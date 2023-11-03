const fs = require('fs');
const path = require('path');
const defFile = require.resolve('../../node_modules/@npmcli/config/lib/definitions/definitions.js');
const parser = require('@babel/parser').parse;
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const def = fs.readFileSync(defFile, 'utf8');
const ast = parser(def);

const defaultsTemplate = body => `\
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import os from 'os'
import path from 'path'
import * as ciInfo from 'ci-info'
const temp = os.tmpdir()
const uidOrPid = process.getuid ? process.getuid() : process.pid
const isWindows = process.platform === 'win32'

let home = os.homedir()

if (home) {
  process.env.HOME = home
} else {
  home = path.resolve(temp, 'npm-' + uidOrPid)
}

const cacheExtra = process.platform === 'win32' ? 'npm-cache' : '.npm'
const cacheRoot = process.platform === 'win32' && process.env.APPDATA || home
const cache = path.resolve(cacheRoot, cacheExtra)

const editor = process.env.EDITOR ||
  process.env.VISUAL ||
  (isWindows ? \`${process.env.SYSTEMROOT}\\notepad.exe\` : 'vi')

const shell = isWindows
  ? process.env.ComSpec || 'cmd'
  : process.env.SHELL || 'sh'

const unicode = /UTF-?8$/i.test(
  process.env.LC_ALL ||
  process.env.LC_CTYPE ||
  process.env.LANG || ''
)

let defaults: unknown
let globalPrefix

Object.defineProperty(exports, 'defaults', {
  get: function () {
    if (defaults) return defaults

    if (process.env.PREFIX) {
      globalPrefix = process.env.PREFIX
    } else if (process.platform === 'win32') {
      // c:\\node\\node.exe --> prefix=c:\\node\\
      globalPrefix = path.dirname(process.execPath)
    } else {
      // /usr/local/bin/node --> prefix=/usr/local
      globalPrefix = path.dirname(path.dirname(process.execPath)) // destdir only is respected on Unix

      if (process.env.DESTDIR) {
        globalPrefix = path.join(process.env.DESTDIR, globalPrefix)
      }
    }


		defaults = {
		${Object.keys(body).map(key => `\
			'${key}' : ${body[key]},`).join('\n')}

		}
		return defaults
	  },
	})
	
		`;

// ${body.replace(INDENT_REGEXP, INDENT_REPLACER).replace("'node-version': process.version,", '// 

const typesTemplate = body => `\
import path from 'path'
import url from 'url'

const Umask = () => {}
const getLocalAddresses = () => []
const semver = () => {}

export const types = {
${Object.keys(body).map(key => `\
'${key}' : ${body[key]},`).join('\n')}
}
`;
// ${body.replace(INDENT_REGEXP, INDENT_REPLACER)};
let extractedTypes = {};
let extractedDefaults = {};

function extractProperties(properties) {
  const result = {};
  properties.forEach(property => {
    const propertyName = property.get('key').node.name;
    const propertyValue = property.get('value').node;
    result[propertyName] = propertyValue;
  });
  return result;
}

traverse(ast, {
  CallExpression(path) {
    const calleeName = path.get('callee.name').node;
    if (calleeName === 'define' && path.get('arguments')[1].isObjectExpression()) {
      const key = path.get('arguments')[0].node.value;
      const properties = path.get('arguments')[1].get('properties');
      const extractedProperties = extractProperties(properties);
	 // console.log('Extracted Properties:', extractedProperties);
      if (extractedProperties.type) {
		//remove [] and replace , with |
		extractedTypes[key] = generator(extractedProperties.type).code
	  }		
		
	if (extractedProperties.default) {
		extractedDefaults[key] = generator(extractedProperties.default).code;
      }
    }
  },
});

//We remove node-version to fix the issue described here: https://github.com/pnpm/pnpm/issues/4203#issuecomment-1133872769')};
delete extractedDefaults['node-version'];

  console.log('Extracted Defaults:', extractedDefaults);
 // console.log('Extracted Types:', extractedTypes);
fs.writeFileSync(path.join(__dirname, 'defaults.ts'), defaultsTemplate(extractedDefaults));
fs.writeFileSync(path.join(__dirname, 'types.ts'), typesTemplate(extractedTypes));