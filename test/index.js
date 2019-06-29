(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./test/index.es6");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/id.js":
/*!*******************!*\
  !*** ./src/id.js ***!
  \*******************/
/*! exports provided: id */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"id\", function() { return id; });\n/**\r\n *\r\n * @package     workerize\r\n * @copyright   Copyright (C) 2005 - 2019 Thierry Bela.\r\n *\r\n * dual licensed\r\n *\r\n * @license     LGPL v3\r\n * @license     MIT License\r\n */\r\n\r\n// @ts-check\r\n/* eslint wrap-iife: 0 */\r\n\r\nfunction id() {\r\n\r\n\treturn Number(Math.random().toString().substring(2)).toString(36)\r\n}\n\n//# sourceURL=webpack:///./src/id.js?");

/***/ }),

/***/ "./src/serialize.js":
/*!**************************!*\
  !*** ./src/serialize.js ***!
  \**************************/
/*! exports provided: serialize */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"serialize\", function() { return serialize; });\n/**\r\n *\r\n * @package     workerize\r\n * @copyright   Copyright (C) 2005 - 2019 Thierry Bela.\r\n *\r\n * dual licensed\r\n *\r\n * @license     LGPL v3\r\n * @license     MIT License\r\n */\r\n\r\n// @ts-check\r\n\r\n/**\r\n * serialize class or function\r\n * @param {object|function} task \r\n */\r\nfunction serialize(task) {\r\n\r\n    const source = task.toString().trim();\r\n\r\n    let type = 'function',\r\n        isAsync = Object.getPrototypeOf(task).constructor.name === 'AsyncFunction',\r\n        body;\r\n\r\n    const data = source.match(/^((class)|((async\\s+)?function)?)\\s*([^{(]*)[({]/);\r\n\r\n\r\n    type = data[1];\r\n    let name = data[5].trim().replace(/[\\s(].*/, '');\r\n\r\n    body = type + ' ' + (name === '' ? task.name : name) + source.substring((type + (name === '' ? name : ' ' + name)).length);\r\n\r\n    if (name === '') {\r\n\r\n        name = task.name;\r\n    }\r\n\r\n    return {\r\n        type,\r\n        name,\r\n        body,\r\n        isAsync\r\n    }\r\n}\n\n//# sourceURL=webpack:///./src/serialize.js?");

/***/ }),

/***/ "./src/worker.js":
/*!***********************!*\
  !*** ./src/worker.js ***!
  \***********************/
