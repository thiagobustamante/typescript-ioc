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
describe("Simple Field injection of a no autowired type", function () {
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
    it("should inject a simple date field", function () {
        var instance = new SimppleInject();
        expect(instance.dateProperty).toBeDefined();
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
describe("Simple Constructor parameter injection", function () {
    var constructorsArgs = new Array();
    var TesteConstructor = (function () {
        function TesteConstructor(date) {
            constructorsArgs.push(date);
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
    it("should inject a date as argument on cosntrutor call, when parameter is not provided", function () {
        var instance = new TesteConstructor2();
        expect(constructorsArgs.length).toEqual(1);
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

//# sourceMappingURL=test.spec.js.map
