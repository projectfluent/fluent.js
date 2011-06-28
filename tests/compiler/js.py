import unittest
import sys
sys.path.append('./')

from pyjs import ast as js
from l20n import ast as l20n
from l20n.compiler.js import Compiler, CompilerError

compile = Compiler.compile

class L20nJsCompilerTestCase(unittest.TestCase):

    def test_empty_lol(self):
        lol = l20n.LOL()
        prog = compile(lol)
        self.assertEqual(len(prog.body), 0)

    def test_empty_entity(self):
        lol = l20n.LOL(
            (l20n.Entity(l20n.Identifier('id')), )
        )
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)
        self.assertEqual(exp.right.value, None)


    def test_string_value(self):
        lol = l20n.LOL(
            (l20n.Entity(id=l20n.Identifier('id'),
                         value=l20n.String('foo')),)
        )
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)
        self.assertEqual(exp.right.value, "foo")

    def test_array_value(self):
        lol = l20n.LOL(
            (l20n.Entity(id=l20n.Identifier('id'),
                         value=l20n.Array((
                             l20n.String('foo'),
                             l20n.String('foo2'),))),)
        )
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)
        self.assertEqual(len(exp.right.elements), 2)
        self.assertEqual(exp.right.elements[0].value, 'foo')
        self.assertEqual(exp.right.elements[1].value, 'foo2')

    def test_hash_value(self):
        entity = l20n.Entity(id=l20n.Identifier('id'),
                         value=l20n.Hash((
                             l20n.KeyValuePair(
                                 l20n.Identifier('foo'),
                                 l20n.String('foo value')),
                             l20n.KeyValuePair(
                                 l20n.Identifier('foo2'),
                                 l20n.String('foo2 value'))
                         )))
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)
        self.assertEqual(len(exp.right.properties), 2)
        self.assertEqual(exp.right.properties[0].value.value, 'foo value')
        self.assertEqual(exp.right.properties[1].value.value, 'foo2 value')


if __name__ == '__main__':
    unittest.main()

