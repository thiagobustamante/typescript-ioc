import { InjectorHandler } from './container/injection-handler';
import { Scope, ObjectFactory } from './model';

/**
 * Default [[Scope]] that always create a new instace for any dependency resolution request
 */
export class LocalScope extends Scope {
    public resolve(factory: ObjectFactory, _source: Function) {
        return factory();
    }
}

/**
 * Scope that create only a single instace to handle all dependency resolution requests.
 */
export class SingletonScope extends Scope {
    private static instances: Map<Function, any> = new Map<Function, any>();

    public resolve(factory: ObjectFactory, source: any) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            instance = factory();
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
