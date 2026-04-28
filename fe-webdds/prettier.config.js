const config = {
	semi: true,
	tabWidth: 2,
	useTabs: true,
	singleQuote: false,
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: "always",
	quoteProps: "as-needed",
	jsxSingleQuote: false,
	trailingComma: "none",
	endOfLine: "lf",
	printWidth: 80,

	plugins: ["@trivago/prettier-plugin-sort-imports"],

	importOrder: [
		"^react",
		"^next",
		"<THIRD_PARTY_MODULES>",
		"^@store/(.*)$",
		"^@hooks/(.*)$",
		"^@common/(.*)$",
		"^@component/(.*)$",
		"^@constants/(.*)$",
		"^@utils/(.*)$",
		"^@types/(.*)$",
		"^[./]"
	],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true
};

module.exports = config;
