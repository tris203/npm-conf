'use strict'
import { readCAFileSync } from '@pnpm/network.ca-file'
import fs from 'fs'
import path from 'path'
import { parseField, findPrefix } from './util'
import { ConfigChain, type ConfigChainOptions } from 'config-chain'
import { keyToSetting } from './envKeyToSetting'

export interface ErrorFormat {
  code: string
  message: string
}

export class Conf extends ConfigChain {
  _parseField: (field: any, key: any) => any
  root: any
  sources: any
  push: any
  _await: any
  addString: any
  list: any
  globalPrefix: any
  localPrefix: any
  get: any;
  set: any;
  // https://github.com/npm/cli/blob/latest/lib/config/core.js#L203-L217
  constructor (base: ConfigChainOptions, types: any) {
    super(base)
    this.root = base
    this._parseField = parseField.bind(null, types || require('./types'))
  }

  // https://github.com/npm/cli/blob/latest/lib/config/core.js#L326-L338
  add (data: Record<string, any>, marker: string | { __source__: string } | undefined) {
    try {
      for (const x of Object.keys(data)) {
        data[x] = this._parseField(data[x], x)
      }
    } catch (error) {
      throw error
    }

    // @ts-expect-error
    return super.add(data, marker)
  }

  // https://github.com/npm/cli/blob/latest/lib/config/core.js#L306-L319
  addFile (file: number | fs.PathLike, name: string): any {
    name = name || file.toString()

    const marker = { __source__: name }

    this.sources[name] = { path: file, type: 'ini' }
    this.push(marker)
    this._await()

    try {
      const contents = fs.readFileSync(file, 'utf8')
      this.addString(contents, file, 'ini', marker)
    } catch (error) {
      if ((error as ErrorFormat).code === 'ENOENT') {
        this.add({}, marker)
      } else {
        return `Issue while reading "${file}". ${(error as Error).message}`
      }
    }
  }

  // https://github.com/npm/cli/blob/latest/lib/config/core.js#L341-L357
  addEnv (env: string | NodeJS.ProcessEnv): any {
    env = env || process.env

    const conf = {}

    Object.keys(env)
      .filter(x => /^npm_config_/i.test(x))
      .forEach(x => {
        if (!env[x]) {
          return
        }

        conf[keyToSetting(x.substr(11))] = env[x]
      })

    return super.addEnv('', conf, 'env')
  }

  // https://github.com/npm/cli/blob/latest/lib/config/load-prefix.js
  loadPrefix () {
    const cli = this.list[0]

    Object.defineProperty(this, 'prefix', {
      enumerable: true,
      set: prefix => {
        const g = this.get('global')
        this[g ? 'globalPrefix' : 'localPrefix'] = prefix
      },
      get: () => {
        const g = this.get('global')
        return g ? this.globalPrefix : this.localPrefix
      },
    })

    Object.defineProperty(this, 'globalPrefix', {
      enumerable: true,
      set: prefix => {
        this.set('prefix', prefix)
      },
      get: () => {
        return path.resolve(this.get('prefix'))
      },
    })

    let p: string

    Object.defineProperty(this, 'localPrefix', {
      enumerable: true,
      set: prefix => {
        p = prefix
      },
      get: () => {
        return p
      },
    })

    if (Object.prototype.hasOwnProperty.call(cli, 'prefix')) {
      p = path.resolve(cli.prefix)
    } else {
      try {
        const prefix = findPrefix(process.cwd())
        p = prefix
      } catch (error) {
        throw error
      }
    }

    return p
  }

  // https://github.com/npm/cli/blob/latest/lib/config/load-cafile.js
  loadCAFile (file: string) {
    if (!file) {
      return
    }

    const ca = readCAFileSync(file)
    if (ca) {
      this.set('ca', ca)
    }
  }

  // https://github.com/npm/cli/blob/latest/lib/config/set-user.js
  loadUser () {
    const defConf = this.root

    if (this.get('global')) {
      return
    }

    if (process.env.SUDO_UID) {
      defConf.user = Number(process.env.SUDO_UID)
      return
    }

    const prefix = path.resolve(this.get('prefix'))

    try {
      const stats = fs.statSync(prefix)
      defConf.user = stats.uid
    } catch (error) {
      if ((error as ErrorFormat).code === 'ENOENT') {
        return
      }

      throw error
    }
  }
}