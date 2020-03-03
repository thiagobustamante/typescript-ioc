
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCBindConfig } from '../../../src/container/container-binding-config';
import { BuildContext } from '../../../src/model';

jest.mock('../../../src/container/injection-handler');

const mockInjectorInstrumentConstructor = InjectorHandler.instrumentConstructor as jest.Mock;
const mockInjectorBlockInstantiation = InjectorHandler.blockInstantiation as jest.Mock;
const mockInjectorUnBlockInstantiation = InjectorHandler.unblockInstantiation as jest.Mock;
const mockInjectorGetConstructorFromType = InjectorHandler.getConstructorFromType as jest.Mock;
const mockInjectorCheckType = InjectorHandler.checkType as jest.Mock;
const mockInjectorInjectContext = InjectorHandler.injectContext as jest.Mock;
const mockInjectorRemoveContext = InjectorHandler.removeContext as jest.Mock;

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
        mockInjectorInjectContext.mockClear();
        mockInjectorRemoveContext.mockClear();
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
            expect(bindConfig.iocScope).toEqual(scope);
            expect(mockScopeInit).toBeCalledWith(MyBaseType);
        });

        it('should finish any previous scope before configure a new one', () => {
            const scope = mockScope();
            const previousScope: any = { finish: jest.fn() };

            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.iocScope = previousScope;

            expect(bindConfig.scope(scope)).toEqual(bindConfig);
            expect(bindConfig.iocScope).toEqual(scope);
            expect(mockScopeInit).toBeCalledWith(MyBaseType);
            expect(previousScope.finish).toBeCalledWith(MyBaseType);
        });
    });

    describe('factory()', () => {
        it('should configure the factory to create instances', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const instance = { a: 'instance' };
            const context = new BuildContext();
            const factory = jest.fn().mockReturnValue(instance);
            const blocked = true;
            mockInjectorUnBlockInstantiation.mockReturnValue(blocked);
            expect(bindConfig.factory(factory)).toEqual(bindConfig);
            expect(bindConfig.iocFactory(context)).toEqual(instance);
            expect(mockInjectorUnBlockInstantiation).toBeCalled();
            expect(factory).toBeCalledWith(context);
            expect(mockInjectorInjectContext).toBeCalledWith(instance, context);
            expect(mockInjectorBlockInstantiation).toBeCalledWith(blocked);
        });

        it('should call scope.reset after changing the factory', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.iocScope = mockScope();

            const factory = () => new MyBaseType();
            expect(bindConfig.factory(factory)).toEqual(bindConfig);
            expect(mockScopeReset).toBeCalledWith(MyBaseType);
        });
    });

    describe('getInstance()', () => {
        it('shoud retrieve instances, creating them based on the configuration state', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const instance = new MyBaseType();
            const factory = jest.fn().mockReturnValue(instance);
            const buildContext = new BuildContext();
            bindConfig.scope(mockScope()).factory(factory);
            mockScopeResolve.mockReturnValue(instance);

            expect(bindConfig.getInstance(buildContext)).toEqual(instance);
            expect(bindConfig.iocScope.resolve).toBeCalledWith(bindConfig.iocFactory, MyBaseType, buildContext);
        });

        it('shoud retrieve instances for instrumented constructors', () => {
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const instance = new MyBaseType();
            const factory = jest.fn().mockReturnValue(instance);
            const decoratedConstructor = { anyObject: 'anyOtherValue' };
            const buildContext = new BuildContext();
            mockInjectorInstrumentConstructor.mockReturnValue(decoratedConstructor);

            bindConfig.scope(mockScope()).factory(factory);
            mockScopeResolve.mockReturnValue(instance);
            bindConfig.instrumentConstructor();

            expect(bindConfig.getInstance(buildContext)).toEqual(instance);
            expect(bindConfig.iocScope.resolve).toBeCalledWith(bindConfig.iocFactory, MyBaseType, buildContext);
        });
    });

    describe('to()', () => {
        it('should create providers for type instantiation', () => {
            class MyType extends MyBaseType { }

            const instance = new MyType();
            mockInstanceFactory.mockReturnValue(instance);
            mockInjectorGetConstructorFromType.mockReturnValue(MyType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const context = new BuildContext();

            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            expect(bindConfig.iocFactory(context)).toEqual(instance);
            expect(bindConfig.targetSource).toEqual(MyType);
            expect(mockInjectorCheckType).toBeCalledWith(MyType);
            expect(mockInjectorInjectContext).toBeCalledWith(instance, context);
        });

        it('should reset scope after change configuration', () => {
            class MyType extends MyBaseType { }

            const instance = new MyType();
            mockInstanceFactory.mockReturnValue(instance);
            mockInjectorGetConstructorFromType.mockReturnValue(MyType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            bindConfig.scope(mockScope());

            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            expect(bindConfig.iocFactory()).toEqual(instance);
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
            const buildContext = new BuildContext();
            bindConfig.withParams(Date);
            expect(bindConfig.to(MyType as any)).toEqual(bindConfig);
            const newInstance = bindConfig.iocFactory(buildContext) as MyType;
            expect(newInstance.date).toBeDefined();
            expect(mockInstanceFactory).toBeCalledWith(Date, buildContext);
            expect(mockInjectorInjectContext).toBeCalledWith(MyType, buildContext);
            expect(mockInjectorUnBlockInstantiation).toBeCalled();
            expect(mockInjectorRemoveContext).toBeCalledWith(MyType);
        });

        it('should support instrumented constructors', () => {
            class ExtendedType extends MyBaseType { }
            mockInjectorInstrumentConstructor.mockReturnValue(ExtendedType);
            mockInjectorGetConstructorFromType.mockReturnValue(MyBaseType);
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);
            const buildContext = new BuildContext();
            bindConfig.instrumentConstructor();
            expect(bindConfig.to(MyBaseType as any)).toEqual(bindConfig);
            const newInstance = bindConfig.iocFactory(buildContext);
            expect(newInstance).toBeDefined();
            expect(newInstance).toBeInstanceOf(ExtendedType);
            expect(mockInjectorInjectContext).toBeCalledWith(ExtendedType, buildContext);
            expect(mockInjectorRemoveContext).toBeCalledWith(ExtendedType);
        });

    });
});
