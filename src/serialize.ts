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

export function serialize(task: Function): SerializedTask {

    const source: string = task.toString().trim();

    let type: string,
        isAsync: boolean = Object.getPrototypeOf(task).constructor.name === 'AsyncFunction',
        body: string;

    const data = source.match(/^((class)|((async\s+)?function)?)\s*([^{(]*)[({]/);

    // @ts-ignore
    type = data[1];
    // @ts-ignore
    let name: string = data[5].trim().replace(/[\s(].*/, '');

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

    return <SerializedTask>{
        type,
        name,
        body,
        isAsync
    }
}