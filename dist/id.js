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
function id() {
    return Number(Math.random().toString().substring(2)).toString(36);
}

export { id };
