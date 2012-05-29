import os
import codecs
import sys

import l20n.format.lol.parser as parser
import l20n.format.lol.ast as ast
import l10ndiff

if sys.version >= '3':
    basestring = str
    string = str
else:
    string = unicode

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
        return string(s)
    elif isinstance(s, ast.String):
        return s.content
    elif s is None:
        return s
    raise Exception("FUCK!")

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

def do_stats(result):
    res = {
        'all': 0.0,
        'translated': 0.0,
        'outdated': 0.0,
        'obsolete': 0.0,
        'added': 0.0,
        'untranslated': 0.0
    }
    for t in result.keys():
        if t == 'nottranslated':
            res['untranslated'] += len(result[t])
        elif t == 'outdated':
            res['outdated'] += len(result[t])
        elif t == 'uptodate':
            res['translated'] += len(result[t])
        elif t == 'added':
            res['added'] += len(result[t])
        elif t == 'obsolete':
            res['obsolete'] += len(result[t])
        res['all'] += len(result[t])
    return res

def print_result(rname,
                 result):
    print('  %s' % rname)
    for k in result.keys():
        if not len(result[k]):
            continue
        print('    %s:' % k)
        for i in result[k].keys():
            print('      %s' % i)
    stats = do_stats(result)
    print('\n===== stats =====')
    print('entities: %d' % stats['all'])
    print('translated: %d (%.1f%%), \
 outdated: %d (%.1f%%), \
 obsolete: %d (%.1f%%), \
 missing: %d (%.1f%%), \
 untranslated: %d (%.1f%%)' % (stats['translated'],
                      stats['translated']/stats['all']*100,
                                stats['outdated'],
                               stats['outdated']/stats['all']*100,
                                stats['obsolete'],
                               stats['obsolete']/stats['all']*100,
                                stats['added'],
                               stats['added']/stats['all']*100,
                                stats['untranslated'],
                              stats['untranslated']/stats['all']*100))


def locale_status():
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

    l10ndiff.list(orig_lol, trans_lol)

    orig_dict = get_entity_dict(orig_lol)
    trans_dict = get_entity_dict(trans_lol)
    source_dict = get_entity_dict(source_lol)
   
    for k,entity in source_dict.items():
        res = diff_entity(source_dict[k],
                          orig_dict.get(k, None),
                          trans_dict.get(k, None))
        result[res][k] = entity
    
    for k,entity in orig_dict.items():
        if k not in source_dict:
            result['obsolete'][k] = entity
    print_result('homescreen', result)


if __name__ == '__main__':
    locale_status()

