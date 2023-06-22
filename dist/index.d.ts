/**
 *
 * @package     workerize
 * @copyright   Copyright (C) 2005 - 2019 Thierry Bela.
 *
 * dual licensed
 *
 * @license     LGPL v3
 * @license     MIT License
 */

interface Constructable<T> {
    new(...args: any) : T;
    [key: string]: Promise;
}

interface SerializedTask {

    type: 'class' | 'function' | '',
    name: string,
    body: string,
    isAsync: boolean
}

declare type ClassOrFunctionType<T> = Function<T> | Constructable<T>;

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

declare function dispose(...args: Function[]): void;
declare function workerize(task: Function, dependencies?: string[]): ClassOrFunctionType<Function>;

declare function generate(task: Function, dependencies?: string[]): string;

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

declare function serialize(task: Function): SerializedTask;

export { dispose, generate, serialize, workerize };
