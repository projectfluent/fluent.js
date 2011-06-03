from silme.core import Structure, Comment as BaseComment
from silme.core.entity import Entity as BaseEntity, SimpleValue, is_string, is_entity
from silme.core.types.odict import OrderedDict
import re

class LOL(Structure):
    def add(self, element):
        if element is not None:
            self.add_element(element)

    def add_element(self, element, pos=None):
        """
        overwrite silme.core.Structure.add_element
        """
        if element == None:
            return 0
        t = type(element).__name__[0]
        if is_string(element):
            return self.add_string(element, pos)
        elif is_entity(element):
            return self.add_entity(element, pos)
        elif isinstance(t, Comment):
            return self.add_comment(element, pos)
        else:
            self.append(element)

class WS():
    def __init__(self, content):
        self.content = content

class Group():
    def __init__(self):
        self.structure = []

    def add(self, entry):
        self.structure.append(entry)

class ComplexStringValue(SimpleValue):
    pattern = re.compile(r'{{([^}]*)}}')

    def __init__(self):
        self.pieces = []

    def get(self, *args, **kwargs):
        return ''.join([str(piece) for piece in self.pieces])

    def __repr__(self):
        return ''.join([str(piece) for piece in self.pieces])

    def __str__(self):
        return ''.join([str(piece) for piece in self.pieces])

class Entity(BaseEntity):
    def __init__(self, id, value=None):
        BaseEntity.__init__(self, id, value)
        self.kvplist = OrderedDict()
        self.index = []
    
class Comment(BaseComment):
    def __init__(self, content=None):
        self.content = content

class Index(list):
    def __init__(self):
        list.__init__(self)

class Expander():
    def __init__(self):
        self.expression = None

    def __repr__(self):
        return '{{%s}}' % str(self.expression) 

class Macro(object):
    def __init__(self, id=None):
        self.id = id
        self.structure=[]
        self.idlist = []
        self.kvplist = OrderedDict()

class Operator(str):
    pass

class KeyValuePair():
    def __init__(self, key=None, value=None):
        self.key = key
        self.value = value
        self.ws = []
    
    def add(self, value):
        if isinstance(self.value, list):
            self.value.append(value)
        elif self.value is not None:
            self.value = [self.value, value]
        else:
            self.value = value

class OperatorExpression(list):
    def __repr__(self):
        return ''.join([str(i) for i in self])

class ConditionalExpression(OperatorExpression):
    pass

class OrExpression(OperatorExpression):
    pass

class AndExpression(OperatorExpression):
    pass

class EqualityExpression(OperatorExpression):
    pass

class RelationalExpression(OperatorExpression):
    pass

class AdditiveExpression(OperatorExpression):
    pass

class MultiplicativeExpression(OperatorExpression):
    pass

class UnaryExpression(OperatorExpression):
    pass

class BraceExpression(list):
    pass

class MacroCall():
    def __init__(self, idref):
        self.idref = idref
        self.args = []

class ObjectIndex():
    def __init__(self, idref, arg=None, computed=False):
        self.idref = idref
        self.arg = arg
        self.computed = computed

class AttrIndex():
    def __init__(self, idref, arg=None, computed=False):
        self.idref = idref
        self.arg = arg
        self.computed = computed

class Idref(object):
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return self.name


