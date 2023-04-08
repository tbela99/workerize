(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

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
    function serialize(task) {
        const source = task.toString().trim();
        let type, isAsync = Object.getPrototypeOf(task).constructor.name === 'AsyncFunction', body;
        const data = source.match(/^((class)|((async\s+)?function)?)\s*([^{(]*)[({]/);
        // @ts-ignore
        type = data[1];
        // @ts-ignore
        let name = data[5].trim().replace(/[\s(].*/, '');
        // @ts-ignore
        body = (type + ' ' + (name === '' ? task.name : name) + source.substring((type + (name === '' ? name : ' ' + name)).length)).trim();
        if (name === '') {
            name = task.name;
        }
        if (isAsync && name == 'async') {
            name = '';
        }
        if (type === '') {
            type = 'function';
        }
        return {
            type,
            name,
            body,
            isAsync
        };
    }

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

    function generate(task, dependencies = []) {
        const serialized = serialize(task);
        const data = [];
        const className = serialized.name !== '' ? serialized.name : `var${id()}`;
        if (dependencies.length > 0) {
            data.push(`importScripts(${dependencies.map((str) => '' + JSON.stringify(new URL(str, self.location.toString())))});`);
        }
        data.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
        if (serialized.type == 'class') {
            data.push(`let instance;
self.onmessage = async function (e) {
    if (e.data.method == "constructor") {
        instance = new ${className}(...e.data.args);
    } else {
        if (Object.getPrototypeOf(instance[e.data.method]).constructor.name === "AsyncFunction") {
            postMessage({id: e.data.id, data: await instance[e.data.method](...e.data.args)});
        } else {
            postMessage({id: e.data.id, data: instance[e.data.method](...e.data.args)});
        }
    }
}`);
        }
        else {
            data.push(`self.onmessage = async function (e) {
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
        }
        return data.join('\n');
    }

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
    const map = new Map;
    const store = new WeakMap;
    function onMessageHandler(e) {
        const data = map.get(e.data.id);
        if (data != null) {
            if (e.data.type == 'error') {
                // reject
                data[1](e.data.data);
            }
            else {
                //resolve
                data[0](e.data.data);
            }
            map.delete(e.data.id);
        }
    }
    function workerize(task, dependencies = []) {
        const serialized = serialize(task);
        const data = generate(task, dependencies);
        let runner;
        if (serialized.type == 'class') {
            runner = class {
                constructor(...args) {
                    const url = URL.createObjectURL(new Blob([data], {
                        type: 'text/javascript'
                    }));
                    const worker = new Worker(url);
                    // @ts-ignore
                    store.set(this, { worker, url });
                    worker.onmessage = onMessageHandler;
                    function proxy(method) {
                        return async function (...args) {
                            const promiseid = id();
                            return new Promise(function (resolve, reject) {
                                map.set(promiseid, [
                                    resolve,
                                    reject
                                ]);
                                worker.postMessage({
                                    id: promiseid,
                                    method,
                                    args
                                });
                            });
                        };
                    }
                    const proto = Object.getPrototypeOf(this);
                    // all enumerable method
                    for (let name of Object.getOwnPropertyNames(task.prototype)) {
                        if (name == 'constructor') {
                            continue;
                        }
                        if (typeof task.prototype[name] == 'function') {
                            proto[name] = proxy(name);
                        }
                    }
                    worker.postMessage({
                        method: 'constructor',
                        args
                    });
                }
            };
        }
        else {
            const url = URL.createObjectURL(new Blob([data], {
                type: 'text/javascript'
            }));
            const worker = new Worker(url);
            worker.onmessage = onMessageHandler;
            runner = async function (...args) {
                const promiseid = id();
                return new Promise(function (resolve, reject) {
                    worker.onerror = reject;
                    map.set(promiseid, [
                        resolve,
                        reject
                    ]);
                    worker.postMessage({
                        id: promiseid,
                        args
                    });
                });
            };
            store.set(runner, { worker, url });
        }
        return runner;
    }

    var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function t(e){throw new Error('Could not dynamically require "'+e+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var o=function(){function e(n,o,r){function i(a,c){if(!o[a]){if(!n[a]){if(!c&&t)return t(a);if(s)return s(a,!0);var u=new Error("Cannot find module '"+a+"'");throw u.code="MODULE_NOT_FOUND",u}var f=o[a]={exports:{}};n[a][0].call(f.exports,(function(e){return i(n[a][1][e]||e)}),f,f.exports,e,n,o,r);}return o[a].exports}for(var s=t,a=0;a<r.length;a++)i(r[a]);return i}return e}()({1:[function(e,t,n){t.exports=e("./lib/chai");},{"./lib/chai":2}],2:[function(e,t,n){
    /*!
     * chai
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=[];
    /*!
     * Chai version
     */n.version="4.3.3",
    /*!
     * Assertion Error
     */
    n.AssertionError=e("assertion-error");
    /*!
     * Utils for plugins (not exported)
     */
    var r=e("./chai/utils");n.use=function(e){return ~o.indexOf(e)||(e(n,r),o.push(e)),n},
    /*!
     * Utility Functions
     */
    n.util=r;
    /*!
     * Configuration
     */
    var i=e("./chai/config");n.config=i;
    /*!
     * Primary `Assertion` prototype
     */
    var s=e("./chai/assertion");n.use(s);
    /*!
     * Core Assertions
     */
    var a=e("./chai/core/assertions");n.use(a);
    /*!
     * Expect interface
     */
    var c=e("./chai/interface/expect");n.use(c);
    /*!
     * Should interface
     */
    var u=e("./chai/interface/should");n.use(u);
    /*!
     * Assert interface
     */
    var f=e("./chai/interface/assert");n.use(f);},{"./chai/assertion":3,"./chai/config":4,"./chai/core/assertions":5,"./chai/interface/assert":6,"./chai/interface/expect":7,"./chai/interface/should":8,"./chai/utils":23,"assertion-error":34}],3:[function(e,t,n){
    /*!
     * chai
     * http://chaijs.com
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("./config");t.exports=function(e,t){
    /*!
       * Module dependencies.
       */
    var n=e.AssertionError,r=t.flag;
    /*!
       * Module export.
       */
    /*!
       * Assertion Constructor
       *
       * Creates object for chaining.
       *
       * `Assertion` objects contain metadata in the form of flags. Three flags can
       * be assigned during instantiation by passing arguments to this constructor:
       *
       * - `object`: This flag contains the target of the assertion. For example, in
       *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
       *   contain `numKittens` so that the `equal` assertion can reference it when
       *   needed.
       *
       * - `message`: This flag contains an optional custom error message to be
       *   prepended to the error message that's generated by the assertion when it
       *   fails.
       *
       * - `ssfi`: This flag stands for "start stack function indicator". It
       *   contains a function reference that serves as the starting point for
       *   removing frames from the stack trace of the error that's created by the
       *   assertion when it fails. The goal is to provide a cleaner stack trace to
       *   end users by removing Chai's internal functions. Note that it only works
       *   in environments that support `Error.captureStackTrace`, and only when
       *   `Chai.config.includeStack` hasn't been set to `false`.
       *
       * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
       *   should retain its current value, even as assertions are chained off of
       *   this object. This is usually set to `true` when creating a new assertion
       *   from within another assertion. It's also temporarily set to `true` before
       *   an overwritten assertion gets called by the overwriting assertion.
       *
       * @param {Mixed} obj target of the assertion
       * @param {String} msg (optional) custom error message
       * @param {Function} ssfi (optional) starting point for removing stack frames
       * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
       * @api private
       */
    function i(e,n,o,s){return r(this,"ssfi",o||i),r(this,"lockSsfi",s),r(this,"object",e),r(this,"message",n),t.proxify(this)}e.Assertion=i,Object.defineProperty(i,"includeStack",{get:function(){return console.warn("Assertion.includeStack is deprecated, use chai.config.includeStack instead."),o.includeStack},set:function(e){console.warn("Assertion.includeStack is deprecated, use chai.config.includeStack instead."),o.includeStack=e;}}),Object.defineProperty(i,"showDiff",{get:function(){return console.warn("Assertion.showDiff is deprecated, use chai.config.showDiff instead."),o.showDiff},set:function(e){console.warn("Assertion.showDiff is deprecated, use chai.config.showDiff instead."),o.showDiff=e;}}),i.addProperty=function(e,n){t.addProperty(this.prototype,e,n);},i.addMethod=function(e,n){t.addMethod(this.prototype,e,n);},i.addChainableMethod=function(e,n,o){t.addChainableMethod(this.prototype,e,n,o);},i.overwriteProperty=function(e,n){t.overwriteProperty(this.prototype,e,n);},i.overwriteMethod=function(e,n){t.overwriteMethod(this.prototype,e,n);},i.overwriteChainableMethod=function(e,n,o){t.overwriteChainableMethod(this.prototype,e,n,o);},i.prototype.assert=function(e,i,s,a,c,u){var f=t.test(this,arguments);if(!1!==u&&(u=!0),void 0===a&&void 0===c&&(u=!1),!0!==o.showDiff&&(u=!1),!f){i=t.getMessage(this,arguments);var p={actual:t.getActual(this,arguments),expected:a,showDiff:u},l=t.getOperator(this,arguments);throw l&&(p.operator=l),new n(i,p,o.includeStack?this.assert:r(this,"ssfi"))}},
    /*!
       * ### ._obj
       *
       * Quick reference to stored `actual` value for plugin developers.
       *
       * @api private
       */
    Object.defineProperty(i.prototype,"_obj",{get:function(){return r(this,"object")},set:function(e){r(this,"object",e);}});};},{"./config":4}],4:[function(e,t,n){t.exports={includeStack:!1,showDiff:!0,truncateThreshold:40,useProxy:!0,proxyExcludedKeys:["then","catch","inspect","toJSON"]};},{}],5:[function(e,t,n){
    /*!
     * chai
     * http://chaijs.com
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t){var n=e.Assertion,o=e.AssertionError,r=t.flag;function i(e,n){n&&r(this,"message",n),e=e.toLowerCase();var o=r(this,"object"),i=~["a","e","i","o","u"].indexOf(e.charAt(0))?"an ":"a ";this.assert(e===t.type(o).toLowerCase(),"expected #{this} to be "+i+e,"expected #{this} not to be "+i+e);}function s(e,n){return t.isNaN(e)&&t.isNaN(n)||e===n}function a(){r(this,"contains",!0);}function c(e,i){i&&r(this,"message",i);var a=r(this,"object"),c=t.type(a).toLowerCase(),u=r(this,"message"),f=r(this,"negate"),p=r(this,"ssfi"),l=r(this,"deep"),h=l?"deep ":"";u=u?u+": ":"";var d=!1;switch(c){case"string":d=-1!==a.indexOf(e);break;case"weakset":if(l)throw new o(u+"unable to use .deep.include with WeakSet",void 0,p);d=a.has(e);break;case"map":var y=l?t.eql:s;a.forEach((function(t){d=d||y(t,e);}));break;case"set":l?a.forEach((function(n){d=d||t.eql(n,e);})):d=a.has(e);break;case"array":d=l?a.some((function(n){return t.eql(n,e)})):-1!==a.indexOf(e);break;default:if(e!==Object(e))throw new o(u+"the given combination of arguments ("+c+" and "+t.type(e).toLowerCase()+") is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a "+t.type(e).toLowerCase(),void 0,p);var b=Object.keys(e),g=null,w=0;if(b.forEach((function(i){var s=new n(a);if(t.transferFlags(this,s,!0),r(s,"lockSsfi",!0),f&&1!==b.length)try{s.property(i,e[i]);}catch(e){if(!t.checkError.compatibleConstructor(e,o))throw e;null===g&&(g=e),w++;}else s.property(i,e[i]);}),this),f&&b.length>1&&w===b.length)throw g;return}this.assert(d,"expected #{this} to "+h+"include "+t.inspect(e),"expected #{this} to not "+h+"include "+t.inspect(e));}function u(){var e=r(this,"object");this.assert(null!=e,"expected #{this} to exist","expected #{this} to not exist");}function f(){var e=r(this,"object"),n=t.type(e);this.assert("Arguments"===n,"expected #{this} to be arguments but got "+n,"expected #{this} to not be arguments");}function p(e,t){t&&r(this,"message",t);var n=r(this,"object");if(r(this,"deep")){var o=r(this,"lockSsfi");r(this,"lockSsfi",!0),this.eql(e),r(this,"lockSsfi",o);}else this.assert(e===n,"expected #{this} to equal #{exp}","expected #{this} to not equal #{exp}",e,this._obj,!0);}function l(e,n){n&&r(this,"message",n),this.assert(t.eql(e,r(this,"object")),"expected #{this} to deeply equal #{exp}","expected #{this} to not deeply equal #{exp}",e,this._obj,!0);}function h(e,i){i&&r(this,"message",i);var s,a=r(this,"object"),c=r(this,"doLength"),u=r(this,"message"),f=u?u+": ":"",p=r(this,"ssfi"),l=t.type(a).toLowerCase(),h=t.type(e).toLowerCase(),d=!0;if(c&&"map"!==l&&"set"!==l&&new n(a,u,p,!0).to.have.property("length"),c||"date"!==l||"date"===h?"number"===h||!c&&"number"!==l?c||"date"===l||"number"===l?d=!1:s=f+"expected "+("string"===l?"'"+a+"'":a)+" to be a number or a date":s=f+"the argument to above must be a number":s=f+"the argument to above must be a date",d)throw new o(s,void 0,p);if(c){var y,b="length";"map"===l||"set"===l?(b="size",y=a.size):y=a.length,this.assert(y>e,"expected #{this} to have a "+b+" above #{exp} but got #{act}","expected #{this} to not have a "+b+" above #{exp}",e,y);}else this.assert(a>e,"expected #{this} to be above #{exp}","expected #{this} to be at most #{exp}",e);}function d(e,i){i&&r(this,"message",i);var s,a=r(this,"object"),c=r(this,"doLength"),u=r(this,"message"),f=u?u+": ":"",p=r(this,"ssfi"),l=t.type(a).toLowerCase(),h=t.type(e).toLowerCase(),d=!0;if(c&&"map"!==l&&"set"!==l&&new n(a,u,p,!0).to.have.property("length"),c||"date"!==l||"date"===h?"number"===h||!c&&"number"!==l?c||"date"===l||"number"===l?d=!1:s=f+"expected "+("string"===l?"'"+a+"'":a)+" to be a number or a date":s=f+"the argument to least must be a number":s=f+"the argument to least must be a date",d)throw new o(s,void 0,p);if(c){var y,b="length";"map"===l||"set"===l?(b="size",y=a.size):y=a.length,this.assert(y>=e,"expected #{this} to have a "+b+" at least #{exp} but got #{act}","expected #{this} to have a "+b+" below #{exp}",e,y);}else this.assert(a>=e,"expected #{this} to be at least #{exp}","expected #{this} to be below #{exp}",e);}function y(e,i){i&&r(this,"message",i);var s,a=r(this,"object"),c=r(this,"doLength"),u=r(this,"message"),f=u?u+": ":"",p=r(this,"ssfi"),l=t.type(a).toLowerCase(),h=t.type(e).toLowerCase(),d=!0;if(c&&"map"!==l&&"set"!==l&&new n(a,u,p,!0).to.have.property("length"),c||"date"!==l||"date"===h?"number"===h||!c&&"number"!==l?c||"date"===l||"number"===l?d=!1:s=f+"expected "+("string"===l?"'"+a+"'":a)+" to be a number or a date":s=f+"the argument to below must be a number":s=f+"the argument to below must be a date",d)throw new o(s,void 0,p);if(c){var y,b="length";"map"===l||"set"===l?(b="size",y=a.size):y=a.length,this.assert(y<e,"expected #{this} to have a "+b+" below #{exp} but got #{act}","expected #{this} to not have a "+b+" below #{exp}",e,y);}else this.assert(a<e,"expected #{this} to be below #{exp}","expected #{this} to be at least #{exp}",e);}function b(e,i){i&&r(this,"message",i);var s,a=r(this,"object"),c=r(this,"doLength"),u=r(this,"message"),f=u?u+": ":"",p=r(this,"ssfi"),l=t.type(a).toLowerCase(),h=t.type(e).toLowerCase(),d=!0;if(c&&"map"!==l&&"set"!==l&&new n(a,u,p,!0).to.have.property("length"),c||"date"!==l||"date"===h?"number"===h||!c&&"number"!==l?c||"date"===l||"number"===l?d=!1:s=f+"expected "+("string"===l?"'"+a+"'":a)+" to be a number or a date":s=f+"the argument to most must be a number":s=f+"the argument to most must be a date",d)throw new o(s,void 0,p);if(c){var y,b="length";"map"===l||"set"===l?(b="size",y=a.size):y=a.length,this.assert(y<=e,"expected #{this} to have a "+b+" at most #{exp} but got #{act}","expected #{this} to have a "+b+" above #{exp}",e,y);}else this.assert(a<=e,"expected #{this} to be at most #{exp}","expected #{this} to be above #{exp}",e);}function g(e,n){n&&r(this,"message",n);var i=r(this,"object"),s=r(this,"ssfi"),a=r(this,"message");try{var c=i instanceof e;}catch(n){if(n instanceof TypeError)throw new o((a=a?a+": ":"")+"The instanceof assertion needs a constructor but "+t.type(e)+" was given.",void 0,s);throw n}var u=t.getName(e);null===u&&(u="an unnamed constructor"),this.assert(c,"expected #{this} to be an instance of "+u,"expected #{this} to not be an instance of "+u);}function w(e,n,i){i&&r(this,"message",i);var s=r(this,"nested"),a=r(this,"own"),c=r(this,"message"),u=r(this,"object"),f=r(this,"ssfi"),p=typeof e;if(c=c?c+": ":"",s){if("string"!==p)throw new o(c+"the argument to property must be a string when using nested syntax",void 0,f)}else if("string"!==p&&"number"!==p&&"symbol"!==p)throw new o(c+"the argument to property must be a string, number, or symbol",void 0,f);if(s&&a)throw new o(c+'The "nested" and "own" flags cannot be combined.',void 0,f);if(null==u)throw new o(c+"Target cannot be null or undefined.",void 0,f);var l,h=r(this,"deep"),d=r(this,"negate"),y=s?t.getPathInfo(u,e):null,b=s?y.value:u[e],g="";h&&(g+="deep "),a&&(g+="own "),s&&(g+="nested "),g+="property ",l=a?Object.prototype.hasOwnProperty.call(u,e):s?y.exists:t.hasProperty(u,e),d&&1!==arguments.length||this.assert(l,"expected #{this} to have "+g+t.inspect(e),"expected #{this} to not have "+g+t.inspect(e)),arguments.length>1&&this.assert(l&&(h?t.eql(n,b):n===b),"expected #{this} to have "+g+t.inspect(e)+" of #{exp}, but got #{act}","expected #{this} to not have "+g+t.inspect(e)+" of #{act}",n,b),r(this,"object",b);}function m(e,t,n){r(this,"own",!0),w.apply(this,arguments);}function v(e,n,o){"string"==typeof n&&(o=n,n=null),o&&r(this,"message",o);var i=r(this,"object"),s=Object.getOwnPropertyDescriptor(Object(i),e);s&&n?this.assert(t.eql(n,s),"expected the own property descriptor for "+t.inspect(e)+" on #{this} to match "+t.inspect(n)+", got "+t.inspect(s),"expected the own property descriptor for "+t.inspect(e)+" on #{this} to not match "+t.inspect(n),n,s,!0):this.assert(s,"expected #{this} to have an own property descriptor for "+t.inspect(e),"expected #{this} to not have an own property descriptor for "+t.inspect(e)),r(this,"object",s);}function x(){r(this,"doLength",!0);}function O(e,o){o&&r(this,"message",o);var i,s=r(this,"object"),a=t.type(s).toLowerCase(),c=r(this,"message"),u=r(this,"ssfi"),f="length";switch(a){case"map":case"set":f="size",i=s.size;break;default:new n(s,c,u,!0).to.have.property("length"),i=s.length;}this.assert(i==e,"expected #{this} to have a "+f+" of #{exp} but got #{act}","expected #{this} to not have a "+f+" of #{act}",e,i);}function j(e,t){t&&r(this,"message",t);var n=r(this,"object");this.assert(e.exec(n),"expected #{this} to match "+e,"expected #{this} not to match "+e);}function M(e){var n,i,s=r(this,"object"),a=t.type(s),c=t.type(e),u=r(this,"ssfi"),f=r(this,"deep"),p="",l=!0,h=r(this,"message"),d=(h=h?h+": ":"")+"when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments";if("Map"===a||"Set"===a)p=f?"deeply ":"",i=[],s.forEach((function(e,t){i.push(t);})),"Array"!==c&&(e=Array.prototype.slice.call(arguments));else {switch(i=t.getOwnEnumerableProperties(s),c){case"Array":if(arguments.length>1)throw new o(d,void 0,u);break;case"Object":if(arguments.length>1)throw new o(d,void 0,u);e=Object.keys(e);break;default:e=Array.prototype.slice.call(arguments);}e=e.map((function(e){return "symbol"==typeof e?e:String(e)}));}if(!e.length)throw new o(h+"keys required",void 0,u);var y=e.length,b=r(this,"any"),g=r(this,"all"),w=e;if(b||g||(g=!0),b&&(l=w.some((function(e){return i.some((function(n){return f?t.eql(e,n):e===n}))}))),g&&(l=w.every((function(e){return i.some((function(n){return f?t.eql(e,n):e===n}))})),r(this,"contains")||(l=l&&e.length==i.length)),y>1){var m=(e=e.map((function(e){return t.inspect(e)}))).pop();g&&(n=e.join(", ")+", and "+m),b&&(n=e.join(", ")+", or "+m);}else n=t.inspect(e[0]);n=(y>1?"keys ":"key ")+n,n=(r(this,"contains")?"contain ":"have ")+n,this.assert(l,"expected #{this} to "+p+n,"expected #{this} to not "+p+n,w.slice(0).sort(t.compareByInspect),i.sort(t.compareByInspect),!0);}function P(e,o,i){i&&r(this,"message",i);var s,a=r(this,"object"),c=r(this,"ssfi"),u=r(this,"message"),f=r(this,"negate")||!1;new n(a,u,c,!0).is.a("function"),(e instanceof RegExp||"string"==typeof e)&&(o=e,e=null);try{a();}catch(e){s=e;}var p=void 0===e&&void 0===o,l=Boolean(e&&o),h=!1,d=!1;if(p||!p&&!f){var y="an error";e instanceof Error?y="#{exp}":e&&(y=t.checkError.getConstructorName(e)),this.assert(s,"expected #{this} to throw "+y,"expected #{this} to not throw an error but #{act} was thrown",e&&e.toString(),s instanceof Error?s.toString():"string"==typeof s?s:s&&t.checkError.getConstructorName(s));}if(e&&s&&(e instanceof Error&&t.checkError.compatibleInstance(s,e)===f&&(l&&f?h=!0:this.assert(f,"expected #{this} to throw #{exp} but #{act} was thrown","expected #{this} to not throw #{exp}"+(s&&!f?" but #{act} was thrown":""),e.toString(),s.toString())),t.checkError.compatibleConstructor(s,e)===f&&(l&&f?h=!0:this.assert(f,"expected #{this} to throw #{exp} but #{act} was thrown","expected #{this} to not throw #{exp}"+(s?" but #{act} was thrown":""),e instanceof Error?e.toString():e&&t.checkError.getConstructorName(e),s instanceof Error?s.toString():s&&t.checkError.getConstructorName(s)))),s&&null!=o){var b="including";o instanceof RegExp&&(b="matching"),t.checkError.compatibleMessage(s,o)===f&&(l&&f?d=!0:this.assert(f,"expected #{this} to throw error "+b+" #{exp} but got #{act}","expected #{this} to throw error not "+b+" #{exp}",o,t.checkError.getMessage(s)));}h&&d&&this.assert(f,"expected #{this} to throw #{exp} but #{act} was thrown","expected #{this} to not throw #{exp}"+(s?" but #{act} was thrown":""),e instanceof Error?e.toString():e&&t.checkError.getConstructorName(e),s instanceof Error?s.toString():s&&t.checkError.getConstructorName(s)),r(this,"object",s);}function N(e,n){n&&r(this,"message",n);var o=r(this,"object"),i=r(this,"itself"),s="function"!=typeof o||i?o[e]:o.prototype[e];this.assert("function"==typeof s,"expected #{this} to respond to "+t.inspect(e),"expected #{this} to not respond to "+t.inspect(e));}function E(e,n){n&&r(this,"message",n);var o=e(r(this,"object"));this.assert(o,"expected #{this} to satisfy "+t.objDisplay(e),"expected #{this} to not satisfy"+t.objDisplay(e),!r(this,"negate"),o);}function S(e,t,i){i&&r(this,"message",i);var s=r(this,"object"),a=r(this,"message"),c=r(this,"ssfi");if(new n(s,a,c,!0).is.a("number"),"number"!=typeof e||"number"!=typeof t)throw new o((a=a?a+": ":"")+"the arguments to closeTo or approximately must be numbers"+(void 0===t?", and a delta is required":""),void 0,c);this.assert(Math.abs(s-e)<=t,"expected #{this} to be close to "+e+" +/- "+t,"expected #{this} not to be close to "+e+" +/- "+t);}function k(e,t,n,o,r){if(!o){if(e.length!==t.length)return !1;t=t.slice();}return e.every((function(e,i){if(r)return n?n(e,t[i]):e===t[i];if(!n){var s=t.indexOf(e);return -1!==s&&(o||t.splice(s,1),!0)}return t.some((function(r,i){return !!n(e,r)&&(o||t.splice(i,1),!0)}))}))}function A(e,o){o&&r(this,"message",o);var i=r(this,"object"),s=r(this,"message"),a=r(this,"ssfi"),c=r(this,"contains"),u=r(this,"deep");new n(e,s,a,!0).to.be.an("array"),c?this.assert(e.some((function(e){return i.indexOf(e)>-1})),"expected #{this} to contain one of #{exp}","expected #{this} to not contain one of #{exp}",e,i):u?this.assert(e.some((function(e){return t.eql(i,e)})),"expected #{this} to deeply equal one of #{exp}","expected #{this} to deeply equal one of #{exp}",e,i):this.assert(e.indexOf(i)>-1,"expected #{this} to be one of #{exp}","expected #{this} to not be one of #{exp}",e,i);}function D(e,t,o){o&&r(this,"message",o);var i,s=r(this,"object"),a=r(this,"message"),c=r(this,"ssfi");new n(s,a,c,!0).is.a("function"),t?(new n(e,a,c,!0).to.have.property(t),i=e[t]):(new n(e,a,c,!0).is.a("function"),i=e()),s();var u=null==t?e():e[t],f=null==t?i:"."+t;r(this,"deltaMsgObj",f),r(this,"initialDeltaValue",i),r(this,"finalDeltaValue",u),r(this,"deltaBehavior","change"),r(this,"realDelta",u!==i),this.assert(i!==u,"expected "+f+" to change","expected "+f+" to not change");}function T(e,t,o){o&&r(this,"message",o);var i,s=r(this,"object"),a=r(this,"message"),c=r(this,"ssfi");new n(s,a,c,!0).is.a("function"),t?(new n(e,a,c,!0).to.have.property(t),i=e[t]):(new n(e,a,c,!0).is.a("function"),i=e()),new n(i,a,c,!0).is.a("number"),s();var u=null==t?e():e[t],f=null==t?i:"."+t;r(this,"deltaMsgObj",f),r(this,"initialDeltaValue",i),r(this,"finalDeltaValue",u),r(this,"deltaBehavior","increase"),r(this,"realDelta",u-i),this.assert(u-i>0,"expected "+f+" to increase","expected "+f+" to not increase");}function q(e,t,o){o&&r(this,"message",o);var i,s=r(this,"object"),a=r(this,"message"),c=r(this,"ssfi");new n(s,a,c,!0).is.a("function"),t?(new n(e,a,c,!0).to.have.property(t),i=e[t]):(new n(e,a,c,!0).is.a("function"),i=e()),new n(i,a,c,!0).is.a("number"),s();var u=null==t?e():e[t],f=null==t?i:"."+t;r(this,"deltaMsgObj",f),r(this,"initialDeltaValue",i),r(this,"finalDeltaValue",u),r(this,"deltaBehavior","decrease"),r(this,"realDelta",i-u),this.assert(u-i<0,"expected "+f+" to decrease","expected "+f+" to not decrease");}function C(e,t){t&&r(this,"message",t);var n,o=r(this,"deltaMsgObj"),i=r(this,"initialDeltaValue"),s=r(this,"finalDeltaValue"),a=r(this,"deltaBehavior"),c=r(this,"realDelta");n="change"===a?Math.abs(s-i)===Math.abs(e):c===Math.abs(e),this.assert(n,"expected "+o+" to "+a+" by "+e,"expected "+o+" to not "+a+" by "+e);}["to","be","been","is","and","has","have","with","that","which","at","of","same","but","does","still","also"].forEach((function(e){n.addProperty(e);})),n.addProperty("not",(function(){r(this,"negate",!0);})),n.addProperty("deep",(function(){r(this,"deep",!0);})),n.addProperty("nested",(function(){r(this,"nested",!0);})),n.addProperty("own",(function(){r(this,"own",!0);})),n.addProperty("ordered",(function(){r(this,"ordered",!0);})),n.addProperty("any",(function(){r(this,"any",!0),r(this,"all",!1);})),n.addProperty("all",(function(){r(this,"all",!0),r(this,"any",!1);})),n.addChainableMethod("an",i),n.addChainableMethod("a",i),n.addChainableMethod("include",c,a),n.addChainableMethod("contain",c,a),n.addChainableMethod("contains",c,a),n.addChainableMethod("includes",c,a),n.addProperty("ok",(function(){this.assert(r(this,"object"),"expected #{this} to be truthy","expected #{this} to be falsy");})),n.addProperty("true",(function(){this.assert(!0===r(this,"object"),"expected #{this} to be true","expected #{this} to be false",!r(this,"negate"));})),n.addProperty("false",(function(){this.assert(!1===r(this,"object"),"expected #{this} to be false","expected #{this} to be true",!!r(this,"negate"));})),n.addProperty("null",(function(){this.assert(null===r(this,"object"),"expected #{this} to be null","expected #{this} not to be null");})),n.addProperty("undefined",(function(){this.assert(void 0===r(this,"object"),"expected #{this} to be undefined","expected #{this} not to be undefined");})),n.addProperty("NaN",(function(){this.assert(t.isNaN(r(this,"object")),"expected #{this} to be NaN","expected #{this} not to be NaN");})),n.addProperty("exist",u),n.addProperty("exists",u),n.addProperty("empty",(function(){var e,n=r(this,"object"),i=r(this,"ssfi"),s=r(this,"message");switch(s=s?s+": ":"",t.type(n).toLowerCase()){case"array":case"string":e=n.length;break;case"map":case"set":e=n.size;break;case"weakmap":case"weakset":throw new o(s+".empty was passed a weak collection",void 0,i);case"function":var a=s+".empty was passed a function "+t.getName(n);throw new o(a.trim(),void 0,i);default:if(n!==Object(n))throw new o(s+".empty was passed non-string primitive "+t.inspect(n),void 0,i);e=Object.keys(n).length;}this.assert(0===e,"expected #{this} to be empty","expected #{this} not to be empty");})),n.addProperty("arguments",f),n.addProperty("Arguments",f),n.addMethod("equal",p),n.addMethod("equals",p),n.addMethod("eq",p),n.addMethod("eql",l),n.addMethod("eqls",l),n.addMethod("above",h),n.addMethod("gt",h),n.addMethod("greaterThan",h),n.addMethod("least",d),n.addMethod("gte",d),n.addMethod("greaterThanOrEqual",d),n.addMethod("below",y),n.addMethod("lt",y),n.addMethod("lessThan",y),n.addMethod("most",b),n.addMethod("lte",b),n.addMethod("lessThanOrEqual",b),n.addMethod("within",(function(e,i,s){s&&r(this,"message",s);var a,c=r(this,"object"),u=r(this,"doLength"),f=r(this,"message"),p=f?f+": ":"",l=r(this,"ssfi"),h=t.type(c).toLowerCase(),d=t.type(e).toLowerCase(),y=t.type(i).toLowerCase(),b=!0,g="date"===d&&"date"===y?e.toUTCString()+".."+i.toUTCString():e+".."+i;if(u&&"map"!==h&&"set"!==h&&new n(c,f,l,!0).to.have.property("length"),u||"date"!==h||"date"===d&&"date"===y?"number"===d&&"number"===y||!u&&"number"!==h?u||"date"===h||"number"===h?b=!1:a=p+"expected "+("string"===h?"'"+c+"'":c)+" to be a number or a date":a=p+"the arguments to within must be numbers":a=p+"the arguments to within must be dates",b)throw new o(a,void 0,l);if(u){var w,m="length";"map"===h||"set"===h?(m="size",w=c.size):w=c.length,this.assert(w>=e&&w<=i,"expected #{this} to have a "+m+" within "+g,"expected #{this} to not have a "+m+" within "+g);}else this.assert(c>=e&&c<=i,"expected #{this} to be within "+g,"expected #{this} to not be within "+g);})),n.addMethod("instanceof",g),n.addMethod("instanceOf",g),n.addMethod("property",w),n.addMethod("ownProperty",m),n.addMethod("haveOwnProperty",m),n.addMethod("ownPropertyDescriptor",v),n.addMethod("haveOwnPropertyDescriptor",v),n.addChainableMethod("length",O,x),n.addChainableMethod("lengthOf",O,x),n.addMethod("match",j),n.addMethod("matches",j),n.addMethod("string",(function(e,o){o&&r(this,"message",o);var i=r(this,"object"),s=r(this,"message"),a=r(this,"ssfi");new n(i,s,a,!0).is.a("string"),this.assert(~i.indexOf(e),"expected #{this} to contain "+t.inspect(e),"expected #{this} to not contain "+t.inspect(e));})),n.addMethod("keys",M),n.addMethod("key",M),n.addMethod("throw",P),n.addMethod("throws",P),n.addMethod("Throw",P),n.addMethod("respondTo",N),n.addMethod("respondsTo",N),n.addProperty("itself",(function(){r(this,"itself",!0);})),n.addMethod("satisfy",E),n.addMethod("satisfies",E),n.addMethod("closeTo",S),n.addMethod("approximately",S),n.addMethod("members",(function(e,o){o&&r(this,"message",o);var i=r(this,"object"),s=r(this,"message"),a=r(this,"ssfi");new n(i,s,a,!0).to.be.an("array"),new n(e,s,a,!0).to.be.an("array");var c,u,f,p=r(this,"contains"),l=r(this,"ordered");p?(u="expected #{this} to be "+(c=l?"an ordered superset":"a superset")+" of #{exp}",f="expected #{this} to not be "+c+" of #{exp}"):(u="expected #{this} to have the same "+(c=l?"ordered members":"members")+" as #{exp}",f="expected #{this} to not have the same "+c+" as #{exp}");var h=r(this,"deep")?t.eql:void 0;this.assert(k(e,i,h,p,l),u,f,e,i,!0);})),n.addMethod("oneOf",A),n.addMethod("change",D),n.addMethod("changes",D),n.addMethod("increase",T),n.addMethod("increases",T),n.addMethod("decrease",q),n.addMethod("decreases",q),n.addMethod("by",C),n.addProperty("extensible",(function(){var e=r(this,"object"),t=e===Object(e)&&Object.isExtensible(e);this.assert(t,"expected #{this} to be extensible","expected #{this} to not be extensible");})),n.addProperty("sealed",(function(){var e=r(this,"object"),t=e!==Object(e)||Object.isSealed(e);this.assert(t,"expected #{this} to be sealed","expected #{this} to not be sealed");})),n.addProperty("frozen",(function(){var e=r(this,"object"),t=e!==Object(e)||Object.isFrozen(e);this.assert(t,"expected #{this} to be frozen","expected #{this} to not be frozen");})),n.addProperty("finite",(function(e){var t=r(this,"object");this.assert("number"==typeof t&&isFinite(t),"expected #{this} to be a finite number","expected #{this} to not be a finite number");}));};},{}],6:[function(e,t,n){
    /*!
     * chai
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t){
    /*!
       * Chai dependencies.
       */
    var n=e.Assertion,o=t.flag,r=e.assert=function(t,o){new n(null,null,e.assert,!0).assert(t,o,"[ negation message unavailable ]");};
    /*!
       * Module export.
       */r.fail=function(t,n,o,i){throw arguments.length<2&&(o=t,t=void 0),o=o||"assert.fail()",new e.AssertionError(o,{actual:t,expected:n,operator:i},r.fail)},r.isOk=function(e,t){new n(e,t,r.isOk,!0).is.ok;},r.isNotOk=function(e,t){new n(e,t,r.isNotOk,!0).is.not.ok;},r.equal=function(e,t,i){var s=new n(e,i,r.equal,!0);s.assert(t==o(s,"object"),"expected #{this} to equal #{exp}","expected #{this} to not equal #{act}",t,e,!0);},r.notEqual=function(e,t,i){var s=new n(e,i,r.notEqual,!0);s.assert(t!=o(s,"object"),"expected #{this} to not equal #{exp}","expected #{this} to equal #{act}",t,e,!0);},r.strictEqual=function(e,t,o){new n(e,o,r.strictEqual,!0).to.equal(t);},r.notStrictEqual=function(e,t,o){new n(e,o,r.notStrictEqual,!0).to.not.equal(t);},r.deepEqual=r.deepStrictEqual=function(e,t,o){new n(e,o,r.deepEqual,!0).to.eql(t);},r.notDeepEqual=function(e,t,o){new n(e,o,r.notDeepEqual,!0).to.not.eql(t);},r.isAbove=function(e,t,o){new n(e,o,r.isAbove,!0).to.be.above(t);},r.isAtLeast=function(e,t,o){new n(e,o,r.isAtLeast,!0).to.be.least(t);},r.isBelow=function(e,t,o){new n(e,o,r.isBelow,!0).to.be.below(t);},r.isAtMost=function(e,t,o){new n(e,o,r.isAtMost,!0).to.be.most(t);},r.isTrue=function(e,t){new n(e,t,r.isTrue,!0).is.true;},r.isNotTrue=function(e,t){new n(e,t,r.isNotTrue,!0).to.not.equal(!0);},r.isFalse=function(e,t){new n(e,t,r.isFalse,!0).is.false;},r.isNotFalse=function(e,t){new n(e,t,r.isNotFalse,!0).to.not.equal(!1);},r.isNull=function(e,t){new n(e,t,r.isNull,!0).to.equal(null);},r.isNotNull=function(e,t){new n(e,t,r.isNotNull,!0).to.not.equal(null);},r.isNaN=function(e,t){new n(e,t,r.isNaN,!0).to.be.NaN;},r.isNotNaN=function(e,t){new n(e,t,r.isNotNaN,!0).not.to.be.NaN;},r.exists=function(e,t){new n(e,t,r.exists,!0).to.exist;},r.notExists=function(e,t){new n(e,t,r.notExists,!0).to.not.exist;},r.isUndefined=function(e,t){new n(e,t,r.isUndefined,!0).to.equal(void 0);},r.isDefined=function(e,t){new n(e,t,r.isDefined,!0).to.not.equal(void 0);},r.isFunction=function(e,t){new n(e,t,r.isFunction,!0).to.be.a("function");},r.isNotFunction=function(e,t){new n(e,t,r.isNotFunction,!0).to.not.be.a("function");},r.isObject=function(e,t){new n(e,t,r.isObject,!0).to.be.a("object");},r.isNotObject=function(e,t){new n(e,t,r.isNotObject,!0).to.not.be.a("object");},r.isArray=function(e,t){new n(e,t,r.isArray,!0).to.be.an("array");},r.isNotArray=function(e,t){new n(e,t,r.isNotArray,!0).to.not.be.an("array");},r.isString=function(e,t){new n(e,t,r.isString,!0).to.be.a("string");},r.isNotString=function(e,t){new n(e,t,r.isNotString,!0).to.not.be.a("string");},r.isNumber=function(e,t){new n(e,t,r.isNumber,!0).to.be.a("number");},r.isNotNumber=function(e,t){new n(e,t,r.isNotNumber,!0).to.not.be.a("number");},r.isFinite=function(e,t){new n(e,t,r.isFinite,!0).to.be.finite;},r.isBoolean=function(e,t){new n(e,t,r.isBoolean,!0).to.be.a("boolean");},r.isNotBoolean=function(e,t){new n(e,t,r.isNotBoolean,!0).to.not.be.a("boolean");},r.typeOf=function(e,t,o){new n(e,o,r.typeOf,!0).to.be.a(t);},r.notTypeOf=function(e,t,o){new n(e,o,r.notTypeOf,!0).to.not.be.a(t);},r.instanceOf=function(e,t,o){new n(e,o,r.instanceOf,!0).to.be.instanceOf(t);},r.notInstanceOf=function(e,t,o){new n(e,o,r.notInstanceOf,!0).to.not.be.instanceOf(t);},r.include=function(e,t,o){new n(e,o,r.include,!0).include(t);},r.notInclude=function(e,t,o){new n(e,o,r.notInclude,!0).not.include(t);},r.deepInclude=function(e,t,o){new n(e,o,r.deepInclude,!0).deep.include(t);},r.notDeepInclude=function(e,t,o){new n(e,o,r.notDeepInclude,!0).not.deep.include(t);},r.nestedInclude=function(e,t,o){new n(e,o,r.nestedInclude,!0).nested.include(t);},r.notNestedInclude=function(e,t,o){new n(e,o,r.notNestedInclude,!0).not.nested.include(t);},r.deepNestedInclude=function(e,t,o){new n(e,o,r.deepNestedInclude,!0).deep.nested.include(t);},r.notDeepNestedInclude=function(e,t,o){new n(e,o,r.notDeepNestedInclude,!0).not.deep.nested.include(t);},r.ownInclude=function(e,t,o){new n(e,o,r.ownInclude,!0).own.include(t);},r.notOwnInclude=function(e,t,o){new n(e,o,r.notOwnInclude,!0).not.own.include(t);},r.deepOwnInclude=function(e,t,o){new n(e,o,r.deepOwnInclude,!0).deep.own.include(t);},r.notDeepOwnInclude=function(e,t,o){new n(e,o,r.notDeepOwnInclude,!0).not.deep.own.include(t);},r.match=function(e,t,o){new n(e,o,r.match,!0).to.match(t);},r.notMatch=function(e,t,o){new n(e,o,r.notMatch,!0).to.not.match(t);},r.property=function(e,t,o){new n(e,o,r.property,!0).to.have.property(t);},r.notProperty=function(e,t,o){new n(e,o,r.notProperty,!0).to.not.have.property(t);},r.propertyVal=function(e,t,o,i){new n(e,i,r.propertyVal,!0).to.have.property(t,o);},r.notPropertyVal=function(e,t,o,i){new n(e,i,r.notPropertyVal,!0).to.not.have.property(t,o);},r.deepPropertyVal=function(e,t,o,i){new n(e,i,r.deepPropertyVal,!0).to.have.deep.property(t,o);},r.notDeepPropertyVal=function(e,t,o,i){new n(e,i,r.notDeepPropertyVal,!0).to.not.have.deep.property(t,o);},r.ownProperty=function(e,t,o){new n(e,o,r.ownProperty,!0).to.have.own.property(t);},r.notOwnProperty=function(e,t,o){new n(e,o,r.notOwnProperty,!0).to.not.have.own.property(t);},r.ownPropertyVal=function(e,t,o,i){new n(e,i,r.ownPropertyVal,!0).to.have.own.property(t,o);},r.notOwnPropertyVal=function(e,t,o,i){new n(e,i,r.notOwnPropertyVal,!0).to.not.have.own.property(t,o);},r.deepOwnPropertyVal=function(e,t,o,i){new n(e,i,r.deepOwnPropertyVal,!0).to.have.deep.own.property(t,o);},r.notDeepOwnPropertyVal=function(e,t,o,i){new n(e,i,r.notDeepOwnPropertyVal,!0).to.not.have.deep.own.property(t,o);},r.nestedProperty=function(e,t,o){new n(e,o,r.nestedProperty,!0).to.have.nested.property(t);},r.notNestedProperty=function(e,t,o){new n(e,o,r.notNestedProperty,!0).to.not.have.nested.property(t);},r.nestedPropertyVal=function(e,t,o,i){new n(e,i,r.nestedPropertyVal,!0).to.have.nested.property(t,o);},r.notNestedPropertyVal=function(e,t,o,i){new n(e,i,r.notNestedPropertyVal,!0).to.not.have.nested.property(t,o);},r.deepNestedPropertyVal=function(e,t,o,i){new n(e,i,r.deepNestedPropertyVal,!0).to.have.deep.nested.property(t,o);},r.notDeepNestedPropertyVal=function(e,t,o,i){new n(e,i,r.notDeepNestedPropertyVal,!0).to.not.have.deep.nested.property(t,o);},r.lengthOf=function(e,t,o){new n(e,o,r.lengthOf,!0).to.have.lengthOf(t);},r.hasAnyKeys=function(e,t,o){new n(e,o,r.hasAnyKeys,!0).to.have.any.keys(t);},r.hasAllKeys=function(e,t,o){new n(e,o,r.hasAllKeys,!0).to.have.all.keys(t);},r.containsAllKeys=function(e,t,o){new n(e,o,r.containsAllKeys,!0).to.contain.all.keys(t);},r.doesNotHaveAnyKeys=function(e,t,o){new n(e,o,r.doesNotHaveAnyKeys,!0).to.not.have.any.keys(t);},r.doesNotHaveAllKeys=function(e,t,o){new n(e,o,r.doesNotHaveAllKeys,!0).to.not.have.all.keys(t);},r.hasAnyDeepKeys=function(e,t,o){new n(e,o,r.hasAnyDeepKeys,!0).to.have.any.deep.keys(t);},r.hasAllDeepKeys=function(e,t,o){new n(e,o,r.hasAllDeepKeys,!0).to.have.all.deep.keys(t);},r.containsAllDeepKeys=function(e,t,o){new n(e,o,r.containsAllDeepKeys,!0).to.contain.all.deep.keys(t);},r.doesNotHaveAnyDeepKeys=function(e,t,o){new n(e,o,r.doesNotHaveAnyDeepKeys,!0).to.not.have.any.deep.keys(t);},r.doesNotHaveAllDeepKeys=function(e,t,o){new n(e,o,r.doesNotHaveAllDeepKeys,!0).to.not.have.all.deep.keys(t);},r.throws=function(e,t,i,s){("string"==typeof t||t instanceof RegExp)&&(i=t,t=null);var a=new n(e,s,r.throws,!0).to.throw(t,i);return o(a,"object")},r.doesNotThrow=function(e,t,o,i){("string"==typeof t||t instanceof RegExp)&&(o=t,t=null),new n(e,i,r.doesNotThrow,!0).to.not.throw(t,o);},r.operator=function(i,s,a,c){var u;switch(s){case"==":u=i==a;break;case"===":u=i===a;break;case">":u=i>a;break;case">=":u=i>=a;break;case"<":u=i<a;break;case"<=":u=i<=a;break;case"!=":u=i!=a;break;case"!==":u=i!==a;break;default:throw c=c?c+": ":c,new e.AssertionError(c+'Invalid operator "'+s+'"',void 0,r.operator)}var f=new n(u,c,r.operator,!0);f.assert(!0===o(f,"object"),"expected "+t.inspect(i)+" to be "+s+" "+t.inspect(a),"expected "+t.inspect(i)+" to not be "+s+" "+t.inspect(a));},r.closeTo=function(e,t,o,i){new n(e,i,r.closeTo,!0).to.be.closeTo(t,o);},r.approximately=function(e,t,o,i){new n(e,i,r.approximately,!0).to.be.approximately(t,o);},r.sameMembers=function(e,t,o){new n(e,o,r.sameMembers,!0).to.have.same.members(t);},r.notSameMembers=function(e,t,o){new n(e,o,r.notSameMembers,!0).to.not.have.same.members(t);},r.sameDeepMembers=function(e,t,o){new n(e,o,r.sameDeepMembers,!0).to.have.same.deep.members(t);},r.notSameDeepMembers=function(e,t,o){new n(e,o,r.notSameDeepMembers,!0).to.not.have.same.deep.members(t);},r.sameOrderedMembers=function(e,t,o){new n(e,o,r.sameOrderedMembers,!0).to.have.same.ordered.members(t);},r.notSameOrderedMembers=function(e,t,o){new n(e,o,r.notSameOrderedMembers,!0).to.not.have.same.ordered.members(t);},r.sameDeepOrderedMembers=function(e,t,o){new n(e,o,r.sameDeepOrderedMembers,!0).to.have.same.deep.ordered.members(t);},r.notSameDeepOrderedMembers=function(e,t,o){new n(e,o,r.notSameDeepOrderedMembers,!0).to.not.have.same.deep.ordered.members(t);},r.includeMembers=function(e,t,o){new n(e,o,r.includeMembers,!0).to.include.members(t);},r.notIncludeMembers=function(e,t,o){new n(e,o,r.notIncludeMembers,!0).to.not.include.members(t);},r.includeDeepMembers=function(e,t,o){new n(e,o,r.includeDeepMembers,!0).to.include.deep.members(t);},r.notIncludeDeepMembers=function(e,t,o){new n(e,o,r.notIncludeDeepMembers,!0).to.not.include.deep.members(t);},r.includeOrderedMembers=function(e,t,o){new n(e,o,r.includeOrderedMembers,!0).to.include.ordered.members(t);},r.notIncludeOrderedMembers=function(e,t,o){new n(e,o,r.notIncludeOrderedMembers,!0).to.not.include.ordered.members(t);},r.includeDeepOrderedMembers=function(e,t,o){new n(e,o,r.includeDeepOrderedMembers,!0).to.include.deep.ordered.members(t);},r.notIncludeDeepOrderedMembers=function(e,t,o){new n(e,o,r.notIncludeDeepOrderedMembers,!0).to.not.include.deep.ordered.members(t);},r.oneOf=function(e,t,o){new n(e,o,r.oneOf,!0).to.be.oneOf(t);},r.changes=function(e,t,o,i){3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.changes,!0).to.change(t,o);},r.changesBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.changesBy,!0).to.change(t,o).by(i);},r.doesNotChange=function(e,t,o,i){return 3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.doesNotChange,!0).to.not.change(t,o)},r.changesButNotBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.changesButNotBy,!0).to.change(t,o).but.not.by(i);},r.increases=function(e,t,o,i){return 3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.increases,!0).to.increase(t,o)},r.increasesBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.increasesBy,!0).to.increase(t,o).by(i);},r.doesNotIncrease=function(e,t,o,i){return 3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.doesNotIncrease,!0).to.not.increase(t,o)},r.increasesButNotBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.increasesButNotBy,!0).to.increase(t,o).but.not.by(i);},r.decreases=function(e,t,o,i){return 3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.decreases,!0).to.decrease(t,o)},r.decreasesBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.decreasesBy,!0).to.decrease(t,o).by(i);},r.doesNotDecrease=function(e,t,o,i){return 3===arguments.length&&"function"==typeof t&&(i=o,o=null),new n(e,i,r.doesNotDecrease,!0).to.not.decrease(t,o)},r.doesNotDecreaseBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);return new n(e,s,r.doesNotDecreaseBy,!0).to.not.decrease(t,o).by(i)},r.decreasesButNotBy=function(e,t,o,i,s){if(4===arguments.length&&"function"==typeof t){var a=i;i=o,s=a;}else 3===arguments.length&&(i=o,o=null);new n(e,s,r.decreasesButNotBy,!0).to.decrease(t,o).but.not.by(i);},
    /*!
       * ### .ifError(object)
       *
       * Asserts if value is not a false value, and throws if it is a true value.
       * This is added to allow for chai to be a drop-in replacement for Node's
       * assert class.
       *
       *     var err = new Error('I am a custom error');
       *     assert.ifError(err); // Rethrows err!
       *
       * @name ifError
       * @param {Object} object
       * @namespace Assert
       * @api public
       */
    r.ifError=function(e){if(e)throw e},r.isExtensible=function(e,t){new n(e,t,r.isExtensible,!0).to.be.extensible;},r.isNotExtensible=function(e,t){new n(e,t,r.isNotExtensible,!0).to.not.be.extensible;},r.isSealed=function(e,t){new n(e,t,r.isSealed,!0).to.be.sealed;},r.isNotSealed=function(e,t){new n(e,t,r.isNotSealed,!0).to.not.be.sealed;},r.isFrozen=function(e,t){new n(e,t,r.isFrozen,!0).to.be.frozen;},r.isNotFrozen=function(e,t){new n(e,t,r.isNotFrozen,!0).to.not.be.frozen;},r.isEmpty=function(e,t){new n(e,t,r.isEmpty,!0).to.be.empty;},r.isNotEmpty=function(e,t){new n(e,t,r.isNotEmpty,!0).to.not.be.empty;},
    /*!
       * Aliases.
       */
    function e(t,n){return r[n]=r[t],e}("isOk","ok")("isNotOk","notOk")("throws","throw")("throws","Throw")("isExtensible","extensible")("isNotExtensible","notExtensible")("isSealed","sealed")("isNotSealed","notSealed")("isFrozen","frozen")("isNotFrozen","notFrozen")("isEmpty","empty")("isNotEmpty","notEmpty");};},{}],7:[function(e,t,n){
    /*!
     * chai
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t){e.expect=function(t,n){return new e.Assertion(t,n)},e.expect.fail=function(t,n,o,r){throw arguments.length<2&&(o=t,t=void 0),o=o||"expect.fail()",new e.AssertionError(o,{actual:t,expected:n,operator:r},e.expect.fail)};};},{}],8:[function(e,t,n){
    /*!
     * chai
     * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t){var n=e.Assertion;function o(){function t(){return this instanceof String||this instanceof Number||this instanceof Boolean||"function"==typeof Symbol&&this instanceof Symbol||"function"==typeof BigInt&&this instanceof BigInt?new n(this.valueOf(),null,t):new n(this,null,t)}function o(e){Object.defineProperty(this,"should",{value:e,enumerable:!0,configurable:!0,writable:!0});}Object.defineProperty(Object.prototype,"should",{set:o,get:t,configurable:!0});var r={fail:function(t,n,o,i){throw arguments.length<2&&(o=t,t=void 0),o=o||"should.fail()",new e.AssertionError(o,{actual:t,expected:n,operator:i},r.fail)},equal:function(e,t,o){new n(e,o).to.equal(t);},Throw:function(e,t,o,r){new n(e,r).to.Throw(t,o);},exist:function(e,t){new n(e,t).to.exist;},not:{}};return r.not.equal=function(e,t,o){new n(e,o).to.not.equal(t);},r.not.Throw=function(e,t,o,r){new n(e,r).to.not.Throw(t,o);},r.not.exist=function(e,t){new n(e,t).to.not.exist;},r.throw=r.Throw,r.not.throw=r.not.Throw,r}e.should=o,e.Should=o;};},{}],9:[function(e,t,n){
    /*!
     * Chai - addChainingMethod utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./addLengthGuard"),r=e("../../chai"),i=e("./flag"),s=e("./proxify"),a=e("./transferFlags"),c="function"==typeof Object.setPrototypeOf,u=function(){},f=Object.getOwnPropertyNames(u).filter((function(e){var t=Object.getOwnPropertyDescriptor(u,e);return "object"!=typeof t||!t.configurable})),p=Function.prototype.call,l=Function.prototype.apply;t.exports=function(e,t,n,u){"function"!=typeof u&&(u=function(){});var h={method:n,chainingBehavior:u};e.__methods||(e.__methods={}),e.__methods[t]=h,Object.defineProperty(e,t,{get:function(){h.chainingBehavior.call(this);var n=function(){i(this,"lockSsfi")||i(this,"ssfi",n);var e=h.method.apply(this,arguments);if(void 0!==e)return e;var t=new r.Assertion;return a(this,t),t};if(o(n,t,!0),c){var u=Object.create(this);u.call=p,u.apply=l,Object.setPrototypeOf(n,u);}else Object.getOwnPropertyNames(e).forEach((function(t){if(-1===f.indexOf(t)){var o=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(n,t,o);}}));return a(this,n),s(n)},configurable:!0});};},{"../../chai":2,"./addLengthGuard":10,"./flag":15,"./proxify":31,"./transferFlags":33}],10:[function(e,t,n){var o=Object.getOwnPropertyDescriptor((function(){}),"length");
    /*!
     * Chai - addLengthGuard utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */t.exports=function(e,t,n){return o.configurable?(Object.defineProperty(e,"length",{get:function(){if(n)throw Error("Invalid Chai property: "+t+'.length. Due to a compatibility issue, "length" cannot directly follow "'+t+'". Use "'+t+'.lengthOf" instead.');throw Error("Invalid Chai property: "+t+'.length. See docs for proper usage of "'+t+'".')}}),e):e};},{}],11:[function(e,t,n){
    /*!
     * Chai - addMethod utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("./addLengthGuard"),r=e("../../chai"),i=e("./flag"),s=e("./proxify"),a=e("./transferFlags");t.exports=function(e,t,n){var c=function(){i(this,"lockSsfi")||i(this,"ssfi",c);var e=n.apply(this,arguments);if(void 0!==e)return e;var t=new r.Assertion;return a(this,t),t};o(c,t,!1),e[t]=s(c,t);};},{"../../chai":2,"./addLengthGuard":10,"./flag":15,"./proxify":31,"./transferFlags":33}],12:[function(e,t,n){
    /*!
     * Chai - addProperty utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("../../chai"),r=e("./flag"),i=e("./isProxyEnabled"),s=e("./transferFlags");t.exports=function(e,t,n){n=void 0===n?function(){}:n,Object.defineProperty(e,t,{get:function e(){i()||r(this,"lockSsfi")||r(this,"ssfi",e);var t=n.call(this);if(void 0!==t)return t;var a=new o.Assertion;return s(this,a),a},configurable:!0});};},{"../../chai":2,"./flag":15,"./isProxyEnabled":26,"./transferFlags":33}],13:[function(e,t,n){
    /*!
     * Chai - compareByInspect utility
     * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./inspect");t.exports=function(e,t){return o(e)<o(t)?-1:1};},{"./inspect":24}],14:[function(e,t,n){
    /*!
     * Chai - expectTypes utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("assertion-error"),r=e("./flag"),i=e("type-detect");t.exports=function(e,t){var n=r(e,"message"),s=r(e,"ssfi");n=n?n+": ":"",e=r(e,"object"),(t=t.map((function(e){return e.toLowerCase()}))).sort();var a=t.map((function(e,n){var o=~["a","e","i","o","u"].indexOf(e.charAt(0))?"an":"a";return (t.length>1&&n===t.length-1?"or ":"")+o+" "+e})).join(", "),c=i(e).toLowerCase();if(!t.some((function(e){return c===e})))throw new o(n+"object tested must be "+a+", but "+c+" given",void 0,s)};},{"./flag":15,"assertion-error":34,"type-detect":39}],15:[function(e,t,n){
    /*!
     * Chai - flag utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t,n){var o=e.__flags||(e.__flags=Object.create(null));if(3!==arguments.length)return o[t];o[t]=n;};},{}],16:[function(e,t,n){
    /*!
     * Chai - getActual utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t){return t.length>4?t[4]:e._obj};},{}],17:[function(e,t,n){
    /*!
     * Chai - getEnumerableProperties utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e){var t=[];for(var n in e)t.push(n);return t};},{}],18:[function(e,t,n){
    /*!
     * Chai - message composition utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./flag"),r=e("./getActual"),i=e("./objDisplay");t.exports=function(e,t){var n=o(e,"negate"),s=o(e,"object"),a=t[3],c=r(e,t),u=n?t[2]:t[1],f=o(e,"message");return "function"==typeof u&&(u=u()),u=(u=u||"").replace(/#\{this\}/g,(function(){return i(s)})).replace(/#\{act\}/g,(function(){return i(c)})).replace(/#\{exp\}/g,(function(){return i(a)})),f?f+": "+u:u};},{"./flag":15,"./getActual":16,"./objDisplay":27}],19:[function(e,t,n){var o=e("type-detect"),r=e("./flag");function i(e){var t=o(e);return -1!==["Array","Object","function"].indexOf(t)}t.exports=function(e,t){var n=r(e,"operator"),o=r(e,"negate"),s=t[3],a=o?t[2]:t[1];if(n)return n;if("function"==typeof a&&(a=a()),(a=a||"")&&!/\shave\s/.test(a)){var c=i(s);return /\snot\s/.test(a)?c?"notDeepStrictEqual":"notStrictEqual":c?"deepStrictEqual":"strictEqual"}};},{"./flag":15,"type-detect":39}],20:[function(e,t,n){
    /*!
     * Chai - getOwnEnumerableProperties utility
     * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./getOwnEnumerablePropertySymbols");t.exports=function(e){return Object.keys(e).concat(o(e))};},{"./getOwnEnumerablePropertySymbols":21}],21:[function(e,t,n){
    /*!
     * Chai - getOwnEnumerablePropertySymbols utility
     * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e){return "function"!=typeof Object.getOwnPropertySymbols?[]:Object.getOwnPropertySymbols(e).filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))};},{}],22:[function(e,t,n){
    /*!
     * Chai - getProperties utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e){var t=Object.getOwnPropertyNames(e);function n(e){-1===t.indexOf(e)&&t.push(e);}for(var o=Object.getPrototypeOf(e);null!==o;)Object.getOwnPropertyNames(o).forEach(n),o=Object.getPrototypeOf(o);return t};},{}],23:[function(e,t,n){
    /*!
     * chai
     * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Dependencies that are used for multiple exports are required here only once
     */
    var o=e("pathval");
    /*!
     * test utility
     */n.test=e("./test"),
    /*!
     * type utility
     */
    n.type=e("type-detect"),
    /*!
     * expectTypes utility
     */
    n.expectTypes=e("./expectTypes"),
    /*!
     * message utility
     */
    n.getMessage=e("./getMessage"),
    /*!
     * actual utility
     */
    n.getActual=e("./getActual"),
    /*!
     * Inspect util
     */
    n.inspect=e("./inspect"),
    /*!
     * Object Display util
     */
    n.objDisplay=e("./objDisplay"),
    /*!
     * Flag utility
     */
    n.flag=e("./flag"),
    /*!
     * Flag transferring utility
     */
    n.transferFlags=e("./transferFlags"),
    /*!
     * Deep equal utility
     */
    n.eql=e("deep-eql"),
    /*!
     * Deep path info
     */
    n.getPathInfo=o.getPathInfo,
    /*!
     * Check if a property exists
     */
    n.hasProperty=o.hasProperty,
    /*!
     * Function name
     */
    n.getName=e("get-func-name"),
    /*!
     * add Property
     */
    n.addProperty=e("./addProperty"),
    /*!
     * add Method
     */
    n.addMethod=e("./addMethod"),
    /*!
     * overwrite Property
     */
    n.overwriteProperty=e("./overwriteProperty"),
    /*!
     * overwrite Method
     */
    n.overwriteMethod=e("./overwriteMethod"),
    /*!
     * Add a chainable method
     */
    n.addChainableMethod=e("./addChainableMethod"),
    /*!
     * Overwrite chainable method
     */
    n.overwriteChainableMethod=e("./overwriteChainableMethod"),
    /*!
     * Compare by inspect method
     */
    n.compareByInspect=e("./compareByInspect"),
    /*!
     * Get own enumerable property symbols method
     */
    n.getOwnEnumerablePropertySymbols=e("./getOwnEnumerablePropertySymbols"),
    /*!
     * Get own enumerable properties method
     */
    n.getOwnEnumerableProperties=e("./getOwnEnumerableProperties"),
    /*!
     * Checks error against a given set of criteria
     */
    n.checkError=e("check-error"),
    /*!
     * Proxify util
     */
    n.proxify=e("./proxify"),
    /*!
     * addLengthGuard util
     */
    n.addLengthGuard=e("./addLengthGuard"),
    /*!
     * isProxyEnabled helper
     */
    n.isProxyEnabled=e("./isProxyEnabled"),
    /*!
     * isNaN method
     */
    n.isNaN=e("./isNaN"),
    /*!
     * getOperator method
     */
    n.getOperator=e("./getOperator");},{"./addChainableMethod":9,"./addLengthGuard":10,"./addMethod":11,"./addProperty":12,"./compareByInspect":13,"./expectTypes":14,"./flag":15,"./getActual":16,"./getMessage":18,"./getOperator":19,"./getOwnEnumerableProperties":20,"./getOwnEnumerablePropertySymbols":21,"./inspect":24,"./isNaN":25,"./isProxyEnabled":26,"./objDisplay":27,"./overwriteChainableMethod":28,"./overwriteMethod":29,"./overwriteProperty":30,"./proxify":31,"./test":32,"./transferFlags":33,"check-error":35,"deep-eql":36,"get-func-name":37,pathval:38,"type-detect":39}],24:[function(e,t,n){var o=e("get-func-name"),r=e("./getProperties"),i=e("./getEnumerableProperties"),s=e("../config");function a(e,t,n,o){return u({showHidden:t,seen:[],stylize:function(e){return e}},e,void 0===n?2:n)}t.exports=a;var c=function(e){return "object"==typeof HTMLElement?e instanceof HTMLElement:e&&"object"==typeof e&&"nodeType"in e&&1===e.nodeType&&"string"==typeof e.nodeName};function u(e,t,s){if(t&&"function"==typeof t.inspect&&t.inspect!==n.inspect&&(!t.constructor||t.constructor.prototype!==t)){var a=t.inspect(s,e);return "string"!=typeof a&&(a=u(e,a,s)),a}var x=f(e,t);if(x)return x;if(c(t)){if("outerHTML"in t)return t.outerHTML;try{if(document.xmlVersion)return (new XMLSerializer).serializeToString(t);var O="http://www.w3.org/1999/xhtml",j=document.createElementNS(O,"_");j.appendChild(t.cloneNode(!1));var M=j.innerHTML.replace("><",">"+t.innerHTML+"<");return j.innerHTML="",M}catch(e){}}var P,N,E=i(t),S=e.showHidden?r(t):E;if(0===S.length||v(t)&&(1===S.length&&"stack"===S[0]||2===S.length&&"description"===S[0]&&"stack"===S[1])){if("function"==typeof t)return N=(P=o(t))?": "+P:"",e.stylize("[Function"+N+"]","special");if(w(t))return e.stylize(RegExp.prototype.toString.call(t),"regexp");if(m(t))return e.stylize(Date.prototype.toUTCString.call(t),"date");if(v(t))return p(t)}var k,A="",D=!1,T=!1,q=["{","}"];if(b(t)&&(T=!0,q=["[","]"]),g(t)&&(D=!0,q=["[","]"]),"function"==typeof t&&(A=" [Function"+(N=(P=o(t))?": "+P:"")+"]"),w(t)&&(A=" "+RegExp.prototype.toString.call(t)),m(t)&&(A=" "+Date.prototype.toUTCString.call(t)),v(t))return p(t);if(0===S.length&&(!D||0==t.length))return q[0]+A+q[1];if(s<0)return w(t)?e.stylize(RegExp.prototype.toString.call(t),"regexp"):e.stylize("[Object]","special");if(e.seen.push(t),D)k=l(e,t,s,E,S);else {if(T)return h(t);k=S.map((function(n){return d(e,t,s,E,n,D)}));}return e.seen.pop(),y(k,A,q)}function f(e,t){switch(typeof t){case"undefined":return e.stylize("undefined","undefined");case"string":var n="'"+JSON.stringify(t).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return e.stylize(n,"string");case"number":return 0===t&&1/t==-1/0?e.stylize("-0","number"):e.stylize(""+t,"number");case"boolean":return e.stylize(""+t,"boolean");case"symbol":return e.stylize(t.toString(),"symbol");case"bigint":return e.stylize(t.toString()+"n","bigint")}if(null===t)return e.stylize("null","null")}function p(e){return "["+Error.prototype.toString.call(e)+"]"}function l(e,t,n,o,r){for(var i=[],s=0,a=t.length;s<a;++s)Object.prototype.hasOwnProperty.call(t,String(s))?i.push(d(e,t,n,o,String(s),!0)):i.push("");return r.forEach((function(r){r.match(/^\d+$/)||i.push(d(e,t,n,o,r,!0));})),i}function h(e){for(var t="[ ",n=0;n<e.length;++n){if(t.length>=s.truncateThreshold-7){t+="...";break}t+=e[n]+", ";}return -1!==(t+=" ]").indexOf(",  ]")&&(t=t.replace(",  ]"," ]")),t}function d(e,t,n,o,r,i){var s,a,c=Object.getOwnPropertyDescriptor(t,r);if(c&&(c.get?a=c.set?e.stylize("[Getter/Setter]","special"):e.stylize("[Getter]","special"):c.set&&(a=e.stylize("[Setter]","special"))),o.indexOf(r)<0&&(s="["+r+"]"),a||(e.seen.indexOf(t[r])<0?(a=u(e,t[r],null===n?null:n-1)).indexOf("\n")>-1&&(a=i?a.split("\n").map((function(e){return "  "+e})).join("\n").substr(2):"\n"+a.split("\n").map((function(e){return "   "+e})).join("\n")):a=e.stylize("[Circular]","special")),void 0===s){if(i&&r.match(/^\d+$/))return a;(s=JSON.stringify(""+r)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(s=s.substr(1,s.length-2),s=e.stylize(s,"name")):(s=s.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),s=e.stylize(s,"string"));}return s+": "+a}function y(e,t,n){return e.reduce((function(e,t){return e+t.length+1}),0)>60?n[0]+(""===t?"":t+"\n ")+" "+e.join(",\n  ")+" "+n[1]:n[0]+t+" "+e.join(", ")+" "+n[1]}function b(e){return "object"==typeof e&&/\w+Array]$/.test(x(e))}function g(e){return Array.isArray(e)||"object"==typeof e&&"[object Array]"===x(e)}function w(e){return "object"==typeof e&&"[object RegExp]"===x(e)}function m(e){return "object"==typeof e&&"[object Date]"===x(e)}function v(e){return "object"==typeof e&&"[object Error]"===x(e)}function x(e){return Object.prototype.toString.call(e)}},{"../config":4,"./getEnumerableProperties":17,"./getProperties":22,"get-func-name":37}],25:[function(e,t,n){
    /*!
     * Chai - isNaN utility
     * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
     * MIT Licensed
     */
    function o(e){return e!=e}t.exports=Number.isNaN||o;},{}],26:[function(e,t,n){var o=e("../config");
    /*!
     * Chai - isProxyEnabled helper
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */t.exports=function(){return o.useProxy&&"undefined"!=typeof Proxy&&"undefined"!=typeof Reflect};},{"../config":4}],27:[function(e,t,n){
    /*!
     * Chai - flag utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./inspect"),r=e("../config");t.exports=function(e){var t=o(e),n=Object.prototype.toString.call(e);if(r.truncateThreshold&&t.length>=r.truncateThreshold){if("[object Function]"===n)return e.name&&""!==e.name?"[Function: "+e.name+"]":"[Function]";if("[object Array]"===n)return "[ Array("+e.length+") ]";if("[object Object]"===n){var i=Object.keys(e);return "{ Object ("+(i.length>2?i.splice(0,2).join(", ")+", ...":i.join(", "))+") }"}return t}return t};},{"../config":4,"./inspect":24}],28:[function(e,t,n){
    /*!
     * Chai - overwriteChainableMethod utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("../../chai"),r=e("./transferFlags");t.exports=function(e,t,n,i){var s=e.__methods[t],a=s.chainingBehavior;s.chainingBehavior=function(){var e=i(a).call(this);if(void 0!==e)return e;var t=new o.Assertion;return r(this,t),t};var c=s.method;s.method=function(){var e=n(c).apply(this,arguments);if(void 0!==e)return e;var t=new o.Assertion;return r(this,t),t};};},{"../../chai":2,"./transferFlags":33}],29:[function(e,t,n){
    /*!
     * Chai - overwriteMethod utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("./addLengthGuard"),r=e("../../chai"),i=e("./flag"),s=e("./proxify"),a=e("./transferFlags");t.exports=function(e,t,n){var c=e[t],u=function(){throw new Error(t+" is not a function")};c&&"function"==typeof c&&(u=c);var f=function(){i(this,"lockSsfi")||i(this,"ssfi",f);var e=i(this,"lockSsfi");i(this,"lockSsfi",!0);var t=n(u).apply(this,arguments);if(i(this,"lockSsfi",e),void 0!==t)return t;var o=new r.Assertion;return a(this,o),o};o(f,t,!1),e[t]=s(f,t);};},{"../../chai":2,"./addLengthGuard":10,"./flag":15,"./proxify":31,"./transferFlags":33}],30:[function(e,t,n){
    /*!
     * Chai - overwriteProperty utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("../../chai"),r=e("./flag"),i=e("./isProxyEnabled"),s=e("./transferFlags");t.exports=function(e,t,n){var a=Object.getOwnPropertyDescriptor(e,t),c=function(){};a&&"function"==typeof a.get&&(c=a.get),Object.defineProperty(e,t,{get:function e(){i()||r(this,"lockSsfi")||r(this,"ssfi",e);var t=r(this,"lockSsfi");r(this,"lockSsfi",!0);var a=n(c).call(this);if(r(this,"lockSsfi",t),void 0!==a)return a;var u=new o.Assertion;return s(this,u),u},configurable:!0});};},{"../../chai":2,"./flag":15,"./isProxyEnabled":26,"./transferFlags":33}],31:[function(e,t,n){var o=e("../config"),r=e("./flag"),i=e("./getProperties"),s=e("./isProxyEnabled"),a=["__flags","__methods","_obj","assert"];function c(e,t,n){if(Math.abs(e.length-t.length)>=n)return n;for(var o=[],r=0;r<=e.length;r++)o[r]=Array(t.length+1).fill(0),o[r][0]=r;for(var i=0;i<t.length;i++)o[0][i]=i;for(r=1;r<=e.length;r++){var s=e.charCodeAt(r-1);for(i=1;i<=t.length;i++)Math.abs(r-i)>=n?o[r][i]=n:o[r][i]=Math.min(o[r-1][i]+1,o[r][i-1]+1,o[r-1][i-1]+(s===t.charCodeAt(i-1)?0:1));}return o[e.length][t.length]}t.exports=function(e,t){return s()?new Proxy(e,{get:function e(n,s){if("string"==typeof s&&-1===o.proxyExcludedKeys.indexOf(s)&&!Reflect.has(n,s)){if(t)throw Error("Invalid Chai property: "+t+"."+s+'. See docs for proper usage of "'+t+'".');var u=null,f=4;throw i(n).forEach((function(e){if(!Object.prototype.hasOwnProperty(e)&&-1===a.indexOf(e)){var t=c(s,e,f);t<f&&(u=e,f=t);}})),null!==u?Error("Invalid Chai property: "+s+'. Did you mean "'+u+'"?'):Error("Invalid Chai property: "+s)}return -1!==a.indexOf(s)||r(n,"lockSsfi")||r(n,"ssfi",e),Reflect.get(n,s)}}):e};},{"../config":4,"./flag":15,"./getProperties":22,"./isProxyEnabled":26}],32:[function(e,t,n){
    /*!
     * Chai - test utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    /*!
     * Module dependencies
     */
    var o=e("./flag");t.exports=function(e,t){var n=o(e,"negate"),r=t[0];return n?!r:r};},{"./flag":15}],33:[function(e,t,n){
    /*!
     * Chai - transferFlags utility
     * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    t.exports=function(e,t,n){var o=e.__flags||(e.__flags=Object.create(null));for(var r in t.__flags||(t.__flags=Object.create(null)),n=3!==arguments.length||n,o)(n||"object"!==r&&"ssfi"!==r&&"lockSsfi"!==r&&"message"!=r)&&(t.__flags[r]=o[r]);};},{}],34:[function(e,t,n){
    /*!
     * assertion-error
     * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
     * MIT Licensed
     */
    /*!
     * Return a function that will copy properties from
     * one object to another excluding any originally
     * listed. Returned function will create a new `{}`.
     *
     * @param {String} excluded properties ...
     * @return {Function}
     */
    function o(){var e=[].slice.call(arguments);function t(t,n){Object.keys(n).forEach((function(o){~e.indexOf(o)||(t[o]=n[o]);}));}return function(){for(var e=[].slice.call(arguments),n=0,o={};n<e.length;n++)t(o,e[n]);return o}}
    /*!
     * Primary Exports
     */function r(e,t,n){var i=o("name","message","stack","constructor","toJSON")(t||{});for(var s in this.message=e||"Unspecified AssertionError",this.showDiff=!1,i)this[s]=i[s];if(n=n||r,Error.captureStackTrace)Error.captureStackTrace(this,n);else try{throw new Error}catch(e){this.stack=e.stack;}}
    /*!
     * Inherit from Error.prototype
     */t.exports=r,r.prototype=Object.create(Error.prototype),
    /*!
     * Statically set name
     */
    r.prototype.name="AssertionError",
    /*!
     * Ensure correct constructor
     */
    r.prototype.constructor=r,r.prototype.toJSON=function(e){var t=o("constructor","toJSON","stack")({name:this.name},this);return !1!==e&&this.stack&&(t.stack=this.stack),t};},{}],35:[function(e,t,n){function o(e,t){return t instanceof Error&&e===t}function r(e,t){return t instanceof Error?e.constructor===t.constructor||e instanceof t.constructor:(t.prototype instanceof Error||t===Error)&&(e.constructor===t||e instanceof t)}function i(e,t){var n="string"==typeof e?e:e.message;return t instanceof RegExp?t.test(n):"string"==typeof t&&-1!==n.indexOf(t)}var s=/\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;function a(e){var t="";if(void 0===e.name){var n=String(e).match(s);n&&(t=n[1]);}else t=e.name;return t}function c(e){var t=e;return e instanceof Error?t=a(e.constructor):"function"==typeof e&&(t=a(e).trim()||a(new e)),t}function u(e){var t="";return e&&e.message?t=e.message:"string"==typeof e&&(t=e),t}t.exports={compatibleInstance:o,compatibleConstructor:r,compatibleMessage:i,getMessage:u,getConstructorName:c};},{}],36:[function(e,t,n){
    /*!
     * deep-eql
     * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
     * MIT Licensed
     */
    var o=e("type-detect");function r(){this._key="chai/deep-eql__"+Math.random()+Date.now();}r.prototype={get:function(e){return e[this._key]},set:function(e,t){Object.isExtensible(e)&&Object.defineProperty(e,this._key,{value:t,configurable:!0});}};var i="function"==typeof WeakMap?WeakMap:r;
    /*!
     * Check to see if the MemoizeMap has recorded a result of the two operands
     *
     * @param {Mixed} leftHandOperand
     * @param {Mixed} rightHandOperand
     * @param {MemoizeMap} memoizeMap
     * @returns {Boolean|null} result
    */function s(e,t,n){if(!n||O(e)||O(t))return null;var o=n.get(e);if(o){var r=o.get(t);if("boolean"==typeof r)return r}return null}
    /*!
     * Set the result of the equality into the MemoizeMap
     *
     * @param {Mixed} leftHandOperand
     * @param {Mixed} rightHandOperand
     * @param {MemoizeMap} memoizeMap
     * @param {Boolean} result
    */function a(e,t,n,o){if(n&&!O(e)&&!O(t)){var r=n.get(e);r?r.set(t,o):((r=new i).set(t,o),n.set(e,r));}}
    /*!
     * Primary Export
     */function c(e,t,n){if(n&&n.comparator)return f(e,t,n);var o=u(e,t);return null!==o?o:f(e,t,n)}function u(e,t){return e===t?0!==e||1/e==1/t:e!=e&&t!=t||!O(e)&&!O(t)&&null}
    /*!
     * The main logic of the `deepEqual` function.
     *
     * @param {Mixed} leftHandOperand
     * @param {Mixed} rightHandOperand
     * @param {Object} [options] (optional) Additional options
     * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
     * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
        complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
        references to blow the stack.
     * @return {Boolean} equal match
    */function f(e,t,n){(n=n||{}).memoize=!1!==n.memoize&&(n.memoize||new i);var r=n&&n.comparator,c=s(e,t,n.memoize);if(null!==c)return c;var f=s(t,e,n.memoize);if(null!==f)return f;if(r){var l=r(e,t);if(!1===l||!0===l)return a(e,t,n.memoize,l),l;var h=u(e,t);if(null!==h)return h}var d=o(e);if(d!==o(t))return a(e,t,n.memoize,!1),!1;a(e,t,n.memoize,!0);var y=p(e,t,d,n);return a(e,t,n.memoize,y),y}function p(e,t,n,o){switch(n){case"String":case"Number":case"Boolean":case"Date":return c(e.valueOf(),t.valueOf());case"Promise":case"Symbol":case"function":case"WeakMap":case"WeakSet":case"Error":return e===t;case"Arguments":case"Int8Array":case"Uint8Array":case"Uint8ClampedArray":case"Int16Array":case"Uint16Array":case"Int32Array":case"Uint32Array":case"Float32Array":case"Float64Array":case"Array":return d(e,t,o);case"RegExp":return l(e,t);case"Generator":return y(e,t,o);case"DataView":return d(new Uint8Array(e.buffer),new Uint8Array(t.buffer),o);case"ArrayBuffer":return d(new Uint8Array(e),new Uint8Array(t),o);case"Set":case"Map":return h(e,t,o);default:return x(e,t,o)}}
    /*!
     * Compare two Regular Expressions for equality.
     *
     * @param {RegExp} leftHandOperand
     * @param {RegExp} rightHandOperand
     * @return {Boolean} result
     */function l(e,t){return e.toString()===t.toString()}
    /*!
     * Compare two Sets/Maps for equality. Faster than other equality functions.
     *
     * @param {Set} leftHandOperand
     * @param {Set} rightHandOperand
     * @param {Object} [options] (Optional)
     * @return {Boolean} result
     */function h(e,t,n){if(e.size!==t.size)return !1;if(0===e.size)return !0;var o=[],r=[];return e.forEach((function(e,t){o.push([e,t]);})),t.forEach((function(e,t){r.push([e,t]);})),d(o.sort(),r.sort(),n)}
    /*!
     * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
     *
     * @param {Iterable} leftHandOperand
     * @param {Iterable} rightHandOperand
     * @param {Object} [options] (Optional)
     * @return {Boolean} result
     */function d(e,t,n){var o=e.length;if(o!==t.length)return !1;if(0===o)return !0;for(var r=-1;++r<o;)if(!1===c(e[r],t[r],n))return !1;return !0}
    /*!
     * Simple equality for generator objects such as those returned by generator functions.
     *
     * @param {Iterable} leftHandOperand
     * @param {Iterable} rightHandOperand
     * @param {Object} [options] (Optional)
     * @return {Boolean} result
     */function y(e,t,n){return d(w(e),w(t),n)}
    /*!
     * Determine if the given object has an @@iterator function.
     *
     * @param {Object} target
     * @return {Boolean} `true` if the object has an @@iterator function.
     */function b(e){return "undefined"!=typeof Symbol&&"object"==typeof e&&void 0!==Symbol.iterator&&"function"==typeof e[Symbol.iterator]}
    /*!
     * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
     * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
     *
     * @param {Object} target
     * @returns {Array} an array of entries from the @@iterator function
     */function g(e){if(b(e))try{return w(e[Symbol.iterator]())}catch(e){return []}return []}
    /*!
     * Gets all entries from a Generator. This will consume the generator - which could have side effects.
     *
     * @param {Generator} target
     * @returns {Array} an array of entries from the Generator.
     */function w(e){for(var t=e.next(),n=[t.value];!1===t.done;)t=e.next(),n.push(t.value);return n}
    /*!
     * Gets all own and inherited enumerable keys from a target.
     *
     * @param {Object} target
     * @returns {Array} an array of own and inherited enumerable keys from the target.
     */function m(e){var t=[];for(var n in e)t.push(n);return t}
    /*!
     * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
     * each key. If any value of the given key is not equal, the function will return false (early).
     *
     * @param {Mixed} leftHandOperand
     * @param {Mixed} rightHandOperand
     * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
     * @param {Object} [options] (Optional)
     * @return {Boolean} result
     */function v(e,t,n,o){var r=n.length;if(0===r)return !0;for(var i=0;i<r;i+=1)if(!1===c(e[n[i]],t[n[i]],o))return !1;return !0}
    /*!
     * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
     * for each enumerable key in the object.
     *
     * @param {Mixed} leftHandOperand
     * @param {Mixed} rightHandOperand
     * @param {Object} [options] (Optional)
     * @return {Boolean} result
     */function x(e,t,n){var o=m(e),r=m(t);if(o.length&&o.length===r.length)return o.sort(),r.sort(),!1!==d(o,r)&&v(e,t,o,n);var i=g(e),s=g(t);return i.length&&i.length===s.length?(i.sort(),s.sort(),d(i,s,n)):0===o.length&&0===i.length&&0===r.length&&0===s.length}
    /*!
     * Returns true if the argument is a primitive.
     *
     * This intentionally returns true for all objects that can be compared by reference,
     * including functions and symbols.
     *
     * @param {Mixed} value
     * @return {Boolean} result
     */function O(e){return null===e||"object"!=typeof e}t.exports=c,t.exports.MemoizeMap=i;},{"type-detect":39}],37:[function(e,t,n){var o=Function.prototype.toString,r=/\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;function i(e){if("function"!=typeof e)return null;var t="";if(void 0===Function.prototype.name&&void 0===e.name){var n=o.call(e).match(r);n&&(t=n[1]);}else t=e.name;return t}t.exports=i;},{}],38:[function(e,t,n){function o(e,t){return null!=e&&t in Object(e)}function r(e){return e.replace(/([^\\])\[/g,"$1.[").match(/(\\\.|[^.]+?)+/g).map((function(e){if("constructor"===e||"__proto__"===e||"prototype"===e)return {};var t=/^\[(\d+)\]$/.exec(e);return t?{i:parseFloat(t[1])}:{p:e.replace(/\\([.[\]])/g,"$1")}}))}function i(e,t,n){var o=e,r=null;n=void 0===n?t.length:n;for(var i=0;i<n;i++){var s=t[i];o&&(o=void 0===s.p?o[s.i]:o[s.p],i===n-1&&(r=o));}return r}function s(e,t,n){for(var o=e,r=n.length,i=null,s=0;s<r;s++){var a=null,c=null;if(i=n[s],s===r-1)o[a=void 0===i.p?i.i:i.p]=t;else if(void 0!==i.p&&o[i.p])o=o[i.p];else if(void 0!==i.i&&o[i.i])o=o[i.i];else {var u=n[s+1];a=void 0===i.p?i.i:i.p,c=void 0===u.p?[]:{},o[a]=c,o=o[a];}}}function a(e,t){var n=r(t),s=n[n.length-1],a={parent:n.length>1?i(e,n,n.length-1):e,name:s.p||s.i,value:i(e,n)};return a.exists=o(a.parent,a.name),a}function c(e,t){return a(e,t).value}function u(e,t,n){return s(e,n,r(t)),e}t.exports={hasProperty:o,getPathInfo:a,getPathValue:c,setPathValue:u};},{}],39:[function(t,n,o){!function(e,t){"object"==typeof o&&void 0!==n?n.exports=t():e.typeDetect=t();}(this,(function(){var t="function"==typeof Promise,n="object"==typeof self?self:e,o="undefined"!=typeof Symbol,r="undefined"!=typeof Map,i="undefined"!=typeof Set,s="undefined"!=typeof WeakMap,a="undefined"!=typeof WeakSet,c="undefined"!=typeof DataView,u=o&&void 0!==Symbol.iterator,f=o&&void 0!==Symbol.toStringTag,p=i&&"function"==typeof Set.prototype.entries,l=r&&"function"==typeof Map.prototype.entries,h=p&&Object.getPrototypeOf((new Set).entries()),d=l&&Object.getPrototypeOf((new Map).entries()),y=u&&"function"==typeof Array.prototype[Symbol.iterator],b=y&&Object.getPrototypeOf([][Symbol.iterator]()),g=u&&"function"==typeof String.prototype[Symbol.iterator],w=g&&Object.getPrototypeOf(""[Symbol.iterator]()),m=8,v=-1;function x(e){var o=typeof e;if("object"!==o)return o;if(null===e)return "null";if(e===n)return "global";if(Array.isArray(e)&&(!1===f||!(Symbol.toStringTag in e)))return "Array";if("object"==typeof window&&null!==window){if("object"==typeof window.location&&e===window.location)return "Location";if("object"==typeof window.document&&e===window.document)return "Document";if("object"==typeof window.navigator){if("object"==typeof window.navigator.mimeTypes&&e===window.navigator.mimeTypes)return "MimeTypeArray";if("object"==typeof window.navigator.plugins&&e===window.navigator.plugins)return "PluginArray"}if(("function"==typeof window.HTMLElement||"object"==typeof window.HTMLElement)&&e instanceof window.HTMLElement){if("BLOCKQUOTE"===e.tagName)return "HTMLQuoteElement";if("TD"===e.tagName)return "HTMLTableDataCellElement";if("TH"===e.tagName)return "HTMLTableHeaderCellElement"}}var u=f&&e[Symbol.toStringTag];if("string"==typeof u)return u;var p=Object.getPrototypeOf(e);return p===RegExp.prototype?"RegExp":p===Date.prototype?"Date":t&&p===Promise.prototype?"Promise":i&&p===Set.prototype?"Set":r&&p===Map.prototype?"Map":a&&p===WeakSet.prototype?"WeakSet":s&&p===WeakMap.prototype?"WeakMap":c&&p===DataView.prototype?"DataView":r&&p===d?"Map Iterator":i&&p===h?"Set Iterator":y&&p===b?"Array Iterator":g&&p===w?"String Iterator":null===p?"Object":Object.prototype.toString.call(e).slice(m,v)}return x}));},{}]},{},[1])(1);o.version;o.AssertionError;o.use;o.util;o.config;o.Assertion;var f=o.expect;o.should;o.Should;o.assert;

    /**
     *
     * @copyright   Copyright (C) 2005 - 2023 Thierry Bela.
     *
     * dual licensed
     *
     * @license     LGPL v3
     * @license     MIT License
     */
    (async function () {
        const Class = workerize(class {
            constructor() {
            }
            async callMeAsync(foo) {
                return foo + ' was async parameter';
            }
            watch(...args) {
                console.info('started watching sync ...' + args);
                return 'ACK';
            }
            square(x) {
                return x * x;
            }
        });
        const instance = new Class;
        describe('test class', () => {
            it('test class: calling method #1', async function () {
                // assertions here
                f(await instance.watch('we had an argument')).equals('ACK');
            });
            it('test class: calling method #2', async function () {
                // assertions here
                f(await instance.square(2)).equals(4);
            });
            it('test class: calling async method #3', async function () {
                // assertions here
                f(await instance.callMeAsync(2)).equals('2 was async parameter');
            });
        });
        const func = workerize(function (...args) {
            return args;
        });
        const func2 = workerize(async function (...args) {
            return args;
        });
        const func3 = workerize(async (...args) => ['func3'].concat(args));
        const func4 = workerize((...args) => ['func4'].concat(args));
        describe('test functions', function () {
            it('test function: calling function #1', async function () {
                f((await func('function', 'running', 'from', 'worker')).join(' ')).equals('function running from worker');
            });
            it('test function: calling async function #2', async function () {
                f((await func2('async', 'function', 'running', 'from', 'worker')).join(' ')).equals('async function running from worker');
            });
            it('test function: calling function #3', async function () {
                f((await func3('async', 'function', 'running', 'from', 'worker')).join(' - ')).equals('func3 - async - function - running - from - worker');
            });
            it('test function: calling async function #4', async function () {
                f((await func4('arrow', 'function', 'running', 'from', 'worker')).join(' - ')).equals('func4 - arrow - function - running - from - worker');
            });
        });
        const func5 = workerize(function (...args) {
            // @ts-ignore
            return sum(...args);
        }, ['./js/sum.js']);
        const func6 = workerize(function (...args) {
            // @ts-ignore
            const cat = new Animal(...args);
            return cat.say();
        }, ['./js/animal.js']);
        describe('dependencies test', function () {
            it('calling function from external dependency #1', async function () {
                f(await func5(15, -5, 1)).equals(11);
            });
            it('calling method from external class #2', async function () {
                f(await func6('Cat', 2, 'Charlie')).equals("Charlie says: I am a 2 year(s) old Cat");
            });
        });
        // terminate the service workers
        // dispose(instance, func, func2, func3, func4);
    })();

}));