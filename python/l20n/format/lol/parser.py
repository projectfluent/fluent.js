import re
from l20n.format.lol import ast
import string

class ParserError(Exception):
    pass

class Parser():
    patterns = {
        'id': re.compile('^([a-zA-Z]\w*)'),
        'value': re.compile('^(?P<op>[\'"])(.*?)(?<!\\\)(?P=op)'),
    }
    _parse_strings = False

    def parse(self, content, parse_strings=True):
        lol = ast.LOL()
        lol._struct = True
        lol._template_body = []
        self.content = content
        self._parse_strings = parse_strings
        ws_pre = self.get_ws()
        while self.content:
            try:
                lol.body.append(self.get_entry())
            except IndexError:
                raise ParserError()
            lol._template_body.append(self.get_ws())
        lol._template = '%s%%(body)s' % (ws_pre,)
        return lol

    def get_ws(self, wschars=string.whitespace):
        try:
            if self.content[0] not in wschars:
                return ''
        except IndexError:
            return ''
        content = self.content.lstrip()
        ws = self.content[:len(content)*-1 or None]
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
            entry = self.get_comment()
        elif self.content[0:6] == "import":
            entry = self.get_importstatement()
        else:
            print(self.content)
            raise ParserError()
        return entry

    def get_importstatement(self):
        self.content = self.content[6:]
        self.get_ws()
        if self.content[0] != "(":
            raise ParserError()
        self.content = self.content[1:]
        self.get_ws()
        uri = self.get_string()
        self.get_ws()
        if self.content[0] != ")":
            raise ParserError()
        self.content = self.content[1:]
        impStmt = ast.ImportStatement(uri=uri)
        return impStmt

    def get_identifier(self):
        match = self.patterns['id'].match(self.content)
        if not match:
            raise ParserError()
        self.content = self.content[match.end(0):]
        identifier = ast.Identifier(match.group(1))
        identifier._template = '%(name)s'
        return identifier

    def get_entity(self, id, index=None):
        ws1 = self.get_ws()
        index_arr = index[0] if index else None
        if self.content[0] == '>':
            self.content = self.content[1:]
            entity = ast.Entity(id, index_arr)
            if index:
                entity._template_index = index[2]
                entity._template = "<%%(id)s[%s]%s>" % (index[1], ws1)
            else:
                entity._template = "<%%(id)s%s>" % ws1
            return entity
        if ws1 == '':
            raise ParserError()
        value = self.get_value(none=True)
        ws2 = self.get_ws()
        attrs = self.get_attributes()
        if attrs:
            attrs_template = attrs[1]
            attrs = attrs[0]
        entity = ast.Entity(id,
                            index_arr,
                            value,
                            attrs)
        if index:
            entity._template_index = index[2]
            entity._template = "<%%(id)s[%s]%s%%(value)s%s%%(attrs)s>" % (index[1], ws1,ws2)
        else:
            entity._template = "<%%(id)s%s%%(value)s%s%%(attrs)s>" % (ws1,ws2)
        if attrs:
            entity._template_attrs = attrs_template
        return entity

    def get_macro(self, id):
        idlist = []
        self.content = self.content[1:]
        ws_pre_idlist = self.get_ws()
        ws_idlist_tmpl = []
        if self.content[0] == ')':
            self.content = self.content[1:]
        else:

            while 1:
                idlist.append(self.get_identifier())
                ws_post = self.get_ws()
                if self.content[0] == ',':
                    self.content = self.content[1:]
                    ws_idlist_tmpl.append('%s,%s' % (ws_post, self.get_ws()))
                elif self.content[0] == ')':
                    ws_post_idlist = ws_post
                    self.content = self.content[1:]
                    break
                else:
                    raise ParserError()
        ws1 = self.get_ws()
        if ws1 == '':
            raise ParserError()
        if self.content[0] != '{':
            raise ParserError()
        self.content = self.content[1:]
        ws2 = self.get_ws()
        exp = self.get_expression()
        ws3 = self.get_ws()
        if self.content[0] != '}':
            raise ParserError()
        self.content = self.content[1:]
        ws4 = self.get_ws()
        attrs = self.get_attributes()
        if attrs:
            attrs_template = attrs[1]
            attrs = attrs[0]
        macro = ast.Macro(id,
                          idlist,
                          exp,
                          attrs)
        macro._template = '<%%(id)s(%s%%(args)s%s)%s{%s%%(expression)s%s}%s%%(attrs)s>' % (ws_pre_idlist,
                                                                                 ws_post_idlist,
                                                                               ws1,
                                                                               ws2,
                                                                               ws3,
                                                                               ws4)
        macro._template_args = ws_idlist_tmpl
        if attrs:
            macro._template_attrs = attrs_template
        return macro

    def get_value(self, none=False):
        c = self.content[0]
        if c in ('"', "'"):
            ccc = self.content[:3]
            quote = ccc if ccc in ('"""', "'''") else c
            if self._parse_strings:
                value = self.get_complex_string(quote)
            else:
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

    def get_complex_string(self, quote):

        str_end = quote[0]
        literal = re.compile('^([^\\\{%s]+)' % str_end)
        obj = []
        buffer = ''
        self.content = self.content[len(quote):]

        while not self.content[:len(quote)] == quote:
            if self.content[0] == str_end:
                buffer += self.content[0]
                self.content = self.content[1:]
            if self.content[0] == '\\':
                jump = 3 if self.content[1:3] == '{{' else 2
                buffer += self.content[1:jump]
                self.content = self.content[jump:]
            if self.content[:2] == '{{':
                self.content = self.content[2:]
                if buffer:
                    obj.append(ast.String(buffer))
                    buffer = ''
                ws_pre_exp = self.get_ws()
                expr = self.get_expression()
                expr._template = '{{%s%s%s}}' % (ws_pre_exp,
                                                 expr._template,
                                                 self.get_ws())
                obj.append(expr)
                if self.content[:2] != '}}':
                    raise ParserError()
                self.content = self.content[2:]
            m = literal.match(self.content)
            if m:
                buffer += m.group(1)
                self.content = self.content[m.end(0):]
        if buffer or len(obj):
            string = ast.String(buffer)
            string._template = '%(content)s'
            obj.append(string)
        self.content = self.content[len(quote):]
        if len(obj) == 1 and isinstance(obj[0], ast.String):
            obj[0]._template = '%s%%(content)s%s' % (quote, quote)
            return obj[0]
        cs = ast.ComplexString(obj)
        cs._template = '%s%%(content)s%s' % (quote, quote)
        cs._template_content = ['']
        return cs

    def get_array(self):
        self.content = self.content[1:]
        ws_pre = self.get_ws()
        if self.content[0] == ']':
            self.content = self.content[1:]
            arr = ast.Array()
            arr._template = '%s%%(content)s' % ws_pre
            return arr
        array = []
        array_template = []
        while 1:
            elem = self.get_value()
            array.append(elem)
            ws_item_post = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                array_template.append('%s%s%s' % (ws_item_post,
                                                  ',',
                                                  self.get_ws()))
            elif self.content[0] == ']':
                break
            else:
                raise ParserError()
        self.content = self.content[1:]
        arr = ast.Array(array)
        arr._template = '[%s%%(content)s%s]' % (ws_pre, ws_item_post)
        arr._template_content = array_template
        return arr

    def get_hash(self):
        self.content = self.content[1:]
        ws_pre = self.get_ws()
        if self.content[0] == '}':
            self.content = self.content[1:]
            h = ast.Hash()
            h._template = '%s%%(content)s' % ws_pre
            return h
        hash = []
        hash_template = []
        while 1:
            kvp = self.get_kvp()
            hash.append(kvp)
            ws_item_post = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                hash_template.append('%s%s%s' % (ws_item_post,
                                                 ',',
                                                 self.get_ws()))
            elif self.content[0] == '}':
                break
            else:
                raise ParserError()
        self.content = self.content[1:]
        h = ast.Hash(hash)
        h._template = '{%s%%(content)s%s}' % (ws_pre, ws_item_post)
        h._template_content = hash_template
        return h

    def get_kvp(self):
        key = self.get_identifier()
        ws_post_key = self.get_ws()
        if self.content[0] != ':':
            raise ParserError()
        self.content = self.content[1:]
        ws_pre_value = self.get_ws()
        val = self.get_value()
        kvp = ast.KeyValuePair(key, val)
        kvp._template = '%%(key)s%s:%s%%(value)s' % (ws_post_key,
                                                     ws_pre_value)
        return kvp

    def get_attributes(self):
        if self.content[0] == '>':
            self.content = self.content[1:]
            return None
        hash = []
        hash_template = []
        while 1:
            kvp = self.get_kvp()
            hash.append(kvp)
            ws_post_item = self.get_ws()
            if self.content[0] == '>':
                hash_template.append(ws_post_item)
                self.content = self.content[1:]
                break
            elif ws_post_item == '':
                raise ParserError()
            hash_template.append(ws_post_item)
        if len(hash):
            return (hash, hash_template)
        else:
            return None

    def get_index(self):
        self.content = self.content[1:]
        ws_pre = self.get_ws()
        if self.content[0] == ']':
            self.content = self.content[1:]
            return ([], '%s%%(index)s' % ws_pre, [])
        index = []
        index_template = []
        while 1:
            expression = self.get_expression()
            index.append(expression)
            ws_item_post = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                index_template.append('%s%s%s' % (ws_item_post,
                                                  ',',
                                                  self.get_ws()))
            elif self.content[0] == ']':
                break
            else:
                raise ParserError()
        self.content = self.content[1:]
        template = '%s%%(index)s%s' % (ws_pre, ws_item_post)
        return (index, template, index_template)


    def get_expression(self):
        return self.get_conditional_expression()

    def get_conditional_expression(self):
        or_expression = self.get_or_expression()
        ws_pre_op = self.get_ws()
        if self.content[0] != '?':
            self.content = '%s%s' % (ws_pre_op, self.content)
            return or_expression
        self.content = self.content[1:]
        ws_pre_cons = self.get_ws()
        consequent = self.get_expression()
        ws_post_cons = self.get_ws()
        if self.content[0] != ':':
            raise ParserError()
        self.content = self.content[1:]
        ws_pre_alter = self.get_ws()
        alternate = self.get_expression()
        cons_exp = ast.ConditionalExpression(or_expression,
                                             consequent,
                                             alternate)
        cons_exp._template = '%%(test)s%s?%s%%(consequent)s%s:%s%%(alternate)s' % (ws_pre_op,
                                                                                     ws_pre_cons,
                                                                                     ws_post_cons,
                                                                                     ws_pre_alter)
        return cons_exp

    def get_prefix_expression(self, token, token_length, cl, op, nxt):
        exp = nxt()
        ws_pre_op = self.get_ws()
        while self.content[:token_length] in token:
            t = self.content[:token_length]
            self.content = self.content[token_length:]
            ws_post_op = self.get_ws()
            exp = cl(op(t),
                     exp,
                     nxt())
            exp._template = '%%(left)s%s%%(operator)s%s%%(right)s' % (ws_pre_op, 
                                                                      ws_post_op)
            ws_pre_op = self.get_ws()
        self.content = '%s%s' % (ws_pre_op, self.content)
        return exp

    def get_prefix_expression_re(self, token, cl, op, nxt):
        exp = nxt()
        ws_pre_op = self.get_ws()
        m = token.match(self.content)
        while m:
            self.content = self.content[m.end(0):]
            ws_post_op = self.get_ws()
            exp = cl(op(m.group(0)),
                     exp,
                     nxt())
            exp._template = '%%(left)s%s%%(operator)s%s%%(right)s' % (ws_pre_op,
                                                                      ws_post_op)
            ws_pre_op = self.get_ws()
            m = token.match(self.content)
        self.content = '%s%s' % (ws_pre_op, self.content)
        return exp


    def get_postfix_expression(self, token, token_length, cl, op, nxt):
        t = self.content[0]
        if t not in token:
            return nxt()
        self.content = self.content[1:]
        ws = self.get_ws()
        exp = cl(op(t),
                 self.get_postfix_expression(token, token_length, cl, op, nxt))
        exp._template = '%%(operator)s%s%%(argument)s' % ws
        return exp

    def get_or_expression(self,
                          token=('||',),
                          cl=ast.LogicalExpression,
                          op=ast.LogicalOperator):
        return self.get_prefix_expression(token, 2, cl, op, self.get_and_expression)

    def get_and_expression(self,
                          token=('&&',),
                          cl=ast.LogicalExpression,
                          op=ast.LogicalOperator):
        return self.get_prefix_expression(token, 2, cl, op, self.get_equality_expression)

    def get_equality_expression(self,
                          token=('==', '!='),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression(token, 2, cl, op, self.get_relational_expression)

    def get_relational_expression(self,
                          token=re.compile('^[<>]=?'),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression_re(token, cl, op, self.get_additive_expression)

    def get_additive_expression(self,
                          token=('+', '-'),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression(token, 1, cl, op, self.get_modulo_expression)

    def get_modulo_expression(self,
                          token=('%',),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression(token, 1, cl, op, self.get_multiplicative_expression)

    def get_multiplicative_expression(self,
                          token=('*',),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression(token, 1, cl, op, self.get_dividive_expression)

    def get_dividive_expression(self,
                          token=('/',),
                          cl=ast.BinaryExpression,
                          op=ast.BinaryOperator):
        return self.get_prefix_expression(token, 1, cl, op, self.get_unary_expression)

    def get_unary_expression(self,
                          token=('+', '-', '!'),
                          cl=ast.UnaryExpression,
                          op=ast.UnaryOperator):
        return self.get_postfix_expression(token, 1, cl, op, self.get_member_expression)

    def get_member_expression(self):
        exp = self.get_parenthesis_expression()
        ws_post_id = self.get_ws()
        matched = False
        while 1:
            if self.content[0:2] in ('[.', '..'):
                exp = self.get_attr_expression(exp, ws_post_id)
                matched = True
            elif self.content[0] in ('[', '.'):
                exp = self.get_property_expression(exp, ws_post_id)
                matched = True
            elif self.content[0] == '(':
                exp = self.get_call_expression(exp, ws_post_id)
                matched = True
            else:
                break
        if not matched:
            self.content = '%s%s' % (ws_post_id, self.content)
        return exp

    def get_parenthesis_expression(self):
        if self.content[0] == "(":
            self.content = self.content[1:]
            ws_pre = self.get_ws()
            pexp = ast.ParenthesisExpression(self.get_expression())
            ws_post = self.get_ws()
            if self.content[0] != ')':
                raise ParserError()
            self.content = self.content[1:]
            pexp._template = '(%s%%(expression)s%s)' % (ws_pre, ws_post)
            return pexp
        return self.get_primary_expression()

    def get_primary_expression(self):
        #number
        ptr = 0
        while self.content[ptr].isdigit():
            ptr+=1
        if ptr:
            d =  int(self.content[:ptr])
            self.content = self.content[ptr:]
            literal = ast.Literal(d)
            literal._template = '%(value)s'
            return literal
        #value
        if self.content[0] in ('"\'{['):
            return self.get_value()
        return self.get_identifier()

    def get_attr_expression(self, idref, ws_post_id):
        d = self.content[0:2]
        if d == '[.':
            self.content = self.content[2:]
            ws_pre = self.get_ws()
            exp = self.get_expression()
            ws_post = self.get_ws()
            self.content = self.content[1:]
            attr = ast.AttributeExpression(idref, exp, True)
            attr._template = '%%(expression)s%s[.%s%%(attribute)s%s]' % (ws_post_id, ws_pre, ws_post)
            return attr
        elif d == '..':
            self.content = self.content[2:]
            prop = self.get_identifier()
            ae = ast.AttributeExpression(idref, prop, False)
            ae._template = '%(expression)s..%(attribute)s'
            return ae
        else:
            raise ParserError()

    def get_property_expression(self, idref, ws_post_id):
        d = self.content[0]
        if d == '[':
            self.content = self.content[1:]
            ws_pre = self.get_ws()
            exp = self.get_expression()
            ws_post = self.get_ws()
            self.content = self.content[1:]
            prop = ast.PropertyExpression(idref, exp, True)
            prop._template = '%%(expression)s%s[%s%%(property)s%s]' % (ws_post_id, ws_pre, ws_post)
            return prop
        elif d == '.':
            self.content = self.content[1:]
            prop = self.get_identifier()
            pe = ast.PropertyExpression(idref, prop, False)
            pe._template = '%(expression)s.%(property)s'
            return pe
        else:
            raise ParserError()

    def get_call_expression(self, callee, ws_post_id):
        mcall = ast.CallExpression(callee)
        self.content = self.content[1:]
        ws_pre = self.get_ws()
        if self.content[0] == ')':
            self.content = self.content[1:]
            mcall._template = '%%(callee)s%s()' % (ws_post_id)
            return mcall
        template = []
        while 1:
            exp = self.get_expression()
            mcall.arguments.append(exp)
            ws_post = self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                template.append('%s,%s' % (ws_post, self.get_ws()))
            elif self.content[0] == ')':
                break
            else:
                raise ParserError()
        self.content = self.content[1:]
        mcall._template = '%%(callee)s%s(%s%%(arguments)s%s)' % (ws_post_id, ws_pre, ws_post)
        mcall._template_arguments = template
        return mcall

    def get_comment(self):
        comment, sep, self.content = self.content[2:].partition('*/')
        if not sep:
            raise ParserError()
        return ast.Comment(comment)

