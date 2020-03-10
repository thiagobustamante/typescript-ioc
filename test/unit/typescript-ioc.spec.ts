
import { IoCContainer } from '../../src/container/container';
import { Container, Scope, Config, ObjectFactory } from '../../src/typescript-ioc';
import { BuildContext, ValueConfig } from '../../src/model';

jest.mock('../../src/container/container');
const mockBind = IoCContainer.bind as jest.Mock;
const mockBindName = IoCContainer.bindName as jest.Mock;
const mockGet = IoCContainer.get as jest.Mock;
const mockGetType = IoCContainer.getType as jest.Mock;
const mockSnapshot = IoCContainer.snapshot as jest.Mock;
const mockNamespace = IoCContainer.namespace as jest.Mock;

const mockTo = jest.fn();
const mockFactory = jest.fn();
const mockScope = jest.fn();
const mockWithParams = jest.fn();
let bindResult: Config;
let bindNameResult: ValueConfig;

describe('Container', () => {

    beforeAll(() => {
        bindResult = {
            to: mockTo,
            factory: mockFactory,
            scope: mockScope,
            withParams: mockWithParams
        };
        bindNameResult = {
            to: mockTo
        };

    });

    beforeEach(() => {
        mockGet.mockClear();
        mockGetType.mockClear();
        mockSnapshot.mockClear();
        mockNamespace.mockClear();
        mockTo.mockClear();
        mockFactory.mockClear();
        mockScope.mockClear();
        mockWithParams.mockClear();
        mockBind.mockClear();
        mockBindName.mockClear();
        mockBind.mockReturnValue(bindResult);
        mockBindName.mockReturnValue(bindNameResult);
    });

    class MyBaseType { }
    class MyType extends MyBaseType { }
    const MyFactory: ObjectFactory = () => new MyType();

    it('should get an instance for a type bound to the container', () => {
        const bind = Container.bind(MyBaseType);

        expect(mockBind).toBeCalledWith(MyBaseType);
        expect(bind).toStrictEqual(bindResult);
    });

    it('should get an instance for a type bound to the container', () => {
        const value = { value: 'value' };
        mockGet.mockReturnValue(value);
        const object = Container.get(MyBaseType);

        expect(mockGet).toBeCalledWith(MyBaseType, expect.any(BuildContext));
        expect(object).toStrictEqual(value);
    });

    it('should get a type bound with a source type from the container', () => {
        const value = { value: 'value' };
        mockGetType.mockReturnValue(value);
        const object = Container.getType(MyBaseType);

        expect(mockGetType).toBeCalledWith(MyBaseType);
        expect(object).toStrictEqual(value);
    });

    it('should create a config snapshot for the container', () => {
        const value = { value: 'value' };
        mockSnapshot.mockReturnValue(value);
        const object = Container.snapshot();

        expect(mockSnapshot).toBeCalledTimes(1);
        expect(object).toStrictEqual(value);
    });

    it('should create a namespace in the container', () => {
        const value = { value: 'value' };
        mockNamespace.mockReturnValue(value);
        const object = Container.namespace('name');

        expect(mockNamespace).toBeCalledTimes(1);
        expect(mockNamespace).toBeCalledWith('name');
        expect(object).toStrictEqual(value);
    });

    it('should create a namespace in the container using environment alias', () => {
        const value = { value: 'value' };
        mockNamespace.mockReturnValue(value);
        const object = Container.environment('name');

        expect(mockNamespace).toBeCalledTimes(1);
        expect(mockNamespace).toBeCalledWith('name');
        expect(object).toStrictEqual(value);
    });

    describe('configure()', () => {

        it('should configure the IoC Container', () => {
            Container.configure({ bind: MyBaseType, to: MyType });

            expect(mockTo).toBeCalledWith(MyType);
            expect(mockFactory).not.toBeCalled();
            expect(mockScope).not.toBeCalled();
            expect(mockWithParams).not.toBeCalled();
        });

        it('should configure the IoC Container using a provider', () => {
            Container.configure({ bind: MyBaseType, factory: MyFactory });

            expect(mockTo).not.toBeCalled();
            expect(mockFactory).toBeCalledWith(MyFactory);
        });

        it('should configure the IoC Container to use a custom scope', () => {
            Container.configure({ bind: MyBaseType, scope: Scope.Singleton });

            expect(mockTo).not.toBeCalled();
            expect(mockFactory).not.toBeCalled();
            expect(mockScope).toBeCalledWith(Scope.Singleton);
        });

        it('should configure the IoC Container to build instances with params', () => {
            Container.configure({ bind: MyBaseType, withParams: ['param'] });

            expect(mockWithParams).toBeCalledWith(['param']);
        });

        it('should configure constants in the IoC Container', () => {
            Container.configure({ bindName: 'myProp', to: 'a value' });

            expect(mockBindName).toBeCalledWith('myProp');
            expect(mockTo).toBeCalledWith('a value');
        });
    });
});
