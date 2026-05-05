/**
 * @file colors.js
 * @description File konfigurasi Token Warna (Design System) pusat.
 */

const colors = {
	surface: {
		50: "#f2f4f6",
		100: "#d9dde3",
		200: "#bfc6cf",
		300: "#a5afbc",
		400: "#8b98a8",
		500: "#718195",
		600: "#576677",
		700: "#3d4c59",
		800: "#23323b",
		900: "#131c23",
		950: "#0b1117",
		DEFAULT: "#131c23"
	},
	
	danger: "#ff4444",
	success: "#00cc66",
	cyan: {
		100: "#ccf7ff",
		200: "#99efff",
		300: "#66e7ff",
		400: "#00d8ff",
		500: "#00b2cc",
		DEFAULT: "#00d8ff"
	}
};

/** Gaya Log Konsol */
export const LOGGER_STYLES = {
    header: 'color: #a78bfa; font-weight: bold; font-size: 11px',
    commandHeader: 'color: #fb923c; font-weight: bold; font-size: 11px',
    section: 'color: #facc15; font-weight: bold',
    label: 'color: #d1d5db',
    value: 'color: #34d399; font-weight: bold',
    separator: 'color: #4b5563',
    duration: 'color: #f59e0b; font-weight: bold',
    sepLine: '-------------------------------------------'
};

export const getTimeHeader = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export { colors };

export default colors;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = colors;
}
