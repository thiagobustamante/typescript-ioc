/**
 * Class responsible to handle the scope of the instances created by the Container
 */
export abstract class Scope {
    /**
     * A reference to the LocalScope. Local Scope return a new instance for each dependency resolution requested.
     * This is the default scope.
     */
    // tslint:disable-next-line:variable-name
    public static Local: Scope;
    /**
     * A reference to the SingletonScope. Singleton Scope return the same instance for any
     * dependency resolution requested.
     */
    // tslint:disable-next-line:variable-name
    public static Singleton: Scope;

    /**
     * Method called when the Container needs to resolve a dependency. It should return the instance that will
     * be returned by the Container.
     * @param provider The provider associated with the current bind. Used to create new instances when necessary.
     * @param source The source type of this bind.
     * @return the resolved instance.
     */
    public abstract resolve(provider: Provider, source: Function): any;

    /**
     * Called by the IoC Container when some configuration is changed on the Container binding.
     * @param _source The source type that has its configuration changed.
     */
    public reset(_source: Function) {
        // Do nothing
    }

    /**
     * Called by the IoC Container when the the target type is bound to this scope
     * @param _source The source type that is bound to that scope.
     */
    public init(_source: Function) {
        // Do nothing
    }

    /**
     * Called by the IoC Container when the the target type is unbound to this scope
     * @param _source The source type that is unbound to that scope.
     */
    public finish(_source: Function) {
        // Do nothing
    }
}

/**
 * A factory for instances created by the Container. Called every time an instance is needed.
 */
export type Provider = () => Object;

/**
 * A bind configuration for a given type in the IoC Container.
 */
export interface Config {
    /**
     * Inform a given implementation type to be used when a dependency for the source type is requested.
     * @param target The implementation type
     */
    to(target: Object): Config;
    /**
     * Inform a provider to be used to create instances when a dependency for the source type is requested.
     * @param provider The provider to create instances
     */
    provider(provider: Provider): Config;
    /**
     * Inform a scope to handle the instances for objects created by the Container for this binding.
     * @param scope Scope to handle instances
     */
    scope(scope: Scope): Config;

    /**
     * Inform the types to be retrieved from IoC Container and passed to the type constructor.
     * @param paramTypes A list with parameter types.
     */
    withParams(...paramTypes: Array<any>): Config;
}
/**
 * A Container configuration
 */
export interface ContainerConfiguration {
    /**
     * The base type to be bound to the container
     */
    bind: any;
    /**
     * Target class that will be instantiated to satisfy the binding
     */
    to?: any;
    /**
     * A factory method used to create instance for this binding
     */
    provider?: Provider;
    /**
     * The Scope where the instance is available
     */
    scope?: Scope;
    /**
     * Additional parameters to be passed to class constructor
     */
    withParams?: Array<any>;
}

/**
 * A Configuration Snapshot. Store the state for a specified binding.
 * Can then be restored later. Useful for testing.
 */
export interface Snapshot {
    /**
     * Restore the previous state
     */
    restore(): void;
}
