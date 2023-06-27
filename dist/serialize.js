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

export { serialize };
