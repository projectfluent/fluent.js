#!/usr/bin/python 
import argparse

from l20n.format.lol.parser import Parser
import pyast

def read_file(filename, charset='utf-8', errors='strict'):
    with open(filename, 'rb') as f:
        return f.read().decode(charset, errors)

def dump_lol(path):
    source = read_file(path)
    p = Parser()
    lol = p.parse(source)
    print(pyast.dump(lol))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Dump LOL\'s AST.',
        prog="dump_lol")
    parser.add_argument('path', type=str,
                        help='path to lol file')
    args = parser.parse_args()
    dump_lol(args.path)
