import { InjectorHandler } from './container/injection-handler';
import { Scope, Provider } from './model';

/**
 * Default [[Scope]] that always create a new instace for any dependency resolution request
 */
export class LocalScope extends Scope {
    public resolve(provider: Provider, _source: Function) {
        return provider();
    }
}

/**
 * Scope that create only a single instace to handle all dependency resolution requests.
 */
export class SingletonScope extends Scope {
    private static instances: Map<Function, any> = new Map<Function, any>();

    public resolve(provider: Provider, source: any) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            instance = provider();
            SingletonScope.instances.set(source, instance);
        }
        return instance;
    }

    public reset(source: Function) {
        SingletonScope.instances.delete(InjectorHandler.getConstructorFromType(source));
    }

    public init(source: Function) {
        this.reset(source);
    }

    public finish(source: Function) {
        this.reset(source);
    }
}
