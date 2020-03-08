import { BuildContext } from '../model';

export type InstanceFactory = (source: Function, context: BuildContext) => any;
export type ValueFactory = (source: string) => any;
