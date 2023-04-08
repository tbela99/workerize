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
import {SerializedTask} from "./@types";
import {serialize} from "./serialize";
import {id} from "./id";

export function generate(task: Function, dependencies: string[] = []): string {

    const serialized: SerializedTask = serialize(task);
    const data: string[] = [];
    const className: string = serialized.name !== '' ? serialized.name : `var${id()}`;

    if (dependencies.length > 0) {

        data.push(`importScripts(${dependencies.map((str: string) => '' + JSON.stringify(new URL(str, self.location.toString())))});`)
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

    } else {

        data.push(`self.onmessage = async function (e) {
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
    }

    return data.join('\n');
}