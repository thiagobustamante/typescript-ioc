
import { AutoWired, Container, Inject, Provided, Provides, Scope, Scoped, Singleton } from '../../src/typescript-ioc';

// tslint:disable:no-unused-expression
describe('@Inject annotation on a property', () => {

	@AutoWired
	class SimppleInject {
		@Inject public dateProperty: Date;
	}

	@AutoWired
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

	@AutoWired
	class ConstructorInjected extends AbsClass {
		constructor(@Inject public anotherDate: Date) {
			super(anotherDate);
		}
	}

	it('should inject a new value on the property field', () => {
		const instance: SimppleInject = new SimppleInject();
		expect(instance.dateProperty).toBeDefined;
	});

	it('should inject a new value on the property field that is accessible inside class constructor', () => {
		const instance: ConstructorSimppleInject = new ConstructorSimppleInject();
		expect(instance.testOK).toEqual(true);
	});

	it('should inject a new value on the property field that is injected into constructor', () => {
		const instance: ConstructorInjected = Container.get(ConstructorInjected);
		expect(instance.anotherDate).toBeDefined;
		expect(instance.date).toBeDefined;
		expect(instance.date).toEqual(instance.anotherDate);
	});
});

describe('@Inject annotation on Constructor parameter', () => {

	const constructorsArgs: Array<any> = new Array<any>();
	const constructorsMultipleArgs: Array<any> = new Array<any>();

	@AutoWired
	class TesteConstructor {
		public injectedDate: Date;
		constructor(@Inject date: Date) {
			constructorsArgs.push(date);
			this.injectedDate = date;
		}
	}

	@AutoWired
	class TesteConstructor2 {
		@Inject
		public teste1: TesteConstructor;
	}

	it('should inject a new value as argument on cosntrutor call, when parameter is not provided', () => {
		const instance: TesteConstructor2 = new TesteConstructor2();
		expect(instance.teste1.injectedDate).toBeDefined;
		expect(constructorsArgs.length).toEqual(1);
	});

	it('should not inject a new value as argument on cosntrutor call, when parameter is provided', () => {
		const myDate: Date = new Date(1);
		const instance: TesteConstructor = new TesteConstructor(myDate);
		expect(instance.injectedDate).toEqual(myDate);
	});

	@AutoWired
	class Aaaa { }
	@AutoWired
	class Bbbb { }
	@AutoWired
	class Cccc { }

	@AutoWired
	class Dddd {
		constructor(@Inject a: Aaaa, @Inject b: Bbbb, @Inject c: Cccc) {
			constructorsMultipleArgs.push(a);
			constructorsMultipleArgs.push(b);
			constructorsMultipleArgs.push(c);
		}
	}
	it('should inject multiple arguments on construtor call in correct order', () => {
		const instance: Dddd = Container.get(Dddd);
		expect(instance).toBeDefined;
		expect(constructorsMultipleArgs[0]).toBeDefined;
		expect(constructorsMultipleArgs[1]).toBeDefined;
		expect(constructorsMultipleArgs[2]).toBeDefined;
		expect(constructorsMultipleArgs[0].constructor).toEqual(Aaaa);
		expect(constructorsMultipleArgs[1].constructor).toEqual(Bbbb);
		expect(constructorsMultipleArgs[2].constructor).toEqual(Cccc);
	});
});

describe('Inheritance on autowired types', () => {
	const constructorsCalled: Array<string> = new Array<string>();

	interface TesteInterface {
		property1: Date;
	}

	@AutoWired
	class TesteAbstract implements TesteInterface {
		public bbb: Date;

		@Inject
		public property1: Date;
		constructor() {
			constructorsCalled.push('TesteAbstract');
		}
	}

	@AutoWired
	class Teste1 extends TesteAbstract {
		public proper1: string = 'Property';

		@Inject
		public property2: Date;
		constructor() {
			super();
			constructorsCalled.push('Teste1');
		}
	}

	@AutoWired
	class Teste2 extends Teste1 {
		@Inject public abc: number = 123;
		@Inject public property3: Date;
		constructor() {
			super();
			constructorsCalled.push('Teste2');
		}
	}

	@AutoWired
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
		expect(instance.property1).toBeDefined;
		expect(instance.property2).toBeDefined;
		expect(instance.abc).toEqual(123);
		expect(instance2.abc).toEqual(234);
		expect(constructorsCalled).toEqual(expect.arrayContaining(['TesteAbstract', 'Teste1', 'Teste2']));
	});

	it('should keep the object prototype chain even before the constructor run', () => {
		const instance: ConstructorMethodInject = new ConstructorMethodInject();
		expect(instance.testOK).toEqual(true);
	});
});

describe('Custom scopes for autowired types', () => {
	const scopeCreations: Array<any> = new Array<any>();

	class MyScope extends (Scope) {
		public resolve(provider: any, _source: any) {
			const result = provider.get();
			scopeCreations.push(result);
			return result;
		}
	}

	@AutoWired
	@Scoped(new MyScope())
	class ScopedTeste {
		constructor() {
			// Nothing
		}
	}

	@AutoWired
	class ScopedTeste2 {
		@Inject public teste1: ScopedTeste;
		constructor() {
			// Nothing
		}
	}

	it('should inject all fields from all types and call all constructors', () => {
		const instance: ScopedTeste2 = new ScopedTeste2();
		expect(instance).toBeDefined;
		expect(instance.teste1).toBeDefined;
		expect(scopeCreations.length).toEqual(1);
		expect(scopeCreations[0]).toEqual(instance.teste1);
	});
});

