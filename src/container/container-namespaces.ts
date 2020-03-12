import { IoCBindConfig, IoCBindValueConfig } from './container-binding-config';

export class ContainerNamespaces {
    private defaultNamespace = new NamespaceBindings(null);
    private namespaces = new Map<string, NamespaceBindings>();
    private currentNamespace: NamespaceBindings;

    public get(type: FunctionConstructor) {
        let result: IoCBindConfig;
        if (this.currentNamespace) {
            result = this.currentNamespace.get(type);
            if (result) {
                return result;
            }
        }
        return this.defaultNamespace.get(type);
    }

    public set(type: FunctionConstructor, bindConfig: IoCBindConfig) {
        (this.currentNamespace || this.defaultNamespace).set(type, bindConfig);
    }

    public getValue(name: string) {
        let result: IoCBindValueConfig;
        if (this.currentNamespace) {
            result = this.currentNamespace.getValue(name);
            if (result) {
                return result;
            }
        }
        return this.defaultNamespace.getValue(name);
    }

    public setValue(name: string, bindConfig: IoCBindValueConfig) {
        (this.currentNamespace || this.defaultNamespace).setValue(name, bindConfig);
    }

    public selectNamespace(name: string) {
        if (name) {
            let namespace = this.namespaces.get(name);
            if (!namespace) {
                namespace = new NamespaceBindings(name);
                this.namespaces.set(name, namespace);
            }
            this.currentNamespace = namespace;
        } else {
            this.currentNamespace = null;
        }
    }

    public removeNamespace(name: string) {
        const namespace = this.namespaces.get(name);
        if (namespace) {
            if (this.currentNamespace && (namespace.name === this.currentNamespace.name)) {
                this.currentNamespace = null;
            }
            namespace.clear();
            this.namespaces.delete(name);
        }
    }

    public selectedNamespace() {
        return (this.currentNamespace ? this.currentNamespace.name : null);
    }
}

class NamespaceBindings {
    public readonly name: string;

    private bindings: Map<FunctionConstructor, IoCBindConfig> = new Map();
    private values: Map<string, IoCBindValueConfig> = new Map();

    constructor(name: string) {
        this.name = name;
    }

    public get(type: FunctionConstructor) {
        return this.bindings.get(type);
    }

    public set(type: FunctionConstructor, bindConfig: IoCBindConfig) {
        bindConfig.namespace = this.name;
        this.bindings.set(type, bindConfig);
    }

    public getValue(name: string) {
        return this.values.get(name);
    }

    public setValue(name: string, bindConfig: IoCBindValueConfig) {
        bindConfig.namespace = this.name;
        this.values.set(name, bindConfig);
    }

    public clear() {
        this.bindings.clear();
        this.values.clear();
    }
}