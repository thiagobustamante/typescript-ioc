"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IoC = require("../typescript-ioc");
require("reflect-metadata");
describe("@Inject annotation on a property", function () {
    var SimppleInject = (function () {
        function SimppleInject() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', Date)
        ], SimppleInject.prototype, "dateProperty", void 0);
        SimppleInject = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], SimppleInject);
        return SimppleInject;
    }());
    it("should inject a new value on the property field", function () {
        var instance = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
    });
});
describe("@Inject annotation on Constructor parameter", function () {
    var constructorsArgs = new Array();
    var TesteConstructor = (function () {
        function TesteConstructor(date) {
            constructorsArgs.push(date);
            this.injectedDate = date;
        }
        TesteConstructor = __decorate([
            IoC.AutoWired,
            __param(0, IoC.Inject), 
            __metadata('design:paramtypes', [Date])
        ], TesteConstructor);
        return TesteConstructor;
    }());
    var TesteConstructor2 = (function () {
        function TesteConstructor2() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', TesteConstructor)
        ], TesteConstructor2.prototype, "teste1", void 0);
        TesteConstructor2 = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], TesteConstructor2);
        return TesteConstructor2;
    }());
    it("should inject a new value as argument on cosntrutor call, when parameter is not provided", function () {
        var instance = new TesteConstructor2();
        expect(constructorsArgs.length).toEqual(1);
        expect(instance.teste1.injectedDate).toBeDefined();
    });
    it("should not inject a new value as argument on cosntrutor call, when parameter is provided", function () {
        var myDate = new Date(1);
        var instance = new TesteConstructor(myDate);
        expect(instance.injectedDate).toEqual(myDate);
    });
});
describe("Inheritance on autowired types", function () {
    var constructorsCalled = new Array();
    var TesteAbstract = (function () {
        function TesteAbstract() {
            constructorsCalled.push('TesteAbstract');
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', Date)
        ], TesteAbstract.prototype, "property1", void 0);
        TesteAbstract = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], TesteAbstract);
        return TesteAbstract;
    }());
    var Teste1 = (function (_super) {
        __extends(Teste1, _super);
        function Teste1() {
            _super.call(this);
            this.proper1 = "Property";
            constructorsCalled.push('Teste1');
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', Date)
        ], Teste1.prototype, "property2", void 0);
        Teste1 = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], Teste1);
        return Teste1;
    }(TesteAbstract));
    var Teste2 = (function (_super) {
        __extends(Teste2, _super);
        function Teste2() {
            _super.call(this);
            this.abc = 123;
            constructorsCalled.push('Teste2');
        }
        Teste2 = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], Teste2);
        return Teste2;
    }(Teste1));
    it("should inject all fields from all types and call all constructors", function () {
        var instance = new Teste2();
        expect(constructorsCalled).toEqual(['TesteAbstract', 'Teste1', 'Teste2']);
        expect(instance.property1).toBeDefined();
        expect(instance.property2).toBeDefined();
    });
});
describe("Custom scopes for autowired types", function () {
    var scopeCreations = new Array();
    var MyScope = (function (_super) {
        __extends(MyScope, _super);
        function MyScope() {
            _super.apply(this, arguments);
        }
        MyScope.prototype.resolve = function (provider, source) {
            var result = provider.get();
            scopeCreations.push(result);
            return result;
        };
        return MyScope;
    }(IoC.Scope));
    var ScopedTeste = (function () {
        function ScopedTeste() {
        }
        ScopedTeste = __decorate([
            IoC.AutoWired,
            IoC.Scoped(new MyScope()), 
            __metadata('design:paramtypes', [])
        ], ScopedTeste);
        return ScopedTeste;
    }());
    var ScopedTeste2 = (function () {
        function ScopedTeste2() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', ScopedTeste)
        ], ScopedTeste2.prototype, "teste1", void 0);
        ScopedTeste2 = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], ScopedTeste2);
        return ScopedTeste2;
    }());
    it("should inject all fields from all types and call all constructors", function () {
        var instance = new ScopedTeste2();
        expect(instance).toBeDefined();
        expect(scopeCreations.length).toEqual(1);
        expect(scopeCreations[0]).toEqual(instance.teste1);
    });
});
describe("Provider for autowired types", function () {
    var providerCreations = new Array();
    var provider = {
        get: function () {
            var result = new ProvidedTeste();
            providerCreations.push(result);
            return result;
        }
    };
    var ProvidedTeste = (function () {
        function ProvidedTeste() {
        }
        ProvidedTeste = __decorate([
            IoC.AutoWired,
            IoC.Singleton,
            IoC.Provided(provider), 
            __metadata('design:paramtypes', [])
        ], ProvidedTeste);
        return ProvidedTeste;
    }());
    var ProvidedTeste2 = (function () {
        function ProvidedTeste2() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', ProvidedTeste)
        ], ProvidedTeste2.prototype, "teste1", void 0);
        ProvidedTeste2 = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], ProvidedTeste2);
        return ProvidedTeste2;
    }());
    it("should inject all fields from all types using a provider to instantiate", function () {
        var instance = new ProvidedTeste2();
        expect(instance).toBeDefined();
        expect(providerCreations.length).toEqual(1);
        expect(providerCreations[0]).toEqual(instance.teste1);
    });
});
describe("Default Implementation class", function () {
    var BaseClass = (function () {
        function BaseClass() {
        }
        return BaseClass;
    }());
    var ImplementationClass = (function () {
        function ImplementationClass() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', Date)
        ], ImplementationClass.prototype, "testProp", void 0);
        ImplementationClass = __decorate([
            IoC.AutoWired,
            IoC.Provides(BaseClass), 
            __metadata('design:paramtypes', [])
        ], ImplementationClass);
        return ImplementationClass;
    }());
    it("should inform Container that it is the implementation for its base type", function () {
        var instance = IoC.Container.get(BaseClass);
        var test = instance['testProp'];
        expect(test).toBeDefined();
    });
});
describe("The IoC Container.bind(source)", function () {
    var ContainerInjectTest = (function () {
        function ContainerInjectTest() {
        }
        __decorate([
            IoC.Inject, 
            __metadata('design:type', Date)
        ], ContainerInjectTest.prototype, "dateProperty", void 0);
        return ContainerInjectTest;
    }());
    IoC.Container.bind(ContainerInjectTest);
    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", function () {
        var instance = IoC.Container.get(ContainerInjectTest);
        expect(instance.dateProperty).toBeDefined();
    });
    it("should not inject internal fields of non AutoWired classes, if it is created by its constructor", function () {
        var instance = new ContainerInjectTest();
        expect(instance.dateProperty).toBeUndefined();
    });
});
describe("The IoC Container.get(source)", function () {
    var ContainerInjectConstructorTest = (function () {
        function ContainerInjectConstructorTest(date) {
            this.injectedDate = date;
        }
        ContainerInjectConstructorTest = __decorate([
            __param(0, IoC.Inject), 
            __metadata('design:paramtypes', [Date])
        ], ContainerInjectConstructorTest);
        return ContainerInjectConstructorTest;
    }());
    IoC.Container.bind(ContainerInjectConstructorTest);
    it("should inject internal fields of non AutoWired classes, if it is requested to the Container", function () {
        var instance = IoC.Container.get(ContainerInjectConstructorTest);
        expect(instance.injectedDate).toBeDefined();
    });
});
describe("The IoC Container", function () {
    var SingletonInstantiation = (function () {
        function SingletonInstantiation() {
        }
        SingletonInstantiation = __decorate([
            IoC.AutoWired,
            IoC.Singleton, 
            __metadata('design:paramtypes', [])
        ], SingletonInstantiation);
        return SingletonInstantiation;
    }());
    var ContainerSingletonInstantiation = (function () {
        function ContainerSingletonInstantiation() {
        }
        ContainerSingletonInstantiation = __decorate([
            IoC.AutoWired, 
            __metadata('design:paramtypes', [])
        ], ContainerSingletonInstantiation);
        return ContainerSingletonInstantiation;
    }());
    IoC.Container.bind(ContainerSingletonInstantiation)
        .to(ContainerSingletonInstantiation)
        .scope(IoC.Scope.Singleton);
    it("should not allow instantiations of Singleton classes.", function () {
        expect(function () { new SingletonInstantiation(); })
            .toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });
    it("should be able to work with Config.scope() changes.", function () {
        expect(function () { new ContainerSingletonInstantiation(); })
            .toThrow(new TypeError("Can not instantiate Singleton class. Ask Container for it, using Container.get"));
    });
    it("should allow Container instantiation of Singleton classes.", function () {
        var instance = IoC.Container.get(SingletonInstantiation);
        expect(instance).toBeDefined();
    });
    it("should allow scope change to Local from Singleton.", function () {
        var instance = IoC.Container.get(SingletonInstantiation);
        expect(instance).toBeDefined();
        IoC.Container.bind(SingletonInstantiation).scope(IoC.Scope.Local);
        var instance2 = new SingletonInstantiation();
        expect(instance2).toBeDefined();
    });
});

//# sourceMappingURL=test.spec.js.map
