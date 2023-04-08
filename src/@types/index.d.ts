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

export interface SerializedTask {

    type: 'class' | 'function' | '',
    name: string,
    body: string,
    isAsync: boolean
}

export declare type ClassOrFunctionType<T> = Function<T> | Constructable<T>;