import re
from l20n import ast

class ParserError(Exception):
    pass

class Parser():
    patterns = {
        'id': re.compile('^([a-zA-Z]\w*)'),
        'value': re.compile('^(?P<op>[\'"])(.*?)(?<!\\\)(?P=op)'),
    }

    def parse(self, content):
        lol = ast.LOL()
        lol._struct = True
        lol._template = []
        self.content = content
        lol._template.append(self.get_ws())
        while self.content:
            try:
                lol.body.append(self.get_entry())
            except IndexError:
                raise ParserError()
            lol._template.append(self.get_ws())
        return lol

    def get_ws(self):
        content = self.content.lstrip()
        ws = self.content[:len(content)*-1]
        self.content = content
        return ws

    def get_entry(self):
        if self.content[0] == '<':
            self.content = self.content[1:]
            id = self.get_identifier()
            if self.content[0] == '(':
                entry = self.get_macro(id)
            elif self.content[0] == '[':
                index = self.get_index()
                entry = self.get_entity(id, index)
            else:
                entry = self.get_entity(id)
        elif self.content[0:2] == '/*':
            entry = self.get_comment(self.ptr)
        else:
            raise ParserError()
        return entry

    def get_identifier(self):
        match = self.patterns['id'].match(self.content)
        if not match:
            raise ParserError()
        self.content = self.content[match.end(0):]
        return ast.Identifier(match.group(1))

    def get_entity(self, id, index=None):
        ws1 = self.get_ws()
        if self.content[0] == '>':
            self.content = self.content[1:]
            entity = ast.Entity(id)
            entity._template = "<%%s%s>" % ws1
            return entity
        if len(ws1) == 0:
            raise ParserError()
        value = self.get_value(none=True)
        ws2 = self.get_ws()
        attrs = self.get_attributes()
        entity = ast.Entity(id,
                            index,
                            value,
                            attrs)
        entity._template = "<%%s%%s%s%%s%s%%s>" % (ws1,ws2)
        return entity

    def get_macro(self, id):
        idlist = []
        self.content = self.content[1:]
        self.get_ws()
        while self.content[0] != ')':
            idlist.append(self.get_identifier())
            self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                self.get_ws()
        self.content = self.content[1:]
        ws = self.get_ws()
        if len(ws) == 0:
            raise ParserError()
        if self.content[0] != '{':
            raise ParserError()
        self.content = self.content[1:]
        exp = self.get_expression()
        self.get_ws()
        if self.content[0] != '}':
            raise ParserError()
        self.content = self.content[1:]
        attrs = self.get_attributes()
        return ast.Macro(id,
                         idlist,
                         exp,
                         attrs)

    def get_value(self, none=False):
        c = self.content[0]
        if c in ('"', "'"):
            value = self.get_string()
        elif c == '[':
            value = self.get_array()
        elif c == '{':
            value = self.get_hash()
        else:
            if none is True:
                return None
            raise ParserError()
        return value

    def get_string(self):
        match = self.patterns['value'].match(self.content)
        if not match:
            raise ParserError()
        self.content = self.content[match.end(0):]
        return ast.String(match.group(2))

    def get_array(self):
        self.content = self.content[1:]
        array = []
        ws = self.get_ws()
        while self.content[0] != ']':
            array.append(self.get_value())
            ws = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                ws2 = self.get_ws()
        self.content = self.content[1:]
        return ast.Array(array)

    def get_hash(self):
        hash = []
        self.content = self.content[1:]
        ws = self.get_ws()
        while self.content[0] != '}':
            kvp = self.get_kvp()
            hash.append(kvp)
            ws = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                ws2 = self.get_ws()
        self.content = self.content[1:]
        return ast.Hash(hash)

    def get_kvp(self):
        ws = self.get_ws()
        key = self.get_identifier()
        ws2 = self.get_ws()
        if self.content[0] != ':':
            raise ParserError()
        self.content = self.content[1:]
        ws3 = self.get_ws()
        val = self.get_value()
        return ast.KeyValuePair(key, val)

    def get_attributes(self):
        hash = []
        while self.content[0] != '>':
            ws = self.get_ws()
            kvp = self.get_kvp()
            hash.append(kvp)
            ws2 = self.get_ws()
        self.content = self.content[1:]
        return hash if len(hash) else None

    def get_index(self):
        index = []
        self.content = self.content[1:]
        ws = self.get_ws()
        while self.content[0] != ']':
            expression = self.get_expression()
            index.append(expression)
            ws = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                self.get_ws()
        self.content = self.content[1:]
        return index


    def get_expression(self):
        return self.get_conditional_expression()

    def get_conditional_expression(self):
        logical_expression = self.get_logical_expression()
        self.get_ws()
        if self.content[0] != '?':
            return logical_expression
        self.content = self.content[1:]
        self.get_ws()
        consequent = self.get_expression()
        self.get_ws()
        if self.content[0] != ':':
            raise ParserError()
        self.content = self.content[1:]
        self.get_ws()
        alternate = self.get_expression()
        self.get_ws()
        return ast.ConditionalExpression(logical_expression,
                                         consequent,
                                         alternate)

    def get_logical_expression(self):
        binary_expression = self.get_binary_expression()
        return binary_expression

    def get_binary_expression(self):
        unary_expression = self.get_unary_expression()
        return unary_expression

    def get_unary_expression(self):
        primary_expression = self.get_primary_expression()
        return primary_expression

    def get_primary_expression(self):
        if self.content[0] == "(":
            self.content = self.content[1:]
            ws = self.get_ws()
            pexp = ast.ParenthesisExpression(self.get_expression())
            ws = self.get_ws()
            if self.content[0] != ')':
                raise ParserError()
            self.content = self.content[1:]
            return pexp
        #number
        ptr = 0
        while self.content[ptr].isdigit():
            ptr+=1
        if ptr:
            d =  int(self.content[:ptr])
            self.content = self.content[ptr:]
            return ast.Literal(d)
        #value
        if self.content[0] in ('"\'{['):
            return self.get_value()
        #idref (with index?) or macrocall
        idref = self.get_identifier()
        if self.content[0:2] == '[.':
            return self.get_attr_expression(idref)
        elif self.content[0] == '[':
            return self.get_member_expression(idref)
        elif self.content[0] != '(':
            return idref
        #macro
        mcall = ast.CallExpression(idref)
        self.content = self.content[1:]
        self.get_ws()
        while self.content[0] != ')':
            exp = self.get_expression()
            mcall.arguments.append(exp)
            self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                self.get_ws()
        self.content = self.content[1:]
        return mcall


    def get_attr_expression(self, idref):
        self.content = self.content[2:]
        self.get_ws()
        exp = self.get_expression()
        self.get_ws()
        self.content = self.content[1:]
        return ast.AttributeExpression(idref, exp)

    def get_member_expression(self, idref):
        self.content = self.content[1:]
        self.get_ws()
        exp = self.get_expression()
        self.get_ws()
        self.content = self.content[1:]
        return ast.MemberExpression(idref, exp)
