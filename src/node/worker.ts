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

import {
    serialize
} from "../serialize";
import {
    id
} from "../id";
import {Worker} from 'node:worker_threads';
import {ClassOrFunctionType, SerializedTask, WorkerOptions} from "../@types";
import {generate} from "./generate";

const map: Map<string, ClassOrFunctionType<Function>> = new Map;
const store: WeakMap<ClassOrFunctionType<Function>, { worker: Worker }> = new WeakMap;

export function dispose(...args: ClassOrFunctionType<Function>[]) {

    const list: Promise<any>[] = [];
    for (let instance of args) {

        // @ts-ignore
        const data: { worker: Worker } | null = store.get(instance);

        if (data != null) {

            store.delete(instance);
            list.push(data.worker.terminate());
        }
    }
    
    return Promise.all(list);
}

function onMessageHandler(e: { [key: string]: any }) {

    const data = map.get(e.id);

    if (data != null) {

        if (e.type == 'error') {

            // reject
            data[1](e.data);
        } else {
            //resolve
            data[0](e.data);
        }

        map.delete(e.id)
    }
}

export function workerize(task: Function, options: WorkerOptions = {}): ClassOrFunctionType<Function> {

    options = Object.assign({dependencies: [], module: false, signal: null}, options);
    const serialized: SerializedTask = serialize(task);
    const data: string = generate(task, options);

    const workerOptions = {eval: true};

    let runner: ClassOrFunctionType<Function>;
    let worker: Worker;

    if (serialized.type == 'class') {

        runner = class {

            constructor(...args: any[]) {

                worker = new Worker(data, workerOptions);

                worker.on('message', onMessageHandler);

                // @ts-ignore
                store.set(this, {worker});

                function proxy(method: string) {

                    return async function (...args: any[]) {

                        const promiseid: string = id();

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
                    }
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
        }

    } else {

        worker = new Worker(data, workerOptions);
        worker.on('message', onMessageHandler);

        runner = async function (...args: any[]): Promise<any> {

            const promiseid: string = id();

            return new Promise(function (resolve, reject) {

                worker.once('error', reject);
                worker.once('messageerror', reject);

                map.set(promiseid, [
                    resolve,
                    reject
                ])

                worker.postMessage({
                    id: promiseid,
                    args
                });
            })
        }

        store.set(runner, {worker});
    }


    if (options.signal != null) {

        options.signal.addEventListener('abort', () => dispose(runner));
    }

    return runner;
}