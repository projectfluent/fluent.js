import { fetchResource } from '../web/io';
import { Service, channel, broadcast } from './bridge';
import { Remote } from '../../bindings/html/remote';

const remote = new Remote(fetchResource, broadcast);

remote.service = new Service('l20n')
  .method('registerView', (...args) => remote.registerView(...args))
  .method('requestLanguages', (...args) => remote.requestLanguages(...args))
  .method('changeLanguages', (...args) => remote.changeLanguages(...args))
  .method('formatEntities', (...args) => remote.formatEntities(...args))
  .method('formatValues', (...args) => remote.formatValues(...args))
  .method('getName', (...args) => remote.getName(...args))
  .method('processString', (...args) => remote.processString(...args))
  .on('disconnect', clientId => remote.unregisterView(clientId))
  .listen(channel);
