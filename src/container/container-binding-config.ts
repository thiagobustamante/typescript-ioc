import { InjectorHandler } from './injection-handler';
import { Scope, Provider, Config } from '../model';
import { InstanceFactory } from './container-instance-factory';

export class IoCBindConfig implements Config {
    public source: Function;
    public targetSource: Function;
    public iocprovider: Provider;
    public iocscope: Scope;
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
            const configImpl = this;
            this.iocprovider = () => {
                const params = configImpl.getParameters();
                if (configImpl.decoratedConstructor) {
                    return (params ? new configImpl.decoratedConstructor(...params) : new configImpl.decoratedConstructor());
                }
                return (params ? new target(...params) : new target());
            };
        } else {
            this.iocprovider = () => {
                return this.instanceFactory(target);
            };
        }
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    public provider(provider: Provider) {
        this.iocprovider = provider;
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    public scope(scope: Scope) {
        if (this.iocscope && this.iocscope !== scope) {
            this.iocscope.finish(this.source);
        }
        this.iocscope = scope;
        if (this.iocscope) {
            this.iocscope.init(this.source);
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
        if (!this.iocscope) {
            this.scope(Scope.Local);
        }
        if (this.decoratedConstructor) {
            return this.getContainerManagedInstance();
        } else {
            return this.iocscope.resolve(this.iocprovider, this.source);
        }
    }

    private getContainerManagedInstance() {
        InjectorHandler.unblockInstantiation(this.source);
        const instance = this.iocscope.resolve(this.iocprovider, this.source);
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
