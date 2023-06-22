# Workerize

Export functions or class into a service worker context.

## Installation

```shell
$ npm i @tbela99/workerize
```

## Using a class

All class methods are turned into async proxies

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

const Rectangle = workerize(class {

    construct(width, height) {

        this.width = width;
        this.height = height;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    getSurface() {

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
```

## Using a function

The function is turned into an async proxy

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

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

```

## Injecting dependencies

you can inject javascript libraries into the worker context

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

const animal = workerize(function (...args) {

    // Animal is defined in './js/animal.js'
    const cat = new Animal(...args)

    return cat.say();
}, ['./js/animal.js']);

const message = await animal('Cat', 2, 'Charlie');

console.log(message); // "Charlie says: I am a 2 year(s) old Cat"

const compute = workerize(function (...args: number[]) {

    // sum is defined in './js/sum.js'
    return sum(...args);
}, ['./js/sum.js']);

const sum = await compute(15, -5, 1);

console.log(sum); // 11

dispose(animal, compute);
```

## A note about the proxies parameters

All parameters you pass to the proxy must
be [transferable](https://developer.mozilla.org/en-US/docs/Web/API/Transferable). Objects will be serialized and
deserialized as JSON data. All methods, property settter and getter are removed.

## License

MIT OR LGPL-3.0
