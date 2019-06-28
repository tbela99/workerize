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

// @ts-check
/* eslint wrap-iife: 0 */

export function id() {

	return Number(Math.random().toString().substring(2)).toString(36)
}