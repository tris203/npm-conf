declare module 'config-chain' {
    import { EventEmitter } from 'events';

  export interface ConfigChainOptions {
        [key: string]: any;
    }

    export interface ConfigChainSource {
        path?: string;
        source?: any;
        type?: string;
        prefix?: string;
        data?: any;
    }

    export class ConfigChain extends EventEmitter {
        constructor(...configs: ConfigChainOptions[]);
        del(key: string, where?: string): this;
        set(key: string, value: any, where?: string): this;
        get(key: string, where?: string): any;
        save(where: string, type?: string, cb?: (err?: Error) => void): this;
        addFile(file: string, type?: string, name?: string): this;
        addEnv(prefix: string, env: any, name?: string): this;
        addUrl(req: any, type?: string, name?: string): this;
        addString(data: string | Buffer, file: string, type?: string, marker?: { __source__: string }): this;
        add(data: any, marker?: { __source__: string }): this;
    }

    export function json(...args: any[]): any;
    export function env(prefix: string, env?: any): { [key: string]: string };

    export function parse(content: string, file: string, type?: string): any;
}