/*! exports provided: dispose, workerize */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"dispose\", function() { return dispose; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"workerize\", function() { return workerize; });\n/* harmony import */ var _serialize_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./serialize.js */ \"./src/serialize.js\");\n/* harmony import */ var _id_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./id.js */ \"./src/id.js\");\n/**\r\n *\r\n * @package     workerize\r\n * @copyright   Copyright (C) 2005 - 2019 Thierry Bela.\r\n *\r\n * dual licensed\r\n *\r\n * @license     LGPL v3\r\n * @license     MIT License\r\n */\r\n\r\n// @ts-check\r\n\r\n\r\n\r\nconst map = new Map;\r\nconst store = new WeakMap;\r\n\r\n/**\r\n * delete the worker instance associated to the class / function\r\n */\r\nfunction dispose() {\r\n\r\n    for (let instance of [].slice.apply(arguments)) {\r\n\r\n        const worker = store.get(instance);\r\n\r\n        if (worker != null) {\r\n\r\n            store.delete(instance);\r\n            worker.terminate();\r\n        }\r\n    }\r\n\r\n}\r\n\r\n/**\r\n * run the class or function given from a worker context\r\n * @param {object|function} task\r\n * @returns {object|function}\r\n */\r\nfunction workerize(task) {\r\n\r\n    const serialized = Object(_serialize_js__WEBPACK_IMPORTED_MODULE_0__[\"serialize\"])(task);\r\n\r\n    const data = [];\r\n    data.push('const Class = (function () { return ' + serialized.body + '})();');\r\n\r\n    let runner;\r\n\r\n    if (serialized.type == 'class') {\r\n\r\n        data.push('let instance');\r\n        data.push('self.onmessage = async function (e) { ');\r\n        data.push(' if (e.data.method == \"constructor\") {');\r\n        data.push('     instance = new (Class.bind(Class, e.data.args));');\r\n        data.push(' } else {');\r\n        data.push('     try {');\r\n        data.push('         if (Object.getPrototypeOf(instance[e.data.method]).constructor.name === \"AsyncFunction\") {');\r\n        data.push('         \tpostMessage({id: e.data.id, data: await instance[e.data.method].apply(instance,e.data.args)});');\r\n        data.push('         } else {')\r\n        data.push('         \tpostMessage({id: e.data.id, data: instance[e.data.method].apply(instance, e.data.args)});');\r\n        data.push('         } ');\r\n        data.push('     }');\r\n        data.push('     catch (error) {');\r\n        data.push('         console.log({error});');\r\n        data.push('         postMessage({id: e.data.id, type: \"error\", data: error});');\r\n        data.push('     }');\r\n        data.push(' }');\r\n        data.push('}');\r\n\r\n        runner = class {\r\n\r\n            constructor() {\r\n\r\n                const worker = new Worker(URL.createObjectURL(new Blob([data.join('\\n')], {\r\n                    type: 'text/javascript'\r\n                })));\r\n\r\n                store.set(this, worker);\r\n\r\n                worker.onmessage = function (e) {\r\n\r\n                    const data = map.get(e.data.id);\r\n\r\n                    if (data != null) {\r\n\r\n                        if (data.type == 'error') {\r\n\r\n                            // reject\r\n                            data[1](e.data.data);\r\n                        } else {\r\n                            //resolve\r\n                            data[0](e.data.data);\r\n                        }\r\n\r\n                        map.delete(e.data.id)\r\n                    }\r\n                }\r\n\r\n                function proxy(method) {\r\n\r\n                    return async function () {\r\n\r\n                        const promiseid = Object(_id_js__WEBPACK_IMPORTED_MODULE_1__[\"id\"])();\r\n                        const args = [].slice.apply(arguments);\r\n\r\n                        return new Promise(function (resolve, reject) {\r\n\r\n                            map.set(promiseid, [\r\n                                resolve,\r\n                                reject\r\n                            ])\r\n\r\n                            worker.postMessage({\r\n                                id: promiseid,\r\n                                method,\r\n                                args\r\n                            });\r\n                        });\r\n                    }\r\n                }\r\n\r\n                const proto = Object.getPrototypeOf(this);\r\n\r\n                // all enumerable method\r\n                for (let name of Object.getOwnPropertyNames(task.prototype)) {\r\n\r\n                    if (name == 'constructor') {\r\n\r\n                        continue;\r\n                    }\r\n\r\n                    if (typeof task.prototype[name] == 'function') {\r\n\r\n                        proto[name] = proxy(name);\r\n                    }\r\n                }\r\n\r\n                worker.postMessage({\r\n                    method: 'constructor',\r\n                    args: [].slice.apply(arguments)\r\n                });\r\n            }\r\n        }\r\n\r\n    } else {\r\n\r\n        data.push('self.onmessage = async function (e) { ');\r\n        data.push(' try {');\r\n        data.push('     if (Object.getPrototypeOf(Class).constructor.name === \"AsyncFunction\") {');\r\n        data.push('         postMessage({id: e.data.id, data: await Class.apply(null, e.data.args)});');\r\n        data.push('     }');\r\n        data.push('     else {')\r\n        data.push('         postMessage({id: e.data.id, data: Class.apply(null, e.data.args)});');\r\n        data.push('     }');\r\n        data.push(' }');\r\n        data.push(' catch (error) {');\r\n        data.push('     console.log({error});');\r\n        data.push('     postMessage({id: e.data.id, type: \"error\", data: error});');\r\n        data.push(' }');\r\n        data.push('}');\r\n\r\n        const worker = new Worker(URL.createObjectURL(new Blob([data.join('\\n')], {\r\n            type: 'text/javascript'\r\n        })));\r\n\r\n        worker.onmessage = function (e) {\r\n\r\n            const data = map.get(e.data.id);\r\n\r\n            if (data != null) {\r\n\r\n                if (data.type == 'error') {\r\n\r\n                    // reject\r\n                    data[1](e.data.data);\r\n                } else {\r\n                    //resolve\r\n                    data[0](e.data.data);\r\n                }\r\n\r\n                map.delete(e.data.id)\r\n            }\r\n        }\r\n\r\n        runner = async function () {\r\n\r\n            const args = [].slice.apply(arguments);\r\n\r\n            const promiseid = Object(_id_js__WEBPACK_IMPORTED_MODULE_1__[\"id\"])();\r\n\r\n            return new Promise(function (resolve, reject) {\r\n\r\n                map.set(promiseid, [\r\n                    resolve,\r\n                    reject\r\n                ])\r\n\r\n                worker.postMessage({\r\n                    id: promiseid,\r\n                    args\r\n                });\r\n            })\r\n        }\r\n\r\n        store.set(runner, worker);\r\n    }\r\n\r\n    return runner;\r\n}\n\n//# sourceURL=webpack:///./src/worker.js?");

