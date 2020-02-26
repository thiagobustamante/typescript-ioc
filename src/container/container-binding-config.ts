import { InjectorHandler } from './injection-handler';
import { Scope, ObjectFactory, Config } from '../model';
import { InstanceFactory } from './container-types';

export class IoCBindConfig implements Config {
    public source: Function;
    public targetSource: Function;
    public iocFactory: ObjectFactory;
    public iocScope: Scope;
    public decoratedConstructor: FunctionConstructor;
    public paramTypes: Array<any>;
    private instanceFactory: InstanceFactory;

    constructor(source: Function, instanceFactory: InstanceFactory) {
        this.source = source;
        this.instanceFactory = instanceFactory;
    }

    public to(target: FunctionConstructor) {
        InjectorHandler.checkType(target);
        const targetSource = InjectorHandler.getConstructorFromType(target);
        this.targetSource = targetSource;
        if (this.source === targetSource) {
            this.iocFactory = () => {
                const params = this.getParameters();
                const constructor = this.decoratedConstructor || target;
                return this.callConstructor(constructor, params);
            };
        } else {
            this.iocFactory = () => {
                return this.instanceFactory(target);
            };
        }
        if (this.iocScope) {
            this.iocScope.reset(this.source);
        }
        return this;
    }

    private callConstructor(constructor: FunctionConstructor, params: Array<any>): Object {
        return (params ? new constructor(...params) : new constructor());
    }

    public factory(factory: ObjectFactory) {
        this.iocFactory = factory;
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

    public getInstance() {
        if (!this.iocScope) {
            this.scope(Scope.Local);
        }
        if (this.decoratedConstructor) {
            return this.getContainerManagedInstance();
        } else {
            return this.iocScope.resolve(this.iocFactory, this.source);
        }
    }

    private getContainerManagedInstance() {
        InjectorHandler.unblockInstantiation(this.source);
        const instance = this.iocScope.resolve(this.iocFactory, this.source);
        InjectorHandler.blockInstantiation(this.source);
        return instance;
    }

    private getParameters() {
        if (this.paramTypes) {
            return this.paramTypes.map(paramType => this.instanceFactory(paramType));
        }
        return null;
    }
}
