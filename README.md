# Workerize

Export functions or class into a worker context in nodejs and web browser. Tasks are cancellable.

## Installation

```shell
$ npm i @tbela99/workerize
```

the

## Node usage

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

// do node stuff
```

## Web browser browser usage

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize/web";

// do browser stuff
```

Alternatively, you can use the 'browser.js' script which uses the UMD module format.

```html

<script src="dist/browser.js"></script>
<script>

    const func = workerize.workerize(function () {
        
        // do something
    })
</script>
```


## Using a function

The function is turned into an async proxy.

### Web example
```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize/web";

// async and arrow functions can be passed as well 
const func = workerize(function (...args) {

    return args.reduce((acc, curr) => acc + curr, 0);
});

response = await func(1, 2, 70); // 74

// terminate the service worker
dispose(func);

```

## Using a class

All class methods are turned into async proxies.

### Node example

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

// pass a class definition
const Class = workerize(class {

    type;
    name;
    age;

    constructor(type, age, name = '') {

        this.type = type;
        this.age = age;
        this.name = name;

        if (name === '') {

            let number = Math.floor(3 + 3 * Math.random());

            while (number--) {

                this.name += String.fromCharCode([65, 97][Math.floor(2 * Math.random())] + Math.floor(26 * Math.random()))
            }
        }
    }

    say() {

        return `${this.name} says: I am a ${this.age} year(s) old ${this.type}`;
    }
});

// create an instance 
const dog = new Class('Dog', 2, 'Marvin');

console.log(await dog.say()); // 'Marin says: I am a 2 years(s) old Dog'

// terminate the service worker
dispose(dog);

```
## Injecting dependencies

You can inject javascript libraries into the worker context.

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

const func = workerize(function (...args) {

    // sum function is defined in ./js/sum.js
    return sum(...args);
}, {dependencies: ['./js/sum.js']});

const result = await func(5, 43, 10);

console.log(result); // 58

dispose(func);

```

## Injecting modules

```javascript

import {
    workerize,
    dispose
} from "@tbela99/workerize";

const func = workerize(function (...args) {

    // an array called 'modules' containing the declared modules is injected in the scope
    // modules are in the same order they are declared
    // add is exported by the module ./js/add.js
    return modules[0].add(...args);
    
}, {dependencies: ['./js/add.js'], module: true});

const result = await func(5, 43, 10);

console.log(result); // 58

dispose(func);

```

## Documentation

### Workerize

parameters:
- _task_: function or class to execute in the worker context.
- _options_: optional, worker options.

worker options:
- _dependencies_: array. an array of javascript files to inject as module or dependencies
- _module_: boolean. If true, dependencies are injected as modules. A variable of type array called 'modules' will be injected in the scope. it contains the injected modules in the same order as they were injected.
- _signal_: optional. AbortSignal instance used to abort the worker execution and delete it

### Dispose

Delete the worker instance.

#### Usage

```javascript

dispose(worker1 [, worker2, ..., workern]);
```
## A note about the proxies parameters

All parameters you pass to the proxy must
be [transferable](https://developer.mozilla.org/en-US/docs/Web/API/Transferable). Objects will be serialized and
deserialized as JSON data. All methods, property settter and getter are removed.

## License

MIT OR LGPL-3.0

---

Thanks to [Jetbrains](https://jetbrains.com) for providing a free WebStorm license