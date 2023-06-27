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
import {ClassOrFunctionType, SerializedTask, WorkerOptions} from "../@types";
import {generate} from "./generate";

const map: Map<string, ClassOrFunctionType<Function>> = new Map;
const store: WeakMap<ClassOrFunctionType<Function>, { worker: Worker, url: string }> = new WeakMap;

export async function dispose(...args: ClassOrFunctionType<Function>[]) {

    for (let instance of args) {

        // @ts-ignore
        const data: { worker: Worker, url: string } | null = store.get(instance);

        if (data != null) {

            URL.revokeObjectURL(data.url);
            store.delete(instance);
            data.worker.terminate();
        }
    }
}

function onMessageHandler(e: MessageEvent) {

    const data = map.get(e.data.id);

    if (data != null) {

        if (e.data.type == 'error') {

            // reject
            data[1](e.data.data);
        } else {
            //resolve
            data[0](e.data.data);
        }

        map.delete(e.data.id)
    }
}

// @ts-ignore
export function workerize(task: Function, options: WorkerOptions = {}): ClassOrFunctionType<Function> {

    options = Object.assign({dependencies: [], module: false, signal: null}, options);

    const serialized: SerializedTask = serialize(task);
    const data: string = generate(task, options);
    const workerOptions = options.module ? {type: 'module'} : {};

    let runner: ClassOrFunctionType<Function>;
    let url: string;
    let worker: Worker;

    url = URL.createObjectURL(new Blob([data], {
        type: 'text/javascript'
    }));

    if (serialized.type == 'class') {

        runner = class {

            constructor(...args: any[]) {

                // @ts-ignore
                worker = new Worker(url, workerOptions);

                worker.onmessage = onMessageHandler;

                // @ts-ignore
                store.set(this, {worker, url});

                function proxy(method: string) {

                    return async function (...args: any[]) {

                        const promiseid: string = id();

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

        // @ts-ignore
        worker = new Worker(url, workerOptions);
        worker.onmessage = onMessageHandler;
        worker.onerror = (error) => {

            throw error
        };

        runner = async function (...args: any[]): Promise<any> {

            const promiseid: string = id();

            return new Promise(function (resolve, reject) {

                worker.onerror = reject;

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

        store.set(runner, {worker, url});
    }

    if (options.signal != null) {

        options.signal.addEventListener('abort', () => dispose(runner));
    }

    return runner;
}