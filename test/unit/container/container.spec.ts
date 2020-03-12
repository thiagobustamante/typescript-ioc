
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCContainer } from '../../../src/container/container';
import { IoCBindConfig, IoCBindValueConfig, PropertyPath } from '../../../src/container/container-binding-config';
import { BuildContext, ObjectFactory } from '../../../src/model';

jest.mock('../../../src/container/injection-handler');
jest.mock('../../../src/container/container-binding-config');

const mockTo = jest.fn();
const mockGetInstance = jest.fn();

const mockIoCBindConfig = IoCBindConfig as jest.Mock;
const mockIoCBindValueConfig = IoCBindValueConfig as jest.Mock;
const mockPropertyParse = PropertyPath.parse as jest.Mock;

const config = {
    to: mockTo,
    getInstance: mockGetInstance
};
const mockConfigGetValue = jest.fn();

const valueConfig = {
    to: mockTo,
    getValue: mockConfigGetValue
};

const mockGetConstructorFromType = InjectorHandler.getConstructorFromType as jest.Mock;
const mockCheckType = InjectorHandler.checkType as jest.Mock;
const mockCheckName = InjectorHandler.checkName as jest.Mock;
const mockInjectProperty = InjectorHandler.injectProperty as jest.Mock;
const mockSelectNamespace = jest.fn();
const mockSelectedNamespace = jest.fn();
const mockRemoveNamespace = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockGetValue = jest.fn();
const mockSetValue = jest.fn();
(IoCContainer as any).namespaces = {
    get: mockGet,
    set: mockSet,
    getValue: mockGetValue,
    setValue: mockSetValue,
    selectNamespace: mockSelectNamespace,
    selectedNamespace: mockSelectedNamespace,
    removeNamespace: mockRemoveNamespace
};

