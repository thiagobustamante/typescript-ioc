import { ContainerConfig } from '../../src/container-config';
import { Container, Provider, Scope } from '../../src/typescript-ioc';
const requireGlob = require('require-glob');

jest.mock('../../src/typescript-ioc');
jest.mock('require-glob');
const mockRequireSync = requireGlob.sync as jest.Mock;

const mockBind = Container.bind as jest.Mock;
const mockTo = jest.fn();
const mockProvider = jest.fn();
const mockScope = jest.fn();
const mockWithParams = jest.fn();
// tslint:disable: no-unused-expression
describe('ContainerConfig', () => {

    beforeAll(() => {
        mockBind.mockReturnValue({
            to: mockTo,
            provider: mockProvider,
            scope: mockScope,
            withParams: mockWithParams
        });
    });

    beforeEach(() => {
        mockRequireSync.mockClear();
        mockTo.mockClear();
        mockProvider.mockClear();
        mockScope.mockClear();
        mockWithParams.mockClear();
    });

    describe('addSource()', () => {
        it('should find classes in different files', () => {
            ContainerConfig.addSource('data/*', 'test');
            expect(mockRequireSync).toBeCalledWith('data/*', { cwd: 'test' });
        });

        it('should use process.cwd as default baseDir', () => {
            ContainerConfig.addSource(['data/*']);
            expect(mockRequireSync).toBeCalledWith(['data/*'], { cwd: process.cwd() });
        });

    });

    describe('configure()', () => {

        class MyBaseType { }
        class MyType extends MyBaseType { }
        const MyProvider: Provider = {
            get: () => { return new MyType(); }
        };

        it('should configure the IoC Container', () => {
            ContainerConfig.configure({ bind: MyBaseType, to: MyType });

            expect(mockTo).toBeCalledWith(MyType);
            expect(mockProvider).not.toBeCalled;
            expect(mockScope).not.toBeCalled;
            expect(mockWithParams).not.toBeCalled;
        });

        it('should configure the IoC Container using a provider', () => {
            ContainerConfig.configure({ bind: MyBaseType, provider: MyProvider });

            expect(mockTo).not.toBeCalled;
            expect(mockProvider).toBeCalledWith(MyProvider);
        });

        it('should configure the IoC Container to use a custom scope', () => {
            ContainerConfig.configure({ bind: MyBaseType, scope: Scope.Singleton });

            expect(mockTo).not.toBeCalled;
            expect(mockProvider).not.toBeCalled;
            expect(mockScope).toBeCalledWith(Scope.Singleton);
        });

        it('should configure the IoC Container to build instances with params', () => {
            ContainerConfig.configure({ bind: MyBaseType, withParams: ['param'] });

            expect(mockWithParams).toBeCalledWith(['param']);
        });
    });
});
