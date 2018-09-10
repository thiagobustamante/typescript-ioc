import { Inject } from '../../src/typescript-ioc';
import IFoo from './ifoo';

export class Worker {
    @Inject public foo: IFoo;

    public work() {
        this.foo.bar();
    }
}
