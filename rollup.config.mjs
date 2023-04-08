import dts from 'rollup-plugin-dts';
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";

export default [
    {
        input: 'src/index.ts',
        plugins: [nodeResolve(), typescript()],
        output: [
            {
                file: './dist/index.mjs',
                format: 'es',
            },
            {
                file: './dist/index.js',
                format: 'umd',
                name: 'workerize'
            }
        ]
    },
    {
        input: 'test/index.test.ts',
        plugins: [nodeResolve(), typescript()],
        output: [
            {
                file: './test/index.test.js',
                format: 'umd',
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
]