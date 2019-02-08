'use strict';

import * as assert from 'assert';
import * as chai from 'chai';
import 'mocha';
import "reflect-metadata";
import { ContainerConfig } from "../../src/container-config";
import { AutoWired, Container, Inject, Provided, Provides, Scope, Scoped, Singleton } from "../../src/typescript-ioc";

const expect = chai.expect;

// tslint:disable:no-unused-expression
describe("@Inject annotation on a property", () => {

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

	it("should inject a new value on the property field", () => {
		const instance: SimppleInject = new SimppleInject();
		expect(instance.dateProperty).to.exist;
	});

	it("should inject a new value on the property field that is accessible inside class constructor", () => {
		const instance: ConstructorSimppleInject = new ConstructorSimppleInject();
		expect(instance.testOK).to.equal(true);
	});

	it("should inject a new value on the property field that is injected into constructor", () => {
		const instance: ConstructorInjected = Container.get(ConstructorInjected);
		expect(instance.anotherDate).to.exist;
		expect(instance.date).to.exist;
		expect(instance.date).to.equal(instance.anotherDate);
	});
});

describe("@Inject annotation on Constructor parameter", () => {

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

	it("should inject a new value as argument on cosntrutor call, when parameter is not provided", () => {
		const instance: TesteConstructor2 = new TesteConstructor2();
		expect(instance.teste1.injectedDate).to.exist;
		expect(constructorsArgs.length).to.equal(1);
	});

	it("should not inject a new value as argument on cosntrutor call, when parameter is provided", () => {
		const myDate: Date = new Date(1);
		const instance: TesteConstructor = new TesteConstructor(myDate);
		expect(instance.injectedDate).to.equals(myDate);
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
	it("should inject multiple arguments on construtor call in correct order", () => {
		const instance: Dddd = Container.get(Dddd);
		expect(instance).to.exist;
		expect(constructorsMultipleArgs[0]).to.exist;
		expect(constructorsMultipleArgs[1]).to.exist;
		expect(constructorsMultipleArgs[2]).to.exist;
		expect(constructorsMultipleArgs[0].constructor).to.equals(Aaaa);
		expect(constructorsMultipleArgs[1].constructor).to.equals(Bbbb);
		expect(constructorsMultipleArgs[2].constructor).to.equals(Cccc);
	});
});

describe("Inheritance on autowired types", () => {
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
		public proper1: string = "Property";

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


	it("should inject all fields from all types and call all constructors", () => {
		const instance: Teste2 = new Teste2();
		const instance2: Teste2 = new Teste2();
		instance2.abc = 234;
		expect(instance.property1).to.exist;
		expect(instance.property2).to.exist;
		expect(instance.abc).to.eq(123);
		expect(instance2.abc).to.eq(234);
		expect(constructorsCalled).to.include.members(['TesteAbstract', 'Teste1', 'Teste2']);
	});

	it("should keep the object prototype chain even before the constructor run", () => {
		const instance: ConstructorMethodInject = new ConstructorMethodInject();
		expect(instance.testOK).to.equal(true);
	});
});

describe("Custom scopes for autowired types", () => {
	const scopeCreations: Array<any> = new Array<any>();

	class MyScope extends (Scope) {
		public resolve(provider: any, source: Function) {
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

	it("should inject all fields from all types and call all constructors", () => {
		const instance: ScopedTeste2 = new ScopedTeste2();
		expect(instance).to.exist;
		expect(instance.teste1).to.exist;
		expect(scopeCreations.length).to.equal(1);
		expect(scopeCreations[0]).to.equal(instance.teste1);
	});
});

describe("Provider for autowired types", () => {
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

	it("should inject all fields from all types using a provider to instantiate", () => {
		const instance: ProvidedTeste2 = new ProvidedTeste2();
		expect(instance).to.exist;
		expect(instance.teste1).to.exist;
		expect(providerCreations.length).to.equal(1);
		expect(providerCreations[0]).to.equal(instance.teste1);
	});
});

describe("Default Implementation class", () => {
	class BaseClass {
	}

	@AutoWired
	@Provides(BaseClass)
	class ImplementationClass implements BaseClass {
		@Inject
		public testProp: Date;
	}

	it("should inform Container that it is the implementation for its base type", () => {
		const instance: ImplementationClass = Container.get(BaseClass) as ImplementationClass;
		const test = instance['testProp'];
		expect(test).to.exist;
	});
});

describe("The IoC Container.bind(source)", () => {

	class ContainerInjectTest {
		@Inject
		public dateProperty: Date;
	}

	Container.bind(ContainerInjectTest);

	it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
		const instance: ContainerInjectTest = Container.get(ContainerInjectTest);
		expect(instance.dateProperty).to.exist;
	});

	it("should inject internal fields of non AutoWired classes, if it is created by its constructor", () => {
		const instance: ContainerInjectTest = new ContainerInjectTest();
		expect(instance.dateProperty).to.exist;
	});
});

describe("The IoC Container.get(source)", () => {

	class ContainerInjectConstructorTest {
		public injectedDate: Date;
		constructor(@Inject date: Date) {
			this.injectedDate = date;
		}
	}

	Container.bind(ContainerInjectConstructorTest);

	it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
		const instance: ContainerInjectConstructorTest = Container.get(ContainerInjectConstructorTest);
		expect(instance.injectedDate).to.exist;
	});
});

