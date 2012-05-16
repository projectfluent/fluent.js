import unittest

from l20n.format.lol.parser import Parser, ParserError

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

        string = "<id '''string'''>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")
        self.assertEqual(lol.body[0].value.content, 'string')

        string = '<id """string""">'
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")
        self.assertEqual(lol.body[0].value.content, 'string')

    def test_string_value_quotes(self):
        string = '<id "str\\"ing">'
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, 'str"ing')

        string = "<id 'str\\'ing'>"
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, "str'ing")

        string = '<id """str"ing""">'
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, 'str"ing')

        string = "<id '''str'ing'''>"
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, "str'ing")

        string = '<id """"string\\"""">'
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, '"string"')

        string = "<id ''''string\\''''>"
        lol = self.parser.parse(string)
        self.assertEqual(lol.body[0].value.content, "'string'")

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
            '<id """value"""">',
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

        string = "<id attr1: 'foo' attr2: 'foo2'    >"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body[0].attrs), 2)
        attr = lol.body[0].attrs[0]
        self.assertEqual(attr.key.name, "attr1")
        self.assertEqual(attr.value.content, "foo")

        string = "<id 'value' attr1: 'foo' attr2: 'foo2' attr3: 'foo3' >"
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
            "<id a2:'a'a3:'v'>",
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

        string = "<id ['foo', 'foo2', 'foo3']  \t>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 3)
        self.assertEqual(val.content[0].content, "foo")
        self.assertEqual(val.content[1].content, "foo2")
        self.assertEqual(val.content[2].content, "foo3")

    def test_nested_array_value(self):
        string = "<id [[], [  ]]>"
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

        string = "<id ['foo', ['foo2', 'foo3' ]  ]>"
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
            "<id ['f' 'f']>",
            "<id ['f''f']>",
            "<id [n?e]>",
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

        string = "<id {a: 'b', a2: 'c', d: 'd' }>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 3)
        self.assertEqual(val.content[0].value.content, "b")

        string = "<id {a: '2', b: '3'} >"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        val = lol.body[0].value
        self.assertEqual(len(val.content), 2)
        self.assertEqual(val.content[0].value.content, "2")
        self.assertEqual(val.content[1].value.content, "3")

    def test_nested_hash_value(self):
        string = "<id {a: {}, b: { }}>"
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
            "<id {a:'foo'b:'foo'}>",
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

        string = "<id[ ] >"
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
            '<id["foo""foo"] "fo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_macro(self):
        string = "<id($n) {2}>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(len(lol.body[0].args), 1)
        self.assertEqual(lol.body[0].expression.value, 2)

        string = "<id( $n, $m, $a ) {2}  >"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(len(lol.body[0].args), 3)
        self.assertEqual(lol.body[0].expression.value, 2)

    def test_macro_errors(self):
        strings = [
            '<id (n) {2}>',
            '<id ($n) {2}>',
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
            '<id(nm nm) {2}>',

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

        string = "<id[ a == b || c == d || e == f ] 'foo'  >"
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

        string = "<id[0 && (1 || 1)] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '&&')
        self.assertEqual(exp.right.expression.operator.token, '||')

        string = "<id[1 || 1 && 0] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.right.operator.token, '&&')

        string = "<id[1 + 2] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '+')
        self.assertEqual(exp.left.value, 1)
        self.assertEqual(exp.right.value, 2)

        string = "<id[1 + 2 - 3 > 4 < 5 <= a >= 'd' * 3 / q % 10] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '>=')

        string = "<id[! +1] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '!')
        self.assertEqual(exp.argument.operator.token, '+')
        self.assertEqual(exp.argument.argument.value, 1)


        string = "<id[1+2] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '+')
        self.assertEqual(exp.left.value, 1)
        self.assertEqual(exp.right.value, 2)

        string = "<id[(1+2)] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0].expression
        self.assertEqual(exp.operator.token, '+')
        self.assertEqual(exp.left.value, 1)
        self.assertEqual(exp.right.value, 2)

        string = "<id[id2['foo']] 'foo2'>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        exp = lol.body[0].index[0]
        self.assertEqual(lol.body[0].value.content, 'foo2')
        self.assertEqual(exp.expression.name, 'id2')
        self.assertEqual(exp.property.content , 'foo')

        string = "<id[id['foo']]>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        exp = lol.body[0].index[0]
        self.assertEqual(lol.body[0].value, None)
        self.assertEqual(exp.expression.name, 'id')
        self.assertEqual(exp.property.content , 'foo')

    def test_expression_errors(self):
        strings = [
            '<id[1+()] "foo">',
            '<id[1<>2] "foo">',
            '<id[1+=2] "foo">',
            '<id[>2] "foo">',
            '<id[1==] "foo">',
            '<id[1+ "foo">',
            '<id[2==1+] "foo">',
            '<id[2==3+4 "fpp">',
            '<id[2==3+ "foo">',
            '<id[2>>2] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_logical_expression(self):
        string = "<id[0 || 1] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.left.value, 0)
        self.assertEqual(exp.right.value, 1)

        string = "<id[0 || 1 && 2 || 3] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.left.operator.token, '||')
        self.assertEqual(exp.right.value, 3)
        self.assertEqual(exp.left.left.value, 0)
        self.assertEqual(exp.left.right.left.value, 1)
        self.assertEqual(exp.left.right.right.value, 2)
        self.assertEqual(exp.left.right.operator.token, '&&')

    def test_logical_expression_errors(self):
        strings = [
            '<id[0 || && 1] "foo">',
            '<id[0 | 1] "foo">',
            '<id[0 & 1] "foo">',
            '<id[|| 1] "foo">',
            '<id[0 ||] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)


    def test_binary_expression(self):
        #from pudb import set_trace; set_trace()
        string = "<id[a / b * c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '*')
        self.assertEqual(exp.left.operator.token, '/')

        string = "<id[8 * 9 % 11] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '%')
        self.assertEqual(exp.left.operator.token, '*')

        string = "<id[6 + 7 - 8 * 9 / 10 % 11] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '-')
        self.assertEqual(exp.left.operator.token, '+')
        self.assertEqual(exp.right.operator.token, '%')


        string = "<id[0 == 1 != 2 > 3 < 4 >= 5 <= 6 + 7 - 8 * 9 / 10 % 11] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '!=')
        self.assertEqual(exp.left.operator.token, '==')
        self.assertEqual(exp.right.operator.token, '<=')
        self.assertEqual(exp.right.left.operator.token, '>=')
        self.assertEqual(exp.right.right.operator.token, '-')
        self.assertEqual(exp.right.left.left.operator.token, '<')
        self.assertEqual(exp.right.left.right.value, 5)
        self.assertEqual(exp.right.left.left.left.operator.token, '>')
        self.assertEqual(exp.right.right.left.operator.token, '+')
        self.assertEqual(exp.right.right.right.operator.token, '%')
        self.assertEqual(exp.right.right.right.left.operator.token, '*')
        self.assertEqual(exp.right.right.right.left.right.operator.token, '/')

    def test_binary_expression_errors(self):
        strings = [
            '<id[1 \ 2] "foo">',
            '<id[1 ** 2] "foo">',
            '<id[1 * / 2] "foo">',
            '<id[1 !> 2] "foo">',
            '<id[1 <* 2] "foo">',
            '<id[1 += 2] "foo">',
            '<id[1 %= 2] "foo">',
            '<id[1 ^ 2] "foo">',
            '<id 2 < 3 "foo">',
            '<id 2 > 3 "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_unary_expression(self):
        #from pudb import set_trace; set_trace()
        string = "<id[! + - 1] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '!')
        self.assertEqual(exp.argument.operator.token, '+')
        self.assertEqual(exp.argument.argument.operator.token, '-')

    def test_unary_expression_errors(self):
        strings = [
            '<id[a ! v] "foo">',
            '<id[!] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_call_expression(self):
        string = "<id[foo()] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.callee.name, 'foo')
        self.assertEqual(len(exp.arguments), 0)

        string = "<id[foo(d, e, f, g)] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.callee.name, 'foo')
        self.assertEqual(len(exp.arguments), 4)
        self.assertEqual(exp.arguments[0].name, 'd')
        self.assertEqual(exp.arguments[1].name, 'e')
        self.assertEqual(exp.arguments[2].name, 'f')
        self.assertEqual(exp.arguments[3].name, 'g')

    def test_call_expression_errors(self):
        strings = [
            '<id[1+()] "foo">',
            '<id[foo(fo fo)] "foo">',
            '<id[foo(()] "foo">',
            '<id[foo(())] "foo">',
            '<id[foo())] "foo">',
            '<id[foo("ff)] "foo">',
            '<id[foo(ff")] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_member_expression(self):
        string = "<id[x['d']] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.name, 'x')
        self.assertEqual(exp.property.content, 'd')

        string = "<id[x.d] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.name, 'x')
        self.assertEqual(exp.property.name, 'd')

        string = "<id[a||b.c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '||')
        self.assertEqual(exp.right.expression.name, 'b')

        string = "<id[ x.d ] 'foo' >"
        lol = self.parser.parse(string)

        string = "<id[ x[ 'd' ] ] 'foo' >"
        lol = self.parser.parse(string)

        string = "<id[ x ['d'] ] 'foo' >"
        lol = self.parser.parse(string)

        string = "<id[x['d']['e']] 'foo' >"
        lol = self.parser.parse(string)

        string = "<id[! (a?b:c) ['d']['e']] 'foo' >"
        lol = self.parser.parse(string)

    def test_member_expression_errors(self):
        strings = [
            '<id[x[[]] "foo">',
            '<id[x[] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_attr_expression(self):
        string = "<id[x.['d']] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.name, 'x')
        self.assertEqual(exp.attribute.content, 'd')

        string = "<id[x..d] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.name, 'x')
        self.assertEqual(exp.attribute.name, 'd')

    def test_attr_expression_errors(self):
        strings = [
            '<id[x...d] "foo">',
            '<id[x[."d"]] "foo">',
            '<id[x[..d]] "foo">',
            '<id[x..[d]] "foo">',
            '<id[x.y..z] "foo">',
            '<id[x..y..z] "foo">',
            '<id[x.y.["z"]] "foo">',
            '<id[x..y.["z"]] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)


    def test_parenthesis_expression(self):
        #from pudb import set_trace; set_trace()
        string = "<id[(1 + 2) * 3] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '*')
        self.assertEqual(exp.left.expression.operator.token, '+')

        string = "<id[(1) + ((2))] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '+')
        self.assertEqual(exp.left.expression.value, 1)
        self.assertEqual(exp.right.expression.expression.value, 2)

        string = "<id[(a||b).c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.expression.operator.token, '||')
        self.assertEqual(exp.property.name, 'c')

        string = "<id[!(a||b).c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.operator.token, '!')
        self.assertEqual(exp.argument.expression.expression.operator.token, '||')
        self.assertEqual(exp.argument.property.name, 'c')

        string = "<id[a().c] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.expression.callee.name, 'a')
        self.assertEqual(exp.property.name, 'c')

    def test_parenthesis_expression_errors(self):
        strings = [
            '<id[1+()] "foo">',
            '<id[(+)*(-)] "foo">',
            '<id[(!)] "foo">',
            '<id[(())] "foo">',
            '<id[(] "foo">',
            '<id[)] "foo">',
            '<id[1+(2] "foo">',
            '<id[a().c.[d]()] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_literal_expression(self):
        string = "<id[012] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.value, 12)

    def test_literal_expression_errors(self):
        strings = [
            '<id[012x1] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_value_expression(self):
        string = "<id['foo'] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.content, 'foo')

        string = "<id[['foo', 'foo2']] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.content[0].content, 'foo')
        self.assertEqual(exp.content[1].content, 'foo2')

        string = "<id[{a: 'foo', b: 'foo2'}] 'foo'>"
        lol = self.parser.parse(string)
        exp = lol.body[0].index[0]
        self.assertEqual(exp.content[0].value.content, 'foo')
        self.assertEqual(exp.content[1].value.content, 'foo2')

    def test_value_expression_errors(self):
        strings = [
            '<id[[0, 1]] "foo">',
            '<id["foo] "foo">',
            '<id[foo"] "foo">',
            '<id[["foo]] "foo">',
            '<id[{"a": "foo"}] "foo">',
            '<id[{a: 0}] "foo">',
            '<id[{a: "foo"] "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_comment(self):
        #from pudb import set_trace; set_trace()
        string = "/* test */"
        lol = self.parser.parse(string)
        comment = lol.body[0]
        self.assertEqual(comment.content, ' test ')

    def test_comment_errors(self):
        strings = [
            '/* foo ',
            'foo */',
            '<id /* test */ "foo">',
        ]
        for string in strings:
            try:
                self.assertRaises(ParserError, self.parser.parse, string)
            except AssertionError:
                raise AssertionError("Failed to raise parser error on string: %s" % string)

    def test_identifier(self):
        string = "<id>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "id")

        string = "<ID>"
        lol = self.parser.parse(string)
        self.assertEqual(len(lol.body), 1)
        self.assertEqual(lol.body[0].id.name, "ID")

if __name__ == '__main__':
    unittest.main()

