import { InjectorHandler } from './injection-handler';
import { Scope, ObjectFactory, Config, BuildContext, ValueConfig } from '../model';
import { InstanceFactory, ValueFactory } from './container-types';
import get = require('lodash.get');
import set = require('lodash.set');

export class IoCBindConfig implements Config {
    public source: Function;
    public targetSource: Function;
    public iocFactory: ObjectFactory;
    public iocScope: Scope;
    public decoratedConstructor: FunctionConstructor;
    public paramTypes: Array<any>;
    public namespace: string;
    private instanceFactory: InstanceFactory;
    private valueFactory: ValueFactory;

    constructor(source: Function, instanceFactory: InstanceFactory, valueFactory: ValueFactory) {
        this.source = source;
        this.instanceFactory = instanceFactory;
        this.valueFactory = valueFactory;
    }

    public to(target: FunctionConstructor) {
        InjectorHandler.checkType(target);
        const targetSource = InjectorHandler.getConstructorFromType(target);
        this.targetSource = targetSource;
        if (this.source === targetSource) {
            this.factory((context) => {
                const params = this.getParameters(context);
                const constructor = this.decoratedConstructor || target;
                return (params ? new constructor(...params) : new constructor());
            });
        } else {
            this.factory((context) => {
                return this.instanceFactory(target, context);
            });
        }
        return this;
    }

    public factory(factory: ObjectFactory) {
        this.iocFactory = (context) => {
            const blocked = InjectorHandler.unblockInstantiation();
            const constructor = this.decoratedConstructor || this.targetSource || this.source;
            InjectorHandler.injectContext(constructor, context);
            const instance = factory(context);
            InjectorHandler.removeContext(constructor);
            InjectorHandler.injectContext(instance, context);
            InjectorHandler.blockInstantiation(blocked);
            return instance;
        };
        if (this.iocScope) {
            this.iocScope.reset(this.source);
        }
        return this;
    }

    public scope(scope: Scope) {
        if (this.iocScope && this.iocScope !== scope) {
            this.iocScope.finish(this.source);
        }
        this.iocScope = scope;
        if (this.iocScope) {
            this.iocScope.init(this.source);
        }
        return this;
    }

    public withParams(...paramTypes: Array<any>) {
        this.paramTypes = paramTypes;
        return this;
    }

    public instrumentConstructor() {
        const newConstructor = InjectorHandler.instrumentConstructor(this.source);
        this.decoratedConstructor = newConstructor;
        this.source.constructor = newConstructor;
        return this;
    }

    public getInstance(context: BuildContext) {
        if (!this.iocScope) {
            this.scope(Scope.Local);
        }
        return this.iocScope.resolve(this.iocFactory, this.source, context);
    }

    public clone() {
        const result = new IoCBindConfig(this.source, this.instanceFactory, this.valueFactory);
        result.iocFactory = this.iocFactory;
        result.iocScope = this.iocScope;
        result.targetSource = this.targetSource;
        result.paramTypes = this.paramTypes;
        result.decoratedConstructor = this.decoratedConstructor;
        return result;
    }

    private getParameters(context: BuildContext) {
        if (this.paramTypes) {
            return this.paramTypes.map(paramType => {
                if (typeof paramType === 'string' || paramType instanceof String) {
                    return this.valueFactory(paramType as string);
                }
                return this.instanceFactory(paramType, context);
            });
        }
        return null;
    }
}


export class IoCBindValueConfig implements ValueConfig {
    public name: string;
    public path: string;
    public namespace: string;
    private value: any;

    constructor(name: string) {
        this.name = name;
    }

    public to(value: any): ValueConfig {
        if (this.path) {
            this.value = this.value || {};
            set(this.value, this.path, value);
        } else {
            this.value = value;
        }
        return this;
    }

    public getValue() {
        if (this.path) {
            return get(this.value, this.path);
        }
        return this.value;
    }

    public clone() {
        const result = new IoCBindValueConfig(this.name);
        result.path = this.path;
        result.value = this.value;
        return result;
    }
}

export class PropertyPath {
    public readonly name: string;
    public readonly path?: string;

    private constructor(name: string, path?: string) {
        this.name = name;
        this.path = path;
    }

    public static parse(value: string) {
        const index = value.indexOf('.');
        if (index < 0) {
            return new PropertyPath(value);
        } else if (index === 0) {
            throw new TypeError(`Invalid value [${value}] passed to Container.bindName`);
        } else if (index + 1 < value.length) {
            return new PropertyPath(value.substring(0, index), value.substring(index + 1));
        }
        return new PropertyPath(value.substring(0, index));
    }
}