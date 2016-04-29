/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />
export declare function Singleton(target: Function): void;
export declare function Scoped(scope: Scope): (target: Function) => void;
export declare function Provided(provider: Provider): (target: Function) => void;
export declare function Provides(target: Function): (to: Function) => void;
export declare function AutoWired(target: Function): any;
export declare function Inject(...args: any[]): any;
export declare class Container {
    private static bindings;
    static bind(source: Function): Config;
    static get(source: Function): any;
    static applyInjections(toInject: Object, targetType?: Function): void;
    static addPropertyInjector(target: Function, key: string, propertyType: Function): void;
    static injectProperty(toInject: Object, key: string, source: Function): void;
}
export interface Config {
    to(target: Object): Config;
    provider(provider: Provider): Config;
    scope(scope: Scope): Config;
}
export interface Provider {
    get(): Object;
}
export declare abstract class Scope {
    static Local: Scope;
    static Singleton: Scope;
    abstract resolve(provider: Provider, source: Function): any;
}
export declare class LocalScope extends Scope {
    resolve(provider: Provider, source: Function): Object;
}
export declare class SingletonScope extends Scope {
    private static instances;
    resolve(provider: Provider, source: Function): any;
}
