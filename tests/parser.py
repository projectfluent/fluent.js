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
            '< id "value">'
        ]
        for string in strings:
            self.assertRaises(ParserError, self.parser.parse, string)



if __name__ == '__main__':
    unittest.main()

