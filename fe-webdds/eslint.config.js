const js = require("@eslint/js");
const jsdoc = require("eslint-plugin-jsdoc");
const { defineConfig } = require("eslint/config");
const globals = require("globals");
const path = require("path");
const tseslint = require("typescript-eslint");

const defineConfigResult = defineConfig([
	{
		ignores: [
			"node_modules",
			"dist",
			"repos",
			"**/*.d.ts",
			"lib/index.css",
			"tailwind.config.js",
			"postcss.config.js",
			"vite.config.ts",
			"src/styles/tailwind.css",
			"package.json",
			".storybook",
			"**/*.config.*",
			"jest.setup.ts",
			"src/utils/api",
			"coverage",
			"jest.setup.js",
			"**/*.test.{js,ts,tsx}",
			"src-tauri",
			"__mocks__"
		]
	},
	{
		files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				sourceType: "module",
				ecmaVersion: "latest",
				project: path.resolve(__dirname, "./tsconfig.json"),
				tsconfigRootDir: __dirname
			},
			globals: Object.fromEntries(
				Object.entries({
					...globals.browser,
					...globals.node
				}).map(([key, value]) => [key.trim(), value])
			)
		},
		plugins: {
			js,
			jsdoc,
			"@typescript-eslint": tseslint.plugin
		},
		settings: {
			jsdoc: {
				mode: "typescript"
			},
			"import/resolver": {
				typescript: {}
			}
		},
		rules: {
			// jsdoc rules...
			"jsdoc/check-access": 1,
			"jsdoc/check-alignment": 1,
			"jsdoc/check-param-names": 1,
			"jsdoc/check-property-names": 1,
			"jsdoc/check-tag-names": 1,
			"jsdoc/check-values": 1,
			"jsdoc/empty-tags": 1,
			"jsdoc/implements-on-classes": 1,
			"jsdoc/multiline-blocks": 1,
			"jsdoc/no-multi-asterisks": 1,
			"jsdoc/require-jsdoc": [
				"warn",
				{
					contexts: [
						"FunctionDeclaration",
						"MethodDefinition",
						"VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"
					]
				}
			],
			"jsdoc/require-param": 1,
			"jsdoc/require-param-description": 1,
			"jsdoc/require-param-name": 1,
			"jsdoc/require-property": 1,
			"jsdoc/require-property-description": 1,
			"jsdoc/require-property-name": 1,
			"jsdoc/require-returns": 1,
			"jsdoc/require-returns-check": 1,
			"jsdoc/require-returns-description": 1,
			"jsdoc/require-yields": 1,
			"jsdoc/require-yields-check": 1,

			// ts rules
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/ban-ts-comment": "warn",

			"max-lines": [
				"warn",
				{ max: 600, skipBlankLines: true, skipComments: true }
			]
		}
	},
	tseslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked
]);

module.exports = defineConfigResult;