describe("The IoC Container.getType(source)", () => {

	abstract class ITest {
		public abstract testValue: string;
	}

	class Test implements ITest {
		public testValue: string = "success";
	}


	class TestNoProvider {
		public testValue: string = "success";
	}

	class TypeNotRegistered {
		public testValue: string = "success";
	}

	Container.bind(ITest).to(Test);
	Container.bind(TestNoProvider);

	it("should retrieve type used by the Container", () => {
		const clazz: Function = Container.getType(ITest);
		expect(clazz).to.be.equal(Test);

		const clazzNoProvider: Function = Container.getType(TestNoProvider);
		expect(clazzNoProvider).to.be.equal(TestNoProvider);
	});

	it("should throw error when the type is not registered in the Container", () => {
		try {
			const clazz: Function = Container.getType(TypeNotRegistered);
			assert.fail(clazz, null, `The type TypeNotResistered should not pass the test`);
		}
		catch (e) {
			expect(e).instanceOf(TypeError);
		}
	});

});

describe("The IoC Container.snapshot(source) and Container.restore(source)", () => {

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

	it("should throw TypeError if you try to restore a type which has not been snapshotted", () => {
		expect(function () { Container.restore(IService); })
			.to.throw(TypeError, "Config for source was never snapshoted.");
	});

	it("should store the existing service and overwrite with new service without scope", () => {

		expect(Container.get(IService)).to.instanceof(Service);

		Container.snapshot(IService);
		Container.bind(IService).to(MockService);

		expect(Container.get(IService)).to.instanceof(MockService);
	});

	it("should revert the service to the saved config without scope", () => {

		Container.restore(IService);

		expect(Container.get(IService)).instanceof(Service);
	});

	it("should store the existing service and overwrite with new service with scope", () => {

		Container.bind(IService).to(Service).scope(Scope.Local);

		expect(Container.get(IService)).to.instanceof(Service);

		Container.snapshot(IService);
		Container.bind(IService).to(MockService).scope(Scope.Local);

		expect(Container.get(IService)).to.instanceof(MockService);
	});

	it("should revert the service to the saved config with scope", () => {

		Container.restore(IService);

		expect(Container.get(IService)).instanceof(Service);
	});
});

describe("The IoC Container", () => {

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

	it("should not allow instantiations of Singleton classes.", () => {
		expect(function () { new SingletonInstantiation(); })
			.to.throw(TypeError, "Can not instantiate Singleton class. Ask Container for it, using Container.get");
	});

	it("should be able to work with Config.scope() changes.", () => {
		expect(function () { new ContainerSingletonInstantiation(); })
			.to.throw(TypeError, "Can not instantiate Singleton class. Ask Container for it, using Container.get");
	});

	it("should allow Container instantiation of Singleton classes.", () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).to.exist;
	});

	it("should allow scope change to Local from Singleton.", () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).to.exist;
		Container.bind(SingletonInstantiation).scope(Scope.Local);
		const instance2: SingletonInstantiation = new SingletonInstantiation();
		expect(instance2).to.exist;
	});
});

describe("The IoC Container Config.to()", () => {

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

	it("should allow target overriding", () => {
		let instance: FirstClass = Container.get(FirstClass);
		expect(instance.getValue()).to.equal('second');

		Container.bind(FirstClass).to(ThirdClass);
		instance = Container.get(FirstClass);
		expect(instance.getValue()).to.equal('third');
	});
});

describe("The IoC Container", () => {

	it("should find classes in different files", () => {
		ContainerConfig.addSource('data/*', 'test');

		const Worker = require('../data/classes').Worker;
		const instance = new Worker();
		expect(instance).to.exist;
		expect(instance.type).to.exist;
		instance.work();
	});

});
