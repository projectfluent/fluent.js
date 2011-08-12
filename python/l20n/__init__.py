debug = True

xul = {}
cache = {}

def _get_file(uri):
    with open('%s.p20n' % uri, 'rb') as file:
        return file.read()

def createContext(id):
    xul[id] = {'l20n': {}, 'data': {}}
    return Context(xul[id], cache)

class LOL(object):
    def __init__(self):
        self._map = {}

class Context(object):
    def __init__(self, obj, cache):
        self.obj = obj
        self.curObj = self.obj['l20n']
        self.cache = cache

    def _getEntity(self, id, params):
        localObj = None;
        if params:
            localObj = {}
            for i in params:
                localObj[i] = params[i]
            localObj.__proto__ = self.curObj
        else:
            localObj = self.curObj
        return [localObj[id], localObj]

    def get(self, id, params=None):
        entity, localObj = self._getEntity(id, params)
        return localObj['getent'](localObj, id)

    def addReference(self, uri):
        if uri not in cache:
            data = _get_file(uri)
            self.cache[uri] = {}
            exec(data, {}, {'self': self.cache[uri]})

        for i in self.cache[uri]:
            self.obj['l20n'][i] = self.cache[uri][i]
        return True



def LOG(arg):
  if (debug):
    print(arg)
  else:
    raise arg