/***/ }),

/***/ "./test/index.es6":
/*!************************!*\
  !*** ./test/index.es6 ***!
  \************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_worker_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../src/worker.js */ \"./src/worker.js\");\n\r\n\r\n(async function () {\r\n\r\n    const Class = (Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"workerize\"])(class {\r\n\r\n        constructor() {\r\n\r\n        }\r\n\r\n        async callMeAsync(foo) {\r\n\r\n            return foo + ' was async parameter'\r\n        }\r\n\r\n        watch() {\r\n            console.info('started watching sync ...' + [].slice.apply(arguments).join());\r\n            return 'ACK';\r\n        }\r\n\r\n        square(x) {\r\n\r\n            return x * x\r\n        }\r\n    }));\r\n\r\n    const instance = new Class;\r\n\r\n    let response = await instance.watch('we had an argument');\r\n\r\n    console.log({\r\n        response\r\n    })\r\n\r\n    response = await instance.square(2);\r\n\r\n    console.log({\r\n        response\r\n    });\r\n\r\n    response = await instance.callMeAsync(2);\r\n\r\n    console.log({\r\n        response\r\n    });\r\n\r\n    const func = Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"workerize\"])(function () {\r\n\r\n        return [].slice.apply(arguments);\r\n    });\r\n\r\n    response = await func('function', 'running', 'from', 'worker');\r\n\r\n    console.log({\r\n        response: response.join(' ')\r\n    });\r\n\r\n    const func2 = Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"workerize\"])(async function () {\r\n\r\n        return [].slice.apply(arguments);\r\n    });\r\n\r\n    response = await func2('async', 'function', 'running', 'from', 'worker');\r\n    console.log({\r\n        response: response.join(' ')\r\n    });\r\n\r\n    const func3 = Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"workerize\"])(async (...args) => ['func3'].concat(args));\r\n\r\n    response = await func3('async', 'function', 'running', 'from', 'worker');\r\n\r\n    console.log({\r\n        response: response.join(' - ')\r\n    });\r\n\r\n    const func4 = Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"workerize\"])((...args) => ['func4'].concat(args));\r\n\r\n    response = await func4('arrow', 'function', 'running', 'from', 'worker');\r\n\r\n    console.log({\r\n        response: response.join(' - ')\r\n    });\r\n\r\n    // terminate the service workers\r\n    Object(_src_worker_js__WEBPACK_IMPORTED_MODULE_0__[\"dispose\"])(instance, func, func2, func3, func4);\r\n})()\n\n//# sourceURL=webpack:///./test/index.es6?");

/***/ })

/******/ });
});