import * as IoC from "../typescript-ioc";
import "reflect-metadata";

describe("@Inject annotation on a property", () => {

	@IoC.AutoWired
	class SimppleInject {
		@IoC.Inject
		dateProperty: Date;
	}

    it("should inject a new value on the property field", () => {
        const instance: SimppleInject = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
    });
});

describe("@Inject annotation on Constructor parameter", () => {

	const constructorsArgs: Array<any> = new Array<any>();
	const constructorsMultipleArgs: Array<any> = new Array<any>();

	@IoC.AutoWired
	class TesteConstructor {
		constructor( @IoC.Inject date: Date) {
			constructorsArgs.push(date);
			this.injectedDate = date;
		}
		injectedDate: Date;
	}

	@IoC.AutoWired
	class TesteConstructor2 {
		@IoC.Inject
		teste1: TesteConstructor;
	}

    it("should inject a new value as argument on cosntrutor call, when parameter is not provided", () => {
        const instance: TesteConstructor2 = new TesteConstructor2();
        expect(constructorsArgs.length).toEqual(1);
        expect(instance.teste1.injectedDate).toBeDefined();
    });

    it("should not inject a new value as argument on cosntrutor call, when parameter is provided", () => {
        const myDate: Date = new Date(1);
        const instance: TesteConstructor = new TesteConstructor(myDate);
        expect(instance.injectedDate).toEqual(myDate);
    });

	@IoC.AutoWired
	class aaaa { }
	@IoC.AutoWired
	class bbbb { }
	@IoC.AutoWired
	class cccc { }

	@IoC.AutoWired
	class dddd {
		constructor( @IoC.Inject a: aaaa, @IoC.Inject b: bbbb, @IoC.Inject c: cccc) {
			constructorsMultipleArgs.push(a);
			constructorsMultipleArgs.push(b);
			constructorsMultipleArgs.push(c);
		}
	}
    it("should inject multiple arguments on construtor call in correct order", () => {
        const instance: dddd = IoC.Container.get(dddd);
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

	@IoC.AutoWired
	class TesteAbstract implements TesteInterface {
		constructor() {
			constructorsCalled.push('TesteAbstract');
		}
		bbb: Date;

		@IoC.Inject
		property1: Date;
	}

	@IoC.AutoWired
	class Teste1 extends TesteAbstract {
		constructor() {
			super();
			constructorsCalled.push('Teste1');
		}
		proper1: string = "Property";

		@IoC.Inject
		property2: Date;
	}

	@IoC.AutoWired
	class Teste2 extends Teste1 {
		constructor() {
			super();
			constructorsCalled.push('Teste2');
		}
		abc: number = 123;
	}

    it("should inject all fields from all types and call all constructors", () => {
        const instance: Teste2 = new Teste2();
        expect(constructorsCalled).toEqual(['TesteAbstract', 'Teste1', 'Teste2']);
        expect(instance.property1).toBeDefined();
        expect(instance.property2).toBeDefined();
    });
});

describe("Custom scopes for autowired types", () => {
	const scopeCreations: Array<any> = new Array<any>();

	class MyScope extends IoC.Scope {
		resolve(provider: IoC.Provider, source: Function) {
			let result = provider.get();
			scopeCreations.push(result);
			return result;
		}
	}
	
	@IoC.AutoWired
	@IoC.Scoped(new MyScope())
	class ScopedTeste {
		constructor() {
		}
	}

	@IoC.AutoWired
	class ScopedTeste2 {
		constructor() {
		}
		@IoC.Inject
		teste1: ScopedTeste;
	}

    it("should inject all fields from all types and call all constructors", () => {
        let instance: ScopedTeste2 = new ScopedTeste2();
        expect(instance).toBeDefined();
        expect(scopeCreations.length).toEqual(1);
        expect(scopeCreations[0]).toEqual(instance.teste1);
    });
});

describe("Provider for autowired types", () => {
	const providerCreations: Array<any> = new Array<any>();

	const provider: IoC.Provider = {
		get: () => {
			const result = new ProvidedTeste(); 
			providerCreations.push(result);
			return result; 
		}
	}

	@IoC.AutoWired
	@IoC.Singleton
	@IoC.Provided(provider)
	class ProvidedTeste {
		constructor() {
		}
	}

	@IoC.AutoWired
	class ProvidedTeste2 {
		constructor() {
		}
		@IoC.Inject
		teste1: ProvidedTeste;
	}

    it("should inject all fields from all types using a provider to instantiate", () => {
        let instance: ProvidedTeste2 = new ProvidedTeste2();
        expect(instance).toBeDefined();
        expect(providerCreations.length).toEqual(1);
        expect(providerCreations[0]).toEqual(instance.teste1);
    });
});

describe("Default Implementation class", () => {
	class BaseClass {
	}

	@IoC.AutoWired
	@IoC.Provides(BaseClass)
	class ImplementationClass implements BaseClass{
		@IoC.Inject
		testProp: Date;
	}

    it("should inform Container that it is the implementation for its base type", () => {
        let instance: BaseClass = IoC.Container.get(BaseClass);
        const test = instance['testProp']
        expect(test).toBeDefined();
    });
});

describe("The IoC Container.bind(source)", () => {

	class ContainerInjectTest {
		@IoC.Inject
		dateProperty: Date;
	}

	IoC.Container.bind(ContainerInjectTest);

    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
        const instance: ContainerInjectTest = IoC.Container.get(ContainerInjectTest);
        expect(instance.dateProperty).toBeDefined();
    });

    it("should not inject internal fields of non AutoWired classes, if it is created by its constructor", () => {
        const instance: ContainerInjectTest = new ContainerInjectTest();
        expect(instance.dateProperty).toBeUndefined();
    });
});

describe("The IoC Container.get(source)", () => {

	class ContainerInjectConstructorTest {
		constructor( @IoC.Inject date: Date) {
			this.injectedDate = date;
		}
		injectedDate: Date;
	}

	IoC.Container.bind(ContainerInjectConstructorTest);

    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", () => {
        const instance: ContainerInjectConstructorTest = IoC.Container.get(ContainerInjectConstructorTest);
        expect(instance.injectedDate).toBeDefined();
    });
});

describe("The IoC Container", () => {

	@IoC.AutoWired
	@IoC.Singleton
	class SingletonInstantiation {
	}

	@IoC.AutoWired
	class ContainerSingletonInstantiation {
	}
	IoC.Container.bind(ContainerSingletonInstantiation)
				 .to(ContainerSingletonInstantiation)
				 .scope(IoC.Scope.Singleton);

    it("should not allow instantiations of Singleton classes.", () => {
		expect(function() { new SingletonInstantiation(); })
			.toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });

    it("should be able to work with Config.scope() changes.", () => {
		expect(function() { new ContainerSingletonInstantiation(); })
			.toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });

    it("should allow Container instantiation of Singleton classes.", () => {
		const instance: SingletonInstantiation = IoC.Container.get(SingletonInstantiation);
		expect(instance).toBeDefined();
    });

    it("should allow scope change to Local from Singleton.", () => {
		const instance: SingletonInstantiation = IoC.Container.get(SingletonInstantiation);
		expect(instance).toBeDefined();
		IoC.Container.bind(SingletonInstantiation).scope(IoC.Scope.Local);
		const instance2: SingletonInstantiation = new SingletonInstantiation();
		expect(instance2).toBeDefined();
    });
});
