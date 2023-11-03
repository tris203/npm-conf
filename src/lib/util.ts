import fs from 'fs'
import path, { type PlatformPath } from 'path'
import { envReplace } from '@pnpm/config.env-replace'
import { type ErrorFormat } from './conf'

type TypeList = Array<PlatformPath | BooleanConstructor | StringConstructor | NumberConstructor>

// https://github.com/npm/cli/blob/latest/lib/config/core.js#L359-L404
export const parseField = (types: { [x: string]: ConcatArray<never> }, field: string | number, key: string | number) => {
  if (typeof field !== 'string') {
    return field
  }

  const typeList: TypeList = [].concat(types[key])
  const isPath = typeList.includes(path)
  const isBool = typeList.includes(Boolean)
  const isString = typeList.includes(String)
  const isNumber = typeList.includes(Number)

  field = `${field}`.trim()

  if (/^".*"$/.test(field)) {
    try {
      field = JSON.parse(field)
    } catch (error) {
      throw new Error(`Failed parsing JSON config key ${key}: ${field}`)
    }
  }

  if (isBool && !isString && field === '') {
    return true
  }

  switch (field) {
  case 'true': {
    return true
  }

  case 'false': {
    return false
  }

  case 'null': {
    return null
  }

  case 'undefined': {
    return undefined
  }
  }

  field = envReplace(field.toString(), process.env)

  if (isPath) {
    const regex = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//

    if (regex.test(field) && process.env.HOME) {
      field = path.resolve(process.env.HOME, field.slice(2))
    }

    field = path.resolve(field)
  }

  if (isNumber && !isNaN(Number(field))) {
    field = Number(field)
  }

  return field
}

// https://github.com/npm/cli/blob/latest/lib/config/find-prefix.js
export const findPrefix = (name: string) => {
  name = path.resolve(name)

  let walkedUp = false

  while (path.basename(name) === 'node_modules') {
    name = path.dirname(name)
    walkedUp = true
  }

  if (walkedUp) {
    return name
  }

  const find = (name: fs.PathLike, original: string): any => {
    const regex = /^[a-zA-Z]:(\\|\/)?$/

    if (name === '/' || (process.platform === 'win32' && regex.test(name.toString()))) {
      return original
    }

    try {
      const files = fs.readdirSync(name)

      if (
        files.includes('node_modules') || files.includes('package.json') || files.includes('package.json5') || files.includes('package.yaml') || files.includes('pnpm-workspace.yaml')
      ) {
        return name
      }

      const dirname = path.dirname(name.toString())

      if (dirname === name) {
        return original
      }

      return find(dirname, original)
    } catch (error) {
      if (name === original) {
        if ((error as ErrorFormat).code === 'ENOENT') {
          return original
        }

        throw error
      }

      return original
    }
  }

  return find(name, name)
}
