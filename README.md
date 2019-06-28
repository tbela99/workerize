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

(async () {


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

// later terminate the workers
    dispose(func, func2, func3);
})();
```

## A not about the proxies parameters

All parameters you pass to the proxy must be [transferable](https://developer.mozilla.org/en-US/docs/Web/API/Transferable). Objects will be serialized and deserialized as JSON data.