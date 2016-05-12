import { fetchResource } from './io';
import { SimpleContext } from '../../lib/context';

export function createSimpleContext(langs, resIds) {
  return SimpleContext.create(fetchResource, langs, resIds);
}
