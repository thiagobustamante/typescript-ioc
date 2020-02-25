
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCBindConfig } from '../../../src/container/container-binding-config';

jest.mock('../../../src/container/injection-handler');

const mockInjectorInstrumentConstructor = InjectorHandler.instrumentConstructor as jest.Mock;
const mockInjectorBlockInstantiation = InjectorHandler.blockInstantiation as jest.Mock;
const mockInjectorUnBlockInstantiation = InjectorHandler.unblockInstantiation as jest.Mock;
const mockInjectorGetConstructorFromType = InjectorHandler.getConstructorFromType as jest.Mock;
const mockInjectorCheckType = InjectorHandler.checkType as jest.Mock;
const mockInstanceFactory = jest.fn();

const mockScopeResolve = jest.fn();
const mockScopeReset = jest.fn();
const mockScopeInit = jest.fn();
const mockScopeFinish = jest.fn();
const mockScope = jest.fn().mockImplementation(() => {
    return {
        resolve: mockScopeResolve,
        reset: mockScopeReset,
        init: mockScopeInit,
        finish: mockScopeFinish
    };
});
describe('IoCBindConfig', () => {
    beforeEach(() => {
        mockInstanceFactory.mockClear();
        mockInjectorInstrumentConstructor.mockClear();
        mockScopeResolve.mockClear();
        mockScopeReset.mockClear();
        mockScopeInit.mockClear();
        mockScopeFinish.mockClear();
        mockInjectorBlockInstantiation.mockClear();
        mockInjectorUnBlockInstantiation.mockClear();
        mockInjectorGetConstructorFromType.mockClear();
        mockInjectorCheckType.mockClear();
    });

    class MyBaseType { }

    describe('instrumentConstructor()', () => {
        it('should instrument the type constructor', () => {
            const decoratedConstructor = { anyObject: 'anyOtherValue' };
            mockInjectorInstrumentConstructor.mockReturnValue(decoratedConstructor);

            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);

            expect(bindConfig.instrumentConstructor()).toEqual(bindConfig);
            expect(mockInjectorInstrumentConstructor).toBeCalledWith(MyBaseType);
            expect(MyBaseType.constructor).toStrictEqual(decoratedConstructor);
            expect(bindConfig.decoratedConstructor).toStrictEqual(decoratedConstructor);
        });
    });

    describe('withParams()', () => {
        it('should configure the paramTypes to be passed to constructor', () => {
            const paramTypes = [Date];
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            expect(bindConfig.withParams(...paramTypes)).toEqual(bindConfig);
            expect(bindConfig.paramTypes).toEqual(paramTypes);

        });
    });

    describe('scope()', () => {
        it('should configure the scope to resolve instances', () => {
            const scope = mockScope();
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);

            expect(bindConfig.scope(scope)).toEqual(bindConfig);
            expect(bindConfig.iocscope).toEqual(scope);
            expect(mockScopeInit).toBeCalledWith(MyBaseType);
        });

        it('should finish any previous scope before configure a new one', () => {
            const scope = mockScope();
            const previousScope: any = { finish: jest.fn() };

            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.iocscope = previousScope;

            expect(bindConfig.scope(scope)).toEqual(bindConfig);
            expect(bindConfig.iocscope).toEqual(scope);
            expect(mockScopeInit).toBeCalledWith(MyBaseType);
            expect(previousScope.finish).toBeCalledWith(MyBaseType);
        });
    });

    describe('provider()', () => {
        it('should configure the provider to create instances', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);

            const provider = () => new MyBaseType();
            expect(bindConfig.provider(provider)).toEqual(bindConfig);
            expect(bindConfig.iocprovider).toEqual(provider);
        });

        it('should call scope.reset after changing the provider', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.iocscope = mockScope();

            const provider = () => new MyBaseType();
            expect(bindConfig.provider(provider)).toEqual(bindConfig);
            expect(bindConfig.iocprovider).toEqual(provider);
            expect(mockScopeReset).toBeCalledWith(MyBaseType);
        });
    });

    describe('getInstance()', () => {
        it('shoud retrieve instances, managing its creation on the configuration state', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const instance = new MyBaseType();
            const provider = jest.fn().mockReturnValue(instance);
            bindConfig.scope(mockScope()).provider(provider);
            mockScopeResolve.mockReturnValue(instance);

            expect(bindConfig.getInstance()).toEqual(instance);
            expect(bindConfig.iocscope.resolve).toBeCalledWith(provider, MyBaseType);
        });

        it('shoud retrieve instances for instrumented constructors', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const instance = new MyBaseType();
            const provider = jest.fn().mockReturnValue(instance);
            const decoratedConstructor = { anyObject: 'anyOtherValue' };
            mockInjectorInstrumentConstructor.mockReturnValue(decoratedConstructor);

            bindConfig.scope(mockScope()).provider(provider);
            mockScopeResolve.mockReturnValue(instance);
            bindConfig.instrumentConstructor();

            expect(bindConfig.getInstance()).toEqual(instance);
            expect(mockInjectorBlockInstantiation).toBeCalledWith(MyBaseType);
            expect(bindConfig.iocscope.resolve).toBeCalledWith(provider, MyBaseType);
            expect(mockInjectorUnBlockInstantiation).toBeCalledWith(MyBaseType);
        });
    });

    describe('to()', () => {
        it('should create providers for type instantiation', () => {
            class MyType extends MyBaseType { }

            const instance = new MyType();
            mockInstanceFactory.mockReturnValue(instance);
            mockInjectorGetConstructorFromType.mockReturnValue(MyType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);

            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            expect(bindConfig.iocprovider()).toEqual(instance);
            expect(bindConfig.targetSource).toEqual(MyType);
            expect(mockInjectorCheckType).toBeCalledWith(MyType);
        });

        it('should reset scope after change configuration', () => {
            class MyType extends MyBaseType { }

            const instance = new MyType();
            mockInstanceFactory.mockReturnValue(instance);
            mockInjectorGetConstructorFromType.mockReturnValue(MyType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.scope(mockScope());

            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            expect(bindConfig.iocprovider()).toEqual(instance);
            expect(mockScopeReset).toBeCalledWith(MyBaseType);
        });

        it('should pass parameters for type constructor in the generated provider', () => {
            class MyType extends MyBaseType {
                constructor(public date: Date) {
                    super();
                }
            }
            mockInstanceFactory.mockImplementation((type) => type === Date ? new Date() : null);
            mockInjectorGetConstructorFromType.mockReturnValue(MyType);
            const bindConfig = new IoCBindConfig(MyType, mockInstanceFactory);
            bindConfig.withParams(Date);
            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            const newInstance = bindConfig.iocprovider() as MyType;
            expect(newInstance.date).toBeDefined();
            expect(mockInstanceFactory).toBeCalledWith(Date);
        });

        it('should support instrumented constructors', () => {
            class ExtendedType extends MyBaseType { }
            mockInjectorInstrumentConstructor.mockReturnValue(ExtendedType);
            mockInjectorGetConstructorFromType.mockReturnValue(MyBaseType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.instrumentConstructor();
            expect(bindConfig.to(MyBaseType as any)).toEqual(bindConfig);
            const newInstance = bindConfig.iocprovider();
            expect(newInstance).toBeDefined();
            expect(newInstance).toBeInstanceOf(ExtendedType);
        });

    });
});
