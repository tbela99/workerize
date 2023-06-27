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

    function generate(task, options = {}) {
        const serialized = serialize(task);
        const data = [];
        const code = [];
        const className = serialized.name !== '' ? serialized.name : `var${id().slice(0, 3)}`;
        code.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
        if (serialized.type == 'class') {
            code.push(`let instance;
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
            code.push(`self.onmessage = async function (e) {
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
        }
        if (!options.module) {
            // @ts-ignore
            if (options.dependencies.length > 0) {
                // @ts-ignore
                data.push(`importScripts(${options.dependencies.map((str) => '' + JSON.stringify(new URL(str, self.location.toString())))});`);
            }
        }
        else {
            // @ts-ignore
            if (options?.dependencies?.length > 0) {
                data.push(`const promisedModules = Promise.all(${JSON.stringify(options.dependencies?.map(dep => new URL(dep, self.location.href).href))}.map(url => import(url)));
                
                let modules = null;
                `);
                code.length = 0;
                code.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
                if (serialized.type == 'class') {
                    code.push(`let instance;
self.onmessage = async function (e) {

    if (modules == null) {
    
        modules = await promisedModules;
    }
    
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
                    code.push(`self.onmessage = async function (e) {
                    
        if (modules == null) {
        
            modules = await promisedModules;
        }
    
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
                }
            }
            //
            // @ts-ignore
            // if (options.dependencies.length > 0) {
            //
            //     // @ts-ignore
            //     data.push(`import(${options.dependencies.map((str: string) => '' + JSON.stringify(new URL(str, self.location.toString())))}).then(modules => {
            //     console.debug(modules);
            //         ${code.join('\n')}
            //     });
            //     console.debug('done');
            //     `);
            //
            //     code.length = 0;
            // }
        }
        return data.concat(code).join('\n');
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
    async function dispose(...args) {
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
    // @ts-ignore
    function workerize(task, options = {}) {
        options = Object.assign({ dependencies: [], module: false, signal: null }, options);
        const serialized = serialize(task);
        const data = generate(task, options);
        const workerOptions = options.module ? { type: 'module' } : {};
        let runner;
        let url;
        let worker;
        url = URL.createObjectURL(new Blob([data], {
            type: 'text/javascript'
        }));
        if (serialized.type == 'class') {
            runner = class {
                constructor(...args) {
                    // @ts-ignore
                    worker = new Worker(url, workerOptions);
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
            // @ts-ignore
            worker = new Worker(url, workerOptions);
            worker.onmessage = onMessageHandler;
            worker.onerror = (error) => {
                throw error;
            };
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
        if (options.signal != null) {
            options.signal.addEventListener('abort', () => dispose(runner));
        }
        return runner;
    }

    exports.dispose = dispose;
    exports.generate = generate;
    exports.workerize = workerize;

}));
