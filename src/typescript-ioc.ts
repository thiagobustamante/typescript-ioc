import "reflect-metadata"
/*********************** Decorators **************************/

/**
 * Decorator processor for @Singleton annotation
 */
export function Singleton(target: Function) {
    IoCContainer.bind(target).scope(Scope.Singleton);
}

/**
 * Decorator processor for @Scoped annotation
 */
export function Scoped(scope: Scope) {
    return function(target: Function) {
        IoCContainer.bind(target).scope(scope);
    }
}

/**
 * Decorator processor for @Scoped annotation
 */
export function Provided(provider: Provider) {
    return function(target: Function) {
        IoCContainer.bind(target).provider(provider);
    }
}

/**
 * Decorator processor for @Provides annotation
 */
export function Provides(target: Function) {
    return function(to: Function) {
        IoCContainer.bind(target).to(to);
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
            IoCContainer.assertInstantiable(target);
            let newArgs: Array<any> = args ? args.concat() : new Array<any>();
            for (let index of existingInjectedParameters) {
                if (index >= newArgs.length) {
                    newArgs.push(IoCContainer.get(paramTypes[index]));
                }
            }
            target.apply(this, newArgs);
            IoCContainer.applyInjections(this, target);
        }, target);
    }
    else {
        newConstructor = InjectorHanlder.decorateConstructor(function(...args: any[]) {
            IoCContainer.assertInstantiable(target);
            target.apply(this, args);
            IoCContainer.applyInjections(this, target);
        }, target);
    }
    let config: ConfigImpl = <ConfigImpl>IoCContainer.bind(target)
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
    IoCContainer.addPropertyInjector(target.constructor, key, t);
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

    remove(key: any) {
        delete this[key];
    } 
}

/**
 * The IoC Container class.
 */
export class Container {
    static bind(source: Function): Config {
        if (!IoCContainer.isBound(source))
        {
            AutoWired(source);
            return IoCContainer.bind(source).to(source);
        }

        return IoCContainer.bind(source);
    }

    static get(source: Function) {
        return IoCContainer.get(source);
    }
}

class IoCContainer {
    private static bindings: Map<ConfigImpl> = new Map<ConfigImpl>();

    static isBound(source: Function): boolean
    {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: ConfigImpl = IoCContainer.bindings.get(baseSource);
        return (!!config);
    }

    static bind(source: Function): Config {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: ConfigImpl = IoCContainer.bindings.get(baseSource);
        if (!config) {
            config = new ConfigImpl(baseSource);
            IoCContainer.bindings.put(baseSource, config);
        }
        return config;
    }

    static get(source: Function) {
        let config: ConfigImpl = <ConfigImpl>IoCContainer.bind(source);
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
            IoCContainer.injectProperty(toInject, key, propertyType);
        });
    }

    static injectProperty(toInject: Object, key: string, source: Function) {
        toInject[key] = IoCContainer.get(source);
    }

    static assertInstantiable(target: Function) {
        if (target['__block_Instantiation']) {
            throw new TypeError("Can not instantiate Singleton class. " +
                "Ask Container for it, using Container.get");
        }
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
        const targetSource = InjectorHanlder.getConstructorFromType(target);
        if (this.source === targetSource) {
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
                    return IoCContainer.get(target);
                }
            };
        }
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    provider(provider: Provider) {
        this.iocprovider = provider;
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    scope(scope: Scope) {
        this.iocscope = scope;
        if (scope === Scope.Singleton) {
            this.source['__block_Instantiation'] = true;
            scope.reset(this.source);
        }
        else if (this.source['__block_Instantiation']) {
            delete this.source['__block_Instantiation'];
        }
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

    reset(source: Function) {

    }
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
            source['__block_Instantiation'] = false;
            instance = provider.get();
            source['__block_Instantiation'] = true;
            SingletonScope.instances.put(source, instance);
        }
        return instance;
    }

    reset(source: Function) {
        SingletonScope.instances.remove(InjectorHanlder.getConstructorFromType(source));
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

