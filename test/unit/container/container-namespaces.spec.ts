
import { ContainerNamespaces } from '../../../src/container/container-namespaces';
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCBindConfig, IoCBindValueConfig } from '../../../src/container/container-binding-config';

describe('ContainerNamespaces', () => {

    let namespaces: ContainerNamespaces;

    beforeEach(() => {
        namespaces = new ContainerNamespaces();
    });

    describe('get()', () => {
        it('should retrieve a bindConfig for the default namespace', () => {
            class MyType { }
            const constructor = InjectorHandler.getConstructorFromType(MyType);
            const config = new IoCBindConfig(constructor, jest.fn(), jest.fn());
            namespaces.set(constructor, config);
            expect(namespaces.get(constructor, true)).toEqual(config);
        });

        it('should retrieve a bindConfig for the current namespace', () => {
            class MyType { }
            const constructor = InjectorHandler.getConstructorFromType(MyType);
            const config = new IoCBindConfig(constructor, jest.fn(), jest.fn());
            const namespaceName = 'newNamespace';
            namespaces.selectNamespace(namespaceName);
            namespaces.set(constructor, config);
            expect(namespaces.get(constructor, true)).toEqual(config);
            namespaces.removeNamespace(namespaceName);
            expect(namespaces.get(constructor, true)).toBeUndefined();
        });

        it('should retrieve a bindConfig from default namespace if does not exist in the current namespace', () => {
            class MyType { }
            const constructor = InjectorHandler.getConstructorFromType(MyType);
            const config = new IoCBindConfig(constructor, jest.fn(), jest.fn());
            const namespaceName = 'newNamespace';
            namespaces.set(constructor, config);
            namespaces.selectNamespace(namespaceName);
            expect(namespaces.get(constructor, true)).toEqual(config);
            namespaces.removeNamespace(namespaceName);
            expect(namespaces.get(constructor, true)).toEqual(config);
        });
    });

    describe('getValue()', () => {
        it('should retrieve a bindConfig for the default namespace', () => {
            const config = new IoCBindValueConfig('my-config');
            namespaces.setValue(config.name, config);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
        });

        it('should retrieve a bindConfig for the current namespace', () => {
            const config = new IoCBindValueConfig('my-config');
            const namespaceName = 'newNamespace';
            namespaces.selectNamespace(namespaceName);
            namespaces.setValue(config.name, config);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
            namespaces.removeNamespace(namespaceName);
            expect(namespaces.getValue(config.name, true)).toBeUndefined();
        });

        it('should retrieve a bindConfig from default namespace if does not exist in the current namespace', () => {
            const config = new IoCBindValueConfig('my-config');
            const namespaceName = 'newNamespace';
            namespaces.setValue(config.name, config);
            namespaces.selectNamespace(namespaceName);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
            namespaces.removeNamespace(namespaceName);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
        });
    });

    describe('selectNamespace()', () => {
        it('should retrieve a bindConfig from default namespace if does not exist in the current namespace', () => {
            const config = new IoCBindValueConfig('my-config');
            const namespaceName = 'newNamespace';
            namespaces.selectNamespace(namespaceName);
            namespaces.setValue(config.name, config);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
            namespaces.selectNamespace(null);
            expect(namespaces.getValue(config.name, true)).toBeUndefined();
            namespaces.selectNamespace(namespaceName);
            expect(namespaces.getValue(config.name, true)).toEqual(config);
        });
    });

    describe('selectedNamespace()', () => {
        it('should retrieve the selected namespace name', () => {
            const namespaceName = 'newNamespace';
            namespaces.selectNamespace(namespaceName);
            expect(namespaces.selectedNamespace()).toEqual(namespaceName);
            namespaces.selectNamespace(null);
            expect(namespaces.selectedNamespace()).toEqual(null);
        });
    });
});
