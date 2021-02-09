
import { IoCContainer } from '../../src/container/container';
import { Inject, Config, Singleton, Scope, Scoped, Factory } from '../../src/typescript-ioc';
import { OnlyInstantiableByContainer, InjectValue } from '../../src/decorators';

jest.mock('../../src/container/container');
const mockInjectProperty = IoCContainer.injectProperty as jest.Mock;
const mockBind = IoCContainer.bind as jest.Mock;

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
            public myMethod(@Inject _anotherDate: Date) {
                //
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

    it('should inject into proper arguments despite previous arguments are not decorated', () => {
        const config: any = {};
        mockBind.mockReturnValue(config);

        class ConstructorInjected {
            constructor(public anotherDate: Date,
                @Inject public myProp: String) {
            }
        }
        expect(mockBind).toBeCalledWith(ConstructorInjected);
        expect(config.paramTypes[0]).toEqual(undefined);
        expect(config.paramTypes[1]).toEqual(String);
    });
});

const mockInjectValueProperty = IoCContainer.injectValueProperty as jest.Mock;
const mockBindName = IoCContainer.bindName as jest.Mock;

describe('@InjectValue decorator', () => {

    beforeEach(() => {
        mockInjectValueProperty.mockClear();
        mockBindName.mockClear();
        mockBind.mockClear();
    });

    it('should inject a new value on the property field', () => {
        class SimppleInject {
            @InjectValue('myDate') public dateProperty: Date;
        }
        expect(mockInjectValueProperty).toBeCalledWith(SimppleInject, 'dateProperty', 'myDate');
    });


    it('should inject new values on constructor parameters', () => {
        const config: any = {};
        mockBind.mockReturnValue(config);

        class ConstructorInjected {
            constructor(@InjectValue('myDate') public anotherDate: Date,
                @Inject public myProp: String) {
            }
        }
        expect(mockBind).toBeCalledWith(ConstructorInjected);
        expect(config.paramTypes).toStrictEqual(['myDate', String]);
    });

    it('should not inject values in non constructor methods', () => {
        class MethodInjected {
            public myMethod(@InjectValue('myDate') _anotherDate: Date) {
                //
            }
        }

        expect(mockBind).not.toBeCalledWith(MethodInjected);
    });

    it('can not be used on classes directly', () => {
        const testFunction = () => {
            @InjectValue('myDate')
            class ClassInjected { }
            expect(mockBind).not.toBeCalledWith(ClassInjected);
        };

        expect(testFunction).toThrow(new TypeError('Invalid @InjectValue Decorator declaration.'));
    });

    it('should inject into proper arguments despite previous arguments are not decorated', () => {
        const config: any = {};
        mockBind.mockReturnValue(config);

        class ConstructorInjected {
            constructor(public anotherDate: Date,
                @InjectValue('myString') public myProp: String) {
            }
        }
        expect(mockBind).toBeCalledWith(ConstructorInjected);
        expect(config.paramTypes[0]).toEqual(undefined);
        expect(config.paramTypes[1]).toEqual('myString');
    });
});

const mockTo = jest.fn();
const mockInstrumentConstructor = jest.fn();
const mockFactory = jest.fn();
const mockScope = jest.fn();
const mockWithParams = jest.fn();
const bindResult: Config = {
    to: mockTo,
    factory: mockFactory,
    scope: mockScope,
    withParams: mockWithParams,
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

describe('@Factory decorator', () => {
    beforeEach(() => {
        mockBind.mockClear();
        mockFactory.mockClear();
        mockBind.mockReturnValue(bindResult);
        mockFactory.mockReturnValue(bindResult);
    });

    it('should configure the class binding to use a custom provider', () => {
        const factory = () => new ProvidedInject();
        @Factory(factory)
        class ProvidedInject { }
        expect(mockBind).toBeCalledWith(ProvidedInject);
        expect(mockFactory).toBeCalledWith(factory);
    });
});

describe('@OnlyInstantiableByContainer decorator', () => {

    beforeEach(() => {
        mockBind.mockClear();
        mockInstrumentConstructor.mockReturnThis();
    });

    it('should make the instantiation of a class only possible through the IoC Container', () => {
        const constructor = { a: 'constructor' };
        const bind = {
            instrumentConstructor: mockInstrumentConstructor,
            decoratedConstructor: constructor
        };
        mockBind.mockReturnValue(bind);
        class WiredInject { }

        expect(OnlyInstantiableByContainer(WiredInject)).toEqual(constructor);
        expect(mockBind).toBeCalledWith(WiredInject);
        expect(mockInstrumentConstructor).toBeCalled();
    });
});
