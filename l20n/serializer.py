from l20n import ast
import sys

if sys.version <= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)


class Serializer():
    @classmethod
    def serialize(cls, lol):
        if hasattr(lol, '_struct') and lol._struct is True:
            string = ''.join([cls.dump_entry(element) for element in lol.body])
        else:
            string = '\n\n'.join([cls.dump_entry(element) for element in lol.body])
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
            kvplist += '\n '.join([cls.dump_kvp(k,v) for k,v in entity.attrs.items()])
        template = entity._template if struct else '<%s%s %s%s>'
        string = template % (entity.id.name,
                             index,
                             cls.dump_value(entity.value),
                             kvplist)
        return string

    @classmethod
    def dump_kvp(cls, key, value):
        if isinstance(value, list):
            return '%s: [%s]' % (key, ','.join(["\"%s\"" % v for v in value]))
        else:
            return '%s: "%s"' % (key, unicode(value))

    @classmethod
    def dump_value(cls, value):
        if isinstance(value, ast.StringValue):
            return '"%s"' % value.content
        elif isinstance(value, ast.ArrayValue):
            return '[%s]' % ', '.join(map(cls.dump_value, value.content))
        elif isinstance(value, ast.ObjectValue):
            return '{%s}' % ', '.join(map(cls.dump_kvp, value.content))

