import { defineConfig } from "vite";

export default defineConfig({
    base: "/geurbot_static/",
    publicDir: "public",
    server: {
        host: "127.0.0.1",
        proxy: {
            "/api": { target: "http://127.0.0.1:8123", changeOrigin: true }
        }
    },
    build: { outDir: "dist", emptyOutDir: true }
});
