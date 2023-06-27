import { serialize } from '../serialize.js';
import { id } from '../id.js';
import { generate } from './generate.js';

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

export { dispose, workerize };
