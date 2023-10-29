import fs from 'fs';
import path, { PlatformPath } from 'path';
import { envReplace } from '@pnpm/config.env-replace';
import { type ErrorFormat } from './conf';

type TypeList = Array<PlatformPath | BooleanConstructor | StringConstructor | NumberConstructor>;

// https://github.com/npm/cli/blob/latest/lib/config/core.js#L359-L404
export const parseField = (types: { [x: string]: ConcatArray<never>; }, field: string | number, key: string | number) => {
	if (typeof field !== 'string') {
		return field;
	}



	const typeList: TypeList = [].concat(types[key]);
	const isPath = typeList.indexOf(path) !== -1;
	const isBool = typeList.indexOf(Boolean) !== -1;
	const isString = typeList.indexOf(String) !== -1;
	const isNumber = typeList.indexOf(Number) !== -1;

	field = `${field}`.trim();

	if (/^".*"$/.test(field)) {
		try {
			field = JSON.parse(field);
		} catch (error) {
			throw new Error(`Failed parsing JSON config key ${key}: ${field}`);
		}
	}

	if (isBool && !isString && field === '') {
		return true;
	}

	switch (field) { // eslint-disable-line default-case
		case 'true': {
			return true;
		}

		case 'false': {
			return false;
		}

		case 'null': {
			return null;
		}

		case 'undefined': {
			return undefined;
		}
	}

	field = envReplace(field.toString(), process.env);

	if (isPath) {
		const regex = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//;

		if (regex.test(field) && process.env.HOME) {
			field = path.resolve(process.env.HOME, field.substr(2));
		}

		field = path.resolve(field);
	}

	if (isNumber && !isNaN(Number(field))) {
		field = Number(field);
	}

	return field;
};

// https://github.com/npm/cli/blob/latest/lib/config/find-prefix.js
export const findPrefix = (name: string) => {
	name = path.resolve(name);

	let walkedUp = false;

	while (path.basename(name) === 'node_modules') {
		name = path.dirname(name);
		walkedUp = true;
	}

	if (walkedUp) {
		return name;
	}

	const find = (name: fs.PathLike, original: string) : any => {
		const regex = /^[a-zA-Z]:(\\|\/)?$/;

		if (name === '/' || (process.platform === 'win32' && regex.test(name.toString()))) {
			return original;
		}

		try {
			const files = fs.readdirSync(name);

			if (
				files.includes('node_modules') ||
				files.includes('package.json') ||
				files.includes('package.json5') ||
				files.includes('package.yaml') ||
				files.includes('pnpm-workspace.yaml')
			) {
				return name;
			}

			const dirname = path.dirname(name.toString());

			if (dirname === name) {
				return original;
			}

			return find(dirname, original);
		} catch (error) {
			if (name === original) {
				if ((error as ErrorFormat).code === 'ENOENT') {
					return original;
				}

				throw error;
			}

			return original;
		}
	};

	return find(name, name);
};
