import { InjectorHandler } from './injection-handler';
import { Scope, ObjectFactory, Config, BuildContext } from '../model';
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
            this.factory((context) => {
                const params = this.getParameters(context);
                const constructor = this.decoratedConstructor || target;
                return this.callConstructor(constructor, params, context);
            });
        } else {
            this.factory((context) => {
                return this.instanceFactory(target, context);
            });
        }
        return this;
    }

    private callConstructor(constructor: FunctionConstructor,
        params: Array<any>,
        context: BuildContext): Object {
        InjectorHandler.injectContext(constructor, context);
        const instance = (params ? new constructor(...params) : new constructor());
        InjectorHandler.removeContext(constructor);
        return instance;
    }

    public factory(factory: ObjectFactory) {
        this.iocFactory = (context) => {
            const instance = factory(context);
            InjectorHandler.injectContext(instance, context);
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
        if (this.decoratedConstructor) {
            return this.getContainerManagedInstance(context);
        } else {
            return this.iocScope.resolve(this.iocFactory, this.source, context);
        }
    }

    private getContainerManagedInstance(context: BuildContext) {
        InjectorHandler.unblockInstantiation(this.source);
        const instance = this.iocScope.resolve(this.iocFactory, this.source, context);
        InjectorHandler.blockInstantiation(this.source);
        return instance;
    }

    private getParameters(context: BuildContext) {
        if (this.paramTypes) {
            return this.paramTypes.map(paramType => this.instanceFactory(paramType, context));
        }
        return null;
    }
}
