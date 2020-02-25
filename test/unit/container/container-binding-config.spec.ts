
import { InjectorHandler } from '../../../src/container/injection-handler';
import { IoCBindConfig } from '../../../src/container/container-binding-config';

jest.mock('../../../src/container/injection-handler');

const mockInjectorInstrumentConstructor = InjectorHandler.instrumentConstructor as jest.Mock;
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
// tslint:disable: no-unused-expression
describe('IoCBindConfig', () => {
    beforeEach(() => {
        mockInstanceFactory.mockClear();
        mockInjectorInstrumentConstructor.mockClear();
        mockScopeResolve.mockClear();
        mockScopeReset.mockClear();
        mockScopeInit.mockClear();
        mockScopeFinish.mockClear();
    });

    class MyBaseType { }

    describe('instrumentConstructor()', () => {
        it('should instrument the type constructor', () => {
            const decoratedConstructor = { anyObject: 'anyOtherValue' };
            const bindConfig = new IoCBindConfig(MyBaseType, mockInstanceFactory);

            mockInjectorInstrumentConstructor.mockReturnValue(decoratedConstructor);

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
});
