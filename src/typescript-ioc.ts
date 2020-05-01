/**
 * This is a lightweight annotation-based dependency injection container for typescript.
 *
 * Visit the project page on [GitHub] (https://github.com/thiagobustamante/typescript-ioc).
 */

import 'reflect-metadata';
import { Config, ValueConfig, ObjectFactory, Scope, ContainerConfiguration, ConstantConfiguration, NamespaceConfiguration, Snapshot, BuildContext } from './model';
import { IoCContainer } from './container/container';
import { LocalScope, SingletonScope, RequestScope } from './scopes';

export { Config };
export { ValueConfig };
export { ObjectFactory };
export { BuildContext };
export { Scope };
export { ContainerConfiguration };
export { ConstantConfiguration };
export { Inject, Factory, Singleton, Scoped, OnlyInstantiableByContainer, InRequestScope, InjectValue } from './decorators';
export { Snapshot };

Scope.Local = new LocalScope();
Scope.Singleton = new SingletonScope();
Scope.Request = new RequestScope();

/**
 * The IoC Container class. Can be used to register and to retrieve your dependencies.
 * You can also use de decorators [[OnlyInstantiableByContainer]], [[Scoped]], [[Singleton]], [[Factory]]
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
        return IoCContainer.get(source, new ContainerBuildContext());
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
     * 
     * @param name 
     */
    public static bindName(name: string): ValueConfig {
        return IoCContainer.bindName(name);
    }

    /**
     * Retrieve a constant from the container.
     * @param name The name of the constant used to identify these binding
     * @return the constant value
     */
    public static getValue(name: string) {
        return IoCContainer.getValue(name);
    }

    /**
     * Select the current namespace to work.
     * @param name The namespace name, or null to select the default namespace
     */
    public static namespace(name: string) {
        return IoCContainer.namespace(name);
    }

    /**
     * An alias to namespace method.
     * @param name The namespace name, or null to select the default namespace
     */
    public static environment(name: string) {
        return Container.namespace(name);
    }

    /**
     * Store the state for a specified binding.  Can then be restored later.   Useful for testing.
     * @param source The dependency type
     */
    // _args is here to ensure backward compatibility
    public static snapshot(_args?: any): Snapshot {
        return IoCContainer.snapshot();
    }

    /**
     * Import an array of configurations to the Container
     * @param configurations 
     */
    public static configure(...configurations: Array<ContainerConfiguration | ConstantConfiguration | NamespaceConfiguration>) {
        configurations.forEach(config => {
            if ((config as ContainerConfiguration).bind) {
                Container.configureType(config as ContainerConfiguration);
            } else if ((config as ConstantConfiguration).bindName) {
                Container.configureConstant(config as ConstantConfiguration);
            } else if ((config as NamespaceConfiguration).env || (config as NamespaceConfiguration).namespace) {
                Container.configureNamespace(config as NamespaceConfiguration);
            }
        });
    }

    private static configureNamespace(config: NamespaceConfiguration) {
        const selectedNamespace = IoCContainer.selectedNamespace();
        const env = config.env || config.namespace;
        Object.keys(env).forEach(namespace => {
            Container.namespace(namespace);
            const namespaceConfig = env[namespace];
            Container.configure(...namespaceConfig);
        });

        Container.namespace(selectedNamespace);
    }

    private static configureConstant(config: ConstantConfiguration) {
        const bind = IoCContainer.bindName(config.bindName);
        if (bind) {
            if (config.to) {
                bind.to(config.to);
            }
        }
    }

    private static configureType(config: ContainerConfiguration) {
        const bind = IoCContainer.bind(config.bind);
        if (bind) {
            if (config.to) {
                bind.to(config.to);
            }
            else if (config.factory) {
                bind.factory(config.factory);
            }
            if (config.scope) {
                bind.scope(config.scope);
            }
            if (config.withParams) {
                bind.withParams(config.withParams);
            }
        }
    }
}

class ContainerBuildContext extends BuildContext {
    private context = new Map<Function, any>();

    public build<T>(source: Function & { prototype: T; }, factory: ObjectFactory): T {
        let instance = this.context.get(source);
        if (!instance) {
            instance = factory(this);
            this.context.set(source, instance);
        }
        return instance;
    }

    public resolve<T>(source: Function & { prototype: T }): T {
        return IoCContainer.get(source, this);
    }
}