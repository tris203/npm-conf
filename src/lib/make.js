const fs = require('fs');
const path = require('path');
const definitions = require('@npmcli/config/lib/definitions')
const Config = require('@npmcli/config')

const INDENT_REGEXP = /^((?:	)+)/gmu;
/** @param {string} match */
const INDENT_REPLACER = match => {
	return '\t'.repeat(match.length >>> 1);
};

/** @param {string} body */
const defaultsTemplate = body => `\
import os from 'os';
import path from 'path';
import { types } from './types';

const temp = os.tmpdir();
const uidOrPid = process.getuid ? process.getuid() : process.pid;
const hasUnicode = () => true;
const isWindows = process.platform === 'win32';

const osenv = {
	editor: () => process.env.EDITOR || process.env.VISUAL || (isWindows ? 'notepad.exe' : 'vi'),
	shell: () => isWindows ? (process.env.COMSPEC || 'cmd.exe') : (process.env.SHELL || '/bin/bash')
};

const umask = {
	fromString: () => process.umask()
};

let home = os.homedir();

if (home) {
	process.env.HOME = home;
} else {
	home = path.resolve(temp, 'npm-' + uidOrPid);
}

const cacheExtra = process.platform === 'win32' ? 'npm-cache' : '.npm';
const cacheRoot = process.platform === 'win32' && process.env.APPDATA || home;
const cache = path.resolve(cacheRoot, cacheExtra);

let defaults: Record<string, any> ;
let globalPrefix;

Object.defineProperty(exports, 'defaults', {
	get: function () {
		if (defaults) return defaults;

		if (process.env.PREFIX) {
			globalPrefix = process.env.PREFIX;
		} else if (process.platform === 'win32') {
			// c:\\node\\node.exe --> prefix=c:\\node\\
			globalPrefix = path.dirname(process.execPath);
		} else {
			// /usr/local/bin/node --> prefix=/usr/local
			globalPrefix = path.dirname(path.dirname(process.execPath)); // destdir only is respected on Unix

			if (process.env.DESTDIR) {
				globalPrefix = path.join(process.env.DESTDIR, globalPrefix);
			}
		}

defaults = ${body.replaceAll('"', `'`).replace("'node-version': process.version,", '// We remove node-version to fix the issue described here: https://github.com/pnpm/pnpm/issues/4203#issuecomment-1133872769')};
return defaults;
}
});`;

/** @param {string} body */
const typesTemplate = body => `\
// Generated with \`lib/make.js\`
'use strict';
const path = require('path');
const Stream = require('stream').Stream;
const url = require('url');

const Umask = () => {};
const getLocalAddresses = () => [];
const semver = () => {};

${body.replace(INDENT_REGEXP, INDENT_REPLACER)};
`;

fs.writeFileSync(path.join(__dirname, 'defaults.ts'), defaultsTemplate(JSON.stringify(definitions.defaults, null, 1)));
// fs.writeFileSync(path.join(__dirname, 'types.js'), typesTemplate(JSON.stringify(definitionTypes, null, 1)));