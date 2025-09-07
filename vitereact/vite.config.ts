import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import cofounderVitePlugin from "./src/_cofounder/vite-plugin/index";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		// webcontainers stuff
		{
			name: "isolation",
			configureServer(server) {
				server.middlewares.use((_req, res, next) => {
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
					res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
					next();
				});
			},
		},
		// pre transform ; to replace/inject <GenUi*> to allow editing ui - COMMENTED OUT
		/*
		{
			name: "cofounderVitePluginPre",
			async transform(code, id) {
				return await cofounderVitePlugin.pre({
					code,
					path: id,
				});
			},
			enforce: "pre", // ensure this plugin runs before other transformations
		},
		*/

		react(),
	],
	server: {
		host: true,
		port: 5173,
		allowedHosts: ['.launchpulse.ai', '.trycloudflare.com', 'localhost', '.ngrok.io', '.tunnel.dev'],
		cors: true,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
		}
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@schema": path.resolve(__dirname, "../backend/schema.ts"),
		},
	},
	build: {
		outDir: "dist",
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					router: ['react-router-dom'],
					ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
					query: ['@tanstack/react-query'],
					redux: ['@reduxjs/toolkit', 'react-redux', 'redux'],
					charts: ['recharts'],
					motion: ['framer-motion'],
					utils: ['axios', 'date-fns', 'clsx', 'class-variance-authority']
				}
			}
		},
		chunkSizeWarningLimit: 1000,
		sourcemap: false,
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true
			}
		}
	},
});
