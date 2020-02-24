/**
 * This is a lightweight annotation-based dependency injection container for typescript.
 *
 * Visit the project page on [GitHub] (https://github.com/thiagobustamante/typescript-ioc).
 */

import 'reflect-metadata';
import { Config, Provider, Scope, ContainerConfiguration, Snapshot } from './model';
import { IoCContainer } from './container/container';
import { LocalScope, SingletonScope } from './scopes';

export { Config };
export { Provider };
export { Scope };
export { ContainerConfiguration };
export { Inject, Provided, Singleton, Scoped } from './decorators';

Scope.Local = new LocalScope();
Scope.Singleton = new SingletonScope();

/**
 * The IoC Container class. Can be used to register and to retrieve your dependencies.
 * You can also use de decorators [[AutoWired]], [[Scoped]], [[Singleton]], [[Provided]] and [[Provides]]
 * to configure the dependency directly on the class.
 */
export class Container {

    /**
     * Add a dependency to the Container. If this type is already present, just return its associated
     * configuration object.
     * Example of usage:
     *
     * ```
     * Container.bind(PersonDAO).to(ProgrammerDAO).scope(Scope.Singleton);
     * ```
     * @param source The type that will be bound to the Container
     * @return a container configuration
     */
    public static bind(source: Function): Config {
        return IoCContainer.bind(source);
    }

    /**
     * Retrieve an object from the container. It will resolve all dependencies and apply any type replacement
     * before return the object.
     * If there is no declared dependency to the given source type, an implicity bind is performed to this type.
     * @param source The dependency type to resolve
     * @return an object resolved for the given source type;
     */
    public static get<T>(source: Function & { prototype: T }): T {
        return IoCContainer.get(source);
    }

    /**
     * Retrieve a type associated with the type provided from the container
     * @param source The dependency type to resolve
     * @return an object resolved for the given source type;
     */
    public static getType(source: Function) {
        return IoCContainer.getType(source);
    }

    /**
     * Store the state for a specified binding.  Can then be restored later.   Useful for testing.
     * @param source The dependency type
     */
    public static snapshot(source: Function): Snapshot {
        return IoCContainer.snapshot(source);
    }

    /**
     * Import an array of configurations to the Container
     * @param configurations 
     */
    public static configure(...configurations: Array<ContainerConfiguration>) {
        configurations.forEach(config => {
            const bind = IoCContainer.bind(config.bind);
            if (bind) {
                if (config.to) {
                    bind.to(config.to);
                } else if (config.provider) {
                    bind.provider(config.provider);
                }
                if (config.scope) {
                    bind.scope(config.scope);
                }
                if (config.withParams) {
                    bind.withParams(config.withParams);
                }
            }
        });
    }
}