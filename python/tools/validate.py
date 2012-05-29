from l20n.format.lol.parser import Parser, ParserError
import l20n.format.lol.ast as ast
import pyast
import sys

def read_file(path):
    with file(path) as f:
        return f.read()

def get_lol(path):
    s = read_file(path)
    parser = Parser()
    lol = parser.parse(s)
    print(pyast.dump(lol))
    return lol

def validate(path):
    errors = []
    warnings = []
    lol = get_lol(path)
    return [[],[]]
    try:
        lol = get_lol(path)
    except ParserError, e:
        errors.append('Cannot parse LOL file')
    else:
        return [[],[]]
        ids = []
        for i in lol.body:
            if isinstance(i, (ast.Entity, ast.Macro)):
                if i.id.name in ids:
                    errors.append('Duplicated ID %s' % i.id.name)
                else:
                    ids.append(i.id.name)
    return (errors, warnings)

if __name__ == '__main__':
    (errors, warnings) = validate(sys.argv[1])
    if errors:
        print('Errors:\n')
        for error in errors:
            print(' * %s' % error)
    if warnings:
        print('Warnings:\n')
        for warning in warnings:
            print(' * %s' % warning)

