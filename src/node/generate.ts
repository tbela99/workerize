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
import {SerializedTask, WorkerOptions} from "../@types";
import {serialize} from "../serialize";
import {id} from "../id";
import {dirname, resolve} from 'node:path';
import {readFileSync} from 'node:fs';

export function generate(task: Function, options: WorkerOptions = {}): string {

    const serialized: SerializedTask = serialize(task);
    const data: string[] = [];
    const code: string[] = [];
    const className: string = serialized.name !== '' ? serialized.name : `var${id().slice(0, 3)}`;

    code.push(`const { parentPort } = require('node:worker_threads');`);
    code.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);

    if (serialized.type == 'class') {

        code.push(`let instance;
        parentPort.on('message', async function (e) {
        
            if (e.method == "constructor") {
                instance = new ${className}(...e.args);
            } else {
                if (Object.getPrototypeOf(instance[e.method]).constructor.name === "AsyncFunction") {
                    parentPort.postMessage({id: e.id, data: await instance[e.method](...e.args)});
                } else {
                    parentPort.postMessage({id: e.id, data: instance[e.method](...e.args)});
                }
            }
        })
`);

    } else {

        code.push(`parentPort.on('message', async function (e) {
        
    parentPort.postMessage({id: e.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.args)});
})`);
    }

    if (!options.module) {

        data.push(`const {runInThisContext} = require('vm');`);

        // @ts-ignore
        if (options?.dependencies?.length > 0) {

            // @ts-ignore
            data.push(`${options.dependencies.reduce((acc: string, str: string) => acc + 'runInThisContext(' + JSON.stringify(readFileSync(!str.startsWith('/') && !str.match(/^[a-z]+:/) ? dirname(process.argv[1]) + '/' + str : str, 'utf-8')) + ');\n', '')}
;`);
        }

    } else {

        // @ts-ignore
        if (options?.dependencies?.length > 0) {

            // @ts-ignore
            const deps = options.dependencies.map((str: string) => resolve(process.cwd(), !str.startsWith('/') && !str.match(/^[a-z]+:/) ? dirname(process.argv[1]) + '/' + str : str));

            data.push(`Promise.all(${JSON.stringify(deps)}.map(url => import(url))).then(modules => {
                ${code.join('\n')}
            });`);
            code.length = 0;
        }
    }

    return data.concat(code).join('\n');
}