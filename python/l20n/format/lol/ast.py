import pyast
import sys

if sys.version >= '3':
    basestring = str

class Node(pyast.Node):
    _abstract = True
    _debug = True

class Entry(Node):
    _abstract = True

class LOL(Node):
    body = pyast.seq(Entry, null=True)

class Expression(Node):
    _abstract = True

class Statement(Entry):
    _abstract = True

class Value(Expression):
    _abstract = True

class Operator(Node):
    _abstract = True

class Identifier(Expression):
    name = pyast.field(pyast.re('[_a-zA-Z]\w*'))

class VariableExpression(Expression):
    id = pyast.field(Identifier)

class Expander(Node):
    expression = pyast.field(Expression)

class KeyValuePair(Node):
    key = pyast.field(Identifier)
    value = pyast.field(Value)
    _abstract = True

class HashItem(KeyValuePair):
    default = pyast.field(bool, default=False)

class Attribute(KeyValuePair):
    local = pyast.field(bool, default=False)

### Entries

class Entity(Entry):
    id = pyast.field(Identifier)
    index = pyast.seq(Expression, null=True)
    value = pyast.field(Value, null=True)
    attrs = pyast.seq(Attribute, null=True)
    local = pyast.field(bool, default=False)

class Comment(Entry):
    content = pyast.field(str, null=True)

class Macro(Entry):
    id = pyast.field(Identifier)
    args = pyast.seq(VariableExpression)
    expression = pyast.field(Expression)
    attrs = pyast.seq(Attribute, null=True)

### Values

class String(Value):
    content = pyast.field(basestring)

class ComplexString(String):
    content = pyast.seq((str, Expression))

class Array(Value):
    content = pyast.seq(Value, null=True)

class Hash(Value):
    content = pyast.seq(HashItem, null=True)

### Statements

class ImportStatement(Statement):
    uri = pyast.field(String)

### Operators

class UnaryOperator(Operator):
    token = pyast.field(("-", "+", "!"))


class BinaryOperator(Operator):
    token = pyast.field(("==", "!=", "<", "<=", ">", ">=",
                         "+", "-", "*", "/", "%"))


class LogicalOperator(Operator):
    token = pyast.field(("||", "&&"))

### Expressions

class Literal(Expression):
    value = pyast.field(int)
    _template = '%(value)s'

class LogicalExpression(Expression):
    operator = pyast.field(LogicalOperator)
    left = pyast.field(Expression)
    right = pyast.field(Expression)

class BinaryExpression(Expression):
    operator = pyast.field(BinaryOperator)
    left = pyast.field(Expression)
    right = pyast.field(Expression)

class ConditionalExpression(Expression):
    test = pyast.field(Expression)
    consequent = pyast.field(Expression)
    alternate = pyast.field(Expression)

class UnaryExpression(Expression):
    operator = pyast.field(UnaryOperator)
    argument = pyast.field(Expression)

class MemberExpression(Expression):
    _abstract = True

class CallExpression(MemberExpression):
    callee = pyast.field(Expression)
    arguments = pyast.seq(Expression, null=True)

class PropertyExpression(MemberExpression):
    expression = pyast.field(Expression)
    property = pyast.field(Expression)
    computed = pyast.field(bool)

class AttributeExpression(MemberExpression):
    expression = pyast.field(Expression)
    attribute = pyast.field(Expression)
    computed = pyast.field(bool)

class ParenthesisExpression(Expression):
    expression = pyast.field(Expression)

class ThisExpression(Expression):
    pass

class GlobalsExpression(Expression):
    id = pyast.field(Identifier)



