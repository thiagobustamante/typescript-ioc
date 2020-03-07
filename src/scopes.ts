import { InjectorHandler } from './container/injection-handler';
import { Scope, ObjectFactory, BuildContext } from './model';

/**
 * Default [[Scope]] that always create a new instace for any dependency resolution request
 */
export class LocalScope extends Scope {
    public resolve(factory: ObjectFactory, _source: Function, context: BuildContext) {
        return factory(context);
    }
}

/**
 * Scope that create only a single instace to handle all dependency resolution requests.
 */
export class SingletonScope extends Scope {
    private static instances: Map<Function, any> = new Map<Function, any>();

    public resolve(factory: ObjectFactory, source: Function, context: BuildContext) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            instance = factory(context);
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

export class RequestScope extends Scope {
    public resolve(factory: ObjectFactory, source: Function, context: BuildContext) {
        this.ensureContext(context);
        return context.build(source, factory);
    }

    private ensureContext(context: BuildContext) {
        if (!context) {
            throw new TypeError('IoC Container can not handle this request. When using @InRequestScope ' +
                'in any dependent type, you should be askking to Container to create the instances through Container.get' +
                ' and not calling the type constructor directly.');
        }
    }
}
