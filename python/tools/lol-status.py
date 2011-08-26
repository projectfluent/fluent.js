from l20n.format.lol.parser import Parser
import l20n.format.lol.ast as ast
import sys
from collections import OrderedDict

def read_file(path):
    with file(path) as f:
        return f.read()

def get_lol(path):
    s = read_file(path)
    parser = Parser()
    lol = parser.parse(s)
    return lol

def get_entities(lol):
    entities = OrderedDict()
    for elem in lol.body:
        if isinstance(elem, ast.Entity):
            entities[elem.id.name] = elem
    return entities

def compare_values(value1, value2):
    if type(value1) != type(value2):
        return False
    if not value1:
        if not value2:
            return True
        return False
    if isinstance(value1, ast.String):
        if value1.content == value2.content:
            return True
        return False
    if isinstance(value1, ast.Array):
        if len(value1.content) != len(value2.content):
            return False
        for k,v in enumerate(value1.content):
            if not compare_values(value1.content[k],
                                  value2.content[k]):
                return False
            return True
        if value1.content == value2.content:
            return True
        return False
    if isinstance(value1, ast.Hash):
        if len(value1.content) != len(value2.content):
            return False
        for k,v in enumerate(value1.content):
            if not compare_values(v.value,
                                  value2.content[k].value):
                return False
            return True


def compare_entities(entity1, entity2):
    value1 = entity1.value
    value2 = entity2.value
    return compare_values(value1, value2)

def get_status(path):
    summary = {}
    lol = get_lol(path)
    summary['entities'] = 0
    summary['macros'] = 0
    summary['ids'] = set()
    for i in lol.body:
        if isinstance(i, ast.Entity):
            summary['entities'] += 1
            summary['ids'].add(i.id.name)
        elif isinstance(i, ast.Macro):
            summary['macros'] += 1
            summary['ids'].add(i.id.name)
    return summary

def get_status_against_source(path, path2):
    summary = {}
    lol = get_lol(path) # l10n file
    lol2 = get_lol(path2) # new source
    entities1 = get_entities(lol)
    entities2 = get_entities(lol2)
    summary['entities'] = {'missing': [],
                           'obsolete': []}
    for key in entities1.keys():
        if key not in entities2:
            summary['entities']['obsolete'].append(key)
        else:
            del entities2[key]
    for key in entities2:
        summary['entities']['missing'].append(key)
    return summary

def get_status_against_two_sources(path, path2, path3):
    summary = {}
    lol = get_lol(path) # l10n file
    lol2 = get_lol(path2) # new source
    lol3 = get_lol(path3) # old source
    entities1 = get_entities(lol)
    entities2 = get_entities(lol2)
    entities3 = get_entities(lol3)
    summary['entities'] = {'missing': [],
                           'obsolete': [],
                           'modified': []}
    for key in entities2.keys():
        if key in entities3:
            if not compare_entities(entities2[key], entities3[key]):
                summary['entities']['modified'].append(key)
    for key in entities1.keys():
        if key not in entities2:
            summary['entities']['obsolete'].append(key)
        else:
            del entities2[key]
    for key in entities2:
        summary['entities']['missing'].append(key)
    return summary

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Please provide at least the path to LOL file')
    elif len(sys.argv) < 3:
        summary = get_status(sys.argv[1])
        print(summary)
    elif len(sys.argv) < 4:
        summary = get_status_against_source(sys.argv[1], sys.argv[2])
        print(summary)
    else:
        summary = get_status_against_two_sources(sys.argv[1],
                                                 sys.argv[2],
                                                 sys.argv[3])
        print(summary)
