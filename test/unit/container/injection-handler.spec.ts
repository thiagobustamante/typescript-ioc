
import { InjectorHandler } from '../../../src/container/injection-handler';

// tslint:disable: no-unused-expression
describe('InjectorHandler', () => {
    describe('instrumentConstructor()', () => {
        it('should decorate the type constructor properly', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            expect(newConstructor.name).toEqual('ioc_wrapper');
            expect(newConstructor['__parent']).toEqual(MyBaseType);
            expect((MyBaseType as any)['__block_Instantiation']).toBeTruthy;
        });

        it('should keep creating valid instances for the baseType', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            InjectorHandler.unblockInstantiation(MyBaseType);
            expect(new newConstructor()).toBeInstanceOf(MyBaseType);
        });
    });

    describe('blockInstantiation()', () => {
        it('should configure the constructor as non instantiable', () => {
            class MyBaseType { }
            InjectorHandler.blockInstantiation(MyBaseType);
            expect((MyBaseType as any)['__block_Instantiation']).toBeTruthy;
        });

        it('should avoid that instrumented constructor create instances', () => {
            class MyBaseType { }
            const newConstructor = InjectorHandler.instrumentConstructor(MyBaseType);
            InjectorHandler.blockInstantiation(MyBaseType);
            expect(() => new newConstructor())
                .toThrow(new TypeError('Can not instantiate it. The instantiation is blocked for this class. Ask Container for it, using Container.get'));
        });
    });

    describe('unblockInstantiation()', () => {
        it('should configure the constructor as instantiable', () => {
            class MyBaseType { }
            InjectorHandler.blockInstantiation(MyBaseType);
            InjectorHandler.unblockInstantiation(MyBaseType);
            expect((MyBaseType as any)['__block_Instantiation']).toBeUndefined;
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
            const instanceFactory = (_source: Function) => {
                return propertyInstance;
            };
            InjectorHandler.injectProperty(MyBaseType, 'myProperty', Date, instanceFactory);

            const instance: any = new MyBaseType();
            expect(instance.myProperty).toEqual(propertyInstance);
            instance.myProperty = secondInstance;
            expect(instance.myProperty).toEqual(secondInstance);
        });
    });
});
