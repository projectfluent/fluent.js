import os
import codecs

import l20n.format.lol.parser as parser
import l20n.format.lol.serializer as serializer
import l20n.format.lol.ast as ast

def read_file(path):
    with codecs.open(path, 'r', encoding='utf-8') as file:
        text = file.read()
    return text

def write_file(path, s):
    f = codecs.open(path, encoding='utf_8', mode='w+')
    f.write(s)
    f.close()

def reduce_complex_string(s):
    if isinstance(s, ast.ComplexString):
        return unicode(s)
    elif isinstance(s, ast.String):
        return s.content
    elif s is None:
        return s
    raise Exception("FUCK!")

def add_entity(lol, k, value):
    id = ast.Identifier(k)
    entity = ast.Entity(id)
    entity.value = value
    lol.body.append(entity)

def remove_entity(lol, id):
    for n,elem in enumerate(lol.body):
        if isinstance(elem, ast.Entity):
            if elem.id.name == id:
                del lol.body[n]

def diff_entity(source, orig, trans):
    sval = reduce_complex_string(source)
    oval = reduce_complex_string(orig)
    trans = reduce_complex_string(trans)

    if oval is None:
        return 'added'
    if trans is None:
        return 'nottranslated'
    if sval is None:
        return 'removed'
    if not sval == oval:
        return 'outdated'
    return 'uptodate'

def get_entity_dict(lol):
    res = {}
    for entry in lol.body:
        if isinstance(entry, ast.Entity):
            if entry.value is None:
                res[entry.id.name] = None
            elif isinstance(entry.value, ast.String):
                res[entry.id.name] = entry.value
    return res

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
    s = serializer.Serializer()

    orig_lol = p.parse(orig_file)
    trans_lol = p.parse(trans_file)
    source_lol = p.parse(source_file)

    orig_dict = get_entity_dict(orig_lol)
    trans_dict = get_entity_dict(trans_lol)
    source_dict = get_entity_dict(source_lol)

    for k,entity in source_dict.items():
        res = diff_entity(source_dict[k],
                          orig_dict.get(k, None),
                          trans_dict.get(k, None))
        if res == 'added':
            add_entity(orig_lol, k, entity)
            add_entity(trans_lol, k, entity)
        elif res == 'nottranslated':
            pass

    for k,entity in orig_dict.items():
        if k not in source_dict:
            remove_entity(orig_lol, k)
            remove_entity(trans_lol, k)
    new_trans_lol = s.serialize(trans_lol)
    new_orig_lol = s.serialize(orig_lol)

    write_file(os.path.join('data', locale, '%s.lol.orig2' % module), new_orig_lol)
    write_file(os.path.join('data', locale, '%s.lol2' % module), new_trans_lol)
    #print_result('homescreen', result)

if __name__ == '__main__':
    update_locale()
