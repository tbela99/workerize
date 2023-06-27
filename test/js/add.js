/**
 *
 * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
 *
 * dual licensed
 *
 * @license     LGPL v3
 * @license     MIT License
 */

export function add(...args) {

    return args.reduce((a, b) => a + b, 0);
}