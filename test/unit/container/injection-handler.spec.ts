
import { InjectorHandler } from '../../../src/container/injection-handler';
import { BuildContext, ObjectFactory } from '../../../src/model';

describe('InjectorHandler', () => {
    describe('instrumentConstructor()', () => {
        it('should decorate the type constructor properly', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            expect(newConstructor.name).toEqual('ioc_wrapper');
            expect(newConstructor['__parent']).toEqual(MyBaseType);
        });

        it('should keep creating valid instances for the baseType', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            InjectorHandler.unblockInstantiation();
            expect(new newConstructor()).toBeInstanceOf(MyBaseType);
            InjectorHandler.blockInstantiation(true);
        });
    });

    describe('blockInstantiation()', () => {
        it('should avoid that instrumented constructor create instances', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            InjectorHandler.blockInstantiation(true);
            expect(() => new newConstructor())
                .toThrow(new TypeError('Can not instantiate it. The instantiation is blocked for this class. Ask Container for it, using Container.get'));
        });
    });

    describe('unblockInstantiation()', () => {
        it('should unblock instantiation and return true if blocked before', () => {
            InjectorHandler.blockInstantiation(true);
            expect(InjectorHandler.unblockInstantiation()).toBeTruthy();
        });

        it('should unblock instantiation and return false if not blocked before', () => {
            InjectorHandler.unblockInstantiation();
            expect(InjectorHandler.unblockInstantiation()).toBeFalsy();
        });
    });

    describe('injectContext()', () => {
        it('should inject the context as a hidden property into the target', () => {
            class MyBaseType { }
            const context = new TestBuildContext();
            InjectorHandler.injectContext(MyBaseType, context);
            expect((MyBaseType as any)['__BuildContext']).toEqual(context);
        });
    });

    describe('removeContext()', () => {
        it('should remove an injected the context from the target', () => {
            class MyBaseType { }
            const context = new TestBuildContext();
            InjectorHandler.injectContext(MyBaseType, context);
            InjectorHandler.removeContext(MyBaseType);
            expect((MyBaseType as any)['__BuildContext']).toBeFalsy();
        });

    });

    describe('getConstructorFromType()', () => {
        it('should extract the original constructor from a type', () => {
            class MyBaseType { }
            const constructor = InjectorHandler.getConstructorFromType(MyBaseType);
            expect(constructor).toEqual(MyBaseType);
        });

        it('should extract the original constructor from an instrumented type', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            const constructor = InjectorHandler.getConstructorFromType(newConstructor);
            expect(constructor).toEqual(MyBaseType);
        });

        it('should extract the original constructor from an unamed type', () => {
            const myType = () => {
                return this;
            };
            const constructor = InjectorHandler.getConstructorFromType(myType);
            expect(constructor).toEqual(myType);
        });

        it('should throw an error with an invalid constructor is informed', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            delete newConstructor['__parent'];
            expect(() => InjectorHandler.getConstructorFromType(newConstructor))
                .toThrow('Can not identify the base Type for requested target ' + newConstructor.toString());
        });
    });

    describe('checkType', () => {
        it('should thow an error if invalid type is provided', () => {
            expect(() => InjectorHandler.checkType(undefined))
                .toThrow(new TypeError('Invalid type requested to IoC container. Type is not defined.'));
        });

        it('should not thow an error if valid type is provided', () => {
            class MyBaseType { }
            expect(() => InjectorHandler.checkType(MyBaseType))
                .not.toThrow(new TypeError('Invalid type requested to IoC container. Type is not defined.'));
        });
    });

    describe('injectProperty', () => {
        it('should create a property to read the injected value from the IoC Container', () => {
            class MyBaseType { }
            const propertyInstance = new Date('2019-05-14T11:01:50.135Z');
            const secondInstance = new Date('2019-05-14T11:01:55.135Z');
            const instanceFactory = jest.fn().mockImplementation(() => {
                return propertyInstance;
            });
            const context = new TestBuildContext();
            InjectorHandler.injectProperty(MyBaseType, 'myProperty', Date, instanceFactory);

            const instance: any = new MyBaseType();
            InjectorHandler.injectContext(instance, context);
            expect(instance.myProperty).toEqual(propertyInstance);
            instance.myProperty = secondInstance;
            expect(instance.myProperty).toEqual(secondInstance);
            expect(instanceFactory).toBeCalledWith(Date, context);
        });

        it('should be able to handle BuildContext in the constructor', () => {
            class MyBaseType { }
            const propertyInstance = new Date('2019-05-14T11:01:50.135Z');
            const secondInstance = new Date('2019-05-14T11:01:55.135Z');
            const instanceFactory = jest.fn().mockImplementation(() => {
                return propertyInstance;
            });
            const context = new TestBuildContext();
            InjectorHandler.injectContext(MyBaseType, context);
            InjectorHandler.injectProperty(MyBaseType, 'myProperty', Date, instanceFactory);

            const instance: any = new MyBaseType();
            expect(instance.myProperty).toEqual(propertyInstance);
            instance.myProperty = secondInstance;
            expect(instance.myProperty).toEqual(secondInstance);
            expect(instanceFactory).toBeCalledWith(Date, context);
        });

    });
});

class TestBuildContext extends BuildContext {
    public build<T>(_source: Function & { prototype: T; }, _factory: ObjectFactory): T {
        return null;
    }
    public resolve<T>(_source: Function & { prototype: T }): T {
        return null;
    }
}