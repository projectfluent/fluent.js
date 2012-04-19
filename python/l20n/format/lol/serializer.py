from l20n.format.lol import ast
import sys
import re

if sys.version >= "3":
    basestring = str
    string = str
else:
    string = unicode

def is_string(string):
    return isinstance(string, basestring)

pattern = re.compile("([A-Z])")
def obj2methodname(obj):
    cname = obj.__class__.__name__
    chunks = pattern.split(cname)
    for i,chunk in enumerate(chunks):
        if i%2:
            chunks[i] = '_%s' % chunk.lower()
    return 'dump%s' % (''.join(chunks))

class SerializerError(Exception):
    pass

class Serializer():
    @classmethod
    def serialize(cls, node, default=False):
        #node._serialize = cls
        if default:
            cls.clean_template(node)
        s = string(node)
        return s

    @classmethod
    def clean_template(cls, node):
        for i in dir(node):
            if i.startswith('_template'):
                try:
                    delattr(node, i)
                except AttributeError:
                    pass
        if isinstance(node, list):
            for i in range(0, len(node)):
                cls.clean_template(node[i])
        elif hasattr(node, '_fields'):
            for i in node._fields:
                cls.clean_template(getattr(node, i))

    @classmethod
    def dump(cls, node):
        name = obj2methodname(node)
        try:
            method = getattr(cls, name)
            return method(node)
        except AttributeError:
            print(type(node))
            raise SerializerError('Unknown node')

    @classmethod
    def dump_l_o_l(cls, lol):
        return '\n'.join([cls.dump(elem) for elem in lol.body])

    @classmethod
    def dump_entity(cls, entity):
        index = "[%(index)s]" % entity if entity.index else ""
        attrs = ""
        value = " %(value)s" % entity if entity.value else ""
        return "<%(id)s%(index)s%(value)s%(attrs)s>" % {'id': entity.id,
                                                        'index': index,
                                                        'value': value,
                                                        'attrs': attrs}

    @classmethod
    def dump_identifier(cls, i):
        return i.name

    @classmethod
    def dump_string(cls, e):
        return '"%(content)s"' % e

    @classmethod
    def dump_comment(cls, comment):
        return '/*%(content)s*/' % comment

    @classmethod
    def dump_macro(cls, macro):
        idlist = "(%s)" % ', '.join([str(arg) for arg in macro.args])
        attrs = ""
        value = " {%(expression)s}" % macro
        return "<%(id)s%(idlist)s%(value)s%(attrs)s>" % {'id': macro.id,
                                                        'idlist': idlist,
                                                        'value': value,
                                                        'attrs': attrs}

    @classmethod
    def dump_prefix_expression(cls, exp):
        return "%(left)s %(operator)s %(right)s" % exp

    dump_binary_expression = dump_prefix_expression
    dump_logical_expression = dump_prefix_expression

    @classmethod
    def dump_postfix_expression(cls, exp):
        return "%(operator)s%(argument)s" % exp

    dump_unary_expression = dump_postfix_expression

    @classmethod
    def dump_parenthesis_expression(cls, exp):
        return "(%(expression)s)" % exp

    @classmethod
    def dump_operator(cls, op):
        return "%(token)s" % op

    dump_binary_operator = dump_operator
    dump_unary_operator = dump_operator
