import l20n.ast as l20n
import sys

if sys.version <= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)


import re

class Serializer():
    @classmethod
    def serialize(cls, l10nobject):
        string = '\n\n'.join([cls.dump_element(element) for element in l10nobject])
        return string

    @classmethod
    def dump_element(cls, element):
        if isinstance(element, l20n.Entity):
            return cls.dump_entity(element)
        elif isinstance(element, l20n.Comment):
            return cls.dump_comment(element)
        elif isinstance(element, l20n.Macro):
            return cls.dump_macro(element)
        else:
            return unicode(element)

    @classmethod
    def dump_entity(cls, entity):
        if isinstance(entity, l20n.Entity):
            if entity.index:
                index = cls.dump_index(entity.index)
            else:
                index = ''
            string = '<%s%s %s' % (entity.id, index, cls.dump_value(entity.values))
            if entity.kvplist:
                string += '\n '
                string += '\n '.join([cls.dump_kvp(k,v) for k,v in entity.kvplist.items()])
            string += '>'
        else:
            string = '<%s "%s">' % (entity.id, unicode(entity.values))
        return string

    @classmethod
    def dump_kvp(cls, key, value):
        if isinstance(value, list):
            return '%s: [%s]' % (key, ','.join(["\"%s\"" % v for v in value]))
        else:
            return '%s: "%s"' % (key, unicode(value))

    @classmethod
    def dump_entitylist(cls, elist, fallback=None):
        if not fallback:
            fallback = elist.fallback
        string = ''.join([cls.dump_entity(entity, fallback)+'\n' for entity in elist.get_entities()])
        return string

    @classmethod
    def dump_value(cls, value):
        if is_string(value):
            return '"%s"' % cls.dump_string(value)
        if isinstance(value, list):
            return '[%s]' % ','.join(map(cls.dump_value, value))
        if isinstance(value, dict):
            multiline = True
            lineend = '\n' if multiline else ''
            inc = ' ' if multiline else ''
            vals = ['%s%s: %s' % (inc,
                                  k,
                                  cls.dump_value(i)) for k,i in value.items()]
            delim = ',%s' % lineend
            return '{%s%s%s}' % (lineend, delim.join(vals), lineend)

    @classmethod
    def dump_string(cls, value):
        if isinstance(value, l20n.ComplexStringValue):
            pieces = []
            for i in value.pieces:
                if is_string(i):
                    pieces.append(i)
                elif isinstance(i, l20n.Expander):
                    pieces.append(cls.dump_expander(i))
            return ''.join(pieces)
        return value

    @classmethod
    def dump_macro(cls, macro):
        return '<%s(%s)->{%s}>' % (macro.id,
                                   cls.dump_idlist(macro.idlist),
                                   cls.dump_expression(macro.structure[0]))

    @classmethod
    def dump_idlist(cls, idlist):
        return ','.join(idlist)

    @classmethod
    def dump_comment(cls, comment):
        string = ''
        if isinstance(comment, l20n.Comment):
          string = comment.content
        else:
            for element in comment:
                string += cls.dump_element(element)
        if string.find('\n')!=-1:
            string = re.sub('(?ms)^\s*(.*)\s*$','/* \n\\1\n */', string)
        else:
            string = re.sub('^\s*(.*)\s*$','/* \\1 */', string)
        string = re.sub('\n(?! \*)', '\n * ', string)
        return string

    @classmethod
    def dump_index(cls, index):
        elems = map(cls.dump_expression, index)
        return '[%s]' % ', '.join(elems)

    @classmethod
    def dump_expander(cls, expander):
        return '{{%s}}' % cls.dump_expression(expander.expression)

    @classmethod
    def dump_expression(cls, expression):
        if isinstance(expression, l20n.ConditionalExpression):
            return cls.dump_conditional_expression(expression)
        if isinstance(expression, l20n.OrExpression):
            return cls.dump_or_expression(expression)
        if isinstance(expression, l20n.AndExpression):
            return cls.dump_and_expression(expression)
        if isinstance(expression, l20n.EqualityExpression):
            return cls.dump_equality_expression(expression)
        if isinstance(expression, l20n.RelationalExpression):
            return cls.dump_relational_expression(expression)
        if isinstance(expression, l20n.AdditiveExpression):
            return cls.dump_additive_expression(expression)
        if isinstance(expression, l20n.MultiplicativeExpression):
            return cls.dump_multiplicative_expression(expression)
        if isinstance(expression, l20n.UnaryExpression):
            return cls.dump_unary_expression(expression)
        if isinstance(expression, l20n.BraceExpression):
            return cls.dump_brace_expression(expression)
        if isinstance(expression, l20n.MacroCall):
            return cls.dump_macrocall(expression)
        if isinstance(expression, l20n.Idref):
            return cls.dump_idref(expression)
        if isinstance(expression, int):
            return str(expression)
        if is_string(expression):
            return '"%s"' % expression

    @classmethod
    def dump_conditional_expression(cls, expression):
        x = [cls.dump_expression(i) for i in expression]
        return '%s?%s:%s' % tuple(x)

    @classmethod
    def dump_or_expression(cls, e):
        s = cls.dump_expression(e[0])
        for i in range(0,1+int((len(e)-3)/2)):
            s = '%s%s%s' % (s, e[(i*2)+1], cls.dump_expression(e[2+(i*2)]))
        return s

    dump_and_expression = dump_or_expression 
    dump_equality_expression = dump_or_expression
    dump_relational_expression = dump_or_expression
    dump_additive_expression = dump_or_expression
    dump_multiplicative_expression = dump_or_expression
    dump_unary_expression = dump_or_expression
    dump_brace_expression = dump_or_expression

    @classmethod
    def dump_macrocall(cls, exp):
        return '%s(%s)' % (exp.idref,
                           ', '.join(map(cls.dump_expression, exp.args)))

    @classmethod
    def dump_idref(cls, idref):
        return '.'.join(idref)

