const npmCore = require('npm/lib/config/core');
const npmDefaults = require('npm/lib/config/defaults');
const pify = require('pify');
const m = require('.');

test('mirror npm config', async () => {
	const conf = m();
	const npmconf = await pify(npmCore.load)();

	expect(conf.globalPrefix).toBe(npmconf.globalPrefix);
	expect(conf.localPrefix).toBe(npmconf.localPrefix);
	expect(conf.get('prefix')).toBe(npmconf.get('prefix'));
	expect(conf.get('registry')).toBe(npmconf.get('registry'));
	expect(conf.get('tmp')).toBe(npmconf.get('tmp'));
});

test.skip('mirror npm defaults', () => {
	expect(m.defaults).toBe(npmDefaults.defaults);
});
