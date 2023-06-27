import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import {glob} from "glob";

export default [...await glob('./test/*.test.ts').then(files => files.map(input => {
    return {
        input,
        plugins: [nodeResolve(), typescript()],
        output:
            {
                banner: `/* generate from ${input} */`,
                file: `${input.replace(/\.ts$/, '.js')}`,
                // entryFileNames: '[name].mjs',
                // chunkFileNames: '[name].[hash].mjs',
                format: 'es'
            }
    }
}))
    ,
    ...await glob('./test/*.node.ts').then(files => files.map(input => {

        return {
            input,
            cache: false,
            plugins: [nodeResolve(), typescript()],
            output:
                {
                    banner: `/* generate from ${input} */`,
                    file: `${input.replace(/\.ts$/, '.mjs')}`,
                    // entryFileNames: '[name].mjs',
                    // chunkFileNames: '[name].[hash].mjs',
                    format: 'es'
                }
        }
    })),
    {
        input: ['./src/web/index.ts', './src/node/index.ts'],
        plugins: [nodeResolve(), typescript()],
        output: [
            {
                dir: 'dist',
                preserveModules: true,
                format: 'es',
            }
        ]
    },
    {
        input: 'src/web/index.ts',
        plugins: [nodeResolve(), typescript()],
        output: [
            {
                file: './dist/browser.js',
                format: 'umd',
                name: 'workerize'
            }
        ]
    },
    {
        input: 'src/index.ts',
        plugins: [dts()],
        output: {

            file: './dist/index.d.ts',
            format: 'es'
        }
    }
];