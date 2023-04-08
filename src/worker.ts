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
} from "./serialize";
import {
    id
} from "./id";
import {ClassOrFunctionType, SerializedTask} from "./@types";
import {generate} from "./generate";

const map: Map<string, Function[]> = new Map;
const store: WeakMap<Function, Worker> = new WeakMap;

export function dispose(...args: Function[]) {

    for (let instance of args) {

        // @ts-ignore
        const worker: Worker | null = store.get(instance);

        if (worker != null) {

            store.delete(instance);
            worker.terminate();
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

export function workerize(task: Function, dependencies: string[] = []): ClassOrFunctionType<Function> {

    const serialized: SerializedTask = serialize(task);
    const data: string = generate(task, dependencies);

    let runner: ClassOrFunctionType<Function>;

    if (serialized.type == 'class') {

        runner = class {

            constructor(...args: any[]) {

                const worker: Worker = new Worker(URL.createObjectURL(new Blob([data], {
                    type: 'text/javascript'
                })));

                // @ts-ignore
                store.set(this, worker);

                worker.onmessage = onMessageHandler;

                function proxy(method: string) {

                    return async function (...args: any[]) {

                        const promiseid: string = id();

                        return new Promise(function (resolve, reject) {

                            map.set(promiseid, [
                                resolve,
                                reject
                            ])

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

        const worker: Worker = new Worker(URL.createObjectURL(new Blob([data], {
            type: 'text/javascript'
        })));

        worker.onmessage = onMessageHandler;

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

        store.set(runner, worker);
    }

    return runner;
}