describe('Provider for autowired types', () => {
	const providerCreations: Array<any> = new Array<any>();

	const provider = {
		get: () => {
			const result = new ProvidedTeste();
			providerCreations.push(result);
			return result;
		}
	};

	@AutoWired
	@Singleton
	@Provided(provider)
	class ProvidedTeste {
		constructor() {
			// Nothing
		}
	}

	@AutoWired
	class ProvidedTeste2 {
		@Inject
		public teste1: ProvidedTeste;
		constructor() {
			// Nothing
		}
	}

	it('should inject all fields from all types using a provider to instantiate', () => {
		const instance: ProvidedTeste2 = new ProvidedTeste2();
		expect(instance).toBeDefined;
		expect(instance.teste1).toBeDefined;
		expect(providerCreations.length).toEqual(1);
		expect(providerCreations[0]).toEqual(instance.teste1);
	});
});

describe('Default Implementation class', () => {
	class BaseClass {
	}

	@AutoWired
	@Provides(BaseClass)
	class ImplementationClass implements BaseClass {
		@Inject
		public testProp: Date;
	}

	it('should inform Container that it is the implementation for its base type', () => {
		const instance: ImplementationClass = Container.get(BaseClass) as ImplementationClass;
		const test = instance['testProp'];
		expect(test).toBeDefined;
	});
});

describe('The IoC Container.bind(source)', () => {

	class ContainerInjectTest {
		@Inject
		public dateProperty: Date;
	}

	Container.bind(ContainerInjectTest);

	it('should inject internal fields of non AutoWired classes, if it is requested to the Container', () => {
		const instance: ContainerInjectTest = Container.get(ContainerInjectTest);
		expect(instance.dateProperty).toBeDefined;
	});

	it('should inject internal fields of non AutoWired classes, if it is created by its constructor', () => {
		const instance: ContainerInjectTest = new ContainerInjectTest();
		expect(instance.dateProperty).toBeDefined;
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

	it('should inject internal fields of non AutoWired classes, if it is requested to the Container', () => {
		const instance: ContainerInjectConstructorTest = Container.get(ContainerInjectConstructorTest);
		expect(instance.injectedDate).toBeDefined;
	});
});

describe('The IoC Container.getType(source)', () => {

	abstract class ITest {
		public abstract testValue: string;
	}

	class Test implements ITest {
		public testValue: string = 'success';
	}


	class TestNoProvider {
		public testValue: string = 'success';
	}

	class TypeNotRegistered {
		public testValue: string = 'success';
	}

	Container.bind(ITest).to(Test);
	Container.bind(TestNoProvider);

	it('should retrieve type used by the Container', () => {
		const clazz: any = Container.getType(ITest);
		expect(clazz).toEqual(Test);

		const clazzNoProvider = Container.getType(TestNoProvider);
		expect(clazzNoProvider).toEqual(TestNoProvider);
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

describe('The IoC Container.snapshot(source) and Container.restore(source)', () => {

	@AutoWired
	abstract class IService {
	}

	@AutoWired
	@Provides(IService)
	class Service implements IService {
	}

	class MockService implements IService {
	}

	Container.bind(IService)
		.to(Service);

	it('should throw TypeError if you try to restore a type which has not been snapshotted', () => {
		expect(() => { Container.restore(IService); })
			.toThrow(new TypeError('Config for source was never snapshoted.'));
	});

	it('should store the existing service and overwrite with new service without scope', () => {

		expect(Container.get(IService)).toBeInstanceOf(Service);

		Container.snapshot(IService);
		Container.bind(IService).to(MockService);

		expect(Container.get(IService)).toBeInstanceOf(MockService);
	});

	it('should revert the service to the saved config without scope', () => {

		Container.restore(IService);

		expect(Container.get(IService)).toBeInstanceOf(Service);
	});

	it('should store the existing service and overwrite with new service with scope', () => {

		Container.bind(IService).to(Service).scope(Scope.Local);

		expect(Container.get(IService)).toBeInstanceOf(Service);

		Container.snapshot(IService);
		Container.bind(IService).to(MockService).scope(Scope.Local);

		expect(Container.get(IService)).toBeInstanceOf(MockService);
	});

	it('should revert the service to the saved config with scope', () => {

		Container.restore(IService);

		expect(Container.get(IService)).toBeInstanceOf(Service);
	});
});

describe('The IoC Container', () => {

	@AutoWired
	@Singleton
	class SingletonInstantiation {
	}

	@AutoWired
	class ContainerSingletonInstantiation {
	}
	Container.bind(ContainerSingletonInstantiation)
		.to(ContainerSingletonInstantiation)
		.scope(Scope.Singleton);

	it('should not allow instantiations of Singleton classes.', () => {
		expect(() => { new SingletonInstantiation(); })
			.toThrow(new TypeError('Can not instantiate Singleton class. Ask Container for it, using Container.get'));
	});

	it('should be able to work with Config.scope() changes.', () => {
		expect(() => { new ContainerSingletonInstantiation(); })
			.toThrow(new TypeError('Can not instantiate Singleton class. Ask Container for it, using Container.get'));
	});

	it('should allow Container instantiation of Singleton classes.', () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).toBeDefined;
	});

	it('should allow scope change to Local from Singleton.', () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).toBeDefined;
		Container.bind(SingletonInstantiation).scope(Scope.Local);
		const instance2: SingletonInstantiation = new SingletonInstantiation();
		expect(instance2).toBeDefined;
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

