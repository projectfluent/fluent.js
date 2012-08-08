import unittest

from pyjs import ast as js
from pyjs import serializer
from l20n.format.lol import ast as l20n
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
                             l20n.HashItem(
                                 l20n.Identifier('foo'),
                                 l20n.String('foo value')),
                             l20n.HashItem(
                                 l20n.Identifier('foo2'),
                                 l20n.String('foo2 value'))
                         )))
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        s = serializer.Serializer()
        self.assertEqual(len(prog.body), 1)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)
        self.assertEqual(len(exp.right.properties), 2)
        self.assertEqual(exp.right.properties[0].value.value, 'foo value')
        self.assertEqual(exp.right.properties[1].value.value, 'foo2 value')

    def test_attributes(self):
        attrs = {'a': l20n.Attribute(
                         l20n.Identifier('a'),
                         l20n.String('foo')),
                
                 'b': l20n.Attribute(
                         l20n.Identifier('b'),
                         l20n.String('foo2')
                 )}
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=l20n.String('foo'),
                             attrs=attrs)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 2)
        exp = prog.body[0].expression
        self.assertEqual(exp.operator.token, "=")
        self.assertTrue(isinstance(exp.left.obj, js.ThisExpression))
        self.assertEqual(exp.left.prop.name, "id")
        self.assertEqual(exp.left.computed, False)

        self.assertTrue(isinstance(exp.right, js.NewExpression))
        self.assertEqual(exp.right.callee.name, "String")
        self.assertEqual(exp.right.arguments[0].value, "foo")

        exp = prog.body[1].expression
        self.assertEqual(exp.operator.token, '=')
        self.assertTrue(isinstance(exp.left.obj, js.MemberExpression))
        self.assertEqual(exp.left.obj.prop.name, 'id')
        self.assertEqual(exp.left.prop.name, "_attrs")
        self.assertEqual(exp.left.computed, False)
    
    def test_property_expression(self):
        string = l20n.ComplexString([
            l20n.String("word1 "),
            l20n.PropertyExpression(
                l20n.Identifier('foo'),
                l20n.Identifier('a'),
                False),
            l20n.String(" word2")
        ])
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=string)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        entity = prog.body[0].expression
        value = entity.right
        val_body = value.body
        val_return = val_body.body[0]
        complex_string = val_return.argument
        first_part = complex_string.left
        getent_mexp = complex_string.right.left
        third_part = complex_string.right.right
        getent_id = getent_mexp.obj
        self.assertEqual(getent_id.name, "sys")
        getent_call = getent_mexp.prop
        getent_arguments = getent_call.arguments
        self.assertEqual(getent_call.callee.name, "getent")
        self.assertEqual(getent_arguments[0].name, "env")
        self.assertEqual(getent_arguments[1].name, "sys")
        self.assertEqual(getent_arguments[2].value, "foo")
        self.assertEqual(len(getent_arguments[3].elements), 1)
        self.assertEqual(getent_arguments[3].elements[0].value, 'a')

        string = l20n.ComplexString([
            l20n.String("word1 "),
            l20n.PropertyExpression(
                l20n.PropertyExpression(
                    l20n.Identifier('foo'),
                    l20n.Identifier('a'),
                    False),
                l20n.Identifier('b'),
                False),
            l20n.String(" word2")
        ])
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=string)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        entity = prog.body[0].expression
        value = entity.right
        val_body = value.body
        val_return = val_body.body[0]
        complex_string = val_return.argument
        first_part = complex_string.left
        getent_mexp = complex_string.right.left
        third_part = complex_string.right.right
        getent_id = getent_mexp.obj
        self.assertEqual(getent_id.name, "sys")
        getent_call = getent_mexp.prop
        getent_arguments = getent_call.arguments
        self.assertEqual(getent_call.callee.name, "getent")
        self.assertEqual(getent_arguments[0].name, "env")
        self.assertEqual(getent_arguments[1].name, "sys")
        self.assertEqual(getent_arguments[2].value, "foo")
        self.assertEqual(len(getent_arguments[3].elements), 2)
        self.assertEqual(getent_arguments[3].elements[0].value, 'a')
        self.assertEqual(getent_arguments[3].elements[1].value, 'b')

        string = l20n.ComplexString([
            l20n.String("word1 "),
            l20n.PropertyExpression(
                l20n.PropertyExpression(
                    l20n.PropertyExpression(
                        l20n.Identifier('foo'),
                        l20n.String('a'),
                        True),
                    l20n.Identifier('b'),
                    False),
                l20n.String('c'),
                True),
            l20n.String(" word2")
        ])
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=string)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        entity = prog.body[0].expression
        value = entity.right
        val_body = value.body
        val_return = val_body.body[0]
        complex_string = val_return.argument
        first_part = complex_string.left
        getent_mexp = complex_string.right.left
        third_part = complex_string.right.right
        getent_id = getent_mexp.obj
        self.assertEqual(getent_id.name, "sys")
        getent_call = getent_mexp.prop     
        getent_arguments = getent_call.arguments
        self.assertEqual(getent_call.callee.name, "getent")
        self.assertEqual(getent_arguments[0].name, "env")
        self.assertEqual(getent_arguments[2].value, "foo")
        self.assertEqual(len(getent_arguments[3].elements), 3)
        self.assertEqual(getent_arguments[3].elements[0].value, 'a')
        self.assertEqual(getent_arguments[3].elements[1].value, 'b')
        self.assertEqual(getent_arguments[3].elements[2].value, 'c')

    def test_attribute_expression(self):
        string = l20n.ComplexString([
            l20n.String("word1 "),
            l20n.PropertyExpression(
                l20n.PropertyExpression(
                    l20n.AttributeExpression(
                        l20n.Identifier('foo'),
                        l20n.String('a'),
                        True),
                    l20n.Identifier('b'),
                    False),
                l20n.String('c'),
                True),
            l20n.String(" word2")
        ])
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=string)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        entity = prog.body[0].expression
        value = entity.right
        val_body = value.body
        val_return = val_body.body[0]
        complex_string = val_return.argument
        first_part = complex_string.left
        getent_mexp = complex_string.right.left
        third_part = complex_string.right.right
        getent_id = getent_mexp.obj
        self.assertEqual(getent_id.name, "sys")
        getent_call = getent_mexp.prop
        getent_arguments = getent_call.arguments
        self.assertEqual(getent_call.callee.name, "getattr")
        self.assertEqual(getent_arguments[0].name, "env")
        self.assertEqual(getent_arguments[2].value, "foo")
        self.assertEqual(getent_arguments[3].value, "a")
        self.assertEqual(len(getent_arguments[4].elements), 2)
        self.assertEqual(getent_arguments[4].elements[0].value, 'b')
        self.assertEqual(getent_arguments[4].elements[1].value, 'c')

    def test_computed_property_expression(self):
        string = l20n.ComplexString([
            l20n.String("word1 "),
            l20n.PropertyExpression(
                l20n.Identifier('foo'),
                l20n.Identifier('a'),
                True),
            l20n.String(" word2")
        ])
        entity = l20n.Entity(id=l20n.Identifier('id'),
                             value=string)
        lol = l20n.LOL((entity,))
        prog = compile(lol)
        self.assertEqual(len(prog.body), 1)
        entity = prog.body[0].expression
        value = entity.right
        val_body = value.body
        val_return = val_body.body[0]
        complex_string = val_return.argument
        first_part = complex_string.left
        getent_mexp = complex_string.right.left
        third_part = complex_string.right.right
        getent_id = getent_mexp.obj
        self.assertEqual(getent_id.name, "sys")
        getent_call = getent_mexp.prop
        getent_arguments = getent_call.arguments
        self.assertEqual(getent_call.callee.name, "getent")
        self.assertEqual(getent_arguments[0].name, "env")
        self.assertEqual(getent_arguments[2].value, "foo")
        self.assertEqual(len(getent_arguments[3].elements), 1)
        subget = getent_arguments[3].elements[0]
        self.assertEqual(subget.prop.callee.name, 'getent')
        self.assertEqual(subget.prop.arguments[0].name, 'env')
        self.assertEqual(subget.prop.arguments[2].value, 'a')


    def test_macro(self):
        m = l20n.Identifier('foo')
        args = [
             l20n.VariableExpression(l20n.Identifier('n')),
        ]
        exp = l20n.VariableExpression(l20n.Identifier('n'))
        exp = l20n.BinaryExpression(
            l20n.BinaryOperator('+'),
            l20n.VariableExpression(l20n.Identifier('n')),
            l20n.Identifier('n')
        )
        macro = l20n.Macro(id=m, args=args, expression=exp)

        lol = l20n.LOL((macro,))
        prog = compile(lol)
        s = serializer.Serializer()
        print(s.dump_program(prog))

        macro = prog.body[0].expression
        value = macro.right
        val_body = value.body
        val_return = val_body.body[0]
        return_exp = val_return.argument
        data = return_exp.left
        self.assertEqual(data.obj.name, 'data')
        self.assertEqual(data.prop.value, 0)
        getent = return_exp.right
        self.assertEqual(getent.obj.name, 'sys')
        self.assertEqual(getent.prop.callee.name, 'getent')
        self.assertEqual(getent.prop.arguments[1].name, 'sys')
        self.assertEqual(getent.prop.arguments[0].name, 'env')
        self.assertEqual(getent.prop.arguments[2].value, 'n')

if __name__ == '__main__':

    unittest.main()

