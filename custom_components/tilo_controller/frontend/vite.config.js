
import { defineConfig } from "vite";

export default defineConfig({
    server: {
        host: "127.0.0.1",
        port: 5173,
    },
    build: {
        outDir: "../www",
        emptyOutDir: true,
        lib: {
            entry: "src/main.js",
            formats: ["es"],
            fileName: () => "tilo-controller.js",
        },
    },
});
