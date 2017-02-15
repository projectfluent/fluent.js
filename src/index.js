import './intl/polyfill';
import * as ast from './syntax/ast';
import * as parser from './syntax/parser';
import _parse from './intl/parser';

export const syntax = {
  ast, parser
};

export const debug = {
  _parse
};

export { MessageContext } from './intl/context';
export {
  FTLNumber as MessageNumberArgument,
  FTLDateTime as MessageDateTimeArgument,
} from './intl/types';