describe('Container', () => {
    beforeEach(() => {
        mockTo.mockClear();
        mockTo.mockReturnThis();
        mockGetInstance.mockClear();

        mockGetConstructorFromType.mockClear();
        mockCheckType.mockClear();
        mockCheckName.mockClear();
        mockInjectProperty.mockClear();

        mockIoCBindConfig.mockClear();
        mockIoCBindConfig.mockImplementation(() => {
            return config;
        });
        mockIoCBindValueConfig.mockClear();
        mockIoCBindValueConfig.mockImplementation(() => {
            return valueConfig;
        });
        mockSelectNamespace.mockClear();
        mockSelectedNamespace.mockClear();
        mockRemoveNamespace.mockClear();
        mockGet.mockClear();
        mockSet.mockClear();
        mockGetValue.mockClear();
        mockSetValue.mockClear();

        mockConfigGetValue.mockClear();
        mockPropertyParse.mockClear();
    });

    describe('bind()', () => {

        it('should bind a type to the container', () => {
            class MyBaseType { }
            const constructor = { anyObject: 'anyValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);

            const bind = IoCContainer.bind(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(mockIoCBindConfig).toBeCalledWith(constructor, IoCContainer.get, IoCContainer.getValue);
            expect(mockTo).toBeCalledWith(MyBaseType);

            expect(bind).toStrictEqual(config);
        });
    });

    describe('bindName()', () => {

        it('should bind a value to the container', () => {
            const valueName = 'myvalue';
            const path = 'a';
            mockPropertyParse.mockReturnValue({
                name: valueName,
                path: path
            });
            mockGetValue.mockReturnValue(null);

            const bind = IoCContainer.bindName(`${valueName}.${path}`);

            expect(mockCheckName).toBeCalledWith(`${valueName}.${path}`);
            expect(mockGetValue).toBeCalledWith(valueName);
            expect(mockIoCBindValueConfig).toBeCalledWith(valueName);
            expect(mockSetValue).toBeCalledWith(valueName, valueConfig);

            expect(bind).toMatchObject({
                path: path
            });
            expect(bind).toEqual(valueConfig);
        });
    });

    describe('get()', () => {
        it('should get an instance for a type bound to the container', () => {
            class MyBaseType { }
            const constructor = { anyProp: 'anyValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            mockIoCBindConfig.mockImplementation(() => {
                return {
                    to: mockTo,
                    getInstance: mockGetInstance,
                    iocFactory: {}
                };
            });
            const instance = { prop: 'instanceProp' };
            const context = new TestBuildContext();
            mockGetInstance.mockReturnValue(instance);

            const result = IoCContainer.get(MyBaseType, context);

            expect(mockGetInstance).toBeCalledWith(context);
            expect(mockTo).toBeCalledTimes(1);
            expect(result).toStrictEqual(instance);
        });

        it('should set a target class before get an instance if no provider is configured', () => {
            class MyBaseType { }
            const constructor = { anyProperty: 'anyValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            const instance = { prop: 'instanceProp' };
            const context = new TestBuildContext();
            mockGetInstance.mockReturnValue(instance);

            const result = IoCContainer.get(MyBaseType, context);

            expect(mockGetInstance).toBeCalledWith(context);
            expect(mockTo).toBeCalledTimes(2);
            expect(result).toStrictEqual(instance);
        });
    });

    describe('getValue()', () => {
        it('should get an instance for a type bound to the container', () => {
            const valueName = 'myvalue';
            const path = 'a';
            const value = 'value';
            mockPropertyParse.mockReturnValue({
                name: valueName,
                path: path
            });
            mockGetValue.mockReturnValue(null);
            mockConfigGetValue.mockReturnValue(value);

            const result = IoCContainer.getValue(`${valueName}.${path}`);

            expect(mockConfigGetValue).toBeCalled();
            expect(result).toStrictEqual(value);
        });
    });


    describe('getType()', () => {
        it('should throw an error for a type not bound to the container', () => {
            class MyBaseType { }
            const constructor = { prop1: 'propValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            expect(() => IoCContainer.getType(MyBaseType))
                .toThrow(TypeError(`The type MyBaseType hasn't been registered with the IOC Container`));

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
        });

        it('should return target type for a type bound to the container', () => {
            class MyBaseType { }
            const constructor = { prop1: 'propValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            mockGet.mockReturnValue({
                to: mockTo,
                getInstance: mockGetInstance,
                targetSource: { target: 'source' }
            });

            const result = IoCContainer.getType(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(mockGet).toBeCalledWith(constructor);
            expect(result).toStrictEqual({ target: 'source' });
        });

        it('should return source when no targetSource is available', () => {
            class MyBaseType { }
            const constructor = { p: 'propValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            mockGet.mockReturnValue({
                to: mockTo,
                getInstance: mockGetInstance,
                source: { target: 'source' }
            });

            const result = IoCContainer.getType(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(mockGet).toBeCalledWith(constructor);
            expect(result).toStrictEqual({ target: 'source' });
        });
    });

    describe('injectProperty()', () => {
        it('should call InjectorHandler.injectProperty properly', () => {
            class MyBaseType { }
            IoCContainer.injectProperty(MyBaseType, 'prop', Date);

            expect(mockInjectProperty).toBeCalledWith(MyBaseType, 'prop', Date, IoCContainer.get);
        });
    });

    describe('namespace()', () => {
        it('should create a namespace properly', () => {
            const namespaceName = 'mynamespace';
            const namespace = IoCContainer.namespace(namespaceName);
            namespace.remove();
            expect(mockSelectNamespace).toBeCalledWith(namespaceName);
            expect(mockRemoveNamespace).toBeCalledWith(namespaceName);
        });
    });

    describe('selectedNamespace()', () => {
        it('should return the selected namespace', () => {
            const namespaceName = 'mynamespace';
            mockSelectedNamespace.mockReturnValue(namespaceName);
            expect(IoCContainer.selectedNamespace()).toEqual(namespaceName);
            expect(mockSelectedNamespace).toBeCalledTimes(1);
        });
    });

});

class TestBuildContext extends BuildContext {
    public build<T>(_source: Function & { prototype: T; }, _factory: ObjectFactory): T {
        return null;
    }
    public resolve<T>(_source: Function & { prototype: T }): T {
        return null;
    }
}