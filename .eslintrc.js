module.exports = {
	extends: [
		'plugin:xivanalysis/recommended',
		'plugin:xivanalysis/client',
	],
	env: {
		browser: true,
	},
	overrides: [{
		files: ['stories/*.stories.js'],
		globals: {
			module: true,
		}
	}]
}
