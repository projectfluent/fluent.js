import unittest
import sys
sys.path.append('./')

from l20n.parser import Parser, ParserError

class L20nParserTestCase(unittest.TestCase):

    def setUp(self):
        self.parser = Parser()

    def test_empty_entity(self):
        string = "<id>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")

    def test_string_value(self):
        string = "<id 'string'>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")
        self.assertEqual(lol.body[0].value.content, 'string')


        string = '<id "string">'
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")
        self.assertEqual(lol.body[0].value.content, 'string')

    def test_string_value_quotes(self):
        string = '<id "str\\"ing">'
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, 'str\\"ing')

        string = "<id 'str\\'ing'>"
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, "str\\'ing")

    def test_basic_errors(self):
        strings = [
            '< "str\\"ing">',
            "<>",
            "<id",
            "id>",
            '<id "value>',
            '<id value">',
            "<id 'value>",
            "<id value'",
            "<id'value'>",
            '<id"value">',
            '< id "value">',
            '<()>',
            '<+s>',
            '<id-id2>',
            '<-id>',
            '<id 2>',
            '<"id">',
            '<\'id\'>',
            '<2>',
            '<09>',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_basic_attributes(self):
        string = "<id attr1: 'foo'>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body[0].attrs), 1)
        attr = lol.body[0].attrs[0]
        self.assertEqual(attr.key.name, "attr1")
        self.assertEqual(attr.value.content, "foo")

        string = "<id 'value' attr1: 'foo' attr2: 'foo2' attr3: 'foo3'>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body[0].attrs), 3)
        attr = lol.body[0].attrs[0]
        self.assertEqual(attr.key.name, "attr1")
        self.assertEqual(attr.value.content, "foo")
        attr = lol.body[0].attrs[1]
        self.assertEqual(attr.key.name, "attr2")
        self.assertEqual(attr.value.content, "foo2")
        attr = lol.body[0].attrs[2]
        self.assertEqual(attr.key.name, "attr3")
        self.assertEqual(attr.value.content, "foo3")


    def test_attribute_errors(self):
        strings = [
            '<id : "foo">',
            "<id 2: >",
            "<id a: >",
            "<id: ''>",
            "<id a: b:>",
            "<id a: 'foo' 'heh'>",
            "<id a: 2>",
            "<id 'a': 'a'>",
            "<id \"a\": 'a'>",
            "<id 2: 'a'>",
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_array_value(self):
        string = "<id []>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 0)

        string = "<id ['foo']>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 1)
        self.assertEqual(val.content[0].content, "foo")

        string = "<id ['foo', 'foo2', 'foo3']>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 3)
        self.assertEqual(val.content[0].content, "foo")
        self.assertEqual(val.content[1].content, "foo2")
        self.assertEqual(val.content[2].content, "foo3")

    def test_nested_array_value(self):
        string = "<id [[], []]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(len(val.content[0].content), 0)

        string = "<id ['foo', ['foo2', 'foo3']]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(val.content[0].content, 'foo')
        self.assertEqual(val.content[1].content[0].content, 'foo2')
        self.assertEqual(val.content[1].content[1].content, 'foo3')

        string = "<id ['foo', ['foo2', 'foo3']]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(val.content[0].content, 'foo')
        self.assertEqual(val.content[1].content[0].content, 'foo2')
        self.assertEqual(val.content[1].content[1].content, 'foo3')

    def test_array_errors(self):
        strings = [
            '<id ["foo]>',
            "<id [do]>",
            "<id [['foo']>",
            "<id [2]]>",
            "<id ['foo'>",
            "<id ['foo]'>",
            "<id '[2'",
            "<id ['[']']>",
            "<id ['f'][][>",
            "<id ['f']['f']>",
            "<id [2, 3]>", 
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_hash_value(self):
        string = "<id {}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 0)

        string = "<id {a: 'b', a2: 'c', d: 'd'}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 3)
        self.assertEqual(val.content[0].value.content, "b")

        string = "<id {a: '2', b: '3'}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(val.content[0].value.content, "2")
        self.assertEqual(val.content[1].value.content, "3")

    def test_nested_hash_value(self):
        string = "<id {a: {}, b: {}}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(len(val.content[0].value.content), 0)

        string = "<id {a: 'foo', b: ['foo2', 'foo3'], c: {a2: 'p'}}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 3)
        self.assertEqual(val.content[0].value.content, 'foo')
        self.assertEqual(val.content[1].value.content[0].content, 'foo2')
        self.assertEqual(val.content[2].value.content[0].key.name, 'a2')
        self.assertEqual(val.content[2].value.content[0].value.content, 'p')

        string = "<id ['foo', ['foo2', 'foo3']]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(val.content[0].content, 'foo')
        self.assertEqual(val.content[1].content[0].content, 'foo2')
        self.assertEqual(val.content[1].content[1].content, 'foo3')

    def test_hash_errors(self):
        strings = [
            '<id {a: 2}>',
            "<id {a: 'd'>",
            "<id a: 'd'}>",
            "<id {{a: 'd'}>",
            "<id {a: 'd'}}>",
            "<id {a:} 'd'}>",
            "<id {2}>",
            "<id {'a': 'foo'}>",
            "<id {\"a\": 'foo'}>",
            "<id {2: 'foo'}>",
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_index(self):
        string = "<id[]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(len(lol.body[0].index), 0)
        self.assertEqual(lol.body[0].value, None)

        string = "<id['foo'] 'foo2'>"
        lol = self.parser.parse(string)
        entity = lol.body[0]
        self.assertEqual(entity.index[0].content, "foo")
        self.assertEqual(entity.value.content, "foo2")

        string = "<id[2] 'foo2'>"
        lol = self.parser.parse(string)
        entity = lol.body[0]
        self.assertEqual(entity.index[0].value, 2)
        self.assertEqual(entity.value.content, "foo2")

        string = "<id[2, 'foo', 3] 'foo2'>"
        lol = self.parser.parse(string)
        entity = lol.body[0]
        self.assertEqual(entity.index[0].value, 2)
        self.assertEqual(entity.index[1].content, 'foo')
        self.assertEqual(entity.index[2].value, 3)
        self.assertEqual(entity.value.content, "foo2")

    def test_index_errors(self):
        strings = [
            '<id[ "foo">',
            '<id] "foo">',
            '<id[ \'] "foo">',
            '<id{ ] "foo">',
            '<id[ } "foo">',
            '<id[" ] "["a"]>',
            '<id[a]["a"]>',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_macro(self):
        string = "<id(n) {2}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(len(lol.body[0].args), 1)
        self.assertEqual(lol.body[0].expression.value, 2)

        string = "<id(n, m, a) {2}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(len(lol.body[0].args), 3)
        self.assertEqual(lol.body[0].expression.value, 2)

    def test_macro_errors(self):
        strings = [
            '<id (n) {2}>',
            '<(n) {2}>',
            '<id(() {2}>',
            '<id()) {2}>',
            '<id[) {2}>',
            '<id(] {2}>',
            '<id(-) {2}>',
            '<id(2+2) {2}>',
            '<id("a") {2}>',
            '<id(\'a\') {2}>',
            '<id(2) {2}>',

        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_expression(self):
        string = "<id[0 == 1 || 1] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.left.operator.token, '==')

        string = "<id[a == b == c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '==')
        self.assertEqual(exp.left.operator.token, '==')

        string = "<id[a == b || c == d || e == f] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.left.operator.token, '||')
        self.assertEqual(exp.right.operator.token, '==')

        string = "<id[0 && 1 || 1] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.left.operator.token, '&&')

        string = "<id[1 || 1 && 0] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.right.operator.token, '&&')

if __name__ == '__main__':
    unittest.main()

