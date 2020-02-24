
import { IoCContainer } from '../../src/container/container';
import { Inject, Config, Singleton, Scope, Scoped, Provided } from '../../src/typescript-ioc';

jest.mock('../../src/container/container');
const mockInjectProperty = IoCContainer.injectProperty as jest.Mock;
const mockBind = IoCContainer.bind as jest.Mock;

// tslint:disable:no-unused-expression
// tslint:disable: no-console
describe('@Inject decorator', () => {

    beforeEach(() => {
        mockInjectProperty.mockClear();
        mockBind.mockClear();
    });

    it('should inject a new value on the property field', () => {
        class SimppleInject {
            @Inject public dateProperty: Date;
        }
        expect(mockInjectProperty).toBeCalledWith(SimppleInject, 'dateProperty', Date);
    });


    it('should inject new values on constructor parameters', () => {
        const config: any = {};
        mockBind.mockReturnValue(config);

        class ConstructorInjected {
            constructor(@Inject public anotherDate: Date,
                @Inject public myProp: String) {
            }
        }
        expect(mockBind).toBeCalledWith(ConstructorInjected);
        expect(config.paramTypes).toStrictEqual([Date, String]);
    });

    it('should not inject values in non constructor methods', () => {
        class MethodInjected {
            public myMethod(@Inject anotherDate: Date) {
                console.log(anotherDate);
            }
        }

        expect(mockBind).not.toBeCalledWith(MethodInjected);
    });

    it('can not be used on classes directly', () => {
        const testFunction = () => {
            @Inject
            class ClassInjected { }
            expect(mockBind).not.toBeCalledWith(ClassInjected);
        };

        expect(testFunction).toThrow(new TypeError('Invalid @Inject Decorator declaration.'));
    });
});

const mockTo = jest.fn();
const mockProvider = jest.fn();
const mockScope = jest.fn();
const mockWithParams = jest.fn();
const bindResult: Config = {
    to: mockTo,
    provider: mockProvider,
    scope: mockScope,
    withParams: mockWithParams
};

describe('@Singleton decorator', () => {
    beforeEach(() => {
        mockBind.mockClear();
        mockScope.mockClear();
        mockBind.mockReturnValue(bindResult);
        mockScope.mockReturnValue(bindResult);
    });

    it('should configure the class binding into a singleton scope', () => {
        @Singleton
        class SingletonInject { }
        expect(mockBind).toBeCalledWith(SingletonInject);
        expect(mockScope).toBeCalledWith(Scope.Singleton);
    });
});

describe('@Scoped decorator', () => {
    beforeEach(() => {
        mockBind.mockClear();
        mockScope.mockClear();
        mockBind.mockReturnValue(bindResult);
        mockScope.mockReturnValue(bindResult);
    });

    it('should configure the class binding into a custom scope', () => {
        @Scoped(Scope.Local)
        class ScopedInject { }
        expect(mockBind).toBeCalledWith(ScopedInject);
        expect(mockScope).toBeCalledWith(Scope.Local);
    });
});

describe('@Provided decorator', () => {
    beforeEach(() => {
        mockBind.mockClear();
        mockProvider.mockClear();
        mockBind.mockReturnValue(bindResult);
        mockProvider.mockReturnValue(bindResult);
    });

    it('should configure the class binding to use a custom provider', () => {
        const provider = () => new ProvidedInject();
        @Provided(provider)
        class ProvidedInject { }
        expect(mockBind).toBeCalledWith(ProvidedInject);
        expect(mockProvider).toBeCalledWith(provider);
    });
});
