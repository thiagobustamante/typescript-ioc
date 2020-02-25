
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCContainer } from '../../../src/container/container';
import { IoCBindConfig } from '../../../src/container/container-binding-config';

jest.mock('../../../src/container/injection-handler');
jest.mock('../../../src/container/container-binding-config');

const mockTo = jest.fn();
const mockGetInstance = jest.fn();

const mockIoCBindConfig = IoCBindConfig as jest.Mock;
const config = {
    to: mockTo,
    getInstance: mockGetInstance
};

const mockGetConstructorFromType = InjectorHandler.getConstructorFromType as jest.Mock;
const mockCheckType = InjectorHandler.checkType as jest.Mock;
const mockInjectProperty = InjectorHandler.injectProperty as jest.Mock;

// tslint:disable: no-unused-expression
describe('Container', () => {
    beforeEach(() => {
        mockTo.mockClear();
        mockTo.mockReturnThis();
        mockGetInstance.mockClear();

        mockGetConstructorFromType.mockClear();
        mockCheckType.mockClear();
        mockInjectProperty.mockClear();

        mockIoCBindConfig.mockClear();
        mockIoCBindConfig.mockImplementation(() => {
            return config;
        });
    });

    describe('bind()', () => {

        it('should bind a type to the container', () => {
            class MyBaseType { }
            const constructor = { anyObject: 'anyValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);

            const bind = IoCContainer.bind(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(mockIoCBindConfig).toBeCalledWith(constructor, IoCContainer.get);
            expect(mockTo).toBeCalledWith(MyBaseType);

            expect(bind).toStrictEqual(config);
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
                    iocprovider: {}
                };
            });
            const instance = { prop: 'instanceProp' };
            mockGetInstance.mockReturnValue(instance);

            const result = IoCContainer.get(MyBaseType);

            expect(mockGetInstance).toBeCalled;
            expect(mockTo).toBeCalledTimes(1);
            expect(result).toStrictEqual(instance);
        });

        it('should set a target class before get an instance if no provider is configured', () => {
            class MyBaseType { }
            const constructor = { anyProperty: 'anyValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            const instance = { prop: 'instanceProp' };
            mockGetInstance.mockReturnValue(instance);

            const result = IoCContainer.get(MyBaseType);

            expect(mockGetInstance).toBeCalled;
            expect(mockTo).toBeCalledTimes(2);
            expect(result).toStrictEqual(instance);
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
            mockIoCBindConfig.mockImplementation(() => {
                return {
                    to: mockTo,
                    getInstance: mockGetInstance,
                    targetSource: { target: 'source' }
                };
            });

            IoCContainer.bind(MyBaseType);
            const result = IoCContainer.getType(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(result).toStrictEqual({ target: 'source' });
        });

        it('should return source when no targetSource is available', () => {
            class MyBaseType { }
            const constructor = { p: 'propValue' };
            mockGetConstructorFromType.mockReturnValue(constructor);
            mockIoCBindConfig.mockImplementation(() => {
                return {
                    to: mockTo,
                    getInstance: mockGetInstance,
                    source: { target: 'source' }
                };
            });

            IoCContainer.bind(MyBaseType);
            const result = IoCContainer.getType(MyBaseType);

            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
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

    describe('snapshot()', () => {
        it('should create a configuration snapshot properly', () => {
            class MyBaseType { }

            const constructor = { x: 'propValue' };
            const mockProvider = jest.fn().mockReturnThis();
            const mockScope = jest.fn().mockReturnThis();
            const mockWithParams = jest.fn().mockReturnThis();

            mockGetConstructorFromType.mockReturnValue(constructor);
            mockIoCBindConfig.mockImplementation(() => {
                return {
                    to: mockTo,
                    scope: mockScope,
                    withParams: mockWithParams,
                    provider: mockProvider,
                    iocprovider: { a: 'provider' },
                    iocscope: { b: 'scope' },
                    paramTypes: [Date]
                };
            });

            const snapshot = IoCContainer.snapshot(MyBaseType);
            snapshot.restore();
            expect(mockCheckType).toBeCalledWith(MyBaseType);
            expect(mockGetConstructorFromType).toBeCalledWith(MyBaseType);
            expect(mockProvider).toBeCalledWith({ a: 'provider' });
            expect(mockScope).toBeCalledWith({ b: 'scope' });
            expect(mockWithParams).toBeCalledWith([Date]);
        });
    });
});
