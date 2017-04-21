import {AutoWired, Inject, Provides, Container, Provider, 
	    Scope, Scoped, Provided, Singleton}  from "../typescript-ioc";
import "reflect-metadata";

describe("@Inject annotation on a property", () => {

	@AutoWired
	class SimppleInject {
		@Inject
		dateProperty: Date;
	}

	@AutoWired
	class ConstructorSimppleInject {
		@Inject
		aDateProperty: Date;

		testOK: boolean;

		constructor() {
			if (this.aDateProperty)
				this.testOK = true; 
		}
	}

    it("should inject a new value on the property field", () => {
        const instance: SimppleInject = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
    });

    it("should inject a new value on the property field that is accessible inside class constructor", () => {
        const instance: ConstructorSimppleInject = new ConstructorSimppleInject();
        expect(instance.testOK).toEqual(true);
    });	
});

describe("@Inject annotation on Constructor parameter", () => {

	const constructorsArgs: Array<any> = new Array<any>();
	const constructorsMultipleArgs: Array<any> = new Array<any>();

	@AutoWired
	class TesteConstructor {
		constructor( @Inject date: Date) {
			constructorsArgs.push(date);
			this.injectedDate = date;
		}
		injectedDate: Date;
	}

	@AutoWired
	class TesteConstructor2 {
		@Inject
		teste1: TesteConstructor;
	}

    it("should inject a new value as argument on cosntrutor call, when parameter is not provided", () => {
        const instance: TesteConstructor2 = new TesteConstructor2();
        expect(instance.teste1.injectedDate).toBeDefined();
        expect(constructorsArgs.length).toEqual(1);
    });

    it("should not inject a new value as argument on cosntrutor call, when parameter is provided", () => {
        const myDate: Date = new Date(1);
        const instance: TesteConstructor = new TesteConstructor(myDate);
        expect(instance.injectedDate).toEqual(myDate);
    });

	@AutoWired
	class aaaa { }
	@AutoWired
	class bbbb { }
	@AutoWired
	class cccc { }

	@AutoWired
	class dddd {
		constructor( @Inject a: aaaa, @Inject b: bbbb, @Inject c: cccc) {
			constructorsMultipleArgs.push(a);
			constructorsMultipleArgs.push(b);
			constructorsMultipleArgs.push(c);
		}
	}
    it("should inject multiple arguments on construtor call in correct order", () => {
        const instance: dddd = Container.get(dddd);
        expect(constructorsMultipleArgs[0]).toBeDefined();
        expect(constructorsMultipleArgs[1]).toBeDefined();
        expect(constructorsMultipleArgs[2]).toBeDefined();
        expect(constructorsMultipleArgs[0].constructor).toEqual(aaaa);
        expect(constructorsMultipleArgs[1].constructor).toEqual(bbbb);
        expect(constructorsMultipleArgs[2].constructor).toEqual(cccc);
	});	
});

describe("Inheritance on autowired types", () => {
	const constructorsCalled: Array<string> = new Array<string>();

	interface TesteInterface {
		property1: Date;
	}

	@AutoWired
	class TesteAbstract implements TesteInterface {
		constructor() {
			constructorsCalled.push('TesteAbstract');
		}
		bbb: Date;

		@Inject
		property1: Date;
	}

	@AutoWired
	class Teste1 extends TesteAbstract {
		constructor() {
			super();
			constructorsCalled.push('Teste1');
		}
		proper1: string = "Property";

		@Inject
		property2: Date;
	}

	@AutoWired
	class Teste2 extends Teste1 {
		constructor() {
			super();
			constructorsCalled.push('Teste2');
		}
		@Inject abc: number = 123;
		@Inject property3: Date;
	}

	@AutoWired
	class ConstructorMethodInject extends Teste2{
		testOK: boolean;

		constructor() {
			super();
			if (this.myMethod())
				this.testOK = true; 
		}

		myMethod() {
			return true;
		} 
	}


    it("should inject all fields from all types and call all constructors", () => {
        const instance: Teste2 = new Teste2();
		expect(instance.property1).toBeDefined();
        expect(instance.property2).toBeDefined();
        expect(constructorsCalled).toEqual(['TesteAbstract', 'Teste1', 'Teste2']);
    });

    it("should keep the object prototype chain even before the constructor run", () => {
        const instance: ConstructorMethodInject = new ConstructorMethodInject();
        expect(instance.testOK).toEqual(true);
    });	
});

