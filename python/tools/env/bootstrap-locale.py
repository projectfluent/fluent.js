import os
import l20n.format.lol.parser as parser
import l20n.format.lol.serializer as serializer
import l20n.format.lol.ast as ast
import codecs

def read_file(path):
    with file(path) as f:
        return f.read()

def write_file(path, s):
    f = codecs.open(path, encoding='utf_8', mode='w+')
    f.write(s)
    f.close()

def get_source_locale(path):
    #from dulwich.client import TCPGitClient
    #os.makedirs(path)
    #client = TCPGitClient(server_address, server_port)
    pass

repo_paths = {
    'mozilla': {
        'gaia': {
          ''
        }
    }
}

project = "mozilla/firefox"


ser = serializer.Serializer()

def bootstrap_lol(lol):
    elems = len(lol.body)
    i=0
    while i<elems:
        if isinstance(lol.body[i], ast.Entity):
            #entity_str = ser.dump_entity(lol.body[i])
            #c = ast.Comment(entity_str)
            #c._template = '/*\n  %(content)s\n*/'
            #s = ast.String('')
            #s._template = '"%(content)s"'
            s = None
            object.__setattr__(lol.body[i], 'value', s)
            #lol.body.insert(i, c)
            #lol._template_body.insert(i, '\n')
            #i+=1
            #elems+=1
        i+=1
    return lol

def bootstrap():
    source_locale = 'en-US'
    locale = 'pl'
    try:
        os.makedirs(os.path.join('data', locale))
    except OSError:
        pass
    module = 'homescreen'
    mpath = '/Users/zbraniecki/projects/mozilla/gaia/apps/homescreen'
    f = read_file(os.path.join(mpath, 'locale', '%s.lol' % source_locale))
    p = parser.Parser()
    lol = p.parse(f)
    s = ser.serialize(lol)
    write_file(os.path.join('data', locale, '%s.lol.orig' % module), s)
    lol = bootstrap_lol(lol)
    s = ser.serialize(lol)
    write_file(os.path.join('data', locale, '%s.lol' % module), s)

if __name__ == '__main__':
    bootstrap()
