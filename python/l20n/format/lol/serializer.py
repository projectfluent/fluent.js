from l20n import ast
import sys

if sys.version >= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)


class Serializer():
    @classmethod
    def serialize(cls, lol):
        if hasattr(lol, '_struct') and lol._struct is True:
            string = ''.join([cls.dump_entry(element) for element in lol.body])
        else:
            string = '\n'.join([cls.dump_entry(element, struct=False) for element in lol.body])
        return string

    @classmethod
    def dump_entry(cls, entry, struct=True):
        if isinstance(entry, ast.Entity):
            return cls.dump_entity(entry, struct=struct)
        elif isinstance(entry, ast.Comment):
            return cls.dump_comment(entry)
        elif isinstance(entry, ast.Macro):
            return cls.dump_macro(entry)
        elif isinstance(entry, ast.WS):
            return cls.dump_ws(entry)
        else:
            return unicode(entry)

    @classmethod
    def dump_ws(cls, ws):
        return ws.content

    @classmethod
    def dump_entity(cls, entity, struct=False):
        if entity.index:
            index = cls.dump_index(entity.index)
        else:
            index = ''
        kvplist = ''
        if entity.attrs:
            kvplist += '\n '
            kvplist += '\n '.join([cls.dump_kvp(kvp) for kvp in entity.attrs])
        template = entity._template if struct else '<%s%s %s%s>'
        string = template % (entity.id.name,
                             index,
                             cls.dump_value(entity.value),
                             kvplist)
        return string

    @classmethod
    def dump_kvp(cls, kvp):
        return '%s: %s' % (kvp.key.name,
                           cls.dump_value(kvp.value))

    @classmethod
    def dump_value(cls, value):
        if not value:
            return ''
        if isinstance(value, ast.String):
            return '"%s"' % value.content
        elif isinstance(value, ast.Array):
            return '[%s]' % ', '.join(map(cls.dump_value, value.content))
        elif isinstance(value, ast.Hash):
            return '{%s}' % ', '.join(map(cls.dump_kvp, value.content))


    @classmethod
    def dump_index(cls, index):
        return '[%s]' % cls.dump_expression(index)

    @classmethod
    def dump_expression(cls, expression):
        if isinstance(expression, ast.ConditionalExpression):
            return cls.dump_conditional_expression(expression)
        elif isinstance(expression, ast.LogicalExpression):
            return cls.dump_logical_expression(expression)
        elif isinstance(expression, ast.BinaryExpression):
            return cls.dump_binary_expression(expression)
        elif isinstance(expression, ast.UnaryExpression):
            return cls.dump_unary_expression(expression)
        elif isinstance(expression, ast.ParenthesisExpression):
            return cls.dump_brace_expression(expression)
        elif isinstance(expression, ast.MemberExpression):
            return cls.dump_macrocall(expression)
        elif isinstance(expression, ast.Identifier):
            return cls.dump_idref(expression)
        elif isinstance(expression, int):
            return str(expression)
        elif is_string(expression):
            return '"%s"' % expression

    @classmethod
    def dump_logical_expression(cls, e):
        s = cls.dump_expression(e[0])
        for i in range(0,1+int((len(e)-3)/2)):
            s = '%s%s%s' % (s, e[(i*2)+1], cls.dump_expression(e[2+(i*2)]))
        return s

    dump_binary_expression = dump_logical_expression 
    dump_equality_expression = dump_logical_expression
    dump_relational_expression = dump_logical_expression
    dump_additive_expression = dump_logical_expression
    dump_multiplicative_expression = dump_logical_expression
    dump_unary_expression = dump_logical_expression
    dump_brace_expression = dump_logical_expression

