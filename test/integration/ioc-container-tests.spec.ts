
import { Container, Inject, Scoped, Scope, ObjectFactory, Singleton, Factory } from '../../src/typescript-ioc';
import { OnlyInstantiableByContainer, InRequestScope } from '../../src/decorators';

describe('@Inject annotation on a property', () => {

    class SimppleInject {
        @Inject public dateProperty: Date;
    }

    class ConstructorSimppleInject {
        @Inject public aDateProperty: Date;

        public testOK: boolean;

        constructor() {
            if (this.aDateProperty) {
                this.testOK = true;
            }
        }
    }

    abstract class AbsClass {
        constructor(public date: Date) { }
    }

    class ConstructorInjected extends AbsClass {
        constructor(@Inject public anotherDate: Date) {
            super(anotherDate);
        }
    }

    it('should inject a new value on the property field', () => {
        const instance: SimppleInject = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
    });

    it('should inject a new value on the property field that is accessible inside class constructor', () => {
        const instance: ConstructorSimppleInject = new ConstructorSimppleInject();
        expect(instance.testOK).toEqual(true);
    });

    it('should inject a new value on the property field that is injected into constructor', () => {
        const instance: ConstructorInjected = Container.get(ConstructorInjected);
        expect(instance.anotherDate).toBeDefined();
        expect(instance.date).toBeDefined();
        expect(instance.date).toEqual(instance.anotherDate);
    });
});

describe('@Inject annotation on Constructor parameter', () => {

    const constructorsArgs: Array<any> = new Array<any>();
    const constructorsMultipleArgs: Array<any> = new Array<any>();

    class TesteConstructor {
        public injectedDate: Date;
        constructor(@Inject date: Date) {
            constructorsArgs.push(date);
            this.injectedDate = date;
        }
    }

    class TesteConstructor2 {
        @Inject
        public teste1: TesteConstructor;
    }

    it('should inject a new value as argument on cosntrutor call, when parameter is not provided', () => {
        const instance: TesteConstructor2 = new TesteConstructor2();
        expect(instance.teste1.injectedDate).toBeDefined();
        expect(constructorsArgs.length).toEqual(1);
    });

    it('should not inject a new value as argument on cosntrutor call, when parameter is provided', () => {
        const myDate: Date = new Date(1);
        const instance: TesteConstructor = new TesteConstructor(myDate);
        expect(instance.injectedDate).toEqual(myDate);
    });

    class Aaaa { }
    class Bbbb { }
    class Cccc { }

    class Dddd {
        constructor(@Inject a: Aaaa, @Inject b: Bbbb, @Inject c: Cccc) {
            constructorsMultipleArgs.push(a);
            constructorsMultipleArgs.push(b);
            constructorsMultipleArgs.push(c);
        }
    }
    it('should inject multiple arguments on construtor call in correct order', () => {
        const instance: Dddd = Container.get(Dddd);
        expect(instance).toBeDefined();
        expect(constructorsMultipleArgs[0]).toBeDefined();
        expect(constructorsMultipleArgs[1]).toBeDefined();
        expect(constructorsMultipleArgs[2]).toBeDefined();
        expect(constructorsMultipleArgs[0]).toBeInstanceOf(Aaaa);
        expect(constructorsMultipleArgs[1]).toBeInstanceOf(Bbbb);
        expect(constructorsMultipleArgs[2]).toBeInstanceOf(Cccc);
    });
});

