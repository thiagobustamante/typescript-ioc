/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

/*********************** Decorators **************************/

/**
 * Decorator processor for @Singleton annotation
 */
export function Singleton(target: Function) {
    Container.bind(target).scope(Scope.Singleton);
}

/**
 * Decorator processor for @Scoped annotation
 */
export function Scoped(scope: Scope) {
    return function(target: Function) {
        Container.bind(target).scope(scope);
    }
}

/**
 * Decorator processor for @Scoped annotation
 */
export function Provided(provider: Provider) {
    return function(target: Function) {
        Container.bind(target).provider(provider);
    }
}

/**
 * Decorator processor for @Provides annotation
 */
export function Provides(target: Function) {
    return function(to: Function) {
        Container.bind(target).to(to);
    }
}

/**
 * Decorator processor for @AutoWired annotation
 */
export function AutoWired(target: Function) {
    let existingInjectedParameters: number[] =
        Reflect.getOwnMetadata("params_inject", target) || [];
    let newConstructor;
    if (existingInjectedParameters.length > 0) {
        const paramTypes: Array<any> =
            Reflect.getMetadata("design:paramtypes", target);
        newConstructor = InjectorHanlder.decorateConstructor(function(...args: any[]) {
            let newArgs: Array<any> = args ? args.concat() : new Array<any>();
            for (let index of existingInjectedParameters) {
                if (index >= newArgs.length) {
                    newArgs.push(Container.get(paramTypes[index]));
                }
            }
            target.apply(this, newArgs);
            Container.applyInjections(this, target);
        }, target);
    }
    else {
        newConstructor = InjectorHanlder.decorateConstructor(function(...args: any[]) {
            target.apply(this, args);
            Container.applyInjections(this, target);
        }, target);
    }
    let config: ConfigImpl = <ConfigImpl>Container.bind(target)
    config.toConstructor(newConstructor);
    return newConstructor;
}

/**
 * Decorator processor for @Inject annotation
 */
export function Inject(...args: any[]) {
    if (args.length == 2) {
        return InjectPropertyDecorator.apply(this, args);
    }
    else if (args.length == 3 && typeof args[2] === "number") {
        return InjectParamDecorator.apply(this, args);
    }

    throw new Error("Invalid @Inject Decorator declaration.");
}

function InjectPropertyDecorator(target: Object, key: string) {
    let t = Reflect.getMetadata("design:type", target, key);
    Container.addPropertyInjector(target.constructor, key, t);
}

function InjectParamDecorator(target: Object, propertyKey: string | symbol,
    parameterIndex: number) {
    if (!propertyKey) // only intercept constructor parameters
    {
        let existingInjectedParameters: number[] =
            Reflect.getOwnMetadata("params_inject", target, propertyKey) || [];
        existingInjectedParameters.push(parameterIndex);
        Reflect.defineMetadata("params_inject", existingInjectedParameters,
            target, propertyKey);
    }
}

/*********************** Container **************************/
class Map<V> {
    put(key: any, value: V) {
        this[key] = value;
    }

    get(key: any): V {
        return this[key];
    }
}

/**
 * The IoC Container class.
 */
export class Container {
    private static bindings: Map<ConfigImpl> = new Map<ConfigImpl>();

    static bind(source: Function): Config {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: ConfigImpl = Container.bindings.get(baseSource);
        if (!config) {
            config = new ConfigImpl(baseSource);
            Container.bindings.put(baseSource, config);
        }
        return config;
    }

    static get(source: Function) {
        let config: ConfigImpl = <ConfigImpl>Container.bind(source);
        if (!config.iocprovider) {
            config.to(<FunctionConstructor>config.source);
        }
        return config.getInstance();
    }

    static applyInjections(toInject: Object, targetType?: Function) {
        if (targetType) {
            const injections: Array<any> = InjectorHanlder.getInjectorFromType(targetType, false);
            injections.forEach(entry => {
                entry(toInject);
            });
        }
        else {
            const injections: Array<any> = InjectorHanlder.getInjectorFromInstance(toInject);
            injections.forEach(entry => {
                entry(toInject);
            });
        }
    }

    static addPropertyInjector(target: Function, key: string, propertyType: Function) {
        const injections: Array<any> = InjectorHanlder.getInjectorFromType(target, false);
        injections.push(toInject => {
            Container.injectProperty(toInject, key, propertyType);
        });
    }

