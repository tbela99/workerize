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

interface WorkerOptions {
    dependencies?: string[];
    module?: boolean ;
    signal?: AbortSignal
}

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

declare function dispose(...args: ClassOrFunctionType<Function>[]): Promise<any[]>;
declare function workerize(task: Function, options?: WorkerOptions): ClassOrFunctionType<Function>;

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

declare function generate(task: Function, options?: WorkerOptions): string;

export { dispose, generate, serialize, workerize };
