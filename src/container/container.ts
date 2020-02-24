import { InjectorHandler } from './injection-handler';
import { Scope, Provider, Snapshot } from '../model';
import { IoCBindConfig } from './container-binding-config';

/**
 * Internal implementation of IoC Container.
 */
export class IoCContainer {
    public static bind(source: Function): IoCBindConfig {
        InjectorHandler.checkType(source);
        const baseSource = InjectorHandler.getConstructorFromType(source);
        let config: IoCBindConfig = IoCContainer.bindings.get(baseSource);
        if (!config) {
            config = new IoCBindConfig(baseSource, IoCContainer.get);
            config
                .to(source as FunctionConstructor)
                .instrumentConstructor(InjectorHandler.instrumentConstructor(source));
            IoCContainer.bindings.set(baseSource, config);
        }
        return config;
    }

    public static get(source: Function) {
        const config: IoCBindConfig = IoCContainer.bind(source);
        if (!config.iocprovider) {
            config.to(config.source as FunctionConstructor);
        }
        return config.getInstance();
    }

    public static getType(source: Function): Function {
        InjectorHandler.checkType(source);
        const baseSource = InjectorHandler.getConstructorFromType(source);
        const config: IoCBindConfig = IoCContainer.bindings.get(baseSource);
        if (!config) {
            throw new TypeError(`The type ${source.name} hasn't been registered with the IOC Container`);
        }
        return config.targetSource || config.source;
    }

    public static injectProperty(target: Function, key: string, propertyType: Function) {
        InjectorHandler.injectProperty(target, key, propertyType, IoCContainer.get);
    }

    /**
     * Store the state for a specified binding.  Can then be restored later.   Useful for testing.
     * @param source The dependency type
     */
    public static snapshot(source: Function): Snapshot {
        const config = IoCContainer.bind(source);
        IoCContainer.snapshots.set(source, {
            provider: config.iocprovider,
            scope: config.iocscope,
            withParams: config.paramTypes
        });
        return {
            restore: () => IoCContainer.restore(source)
        };
    }

    /**
     * Restores the state for a specified binding that was previously captured by snapshot.
     * @param source The dependency type
     */
    private static restore(source: Function): void {
        const config = IoCContainer.bind(source);
        const configSnapshot = IoCContainer.snapshots.get(source);
        config
            .provider(configSnapshot.provider)
            .scope(configSnapshot.scope)
            .withParams(configSnapshot.withParams);
    }

    /**
     * Internal storage for snapshots
     * @type {providers: Map<Function, Provider>; scopes: Map<Function, Scope>}
     */
    private static snapshots: Map<Function, ConfigSnapshot> = new Map();

    private static bindings: Map<FunctionConstructor, IoCBindConfig> = new Map<FunctionConstructor, IoCBindConfig>();
}

interface ConfigSnapshot {
    provider: Provider;
    scope: Scope;
    withParams: Array<any>;
}