describe('Inheritance on types managed by IoC Container', () => {
    const constructorsCalled: Array<string> = new Array<string>();

    interface TesteInterface {
        property1: Date;
    }

    class TesteAbstract implements TesteInterface {
        public bbb: Date;

        @Inject
        public property1: Date;
        constructor() {
            constructorsCalled.push('TesteAbstract');
        }
    }

    class Teste1 extends TesteAbstract {
        public proper1: string = 'Property';

        @Inject
        public property2: Date;
        constructor() {
            super();
            constructorsCalled.push('Teste1');
        }
    }

    class Teste2 extends Teste1 {
        @Inject public abc: number = 123;
        @Inject public property3: Date;
        constructor() {
            super();
            constructorsCalled.push('Teste2');
        }
    }

    class ConstructorMethodInject extends Teste2 {
        public testOK: boolean;

        constructor() {
            super();
            if (this.myMethod()) {
                this.testOK = true;
            }
        }

        public myMethod() {
            return true;
        }
    }


    it('should inject all fields from all types and call all constructors', () => {
        const instance: Teste2 = new Teste2();
        const instance2: Teste2 = new Teste2();
        instance2.abc = 234;
        expect(instance.property1).toBeDefined();
        expect(instance.property2).toBeDefined();
        expect(instance.abc).toEqual(123);
        expect(instance2.abc).toEqual(234);
        expect(constructorsCalled).toEqual(expect.arrayContaining(['TesteAbstract', 'Teste1', 'Teste2']));
    });

    it('should keep the object prototype chain even before the constructor run', () => {
        const instance: ConstructorMethodInject = new ConstructorMethodInject();
        expect(instance.testOK).toEqual(true);
    });
});

describe('Custom scopes for types', () => {
    const scopeCreations: Array<any> = new Array<any>();

    class MyScope extends Scope {
        public resolve(factory: ObjectFactory, _source: any) {
            const result = factory();
            scopeCreations.push(result);
            return result;
        }
    }

    @Scoped(new MyScope())
    class ScopedTeste {
        constructor() {
            // Nothing
        }
    }

    class ScopedTeste2 {
        @Inject public teste1: ScopedTeste;
        constructor() {
            // Nothing
        }
    }

    it('should inject all fields from all types and call all constructors', () => {
        const instance: ScopedTeste2 = new ScopedTeste2();
        expect(instance).toBeDefined();
        expect(instance.teste1).toBeDefined();
        expect(scopeCreations.length).toEqual(1);
        expect(scopeCreations[0]).toEqual(instance.teste1);
    });
});

describe('Request scope for types', () => {
    @InRequestScope
    class RequestScopeClass {
        static instanceCount = 0;
        public instance: number;
        constructor() {
            this.instance = RequestScopeClass.instanceCount++;
        }
    }
    class FirstClass {
        @Inject
        public a: RequestScopeClass;
    }

    class SecondClass {
        @Inject
        public a: RequestScopeClass;
        @Inject
        public b: FirstClass;
    }
    it('should share instances of classes in the same buildContext', () => {
        const secondClass = Container.get(SecondClass);
        expect(secondClass.a.instance).toEqual(secondClass.b.a.instance);
        expect(RequestScopeClass.instanceCount).toEqual(1);
    });

    it('should resolve requestScope even in the class constructor', () => {
        class ThirdClass {
            @Inject
            public a: RequestScopeClass;
            @Inject
            public b: FirstClass;
            public c: RequestScopeClass;

            constructor(@Inject c: RequestScopeClass) {
                if (this.a.instance === c.instance) {
                    this.c = c;
                }
            }
        }

        const thirdClass = Container.get(ThirdClass);
        expect(thirdClass.a.instance).toEqual(thirdClass.b.a.instance);
        expect(thirdClass.c).toBeDefined();
        expect(thirdClass.a.instance).toEqual(thirdClass.c.instance);
    });

    it('should handle direct calls to the constructor', () => {
        expect(() => new SecondClass().a)
            .toThrow(new TypeError('IoC Container can not handle this request. When using @InRequestScope ' +
                'in any dependent type, you should be askking to Container to create the instances through Container.get' +
                ' and not calling the type constructor directly.'));
    });

    it('should support custom providers', () => {
        @Factory((context) => {
            return new ThirdClass(context.resolve(RequestScopeClass));
        })
        class ThirdClass {
            @Inject
            public a: RequestScopeClass;
            @Inject
            public b: FirstClass;
            public c: RequestScopeClass;

            constructor(c: RequestScopeClass) {
                if (this.a.instance === c.instance) {
                    this.c = c;
                }
            }
        }
        const thirdClass = Container.get(ThirdClass);
        expect(thirdClass.a.instance).toEqual(thirdClass.b.a.instance);
        expect(thirdClass.c).toBeDefined();
        expect(thirdClass.a.instance).toEqual(thirdClass.c.instance);
    });

});

