/// <reference path="../../typings/main.d.ts" />

import * as IoC from "../typescript-ioc";
import "reflect-metadata";

describe("Simple Field injection of a no autowired type", () => {

	@IoC.AutoWired
	class SimppleInject {
		@IoC.Inject
		dateProperty: Date;
	}

    it("should inject a simple date field", () => {
        const instance: SimppleInject = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
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

describe("Simple Constructor parameter injection", () => {

	const constructorsArgs: Array<any> = new Array<any>();

	@IoC.AutoWired
	class TesteConstructor {
		constructor( @IoC.Inject date: Date) {
			constructorsArgs.push(date);
		}
	}

	@IoC.AutoWired
	class TesteConstructor2 {
		@IoC.Inject
		teste1: TesteConstructor;
	}

    it("should inject a date as argument on cosntrutor call, when parameter is not provided", () => {
        const instance: TesteConstructor2 = new TesteConstructor2();
        expect(constructorsArgs.length).toEqual(1);
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
