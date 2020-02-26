
import { IoCContainer } from '../../src/container/container';
import { Container, Scope, Config, ObjectFactory } from '../../src/typescript-ioc';
import { BuildContext } from '../../src/model';

jest.mock('../../src/container/container');
const mockBind = IoCContainer.bind as jest.Mock;
const mockGet = IoCContainer.get as jest.Mock;
const mockGetType = IoCContainer.getType as jest.Mock;
const mockSnapshot = IoCContainer.snapshot as jest.Mock;

const mockTo = jest.fn();
const mockFactory = jest.fn();
const mockScope = jest.fn();
const mockWithParams = jest.fn();
let bindResult: Config;

describe('Container', () => {

    beforeAll(() => {
        bindResult = {
            to: mockTo,
            factory: mockFactory,
            scope: mockScope,
            withParams: mockWithParams
        };
        mockBind.mockReturnValue(bindResult);
    });

    beforeEach(() => {
        mockGet.mockClear();
        mockGetType.mockClear();
        mockSnapshot.mockClear();
        mockTo.mockClear();
        mockFactory.mockClear();
        mockScope.mockClear();
        mockWithParams.mockClear();
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
        const object = Container.snapshot(MyBaseType);

        expect(mockSnapshot).toBeCalledWith(MyBaseType);
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
    });
});
