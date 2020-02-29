module.exports = function (x) {
	x = x.toLowerCase().replace(/^npm_config_/, '');
	if (x.endsWith('_authtoken')) {
		return `${x.substr(0, x.length - 10).replace(/_/g, '-')}_authToken`;
	}
	const p = x.toLowerCase()
		.replace(/^npm_config_/, '')
		.replace(/(?!^)_/g, '-');
	return p;
}
