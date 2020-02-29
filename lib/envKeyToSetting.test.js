const envKeyToSetting = require('./envKeyToSetting');
test('envKeyToSetting()', () => {
	expect(envKeyToSetting('NPM_CONFIG_FOO')).toBe('foo');
	expect(envKeyToSetting('npm_config_//npm.pkg.github.com/:_authToken')).toBe('//npm.pkg.github.com/:_authToken')
	expect(envKeyToSetting('npm_config__authToken')).toBe('_authToken')
	expect(envKeyToSetting('npm_config_//npm.pkg.github.com/:_authtoken')).toBe('//npm.pkg.github.com/:_authToken')
	expect(envKeyToSetting('npm_config__authtoken')).toBe('_authToken')
})
