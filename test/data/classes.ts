import { Inject } from '../../src/typescript-ioc';
import IFoo from './ifoo';

export class Worker {
    @Inject foo: IFoo;

    work() {
        this.foo.bar();
    }
}