describe('ObjectFactory for types', () => {
    const factoryCreations: Array<any> = new Array<any>();

    const factory = () => {
        const result = new ProvidedTeste();
        factoryCreations.push(result);
        return result;
    };

    @Singleton
    @Factory(factory)
    class ProvidedTeste {
        constructor() {
            // Nothing
        }
    }

    class ProvidedTeste2 {
        @Inject
        public teste1: ProvidedTeste;
        constructor() {
            // Nothing
        }
    }

    it('should inject all fields from all types using a ObjectFactory to instantiate', () => {
        const instance: ProvidedTeste2 = new ProvidedTeste2();
        expect(instance).toBeDefined();
        expect(instance.teste1).toBeDefined();
        expect(factoryCreations.length).toEqual(1);
        expect(factoryCreations[0]).toEqual(instance.teste1);
    });
});

describe('The IoC Container.bind(source)', () => {

    class ContainerInjectTest {
        @Inject
        public dateProperty: Date;
    }

    Container.bind(ContainerInjectTest);

    it('should inject internal fields of classes, if it is requested to the Container', () => {
        const instance: ContainerInjectTest = Container.get(ContainerInjectTest);
        expect(instance.dateProperty).toBeDefined();
    });

    it('should inject internal fields of classes, if it is created by its constructor', () => {
        const instance: ContainerInjectTest = new ContainerInjectTest();
        expect(instance.dateProperty).toBeDefined();
    });
});

describe('The IoC Container.get(source)', () => {

    class ContainerInjectConstructorTest {
        public injectedDate: Date;
        constructor(@Inject date: Date) {
            this.injectedDate = date;
        }
    }

    Container.bind(ContainerInjectConstructorTest);

    it('should inject internal fields of classes, if it is requested to the Container', () => {
        const instance: ContainerInjectConstructorTest = Container.get(ContainerInjectConstructorTest);
        expect(instance.injectedDate).toBeDefined();
    });
});

describe('The IoC Container.getType(source)', () => {

    abstract class ITest {
        public abstract testValue: string;
    }

    class Test implements ITest {
        public testValue: string = 'success';
    }


    class TestNoObjectFactory {
        public testValue: string = 'success';
    }

    class TypeNotRegistered {
        public testValue: string = 'success';
    }

    Container.bind(ITest).to(Test);
    Container.bind(TestNoObjectFactory);

    it('should retrieve type used by the Container', () => {
        const clazz: any = Container.getType(ITest);
        expect(clazz).toEqual(Test);

        const clazzNoObjectFactory = Container.getType(TestNoObjectFactory);
        expect(clazzNoObjectFactory).toEqual(TestNoObjectFactory);
    });

    it('should throw error when the type is not registered in the Container', () => {
        try {
            Container.getType(TypeNotRegistered);
            fail(new Error(`The type TypeNotResistered should not pass the test`));
        }
        catch (e) {
            expect(e).toBeInstanceOf(TypeError);
        }
    });
});

describe('The IoC Container.snapshot(source)', () => {

    abstract class IService {
    }

    class Service implements IService {
    }

    class MockService implements IService {
    }

    Container.bind(IService).to(Service);

    it('should store the existing service and overwrite with new service without scope', () => {

        expect(Container.get(IService)).toBeInstanceOf(Service);

        const snapshot = Container.snapshot(IService);
        Container.bind(IService).to(MockService);

        expect(Container.get(IService)).toBeInstanceOf(MockService);
        snapshot.restore();
        expect(Container.get(IService)).toBeInstanceOf(Service);
    });


    it('should store the existing service and overwrite with new service with scope', () => {

        Container.bind(IService).to(Service).scope(Scope.Local);

        expect(Container.get(IService)).toBeInstanceOf(Service);

        const snapshot = Container.snapshot(IService);
        Container.bind(IService).to(MockService).scope(Scope.Singleton);

        expect(Container.get(IService)).toBeInstanceOf(MockService);
        snapshot.restore();
        expect(Container.get(IService)).toBeInstanceOf(Service);
    });
});

