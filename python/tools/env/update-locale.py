import os
import codecs
from collections import OrderedDict

import l20n.format.lol.parser as parser
import l20n.format.lol.serializer as serializer
import l20n.format.lol.ast as ast
import pyast
import l10ndiff

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

def update_entity(lol, id, entity):
    pass

def get_entity_dict(lol):
    res = OrderedDict()
    for entry in lol.body:
        if isinstance(entry, ast.Entity):
            res[entry.id.name] = entry
    return res

def get_entity_pos(lol, eid):
    pos = -1
    i = -1
    for entry in lol.body:
        i += 1
        if isinstance(entry, ast.Entity):
            if entry.id.name == eid:
                pos = i
                break
    return pos

def locate_pos(lol, pos):
    after = get_entity_pos(lol, pos['after'])
    if after == -1:
        before = get_entity_pos(lol, pos['before'])
        return before
    return after+1

def apply_ediff(lol, ediff):
    pass

def apply_ldiff(lol, ldiff, source=0, result=1):
    for key, hunk in ldiff.items():
        #print(key)
        #print(hunk)
        if 'added' in hunk['flags']:
            if hunk['elem'][source] is None:
                #inject new entity
                pos = locate_pos(lol, hunk['pos'])
                lol.body.insert(pos, hunk['elem'][result])
                #print(pos)
                pass
            if hunk['elem'][result] is None:
                #removing obsolete entity
                pos = get_entity_pos(lol, key)
                del lol.body[pos]
                del lol._template_body[pos]
        if 'present' in hunk['flags']:
            print(hunk)
            if 'value' in hunk['elem']:
                pos = get_entity_pos(lol, key)
                if lol.body[pos].value is None:
                    pass
                else:
                    lol.body[pos].value.content = hunk['elem']['value']['content'][result]
                    print(lol.body[pos].value.content)
    return

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


    # deal with added/removed entities
    ldiff = l10ndiff.lists(trans_dict, source_dict, values=False)
    apply_ldiff(trans_lol, ldiff)
    # deal with modified entities 
    ldiff = l10ndiff.lists(orig_dict, source_dict, values=True)
    ldiff2 = {}
    for key in ldiff:
        if 'present' in ldiff[key]['flags']:
            ldiff2[key] = ldiff[key]
            #print('%s: %s' % (key, ldiff2[key]))
    print('---')
    print(trans_lol)
    print('---')
    apply_ldiff(trans_lol, ldiff2)
    print('====')
    print(trans_lol)
    print('====')

    #new_trans_lol = s.serialize(trans_lol)
    #new_orig_lol = s.serialize(orig_lol)

    #write_file(os.path.join('data', locale, '%s.lol.orig2' % module), new_orig_lol)
    #write_file(os.path.join('data', locale, '%s.lol2' % module), new_trans_lol)
    #print_result('homescreen', result)

class Example(pyast.Node):
    seq = pyast.seq(pyast.re("[a-z]{2}"))

if __name__ == '__main__':
    e = Example(['foo'])
    #update_locale()
