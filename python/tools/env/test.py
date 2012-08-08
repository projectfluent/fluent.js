import os
import codecs
from collections import OrderedDict

import l20n.format.lol.parser as parser
import l20n.format.lol.serializer as serializer
import l20n.format.lol.ast as ast

import l10ndiff

def read_file(path):
    with codecs.open(path, 'r', encoding='utf-8') as file:
        text = file.read()
    return text

def get_entity_dict(lol):
    res = OrderedDict()
    for entry in lol.body:
        if isinstance(entry, ast.Entity):
            res[entry.id.name] = entry
    return res

def compare_resources(*paths):
    pass

def update_locale():
    source_locale = 'en-US'
    locale = 'pl'
    module = 'homescreen'
    mpath = '/Users/zbraniecki/projects/mozilla/gaia/apps/homescreen'
    orig_file = read_file(os.path.join('data', locale, '%s.lol.orig' % module))
    trans_file = read_file(os.path.join('data', locale, '%s.lol' % module))
    source_file = read_file(os.path.join(mpath, 'locale', '%s.lol' % source_locale))

    result = {
        'nottranslated': {},
        'outdated': {},
        'obsolete': {},
        'added': {},
        'uptodate': {},
    }

    p = parser.Parser()

    orig_lol = p.parse(orig_file)
    trans_lol = p.parse(trans_file)
    source_lol = p.parse(source_file)


    orig_dict = get_entity_dict(orig_lol)
    trans_dict = get_entity_dict(trans_lol)
    source_dict = get_entity_dict(source_lol)

    ldiff = l10ndiff.lists(orig_dict, trans_dict, values=False)
    for key in ldiff:
        print('%s: %s' % (key, ldiff[key]))

def test():
    e1 = ast.Entity(id=ast.Identifier('foo'))
    e1.value = ast.Array([ast.String('c'), ast.String('b')])
    #e1.value = ast.String('faa2')
    val = ast.Array(content=[ast.String('f'), ast.String('g')])
    attr = ast.Attribute(key=ast.Identifier('l'),
                         value=val)
    e1.attrs['l'] = attr
    e2 = ast.Entity(id=ast.Identifier('foo'))
    e2.value = ast.Array([ast.String('c'), ast.String('b')])
    #e2.value = ast.String('faa')
    val = ast.Array(content=[ast.String('p'), ast.String('g')])
    attr = ast.Attribute(key=ast.Identifier('l'),
                         value=val)
    e2.attrs['l'] = attr
    e3 = ast.Entity(id=ast.Identifier('foo'))
    e3.value = ast.Array([ast.String('c'), ast.String('b')])
    #e3.value = ast.String('faa')
    val = ast.Array(content=[ast.String('f'), ast.String('g')])
    attr = ast.Attribute(key=ast.Identifier('l'),
                         value=val)
    e3.attrs['l'] = attr
    
    ediff = l10ndiff.entities(e1, e2, e3)
    print(ediff)

if __name__ == '__main__':
    #test()
    update_locale()
