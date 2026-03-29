import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [react(), dts({ tsconfigPath: './tsconfig.build.json' })],
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'index'
        },
        rolldownOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime']
        },
        sourcemap: true,
        minify: false
    },
    test: {
        globals: true,
        environment: 'jsdom'
    }
});
