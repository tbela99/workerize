import { serialize } from '../serialize.js';
import { id } from '../id.js';

function generate(task, options = {}) {
    const serialized = serialize(task);
    const data = [];
    const code = [];
    const className = serialized.name !== '' ? serialized.name : `var${id().slice(0, 3)}`;
    code.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
    if (serialized.type == 'class') {
        code.push(`let instance;
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
        code.push(`self.onmessage = async function (e) {
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
    }
    if (!options.module) {
        // @ts-ignore
        if (options.dependencies.length > 0) {
            // @ts-ignore
            data.push(`importScripts(${options.dependencies.map((str) => '' + JSON.stringify(new URL(str, self.location.toString())))});`);
        }
    }
    else {
        // @ts-ignore
        if (options?.dependencies?.length > 0) {
            data.push(`const promisedModules = Promise.all(${JSON.stringify(options.dependencies?.map(dep => new URL(dep, self.location.href).href))}.map(url => import(url)));
                
                let modules = null;
                `);
            code.length = 0;
            code.push(serialized.name !== '' ? serialized.body : `const ${className} = ${serialized.body}`);
            if (serialized.type == 'class') {
                code.push(`let instance;
self.onmessage = async function (e) {

    if (modules == null) {
    
        modules = await promisedModules;
    }
    
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
                code.push(`self.onmessage = async function (e) {
                    
        if (modules == null) {
        
            modules = await promisedModules;
        }
    
        postMessage({id: e.data.id, data:${serialized.isAsync ? ' await' : ''} ${className}(...e.data.args)});
}`);
            }
        }
        //
        // @ts-ignore
        // if (options.dependencies.length > 0) {
        //
        //     // @ts-ignore
        //     data.push(`import(${options.dependencies.map((str: string) => '' + JSON.stringify(new URL(str, self.location.toString())))}).then(modules => {
        //     console.debug(modules);
        //         ${code.join('\n')}
        //     });
        //     console.debug('done');
        //     `);
        //
        //     code.length = 0;
        // }
    }
    return data.concat(code).join('\n');
}

export { generate };
