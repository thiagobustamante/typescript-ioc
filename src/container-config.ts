import { Provider, Scope, Container } from './typescript-ioc';

export class ContainerConfig {
    public static addSource(patterns: string | Array<string>, baseDir?: string) {
        const requireGlob = require('require-glob');
        baseDir = baseDir || process.cwd();
        requireGlob.sync(patterns, {
            cwd: baseDir
        });
    }

    public static configure(...configurations: Array<ContainerConfiguration>) {
        configurations.forEach(config => {
            const bind = Container.bind(config.bind);
            if (bind) {
                if (config.to) {
                    bind.to(config.to);
                } else if (config.provider) {
                    bind.provider(config.provider);
                }
                if (config.scope) {
                    bind.scope(config.scope);
                }
                if (config.withParams) {
                    bind.withParams(config.withParams);
                }
            }
        });
    }
}

export interface ContainerConfiguration {
    bind: any;
    to?: any;
    provider?: Provider;
    scope?: Scope;
    withParams?: Array<any>;
}