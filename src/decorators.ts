import 'reflect-metadata';

import { IoCContainer } from './container/container';
import { Scope, ObjectFactory } from './model';

/**
 * A decorator to tell the container that this class should be handled by the Request [[Scope]].
 *
 * ```
 * @ RequestScope
 * class PersonDAO {
 *
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).scope(Scope.Request)
 * ```
 */
export function InRequestScope(target: Function) {
    IoCContainer.bind(target).scope(Scope.Request);
}

/**
 * A decorator to tell the container that this class should be handled by the Singleton [[Scope]].
 *
 * ```
 * @ Singleton
 * class PersonDAO {
 *
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).scope(Scope.Singleton)
 * ```
 */
export function Singleton(target: Function) {
    IoCContainer.bind(target).scope(Scope.Singleton);
}

/**
 * A decorator to tell the container that this class should has its instantiation always handled by the Container.
 *
 * The decorated class will have its constructor overriden to always delegate its instantiation to the IoC Container.
 * So, if you write:
 *
 * ```
 * @ OnlyInstantiableByContainer
 * class PersonService {
 *   @ Inject
 *   personDAO: PersonDAO;
 * }
 * ```
 *
 * You will only be able to create instances of PersonService through the Container. 
 * 
 * ```
 * let PersonService = new PersonService(); // will thrown a TypeError exception
 * ```
 */
export function OnlyInstantiableByContainer(target: Function) {
    return IoCContainer.bind(target).instrumentConstructor().decoratedConstructor as any;
}

/**
 * A decorator to tell the container that this class should be handled by the provided [[Scope]].
 * For example:
 *
 * ```
 * class MyScope extends Scope {
 *   resolve(iocProvider:Provider, source:Function) {
 *     console.log('created by my custom scope.')
 *     return iocProvider.get();
 *   }
 * }
 * @ Scoped(new MyScope())
 * class PersonDAO {
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).scope(new MyScope());
 * ```
 * @param scope The scope that will handle instantiations for this class.
 */
export function Scoped(scope: Scope) {
    return (target: Function) => {
        IoCContainer.bind(target).scope(scope);
    };
}

/**
 * A decorator to tell the container that this class should instantiated by the given [[ObjectFactory]].
 * For example:
 *
 * ```
 * @ Factory(() => new PersonDAO())
 * class PersonDAO {
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).factory(() => new PersonDAO());
 * ```
 * @param factory The factory that will handle instantiations for this class.
 */
export function Factory(factory: ObjectFactory) {
    return (target: Function) => {
        IoCContainer.bind(target).factory(factory);
    };
}

/**
 * A decorator to request from Container that it resolve the annotated property dependency.
 * For example:
 *
 * ```
 * class PersonService {
 *    constructor (@ Inject creationTime: Date) {
 *       this.creationTime = creationTime;
 *    }
 *    @ Inject
 *    personDAO: PersonDAO;
 *
 *    creationTime: Date;
 * }
 *
 * ```
 *
 * When you call:
 *
 * ```
 * let personService: PersonService = Container.get(PersonService);
 * // The properties are all defined, retrieved from the IoC Container
 * console.log('PersonService.creationTime: ' + personService.creationTime);
 * console.log('PersonService.personDAO: ' + personService.personDAO);
 * ```
 */
export function Inject(...args: Array<any>) {
    if (args.length === 2 || (args.length === 3 && typeof args[2] === 'undefined')) {
        return InjectPropertyDecorator.apply(this, args);
    } else if (args.length === 3 && typeof args[2] === 'number') {
        return InjectParamDecorator.apply(this, args);
    }

    throw new TypeError('Invalid @Inject Decorator declaration.');
}

/**
 * A decorator to request from Container that it resolve the annotated property dependency
 * with a constant value.
 * For example:
 *
 * ```
 * inteface Config {
 *   dependencyURL: string;
 *   port: number;
 * }
 * class PersonService {
 *    @ InjectValue('config')
 *    config: Config;
 * }
 * ```
 *
 * When you call:
 *
 * ```
 * let personService: PersonService = Container.get(PersonService);
 * // The properties are all defined, retrieved from the IoC Container
 * console.log('PersonService.config.port: ' + personService.config.port);
 * console.log('PersonService.config.dependencyURL: ' + personService.config.dependencyURL);
 * ```
 */
export function InjectValue(value: string) {
    return (...args: Array<any>) => {
        if (args.length === 2 || (args.length === 3 && typeof args[2] === 'undefined')) {
            const params = [...args, value].filter(v => v ? true : false);
            return InjectValuePropertyDecorator.apply(this, params);
        } else if (args.length === 3 && typeof args[2] === 'number') {
            return InjectValueParamDecorator.apply(this, [...args, value]);
        }

        throw new TypeError('Invalid @InjectValue Decorator declaration.');
    };
}



/**
 * Decorator processor for [[Inject]] decorator on properties
 */
function InjectPropertyDecorator(target: Function, key: string) {
    let t = Reflect.getMetadata('design:type', target, key);
    if (!t) {
        // Needed to support react native inheritance
        t = Reflect.getMetadata('design:type', target.constructor, key);
    }
    IoCContainer.injectProperty(target.constructor, key, t);
}

/**
 * Decorator processor for [[Inject]] decorator on constructor parameters
 */
function InjectParamDecorator(target: Function, propertyKey: string | symbol, parameterIndex: number) {
    if (!propertyKey) { // only intercept constructor parameters
        const config = IoCContainer.bind(target);
        config.paramTypes = config.paramTypes || [];
        const paramTypes: Array<any> = Reflect.getMetadata('design:paramtypes', target);
        config.paramTypes.unshift(paramTypes[parameterIndex]);
    }
}

/**
 * Decorator processor for [[Inject]] decorator on properties
 */
function InjectValuePropertyDecorator(target: Function, key: string, value: string) {
    IoCContainer.injectValueProperty(target.constructor, key, value);
}

/**
 * Decorator processor for [[Inject]] decorator on constructor parameters
 */
function InjectValueParamDecorator(target: Function, propertyKey: string | symbol, _parameterIndex: number, value: string) {
    if (!propertyKey) { // only intercept constructor parameters
        const config = IoCContainer.bind(target);
        config.paramTypes = config.paramTypes || [];
        config.paramTypes.unshift(value);
    }
}