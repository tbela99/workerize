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

export { dispose, generate, workerize };
