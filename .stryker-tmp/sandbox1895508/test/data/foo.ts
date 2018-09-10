import { Provides } from '../../src/typescript-ioc';
import IFoo from './ifoo';

@Provides(IFoo)
export default class Foo implements IFoo {
    public bar(): void {
        // tslint:disable-next-line:no-console
        console.log('Foo bar');
    }
}
