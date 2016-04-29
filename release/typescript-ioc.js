"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function Singleton(target) {
    Container.bind(target).scope(Scope.Singleton);
}
exports.Singleton = Singleton;
function Scoped(scope) {
    return function (target) {
        Container.bind(target).scope(scope);
    };
}
exports.Scoped = Scoped;
function Provided(provider) {
    return function (target) {
        Container.bind(target).provider(provider);
    };
}
exports.Provided = Provided;
function Provides(target) {
    return function (to) {
        Container.bind(target).to(to);
    };
}
exports.Provides = Provides;
function AutoWired(target) {
    var existingInjectedParameters = Reflect.getOwnMetadata("params_inject", target) || [];
    var newConstructor;
    if (existingInjectedParameters.length > 0) {
        var paramTypes_1 = Reflect.getMetadata("design:paramtypes", target);
        newConstructor = InjectorHanlder.decorateConstructor(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var newArgs = args ? args.concat() : new Array();
            for (var _a = 0, existingInjectedParameters_1 = existingInjectedParameters; _a < existingInjectedParameters_1.length; _a++) {
                var index = existingInjectedParameters_1[_a];
                if (index >= newArgs.length) {
                    newArgs.push(Container.get(paramTypes_1[index]));
                }
            }
            target.apply(this, newArgs);
            Container.applyInjections(this, target);
        }, target);
    }
    else {
        newConstructor = InjectorHanlder.decorateConstructor(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            target.apply(this, args);
            Container.applyInjections(this, target);
        }, target);
    }
    var config = Container.bind(target);
    config.toConstructor(newConstructor);
    return newConstructor;
}
exports.AutoWired = AutoWired;
function Inject() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (args.length == 2) {
        return InjectPropertyDecorator.apply(this, args);
    }
    else if (args.length == 3 && typeof args[2] === "number") {
        return InjectParamDecorator.apply(this, args);
    }
    throw new Error("Invalid @Inject Decorator declaration.");
}
exports.Inject = Inject;
function InjectPropertyDecorator(target, key) {
    var t = Reflect.getMetadata("design:type", target, key);
    Container.addPropertyInjector(target.constructor, key, t);
}
function InjectParamDecorator(target, propertyKey, parameterIndex) {
    if (!propertyKey) {
        var existingInjectedParameters = Reflect.getOwnMetadata("params_inject", target, propertyKey) || [];
        existingInjectedParameters.push(parameterIndex);
        Reflect.defineMetadata("params_inject", existingInjectedParameters, target, propertyKey);
    }
}
var Map = (function () {
    function Map() {
    }
    Map.prototype.put = function (key, value) {
        this[key] = value;
    };
    Map.prototype.get = function (key) {
        return this[key];
    };
    return Map;
}());
var Container = (function () {
    function Container() {
    }
    Container.bind = function (source) {
        checkType(source);
        var baseSource = InjectorHanlder.getConstructorFromType(source);
        var config = Container.bindings.get(baseSource);
        if (!config) {
            config = new ConfigImpl(baseSource);
            Container.bindings.put(baseSource, config);
        }
        return config;
    };
    Container.get = function (source) {
        var config = Container.bind(source);
        if (!config.iocprovider) {
            config.to(config.source);
        }
        return config.getInstance();
    };
    Container.applyInjections = function (toInject, targetType) {
        if (targetType) {
            var injections = InjectorHanlder.getInjectorFromType(targetType, false);
            injections.forEach(function (entry) {
                entry(toInject);
            });
        }
        else {
            var injections = InjectorHanlder.getInjectorFromInstance(toInject);
            injections.forEach(function (entry) {
                entry(toInject);
            });
        }
    };
    Container.addPropertyInjector = function (target, key, propertyType) {
        var injections = InjectorHanlder.getInjectorFromType(target, false);
        injections.push(function (toInject) {
            Container.injectProperty(toInject, key, propertyType);
        });
    };
    Container.injectProperty = function (toInject, key, source) {
        toInject[key] = Container.get(source);
    };
    Container.bindings = new Map();
    return Container;
}());
exports.Container = Container;
function checkType(source) {
    if (!source) {
        throw new TypeError('Invalid type requested to IoC ' +
            'container. Type is not defined.');
    }
}
var ConfigImpl = (function () {
    function ConfigImpl(source) {
        this.source = source;
    }
    ConfigImpl.prototype.to = function (target) {
        checkType(target);
        if (this.source === target) {
            var _this_1 = this;
            this.iocprovider = {
                get: function () {
                    if (_this_1.decoratedConstructor) {
                        return new _this_1.decoratedConstructor();
                    }
                    return new target();
                }
            };
        }
        else {
            this.iocprovider = {
                get: function () {
                    return Container.get(target);
                }
            };
        }
        return this;
    };
    ConfigImpl.prototype.toTypeNamed = function (target) {
        this.iocprovider = {
            get: function () {
                checkType(window[target]);
                var c = Object.create(window[target].prototype);
                var targetType = c.constructor;
                checkType(targetType);
                return new targetType();
            }
        };
        return this;
    };
    ConfigImpl.prototype.provider = function (provider) {
        this.iocprovider = provider;
        return this;
    };
    ConfigImpl.prototype.scope = function (scope) {
        this.iocscope = scope;
        return this;
    };
    ConfigImpl.prototype.toConstructor = function (newConstructor) {
        this.decoratedConstructor = newConstructor;
        return this;
    };
    ConfigImpl.prototype.getInstance = function () {
        if (!this.iocscope) {
            this.scope(Scope.Local);
        }
        return this.iocscope.resolve(this.iocprovider, this.source);
    };
    return ConfigImpl;
}());
var Scope = (function () {
    function Scope() {
    }
    return Scope;
}());
exports.Scope = Scope;
var LocalScope = (function (_super) {
    __extends(LocalScope, _super);
    function LocalScope() {
        _super.apply(this, arguments);
    }
    LocalScope.prototype.resolve = function (provider, source) {
        return provider.get();
    };
    return LocalScope;
}(Scope));
exports.LocalScope = LocalScope;
Scope.Local = new LocalScope();
var SingletonScope = (function (_super) {
    __extends(SingletonScope, _super);
    function SingletonScope() {
        _super.apply(this, arguments);
    }
    SingletonScope.prototype.resolve = function (provider, source) {
        var instance = SingletonScope.instances.get(source);
        if (!instance) {
            instance = provider.get();
            SingletonScope.instances.put(source, instance);
        }
        return instance;
    };
    SingletonScope.instances = new Map();
    return SingletonScope;
}(Scope));
exports.SingletonScope = SingletonScope;
Scope.Singleton = new SingletonScope();
var InjectorHanlder = (function () {
    function InjectorHanlder() {
    }
    InjectorHanlder.decorateConstructor = function (derived, base) {
        for (var p in base) {
            if (base.hasOwnProperty(p) && !derived.hasOwnProperty(p)) {
                derived[p] = base[p];
            }
        }
        derived['__parent'] = base;
        function __() { this.constructor = derived; }
        derived.prototype = base === null ? Object.create(base) :
            (__.prototype = base.prototype, new __());
        return derived;
    };
    InjectorHanlder.getConstructorFromType = function (target) {
        var typeConstructor = target;
        if (typeConstructor['name']) {
            return typeConstructor;
        }
        while (typeConstructor = typeConstructor['__parent']) {
            if (typeConstructor['name']) {
                return typeConstructor;
            }
        }
        throw TypeError('Can not identify the base Type for requested target');
    };
    InjectorHanlder.getConstructorFromInstance = function (target) {
        return InjectorHanlder.getConstructorFromType(target.constructor);
    };
    InjectorHanlder.getInjectorFromType = function (target, recursive) {
        var baseConstructor = InjectorHanlder.getConstructorFromType(target);
        if (!InjectorHanlder.typeInjections[baseConstructor]) {
            InjectorHanlder.typeInjections[baseConstructor] = new Array();
        }
        var result = InjectorHanlder.typeInjections[baseConstructor];
        if (recursive) {
            var parent_1 = baseConstructor['__parent'];
            if (parent_1) {
                result = InjectorHanlder.getInjectorFromType(parent_1, true).concat(result);
            }
        }
        return result;
    };
    InjectorHanlder.getInjectorFromInstance = function (target) {
        var baseConstructor = InjectorHanlder.getConstructorFromInstance(target);
        return InjectorHanlder.getInjectorFromType(baseConstructor, true);
    };
    InjectorHanlder.typeInjections = new Map();
    return InjectorHanlder;
}());

//# sourceMappingURL=typescript-ioc.js.map
