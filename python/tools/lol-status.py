from l20n.format.lol.parser import Parser
import l20n.format.lol.ast as ast
import sys

def read_file(path):
    with file(path) as f:
        return f.read()

def get_lol(path):
    s = read_file(path)
    parser = Parser()
    lol = parser.parse(s)
    return lol

def get_status(path):
    summary = {}
    lol = get_lol(path)
    summary['entities'] = 0
    summary['macros'] = 0
    summary['ids'] = []
    for i in lol.body:
        if isinstance(i, ast.Entity):
            summary['entities'] += 1
            summary['ids'].append(i.id.name)
        elif isinstance(i, ast.Macro):
            summary['macros'] += 1
            summary['ids'].append(i.id.name)
    return summary

if __name__ == '__main__':
    summary = get_status(sys.argv[1])
    print(summary)
