/**
 *
 * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
 *
 * dual licensed
 *
 * @license     LGPL v3
 * @license     MIT License
 */

import {
    workerize
} from "../src";

import {expect} from '@esm-bundle/chai';

(async function () {

    const Class = workerize(class {

        constructor() {

        }

        async callMeAsync(foo: string) {

            return foo + ' was async parameter'
        }

        watch(...args: any[]) {
            console.info('started watching sync ...' + args);
            return 'ACK';
        }

        square(x: number) {

            return x * x
        }
    });

    const instance = new Class;

    describe('test class', () => {

        it('test class: calling method #1', async function () {
            // assertions here
            expect(await instance.watch('we had an argument')).equals('ACK');
        });

        it('test class: calling method #2', async function () {
            // assertions here
            expect(await instance.square(2)).equals(4);
        });

        it('test class: calling async method #3', async function () {
            // assertions here
            expect(await instance.callMeAsync(2)).equals('2 was async parameter');
        });
    });

    const func = workerize(function (...args: any[]) {

        return args;
    });

    const func2 = workerize(async function (...args: any[]) {

        return args;
    });

    const func3 = workerize(async (...args: any[]) => ['func3'].concat(args));

    const func4 = workerize((...args: any[]) => ['func4'].concat(args));

    describe('test functions', function () {

        it('test function: calling function #1', async function () {

            expect((await func('function', 'running', 'from', 'worker')).join(' ')).equals('function running from worker')
        })

        it('test function: calling async function #2', async function () {

            expect((await func2('async', 'function', 'running', 'from', 'worker')).join(' ')).equals('async function running from worker')
        });

        it('test function: calling function #3', async function () {

            expect((await func3('async', 'function', 'running', 'from', 'worker')).join(' - ')).equals('func3 - async - function - running - from - worker')
        });

        it('test function: calling async function #4', async function () {

            expect((await func4('arrow', 'function', 'running', 'from', 'worker')).join(' - ')).equals('func4 - arrow - function - running - from - worker')
        });
    });

    const func5 = workerize(function (...args: number[]) {

        // @ts-ignore
        return sum(...args);
    }, ['./js/sum.js']);

    const func6 = workerize(function (...args: any[]) {

        // @ts-ignore
        const cat = new Animal(...args);

        return cat.say();
    }, ['./js/animal.js']);


    describe('dependencies test', function () {

        it('calling function from external dependency #1', async function () {

            expect(await func5(15, -5, 1)).equals(11)
        });

        it('calling method from external class #2', async function () {

            expect(await func6('Cat', 2, 'Charlie')).equals("Charlie says: I am a 2 year(s) old Cat")
        });
    })

    // terminate the service workers
    // dispose(instance, func, func2, func3, func4);
})()