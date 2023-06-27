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
    dispose,
    workerize
} from "../src/node";

import {expect} from '@esm-bundle/chai';

(async function () {

    const Class = workerize(class {

        constructor() {

        }

        async callMeAsync(foo: string) {

            return foo + ' was async parameter'
        }

        watch(...args: any[]) {
            return 'ACK';
        }

        square(x: number) {

            return x * x
        }
    });

    describe('node: test class', () => {

        it('node: test class: calling method #1', async function () {

            const instance = new Class;

            // assertions here
            return instance.watch('we had an argument').then((result: any) => dispose(instance).then(() => expect(result).equals('ACK')));
        });

        it('node: test class: calling method #2', async function () {
            const instance = new Class;

            // assertions here
            return instance.square(2).then((result: any) => dispose(instance).then(() => expect(result).equals(4)));
        });

        it('node: test class: calling async method #3', async function () {
            const instance = new Class;

            // assertions here
            return instance.callMeAsync(2).then((result: any) => dispose(instance).then(() => expect(result).equals('2 was async parameter')));
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

    describe('node: test modules', function () {

        it('node: test function: calling function #1', async function () {

            return func('function', 'running', 'from', 'worker').then((result: any) => dispose(func).then(() => expect(result.join(' ')).equals('function running from worker')))
        })

        it('node: test function: calling async function #2', async function () {

            return func2('async', 'function', 'running', 'from', 'worker').then((result: any) => dispose(func2).then(() => expect(result.join(' ')).equals('async function running from worker')))
        });

        it('node: test function: calling function #3', async function () {

            return func3('async', 'function', 'running', 'from', 'worker').then((result: any) => dispose(func3).then(() => expect(result.join(' - ')).equals('func3 - async - function - running - from - worker')))
        });

        it('node: test function: calling async function #4', async function () {

            return func4('arrow', 'function', 'running', 'from', 'worker').then((result: any) => dispose(func4).then(() => expect(result.join(' - ')).equals('func4 - arrow - function - running - from - worker')))
        });
    });

    const func5 = workerize(function (...args: number[]) {

        // @ts-ignore
        return sum(...args);
    }, {dependencies: ['./test/js/sum.js']});

    const func6 = workerize(function (...args: any[]) {

        // @ts-ignore
        const cat = new Animal(...args);

        return cat.say();
    }, {dependencies: ['./js/animal.js']});


    const func7 = workerize(function (...args: number[]) {

        // @ts-ignore
        return modules[0].sum(...args);
    }, {dependencies: ['./test/js/sum.js'], module: true});

    const func8 = workerize(function (...args: any[]) {

        // @ts-ignore
        const cat = new modules[0].Animal(...args);

        return cat.say();
    }, {dependencies: ['./test/js/animal.mjs']});


    describe('node: dependencies test', async function () {

        it('calling function from external dependency #1', async function () {

            return func5(15, -5, 1).then((result: any) => dispose(func5).then(() => expect(result).equals(11)))
        });

        it('node: calling method from external class #2', async function () {

            return func6('Cat', 2, 'Charlie').then((result: any) => dispose(func6).then(() => expect(result).equals("Charlie says: I am a 2 year(s) old Cat")))
        });
    });

    describe('node: cjs module dependencies test', async function () {

        it('calling function from cjs module #1', async function () {

            return func7(15, -5, 1).then((result: any) => dispose(func7).then(() => expect(result).equals(11)))
        });

        it('node: calling class method from esm module #2', async function () {

            return func8('Dog', 2, 'Max').then((result: any) => dispose(func8).then(() => expect(result).equals("Max says: I am a 2 year(s) old Dog")))
        });
    })

    // terminate the service workers
    // dispose(instance, func, func2, func3, func4);
})()