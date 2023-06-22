(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.workerize = {}));
})(this, (function (exports) { 'use strict';

    /**
     *
     * @package     workerize
     * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
     *
     * dual licensed
     *
     * @license     LGPL v3
     * @license     MIT License
     */
    function serialize(task) {
        const source = task.toString().trim();
        let type, isAsync = Object.getPrototypeOf(task).constructor.name === 'AsyncFunction', body;
        const data = source.match(/^((class)|((async\s+)?function)?)\s*([^{(]*)[({]/);
        // @ts-ignore
        type = data[1];
        // @ts-ignore
        let name = data[5].trim().replace(/[\s(].*/, '');
        // @ts-ignore
        body = (type + ' ' + (name === '' ? task.name : name) + source.substring((type + (name === '' ? name : ' ' + name)).length)).trim();
        if (name === '') {
            name = task.name;
        }
        if (isAsync && name == 'async') {
            name = '';
        }
        if (type === '') {
            type = 'function';
        }
        return {
            type,
            name,
            body,
            isAsync
        };
    }

    /**
     *
     * @package     workerize
     * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
     *
     * dual licensed
     *
     * @license     LGPL v3
     * @license     MIT License
     */
    function id() {
        return Number(Math.random().toString().substring(2)).toString(36);
    }

    function generate(task, dependencies = []) {
        const serialized = serialize(task);
        const data = [];
        const className = serialized.name !== '' ? serialized.name : `var${id()}`;
        if (dependencies.length > 0) {
            data.push(`importScripts(${dependencies.map((str) => '' + JSON.stringify(new URL(str, self.location.toString())))});`);
        }
        data.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
        if (serialized.type == 'class') {
            data.push(`let instance;
self.onmessage = async function (e) {
    if (e.data.method == "constructor") {
        instance = new ${className}(...e.data.args);
    } else {
        if (Object.getPrototypeOf(instance[e.data.method]).constructor.name === "AsyncFunction") {
            postMessage({id: e.data.id, data: await instance[e.data.method](...e.data.args)});
        } else {
            postMessage({id: e.data.id, data: instance[e.data.method](...e.data.args)});
        }
    }
}`);
        }
        else {
            data.push(`self.onmessage = async function (e) {
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
        }
        return data.join('\n');
    }

    /**
     *
     * @package     workerize
     * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
     *
     * dual licensed
     *
     * @license     LGPL v3
     * @license     MIT License
     */
    const map = new Map;
    const store = new WeakMap;
    function dispose(...args) {
        for (let instance of args) {
            // @ts-ignore
            const data = store.get(instance);
            if (data != null) {
                URL.revokeObjectURL(data.url);
                store.delete(instance);
                data.worker.terminate();
            }
        }
    }
    function onMessageHandler(e) {
        const data = map.get(e.data.id);
        if (data != null) {
            if (e.data.type == 'error') {
                // reject
                data[1](e.data.data);
            }
            else {
                //resolve
                data[0](e.data.data);
            }
            map.delete(e.data.id);
        }
    }
    function workerize(task, dependencies = []) {
        const serialized = serialize(task);
        const data = generate(task, dependencies);
        let runner;
        let url;
        let worker;
        if (serialized.type == 'class') {
            runner = class {
                constructor(...args) {
                    url = URL.createObjectURL(new Blob([data], {
                        type: 'text/javascript'
                    }));
                    worker = new Worker(url);
                    worker.onmessage = onMessageHandler;
                    // @ts-ignore
                    store.set(this, { worker, url });
                    function proxy(method) {
                        return async function (...args) {
                            const promiseid = id();
                            return new Promise(function (resolve, reject) {
                                map.set(promiseid, [
                                    resolve,
                                    reject
                                ]);
                                worker.onerror = reject;
                                worker.postMessage({
                                    id: promiseid,
                                    method,
                                    args
                                });
                            });
                        };
                    }
                    const proto = Object.getPrototypeOf(this);
                    // all enumerable method
                    for (let name of Object.getOwnPropertyNames(task.prototype)) {
                        if (name == 'constructor') {
                            continue;
                        }
                        if (typeof task.prototype[name] == 'function') {
                            proto[name] = proxy(name);
                        }
                    }
                    worker.postMessage({
                        method: 'constructor',
                        args
                    });
                }
            };
        }
        else {
            url = URL.createObjectURL(new Blob([data], {
                type: 'text/javascript'
            }));
            worker = new Worker(url);
            worker.onmessage = onMessageHandler;
            runner = async function (...args) {
                const promiseid = id();
                return new Promise(function (resolve, reject) {
                    worker.onerror = reject;
                    map.set(promiseid, [
                        resolve,
                        reject
                    ]);
                    worker.postMessage({
                        id: promiseid,
                        args
                    });
                });
            };
            store.set(runner, { worker, url });
        }
        return runner;
    }

    exports.dispose = dispose;
    exports.generate = generate;
    exports.serialize = serialize;
    exports.workerize = workerize;

}));
