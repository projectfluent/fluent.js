from l20n.format.lol.parser import Parser
from l20n.format.lol.serializer import Serializer
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

def inject(path):
    lol = get_lol(path)

    #lol = ast.LOL()
    #entity1 = ast.Entity(id=ast.Identifier('foo'), value=ast.String('flex'))
    #entity2 = ast.Entity(id=ast.Identifier('foo2'))

    #exp1 = ast.BinaryExpression(
    #    ast.BinaryOperator('+'),
    #    ast.ParenthesisExpression(ast.Literal(1)),
    #    ast.UnaryExpression(
    #        ast.UnaryOperator('!'),
    #        ast.Literal(2)
    #    )
    #)
    #macro1 = ast.Macro(id=ast.Identifier('foo3'), args=[ast.Identifier('a'),
    #                                                   ast.Identifier('b')],
    #                   expression=exp1)
    #com1 = ast.Comment("foo")
    #lol.body.append(entity1)
    #lol.body.append(com1)
    #lol.body.append(entity2)
    #lol.body.append(macro1)
    serializer = Serializer()
    string = serializer.serialize(lol)
    print(string)


if __name__ == '__main__':
    inject(sys.argv[1])
