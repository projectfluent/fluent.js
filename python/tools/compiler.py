import sys
import os

from l20n.compiler.js import Compiler
from l20n.format.lol.parser import Parser

from pyjs.serializer import Serializer

def read_file(path):
    with file(path) as f:
        return f.read()

def get_lol(path):
    s = read_file(path)
    parser = Parser()
    lol = parser.parse(s)
    return lol


def compile(path, output=None):
    lol = get_lol(path)
    compiler = Compiler()
    js = compiler.compile(lol)
    string = Serializer.dump_program(js)
    if output == 'console':
        print(string)
        return
    
    if output is None:
        output = os.path.splitext(path)[0]
        output = '%s.%s' % (output, 'j20n')
    f = open(output, mode='w')
    f.write(string)
    f.close()
    return

if __name__ == '__main__':
    if len(sys.argv) > 2:
        compile(sys.argv[1], sys.argv[2])
    else:
        compile(sys.argv[1])