describe("Custom scopes for autowired types", () => {
	const scopeCreations: Array<any> = new Array<any>();

	class MyScope extends Scope {
		resolve(provider: Provider, source: Function) {
			let result = provider.get();
			scopeCreations.push(result);
			return result;
		}
	}
	
	@AutoWired
	@Scoped(new MyScope())
	class ScopedTeste {
		constructor() {
		}
	}

	@AutoWired
	class ScopedTeste2 {
		constructor() {
		}
		@Inject
		teste1: ScopedTeste;
	}
 
    it("should inject all fields from all types and call all constructors", () => {
        let instance: ScopedTeste2 = new ScopedTeste2();
        expect(instance).toBeDefined();
        expect(instance.teste1).toBeDefined();
        expect(scopeCreations.length).toEqual(1);
        expect(scopeCreations[0]).toEqual(instance.teste1);
    });
});

describe("Provider for autowired types", () => {
	const providerCreations: Array<any> = new Array<any>();

	const provider: Provider = {
		get: () => {
			const result = new ProvidedTeste(); 
			providerCreations.push(result);
			return result; 
		}
	}

	@AutoWired
	@Singleton
	@Provided(provider)
	class ProvidedTeste {
		constructor() {
		}
	}

	@AutoWired
	class ProvidedTeste2 {
		constructor() {
		}
		@Inject
		teste1: ProvidedTeste;
	}

    it("should inject all fields from all types using a provider to instantiate", () => {
        let instance: ProvidedTeste2 = new ProvidedTeste2();
        expect(instance).toBeDefined();
        expect(instance.teste1).toBeDefined();
        expect(providerCreations.length).toEqual(1);
        expect(providerCreations[0]).toEqual(instance.teste1);
    });
});

describe("Default Implementation class", () => {
	class BaseClass {
	}

	@AutoWired
	@Provides(BaseClass)
	class ImplementationClass implements BaseClass{
		@Inject
		testProp: Date;
	}

    it("should inform Container that it is the implementation for its base type", () => {
        let instance: BaseClass = Container.get(BaseClass);
        const test = instance['testProp']
        expect(test).toBeDefined();
    });
});

describe("The IoC Container.bind(source)", () => {

	class ContainerInjectTest {
		@Inject
		dateProperty: Date;
	}

	Container.bind(ContainerInjectTest);

    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
        const instance: ContainerInjectTest = Container.get(ContainerInjectTest);
        expect(instance.dateProperty).toBeDefined();
    });

    it("should inject internal fields of non AutoWired classes, if it is created by its constructor", () => {
        const instance: ContainerInjectTest = new ContainerInjectTest();
        expect(instance.dateProperty).toBeDefined();
    });
});

describe("The IoC Container.get(source)", () => {

	class ContainerInjectConstructorTest {
		constructor( @Inject date: Date) {
			this.injectedDate = date;
		}
		injectedDate: Date;
	}

	Container.bind(ContainerInjectConstructorTest);

    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
        const instance: ContainerInjectConstructorTest = Container.get(ContainerInjectConstructorTest);
        expect(instance.injectedDate).toBeDefined();
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
		expect(function() { new SingletonInstantiation(); })
			.toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });

    it("should be able to work with Config.scope() changes.", () => {
		expect(function() { new ContainerSingletonInstantiation(); })
			.toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });

    it("should allow Container instantiation of Singleton classes.", () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).toBeDefined();
    });

    it("should allow scope change to Local from Singleton.", () => {
		const instance: SingletonInstantiation = Container.get(SingletonInstantiation);
		expect(instance).toBeDefined();
		Container.bind(SingletonInstantiation).scope(Scope.Local);
		const instance2: SingletonInstantiation = new SingletonInstantiation();
		expect(instance2).toBeDefined();
    });
});
