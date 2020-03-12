import { InjectorHandler } from './injection-handler';
import { Snapshot, BuildContext, Namespace } from '../model';
import { IoCBindConfig, IoCBindValueConfig, PropertyPath } from './container-binding-config';
import { ContainerNamespaces } from './container-namespaces';

/**
 * Internal implementation of IoC Container.
 */
export class IoCContainer {
    public static bind(source: Function, readOnly: boolean = false): IoCBindConfig {
        InjectorHandler.checkType(source);
        const baseSource = InjectorHandler.getConstructorFromType(source);
        let config: IoCBindConfig = IoCContainer.namespaces.get(baseSource);
        if (!config) {
            config = new IoCBindConfig(baseSource, IoCContainer.get, IoCContainer.getValue);
            config
                .to(source as FunctionConstructor);
            IoCContainer.namespaces.set(baseSource, config);
        } else if (!readOnly && config.namespace !== IoCContainer.namespaces.selectedNamespace()) {
            config = config.clone();
            IoCContainer.namespaces.set(baseSource, config);
        }
        return config;
    }

    public static bindName(name: string, readOnly: boolean = false): IoCBindValueConfig {
        InjectorHandler.checkName(name);
        const property = PropertyPath.parse(name);
        let config = IoCContainer.namespaces.getValue(property.name);
        if (!config) {
            config = new IoCBindValueConfig(property.name);
            IoCContainer.namespaces.setValue(property.name, config);
        }
        else if (!readOnly && config.namespace !== IoCContainer.namespaces.selectedNamespace()) {
            config = config.clone();
            IoCContainer.namespaces.setValue(property.name, config);
        }
        config.path = property.path;
        return config;
    }

    public static get(source: Function, context: BuildContext) {
        const config: IoCBindConfig = IoCContainer.bind(source, true);
        if (!config.iocFactory) {
            config.to(config.source as FunctionConstructor);
        }
        return config.getInstance(context);
    }

    public static getValue(name: string) {
        const config: IoCBindValueConfig = IoCContainer.bindName(name, true);
        return config.getValue();
    }

    public static getType(source: Function): Function {
        InjectorHandler.checkType(source);
        const baseSource = InjectorHandler.getConstructorFromType(source);
        const config: IoCBindConfig = IoCContainer.namespaces.get(baseSource);
        if (!config) {
            throw new TypeError(`The type ${source.name} hasn't been registered with the IOC Container`);
        }
        return config.targetSource || config.source;
    }

    public static namespace(name: string): Namespace {
        IoCContainer.namespaces.selectNamespace(name);
        return {
            remove: () => {
                if (name) {
                    IoCContainer.namespaces.removeNamespace(name);
                }
            }
        };
    }

    public static selectedNamespace() {
        return IoCContainer.namespaces.selectedNamespace();
    }

    public static injectProperty(target: Function, key: string, propertyType: Function) {
        InjectorHandler.injectProperty(target, key, propertyType, IoCContainer.get);
    }

    public static injectValueProperty(target: Function, key: string, name: string) {
        InjectorHandler.injectValueProperty(target, key, name, IoCContainer.getValue);
    }

    /**
     * Create a temporary namespace. Useful for testing.
     */
    public static snapshot(): Snapshot {
        const name = `_snapshot-${IoCContainer.snapshotsCount++}`;
        const namespace = IoCContainer.namespace(name);
        return {
            restore: () => namespace.remove(),
            select: () => IoCContainer.namespace(name)
        };
    }

    private static namespaces: ContainerNamespaces = new ContainerNamespaces();
    private static snapshotsCount = 0;
}