describe('@OnlyInstantiableByContainer decorator', () => {

    @OnlyInstantiableByContainer
    @Singleton
    class SingletonInstantiation {
        public static countInstances = 0;
        public instanceNumber: number;

        constructor() {
            this.instanceNumber = ++SingletonInstantiation.countInstances;
        }
    }

    @OnlyInstantiableByContainer
    class LocalInstantiation {
    }

    it('should not allow instantiations of wired classes.', () => {
        expect(() => new SingletonInstantiation())
            .toThrow(new TypeError('Can not instantiate it. The instantiation is blocked for this class. Ask Container for it, using Container.get'));
        expect(() => new LocalInstantiation())
            .toThrow(new TypeError('Can not instantiate it. The instantiation is blocked for this class. Ask Container for it, using Container.get'));
    });

    it('should allow Container instantiation of Singleton classes.', () => {
        const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
        expect(instance).toBeDefined();
    });

    it('should allow Container instantiation of Singleton classes with instrumented parent.', () => {
        @OnlyInstantiableByContainer
        class First { }

        @OnlyInstantiableByContainer
        class Second extends First { }

        const instance: Second = Container.get(Second);
        expect(instance).toBeDefined();
    });

    it('should allow Container instantiation of Singleton classes with instrumented properties', () => {
        @OnlyInstantiableByContainer
        class First { }

        @OnlyInstantiableByContainer
        class Second {
            @Inject
            public first: First;
        }

        @OnlyInstantiableByContainer
        class Third {
            @Inject
            public second: Second;
        }

        const third = Container.get(Third);
        expect(third.second).toBeDefined();
        expect(third.second).toEqual(Container.get(Second));
        const second = Container.get(Second);
        expect(third.second.first).toEqual(second.first);
        expect(third.second.first).toEqual(Container.get(First));
    });

    it('should allow Container instantiation of Singleton classes with instrumented properties in the constructor', () => {
        let called: string;
        class Bar {
            public baz() {
                called = 'baz';
            }
        }

        @Singleton
        @OnlyInstantiableByContainer
        class Foo {
            @Inject
            public _bar: Bar;

            constructor() {
                this._bar.baz();
            }
        }

        const foo = Container.get(Foo);
        expect(foo._bar).toBeDefined();
        expect(called).toEqual('baz');
    });

    it('should allow scope change to Local from Singleton.', () => {
        Container.bind(SingletonInstantiation).scope(Scope.Local);
        const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
        expect(instance).toBeDefined();
        const instance2: SingletonInstantiation = Container.get(SingletonInstantiation);
        expect(instance2).toBeDefined();
        expect(instance).not.toEqual(instance2);
    });
});

describe('The IoC Container Config.to()', () => {

    abstract class FirstClass {
        public abstract getValue(): string;
    }

    class SecondClass extends FirstClass {
        public getValue(): string {
            return 'second';
        }
    }

    class ThirdClass extends FirstClass {
        public getValue(): string {
            return 'third';
        }
    }

    Container.bind(FirstClass).to(SecondClass);

    it('should allow target overriding', () => {
        let instance: FirstClass = Container.get(FirstClass);
        expect(instance.getValue()).toEqual('second');

        Container.bind(FirstClass).to(ThirdClass);
        instance = Container.get(FirstClass);
        expect(instance.getValue()).toEqual('third');
    });
});

describe('The IoC Container Config.withParams()', () => {

    class WithParamClass {
        constructor(public date: Date) {

        }
    }
    Container.bind(WithParamClass).withParams(Date);

    it('should configure the params to be passed to constructor manually', () => {
        const instance: WithParamClass = Container.get(WithParamClass);
        expect(instance.date).toBeDefined();
    });
});