    static injectProperty(toInject: Object, key: string, source: Function) {
        toInject[key] = Container.get(source);
    }
}

function checkType(source: Object) {
    if (!source) {
        throw new TypeError('Invalid type requested to IoC ' +
            'container. Type is not defined.');
    }
}

export interface Config {
    to(target: Object): Config;
    provider(provider: Provider): Config;
    scope(scope: Scope): Config;
}

class ConfigImpl implements Config {
    source: Function;
    iocprovider: Provider;
    iocscope: Scope;
    decoratedConstructor: FunctionConstructor;

    constructor(source: Function) {
        this.source = source;
    }

    to(target: FunctionConstructor) {
        checkType(target);
        if (this.source === target) {
            const _this = this;
            this.iocprovider = {
                get: () => {
                    if (_this.decoratedConstructor) {
                        return new _this.decoratedConstructor();
                    }
                    return new target();
                }
            };
        }
        else {
            this.iocprovider = {
                get: () => {
                    return Container.get(target);
                }
            };
        }
        return this;
    }

    toTypeNamed(target: string) {
        this.iocprovider = {
            get: () => {
                checkType(window[target]);
                let c = Object.create(window[target].prototype);
                let targetType = c.constructor;
                checkType(targetType);
                return new targetType();
            }
        };

        return this;
    }

    provider(provider: Provider) {
        this.iocprovider = provider;
        return this;
    }

    scope(scope: Scope) {
        this.iocscope = scope;
        return this;
    }

    toConstructor(newConstructor: FunctionConstructor) {
        this.decoratedConstructor = newConstructor;
        return this;
    }

    getInstance() {
        if (!this.iocscope) {
            this.scope(Scope.Local);
        }
        return this.iocscope.resolve(this.iocprovider, this.source);
    }
}

export interface Provider {
    get(): Object;
}

export abstract class Scope {
    static Local: Scope;
    static Singleton: Scope;

    abstract resolve(provider: Provider, source: Function): any;
}

export class LocalScope extends Scope {
    resolve(provider: Provider, source: Function) {
        return provider.get();
    }
}

Scope.Local = new LocalScope();

export class SingletonScope extends Scope {
    private static instances: Map<any> = new Map<any>();

    resolve(provider: Provider, source: Function) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            instance = provider.get();
            SingletonScope.instances.put(source, instance);
        }
        return instance;
    }
}

Scope.Singleton = new SingletonScope();


/**
 * Utility class to handle injection behavior on class decorations.
 */
class InjectorHanlder {
    static typeInjections: Map<Array<any>> = new Map<Array<any>>();

    static decorateConstructor(derived: Function, base: Function) {
        for (var p in base) {
            if (base.hasOwnProperty(p) && !derived.hasOwnProperty(p)) {
                derived[p] = base[p];
            }
        }
        derived['__parent'] = base;
        function __() { this.constructor = derived; }
        derived.prototype = base === null ? Object.create(base) :
            (__.prototype = base.prototype, new __());
        return derived;
    }

    static getConstructorFromType(target: Function): FunctionConstructor {
        let typeConstructor: Function = target;
        if (typeConstructor['name']) {
            return <FunctionConstructor>typeConstructor;
        }
        while (typeConstructor = typeConstructor['__parent']) {
            if (typeConstructor['name']) {
                return <FunctionConstructor>typeConstructor;
            }
        }
        throw TypeError('Can not identify the base Type for requested target');
    }

    static getConstructorFromInstance(target: Object): FunctionConstructor {
        return InjectorHanlder.getConstructorFromType(target.constructor);
    }
    static getInjectorFromType(target: Function, recursive: boolean) {
        const baseConstructor: Object = InjectorHanlder.getConstructorFromType(target);
        if (!InjectorHanlder.typeInjections[<any>baseConstructor]) {
            InjectorHanlder.typeInjections[<any>baseConstructor] = new Array<any>();
        }
        let result: Array<any> = InjectorHanlder.typeInjections[<any>baseConstructor];
        if (recursive) {
            let parent: Function = baseConstructor['__parent'];
            if (parent) {
                result = InjectorHanlder.getInjectorFromType(parent, true).concat(result);
            }
        }
        return result;
    }

    static getInjectorFromInstance(target: Object) {
        const baseConstructor: Function = InjectorHanlder.getConstructorFromInstance(target);
        return InjectorHanlder.getInjectorFromType(baseConstructor, true)
    }
}

