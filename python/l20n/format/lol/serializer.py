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

