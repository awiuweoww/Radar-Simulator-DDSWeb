import { defineConfig } from "@rspack/cli";
import { DefinePlugin, rspack } from "@rspack/core";
import RefreshPlugin from "@rspack/plugin-react-refresh";
import { configDotenv } from "dotenv";
import * as path from "path";

import { dependencies as deps } from "./package.json";

const isDev = process.env.NODE_ENV === "development";

// Load .env into process.env
configDotenv();

const SERVICE_NAME = process.env.SERVICE_NAME ?? "UNKNOWN_SERVICE";

// Generic helper for reading env variables
const getEnv = (key: string, fallback?: string): string =>
	process.env[key] ?? fallback ?? "";

// Map env to DefinePlugin variables
const defineEnv = Object.entries(process.env).reduce<Record<string, string>>(
	(acc, [key, val]) => {
		acc[`process.env.${key}`] = JSON.stringify(val);
		return acc;
	},
	{}
);

const targets = ["chrome >= 87", "edge >= 88", "firefox >= 78", "safari >= 14"];

export default defineConfig({
	context: __dirname,
	entry: {
		main: "./src/main.tsx"
	},
	devtool: "source-map",
	output: {
		publicPath: "auto",
		filename: "bundle.js"
	},
	resolve: {
		modules: [path.join(__dirname, "src"), "node_modules"],
		alias: {
			"@common": path.resolve(__dirname, "src/common"),
			"@component": path.resolve(__dirname, "src/components"),
			"@constants": path.resolve(__dirname, "src/constants"),
			"@utils": path.resolve(__dirname, "src/utils"),
			"@store": path.resolve(__dirname, "src/store"),
			"@hooks": path.resolve(__dirname, "src/hooks"),
			"@types": path.resolve(__dirname, "src/types"),
			"@streams": path.resolve(__dirname, "src/streams")
		},
		extensions: ["...", ".ts", ".tsx", ".jsx"]
	},
	devServer: {
		port: parseInt(getEnv("PORT", "3000")),
		host: "0.0.0.0",
		hot: true,
		static: {
			directory: path.join(__dirname, "build")
		},
		historyApiFallback: true,
		client: {
			overlay: false
		},
		devMiddleware: {
			writeToDisk: false,
		},
		watchFiles: ["src/**/*"],
	},
	watchOptions: {
		ignored: /node_modules/,
		poll: 1000, 
		aggregateTimeout: 300,
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ["postcss-loader"],
				type: "css"
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: "asset/resource"
			},
			{
				test: /\.[jt]sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "builtin:swc-loader",
						options: {
							jsc: {
								parser: {
									syntax: "typescript",
									tsx: true
								},
								transform: {
									react: {
										runtime: "automatic",
										development: isDev,
										refresh: isDev
									}
								}
							},
							env: { targets }
						}
					}
				]
			}
		]
	},
	plugins: [
		new rspack.container.ModuleFederationPlugin({
			name: SERVICE_NAME.toLowerCase().replace(/-/g, "_"),
			filename: "remoteEntry.js",
			remotes: {},
			exposes: {},
			shared: {
				...deps,
				react: {
					singleton: true,
					eager: true,
					requiredVersion: deps.react
				},
				"react-dom": {
					singleton: true,
					eager: true,
					requiredVersion: deps["react-dom"]
				},
				clsx: {
					singleton: true,
					eager: true,
					requiredVersion: deps["clsx"]
				},
				"tailwind-merge": {
					singleton: true,
					eager: true,
					requiredVersion: deps["tailwind-merge"]
				},
				"google-protobuf": {
					singleton: true,
					eager: true,
					requiredVersion: deps["google-protobuf"]
				},
				"grpc-web": {
					singleton: true,
					eager: true,
					requiredVersion: deps["grpc-web"]
				},
				zustand: {
					singleton: true,
					eager: true,
					requiredVersion: deps["zustand"]
				},
				milsymbol: {
					singleton: true,
					eager: true
				},
				"mil-std-2525": {
					singleton: true,
					eager: true
				},
				"cms-library": {
					singleton: true,
					eager: true,
					requiredVersion: "0.0.1"
				},
				"i18n-iso-countries": {
					singleton: true,
					eager: true,
					requiredVersion: deps["i18n-iso-countries"]
				},
				mitt: {
					singleton: true,
					eager: true
				},
				"socket.io-client": {
					singleton: true,
					eager: true,
					requiredVersion: deps["socket.io-client"]
				},
				ol: {
					singleton: true,
					eager: true,
					requiredVersion: deps["ol"]
				}
			}
		}),
		new rspack.HtmlRspackPlugin({
			template: "./index.html"
		}),
		new DefinePlugin(defineEnv),
		isDev ? new RefreshPlugin() : null
	].filter(Boolean),
	optimization: {
		minimizer: [
			new rspack.SwcJsMinimizerRspackPlugin(),
			new rspack.LightningCssMinimizerRspackPlugin({
				minimizerOptions: { targets }
			})
		]
	},
	experiments: {
		css: true
	}
});
