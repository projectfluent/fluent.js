import pyast

class Node(pyast.Node):
    _abstract = True
    _debug = False

class Entry(Node):
    _abstract = True

class LOL(Node):
    body = pyast.seq(Entry, null=True)

class Expression(Node):
    _abstract = True

class Value(Expression):
    _abstract = True

class Operator(Node):
    _abstract = True

class Identifier(Expression):
    name = pyast.field(pyast.re('[a-zA-Z]\w*'))

class Expander(Node):
    expression = pyast.field(Expression)


class KeyValuePair(Node):
    key = pyast.field(Identifier)
    value = pyast.field(Value)

### Entries

class Entity(Entry):
    id = pyast.field(Identifier)
    index = pyast.seq(Expression, null=True)
    value = pyast.field(Value, null=True)
    attrs = pyast.seq(KeyValuePair, null=True)

class Comment(Entry):
    content = pyast.field(str, null=True)

class Macro(Entry):
    id = pyast.field(Identifier)
    args = pyast.seq(Identifier)
    expression = pyast.field(Expression)
    attrs = pyast.seq(KeyValuePair, null=True)

### Values

class String(Value):
    content = pyast.field(str)

class Array(Value):
    content = pyast.seq(Value, null=True)

class Hash(Value):
    content = pyast.seq(KeyValuePair, null=True)

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
    value = pyast.field((bool, int))

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

class CallExpression(Expression):
    callee = pyast.field(Identifier)
    arguments = pyast.seq(Expression, null=True)

class LogicalExpression(Expression):
    operator = pyast.field(LogicalOperator)
    left = pyast.field(Expression)
    right = pyast.field(Expression)

class MemberExpression(Expression):
    object = pyast.field(Identifier)
    property = pyast.field(Expression)
    computed = pyast.field(bool)

class AttributeExpression(Expression):
    object = pyast.field(Identifier)
    attribute = pyast.field(Expression)
    computed = pyast.field(bool)

class ParenthesisExpression(Expression):
    expression = pyast.field(Expression)
