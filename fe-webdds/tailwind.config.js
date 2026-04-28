/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");
const customColors = require("./src/utils/colors");

module.exports = {
	mode: "jit",
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	darkMode: "media",
	important: true,
	theme: {
		extend: {
			colors: customColors,
			fontFamily: {
				montserrat: ["Montserrat", ...defaultTheme.fontFamily.sans]
			},
			animation: {
				flash: "flash 0.1s linear forwards"
			},
			boxShadow: {
				buttonShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
				"triple-ring": `
					inset 0 0px 6px #000,
					0 0 0 0.5px #000000,
					0 0 0 4px #151515,
					0 0 0 4.5px #000000,
					0 0 0 7px #151515,
					0 0 0 7.5px #000000,
					0 0 0 10.5px #151515
				`,
				"compact-ring-sm": `
					inset 0 0px 1.5px #000,
					0 0 0 0.1px #000000,
					0 0 0 1.5px #161b18ff,
					0 0 0 1.6px #000000,
					0 0 0 3.5px #161b18ff,
					0 0 0 3.6px #000000,
					0 0 0 3px #161b18ff
				`
			},
			keyframes: {
				flash: {
					"0%": { opacity: 0 },
					"50%": { opacity: 1 },
					"100%": { opacity: 0 }
				}
			}
		}
	},
	variants: {
		extend: {}
	},
	plugins: [
		plugin(function ({ addBase }) {
			addBase({
				"@font-face": {
					fontFamily: "Montserrat",
					fontWeight: "400",
					src: "url(/src/assets/fonts/Montserrat-Regular.ttf)"
				}
			});
		}),
		plugin(function ({ addBase }) {
			addBase({
				"@font-face": {
					fontFamily: "Montserrat",
					fontWeight: "500",
					src: "url(/src/assets/fonts/Montserrat-Medium.ttf)"
				}
			});
		}),
		plugin(function ({ addBase }) {
			addBase({
				"@font-face": {
					fontFamily: "Montserrat",
					fontWeight: "600",
					src: "url(/src/assets/fonts/Montserrat-SemiBold.ttf)"
				}
			});
		}),
		plugin(function ({ addBase }) {
			addBase({
				"@font-face": {
					fontFamily: "Montserrat",
					fontWeight: "700",
					src: "url(/src/assets/fonts/Montserrat-Bold.ttf)"
				}
			});
		}),
		plugin(function ({ addBase }) {
			addBase({
				"@font-face": {
					fontFamily: "Montserrat",
					fontWeight: "800",
					src: "url(/src/assets/fonts/Montserrat-ExtraBold.ttf)"
				}
			});
		})
	]
};
