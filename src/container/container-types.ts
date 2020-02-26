import { BuildContext } from '../model';

export type InstanceFactory = (source: Function, context: BuildContext) => any;

