import {
    workerize,
    dispose
} from "../src/worker.js";

(async function () {

    const Class = (workerize(class {

        constructor() {

        }

        async callMeAsync(foo) {

            return foo + ' was async parameter'
        }

        watch() {
            console.info('started watching sync ...' + [].slice.apply(arguments).join());
            return 'ACK';
        }

        square(x) {

            return x * x
        }
    }));

    const instance = new Class;

    let response = await instance.watch('we had an argument');

    console.log({
        response
    })

    response = await instance.square(2);

    console.log({
        response
    });

    response = await instance.callMeAsync(2);

    console.log({
        response
    });

    const func = workerize(function () {

        return [].slice.apply(arguments);
    });

    response = await func('function', 'running', 'from', 'worker');

    console.log({
        response: response.join(' ')
    });

    const func2 = workerize(async function () {

        return [].slice.apply(arguments);
    });

    response = await func2('async', 'function', 'running', 'from', 'worker');
    console.log({
        response: response.join(' ')
    });

    const func3 = workerize(async (...args) => ['func3'].concat(args));

    response = await func3('async', 'function', 'running', 'from', 'worker');

    console.log({
        response: response.join(' - ')
    });

    const func4 = workerize((...args) => ['func4'].concat(args));

    response = await func4('arrow', 'function', 'running', 'from', 'worker');

    console.log({
        response: response.join(' - ')
    });

    // terminate the service workers
    dispose(instance, func, func2, func3, func4);
})()