import { serialize } from '../serialize.js';
import { id } from '../id.js';
import { Worker } from 'node:worker_threads';
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
function dispose(...args) {
    const list = [];
    for (let instance of args) {
        // @ts-ignore
        const data = store.get(instance);
        if (data != null) {
            store.delete(instance);
            list.push(data.worker.terminate());
        }
    }
    return Promise.all(list);
}
function onMessageHandler(e) {
    const data = map.get(e.id);
    if (data != null) {
        if (e.type == 'error') {
            // reject
            data[1](e.data);
        }
        else {
            //resolve
            data[0](e.data);
        }
        map.delete(e.id);
    }
}
function workerize(task, options = {}) {
    options = Object.assign({ dependencies: [], module: false, signal: null }, options);
    const serialized = serialize(task);
    const data = generate(task, options);
    const workerOptions = { eval: true };
    let runner;
    let worker;
    if (serialized.type == 'class') {
        runner = class {
            constructor(...args) {
                worker = new Worker(data, workerOptions);
                worker.on('message', onMessageHandler);
                // @ts-ignore
                store.set(this, { worker });
                function proxy(method) {
                    return async function (...args) {
                        const promiseid = id();
                        return new Promise(function (resolve, reject) {
                            map.set(promiseid, [
                                resolve,
                                reject
                            ]);
                            worker.on('error', reject);
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
        worker = new Worker(data, workerOptions);
        worker.on('message', onMessageHandler);
        runner = async function (...args) {
            const promiseid = id();
            return new Promise(function (resolve, reject) {
                worker.once('error', reject);
                worker.once('messageerror', reject);
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
        store.set(runner, { worker });
    }
    if (options.signal != null) {
        options.signal.addEventListener('abort', () => dispose(runner));
    }
    return runner;
}

export { dispose, workerize };
