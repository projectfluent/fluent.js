import re
from l20n.ast import *
from silme.core.types import OrderedDict

class NoValueException(Exception):
    pass

class L20nParser():
    def __init__(self):
        self.patterns = {}
        self.patterns['ws'] = re.compile('^\s+')
        self.patterns['id'] = re.compile('^[\'"]?(\w+)[\'"]?')
        self.patterns['entry'] = re.compile('(^<)|(^\/\*)|(\[%%)')
        self.patterns['group'] = (re.compile('^\[%%\s*'), re.compile('^%%\]'))

    def parse(self, content):
        self.content = content
        self.lol = LOL(None)
        self.lol.add(self.get_ws())
        #try:
        while self.content:
            self.get_entry()
        #except Exception:
        #    print(self.content[0:50])
        #    raise Exception()
        return self.lol

    def get_entry(self):
        entry = None
        match = self.patterns['entry'].match(self.content)
        if not match:
            raise Exception()
        if self.content[0] == '<':
            self.content = self.content[1:]
            id = self.get_id()
            if self.content[0] == '(':
                entry = self.get_macro(id=id)
            else:
                entry = self.get_entity(id=id)
        elif self.content[0] == '/':
            entry = self.get_comment()
        elif self.content[0] == '[':
            entry = self.get_group()
        else:
            raise Exception()
        self.lol.add(entry)
        self.get_ws()
        return entry

    def get_ws(self):
        match = self.patterns['ws'].match(self.content)
        if not match:
            return None
        self.content = self.content[match.end(0):]
        #return WS(match.group(0)) # this line costs a lot

    def get_group(self):
        group = Group()
        match = self.patterns['group'][0].match(self.content)
        if not match:
            raise Exception()
        self.content = self.content[match.end(0):]
        match = self.patterns['group'][1].match(self.content)
        while not match:
            entry = self.get_entry()
            group.add(entry)
            match = self.patterns['group'][1].match(self.content)
        self.content = self.content[match.end(0):]
        return group

    def get_entity(self, id=None):
        if id is None:
            if self.content[0] != '<':
                raise Exception()
            self.content = self.content[1:]
            id = self.get_id()
        entity = Entity(id)
        if self.content[0] == '[':
            index = self.get_index()
            entity.index = index
        match = self.patterns['ws'].match(self.content)
        if not match:
            raise Exception()
        self.get_ws()
        try:
            value = self.get_value()
        except NoValueException:
            pass
        else:
            entity.value = value
            self.get_ws()
        while self.content[0] != '>':
            kvpair = self.get_key_value_pair()
            entity.kvplist[kvpair.key] = kvpair.value
            self.get_ws()
        self.content = self.content[1:]
        return entity
    
    def get_id(self):
        match = self.patterns['id'].match(self.content)
        if not match:
            raise Exception()
        self.content = self.content[match.end(0):]
        return match.group(1)

    def get_index(self):
        index = Index()
        if self.content[0] != '[':
            raise Exception()
        self.content = self.content[1:]
        self.get_ws()
        while self.content[0] != ']':
            expression = self.get_expression()
            index.append(expression)
            self.get_ws()
            if self.content[0] == ',':
                self.content = self.content[1:]
                self.get_ws()
        self.content = self.content[1:]
        return index

    def get_attr_index(self, idref):
        index = AttrIndex(idref)
        if self.content[0:2] != '[.':
            raise Exception()
        self.content = self.content[2:]
        self.get_ws()
        expression = self.get_expression()
        index.arg = expression
        index.computed = True
        self.get_ws()
        if self.content[0] != ']':
            raise Exception()
        self.content = self.content[1:]
        return index

    def get_object_index(self, idref):
        index = ObjectIndex(idref)
        if self.content[0] != '[':
            raise Exception()
        self.content = self.content[1:]
        self.get_ws()
        expression = self.get_expression()
        index.arg = expression
        index.computed = True
        self.get_ws()
        if self.content[0] != ']':
            raise Exception()
        self.content = self.content[1:]
        return index

    def get_macro(self, id=None):
        if id is None:
            if self.content[0] != '<':
                raise Exception()
            self.content = self.content[1:]
            id = self.get_id()
        macro = Macro(id)
        idlist = []
        if self.content[0]!='(':
            raise Exception()
        self.content = self.content[1:]
        self.get_ws()
        while self.content[0]!=')':
            id = self.get_id()
            idlist.append(id)
            self.get_ws()
            while self.content[0]==',':
                self.content = self.content[1:]
                self.get_ws()
                id=self.get_id()
                idlist.append(id)
                self.get_ws()
        self.content = self.content[1:]
        macro.idlist = idlist
        self.get_ws()
        if self.content[:2]!='->':
            raise Exception()
        self.content = self.content[2:]
        self.get_ws()
        if self.content[0]!='{':
            raise Exception()
        self.content = self.content[1:]
        self.get_ws()
        expression=self.get_expression()
        macro.structure.append(expression)
        self.get_ws()
        if self.content[0]!='}':
            raise Exception()
        self.content = self.content[1:]
        while self.content[0] != '>':
            kvpair = self.get_key_value_pair()
            macro.kvplist[kvpair.key] = kvpair.value
            self.get_ws()
        self.content = self.content[1:]
        return macro
    
    def get_value(self):
        if self.content[0]=="'" or \
            self.content[0]=='"':
            value = self.get_string()
        elif self.content[0]=='[':
            value = self.get_array()
        elif self.content[0]=='{':
            value = self.get_hash()
        else:
            raise NoValueException()
        return value

    def get_key_value_pair(self):
        key_value_pair = KeyValuePair()
        key_value_pair.key = self.get_id()
        if self.content[0]!=':':
            raise Exception()
        self.content = self.content[1:]
        key_value_pair.ws.append(self.get_ws())
        value = self.get_value()
        key_value_pair.value = value
        return key_value_pair
    
    def get_comment(self):
        if self.content[:2] != '/*':
            raise Exception()
        pattern = re.compile('\*\/')
        m = pattern.search(self.content)
        if not m:
            raise Exception()
        comment = self.content[2:m.start(0)]
        self.content = self.content[m.end(0):]
        self.lol.add(Comment(comment))
    
    def get_string(self):
        if self.content[0]!='"' and \
             self.content[0]!="'":
            raise Exception()
        str_end = self.content[0]
        string = ComplexStringValue()
        buffer = ''
        literal = re.compile('^([^\\{'+str_end+']+)')
        self.content = self.content[1:]
        while self.content[0]!=str_end:
            '''
            parsing expressions inside the string
            '''
            if self.content[0]=='\\':
                self.content = self.content[1:]
                buffer = buffer + this.content[0]
                self.content = self.content[1:]
            if self.content[0]=='{':
                self.content = self.content[1:]
                if self.content[0]!='{':
                    raise Exception()
                self.content = self.content[1:]
                expander = Expander()
                expression = self.get_expression()
                if len(buffer):
                    string.pieces.append(buffer)
                    buffer = ''
                expander.expression = expression
                if self.content[0:2]!='}}':
                    raise Exception()
                self.content = self.content[2:]
                string.pieces.append(expander)

            m = literal.match(self.content)
            if m:
                buffer = buffer + m.group(1)
                self.content = self.content[m.end(0):]
        self.content = self.content[1:]
        if len(buffer) or len(string.pieces) == 0:
            string.pieces.append(buffer)
        if len(string.pieces) > 1 or isinstance(string.pieces[0], Expander):
            return string
        return string.pieces[0]
   

    def get_array(self):
        array = []
        if self.content[0]!='[':
            raise Exception()
        self.content=self.content[1:]
        self.get_ws()
        value = self.get_value()
        array.append(value)
        while self.content[0]==',':
            self.content=self.content[1:]
            self.get_ws()
            value = self.get_value()
            array.append(value)
            self.get_ws()
        if self.content[0]!=']':
            raise Exception()
        self.content=self.content[1:]
        return array
    
    def get_hash(self):
        hash = OrderedDict()
        if self.content[0]!='{':
            raise Exception()
        self.content = self.content[1:]
        self.get_ws()
        key_value_pair = self.get_key_value_pair()
        hash[key_value_pair.key] = key_value_pair.value
        self.get_ws()
        while self.content[0]==',':
            self.content = self.content[1:]
            self.get_ws()
            key_value_pair = self.get_key_value_pair()
            hash[key_value_pair.key] = key_value_pair.value
            self.get_ws()
        if self.content[0]!='}':
            raise Exception()
        self.content = self.content[1:]
        return hash
    
    def get_expression(self):
        return self.get_conditional_expression()

    
    def get_prefix_expression(self, pattern, type, prefix):
        higher_expression = prefix()
        self.get_ws()
        m = pattern.match(self.content)
        if not m:
            return higher_expression
        operator_expression = type()
        operator_expression.append(higher_expression)
        while m:
            operator_expression.append(Operator(m.group(0)))
            self.content = self.content[m.end(0):]
            self.get_ws()
            higher_expression = prefix()
            operator_expression.append(higher_expression)
            self.get_ws()
            m = pattern.match(self.content)
        return operator_expression
    
    def get_postfix_expression(self, pattern, type, postfix):
        m = pattern.match(self.content)
        if not m:
            return postfix()
        operator_expression = type()
        operator_expression.append(Operator(m.group(0)))
        self.content = self.content[m.end(0):]
        self.get_ws()
        operator_expression2 = type()
        operator_expression.append(operator_expression2)
        return operator_expression
        
        
    def get_conditional_expression(self):
        or_expression = self.get_or_expression()
        self.get_ws()
        pattern = re.compile('^\?')
        m = pattern.match(self.content)
        if not m:
            return or_expression
        conditional_expression = ConditionalExpression()
        conditional_expression.append(or_expression)
        self.content=self.content[m.end(0):]
        self.get_ws()
        expression = self.get_expression()
        conditional_expression.append(expression)
        self.get_ws()
        pattern = re.compile('^:')
        m = pattern.match(self.content)
        if not m:
            raise Exception()
        self.content=self.content[1:]
        self.get_ws()
        conditional_expression2 = self.get_conditional_expression()
        conditional_expression.append(conditional_expression2)
        self.get_ws()
        return conditional_expression

    def get_or_expression(self):
        return self.get_prefix_expression(re.compile('^\|\|'), OrExpression, self.get_and_expression)
    
    def get_and_expression(self):
        return self.get_prefix_expression(re.compile('^\&\&'), AndExpression, self.get_equality_expression)
    
    def get_equality_expression(self):
        return self.get_prefix_expression(re.compile('^[!=]='), EqualityExpression, self.get_relational_expression)
    
    def get_relational_expression(self):
        return self.get_prefix_expression(re.compile('^[<>]=?'), RelationalExpression, self.get_additive_expression)

    def get_additive_expression(self):
        return self.get_prefix_expression(re.compile('^[\+\-]'), AdditiveExpression, self.get_multiplicative_expression)
    
    def get_multiplicative_expression(self):
        return self.get_prefix_expression(re.compile('^[\*\/\%]'), MultiplicativeExpression, self.get_unary_expression)
    
    def get_unary_expression(self):
        return self.get_postfix_expression(re.compile('^[\+\-\!]'), UnaryExpression, self.get_primary_expression)
        
    def get_primary_expression(self):
        if self.content[0]=='(':
            primary_expression = BraceExpression()
            self.content = self.content[1:]
            expression = self.get_expression()
            primary_expression.append(expression)
            self.get_ws()
            if self.content[0]!=')':
                raise Exception()
            self.content = self.content[1:]
            self.get_ws()
            return primary_expression
        # number
        pattern = re.compile('^[0-9]+')
        match = pattern.match(self.content)
        if match:
            self.content = self.content[match.end(0):]
            self.get_ws()
            return int(match.group(0))
        # lookahead for value
        char = self.content[0]
        if char=='"' or char=="'" or char=='[' or char=='{':
            return self.get_value()
        # idref (with index?) or macrocall
        idref = self.get_idref()
        # check for index
        if self.content[0:2]=='[.':
            index=self.get_attr_index(idref)
            return index
        elif self.content[0]=='[':
            index=self.get_object_index(idref) 
            return index
        elif self.content[0]!='(':
            return idref
        primary_expression = MacroCall(idref)
        self.content = self.content[1:]
        self.get_ws()
        if self.content[0]!=')':
            expression = self.get_expression()
            primary_expression.args.append(expression)
            self.get_ws()
            while self.content[0]==',':
                self.content = self.content[1:]
                self.get_ws()
                expression=self.get_expression()
                primary_expression.args.append(expression)
                self.get_ws()
        if self.content[0]!=')':
            raise Exception()
        self.content=self.content[1:]
        self.get_ws()
        return primary_expression
    
    def get_idref(self):
        idref = Idref(self.get_id())
        if self.content[0:2]=='..':
            self.content = self.content[2:]
            id = self.get_id()
            idref = AttrIndex(idref, id, computed=False)
            return idref
        while self.content[0]=='.':
            self.content = self.content[1:]
            id = self.get_id()
            idref = ObjectIndex(idref, id, computed=False)
        return idref

