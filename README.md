# Workerize
Export functions or class into a service worker context. 

## Using a class

All class method are turned into async proxies

```javascript

import {
    workerize,
    dispose
} from "../src/worker.js";

(async () {

    const Rectangle = workerize(class {

        construct (width, height) {

            this.width = width;
            this.height = height;
        }

        getWidth() { return this.width; }

        getHeight() { return this.height; }

        getSurface () {

            return this.width * this.height;
        }
    });

    const rectangle = new Rectangle(20, 12);

    const width = await rectangle.getWidth();
    
    console.log({width});

    const surface = await rectangle.getSurface();
    
    console.log({surface});

    // ...


    // later terminate the worker
    dispose(rectangle);
})();
```

## Using a function

The function is turned into an async proxy

```javascript

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
})();

```

## A note about the proxies parameters

All parameters you pass to the proxy must be [transferable](https://developer.mozilla.org/en-US/docs/Web/API/Transferable). Objects will be serialized and deserialized as JSON data. All methods, property settter and getter are removed.