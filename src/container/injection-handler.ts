import { InstanceFactory, ValueFactory } from './container-types';
import { BuildContext } from '../model';

const BUILD_CONTEXT_KEY = '__BuildContext';
const IOC_WRAPPER_CLASS = 'ioc_wrapper';

/**
 * Utility class to handle injection behavior on class decorations.
 */
export class InjectorHandler {
    public static constructorNameRegEx = /function (\w*)/;
    private static instantiationsBlocked = true;


    public static instrumentConstructor(source: Function) {
        let newConstructor: any;
        // tslint:disable-next-line:class-name
        newConstructor = class ioc_wrapper extends (source as FunctionConstructor) {
            constructor(...args: Array<any>) {
                super(...args);
                InjectorHandler.assertInstantiable();
            }
        };
        newConstructor['__parent'] = source;
        return newConstructor;
    }

    public static blockInstantiation(blocked: boolean) {
        InjectorHandler.instantiationsBlocked = blocked;
    }

    public static unblockInstantiation() {
        const blocked = InjectorHandler.instantiationsBlocked;
        InjectorHandler.instantiationsBlocked = false;
        return blocked;
    }

    public static getConstructorFromType(target: Function): FunctionConstructor {
        let typeConstructor: any = target;
        if (this.hasNamedConstructor(typeConstructor)) {
            return typeConstructor as FunctionConstructor;
        }
        typeConstructor = typeConstructor['__parent'];
        while (typeConstructor) {
            if (this.hasNamedConstructor(typeConstructor)) {
                return typeConstructor as FunctionConstructor;
            }
            typeConstructor = typeConstructor['__parent'];
        }
        throw TypeError('Can not identify the base Type for requested target ' + target.toString());
    }

    public static checkType(source: Object) {
        if (!source) {
            throw new TypeError('Invalid type requested to IoC ' +
                'container. Type is not defined.');
        }
    }

    public static checkName(source: string) {
        if (!source) {
            throw new TypeError('Invalid name requested to IoC ' +
                'container. Name is not defined.');
        }
    }

    public static injectContext(target: any, context: BuildContext) {
        target[BUILD_CONTEXT_KEY] = context;
    }

    public static removeContext(target: any) {
        delete target[BUILD_CONTEXT_KEY];
    }

    public static injectProperty(target: Function, key: string, propertyType: Function, instanceFactory: InstanceFactory) {
        const propKey = `__${key}`;
        Object.defineProperty(target.prototype, key, {
            enumerable: true,
            get: function () {
                const context: BuildContext = this[BUILD_CONTEXT_KEY] || target[BUILD_CONTEXT_KEY];
                return this[propKey] ? this[propKey] : this[propKey] = instanceFactory(propertyType, context);
            },
            set: function (newValue) {
                this[propKey] = newValue;
            }
        });
    }

    public static injectValueProperty(target: Function, key: string, name: string, valueFactory: ValueFactory) {
        const propKey = `__${key}`;
        Object.defineProperty(target.prototype, key, {
            enumerable: true,
            get: function () {
                return this[propKey] ? this[propKey] : this[propKey] = valueFactory(name);
            },
            set: function (newValue) {
                this[propKey] = newValue;
            }
        });
    }

    private static hasNamedConstructor(source: Function): boolean {
        if (source['name']) {
            return source['name'] !== 'ioc_wrapper';
        } else {
            try {
                const constructorName = source.prototype.constructor.toString().match(this.constructorNameRegEx)[1];
                return (constructorName && constructorName !== IOC_WRAPPER_CLASS);
            } catch {
                // make linter happy
            }

            return false;
        }
    }

    private static assertInstantiable() {
        if (InjectorHandler.instantiationsBlocked) {
            throw new TypeError('Can not instantiate it. The instantiation is blocked for this class. ' +
                'Ask Container for it, using Container.get');
        }
    }
}