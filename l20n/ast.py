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
    name = pyast.field(pyast.re('\w+'))

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
    body = pyast.field(Expression)

### Values

class String(Value):
    content = pyast.field(str)

class Array(Value):
    content = pyast.seq(Value)

class Hash(Value):
    content = pyast.seq(KeyValuePair)

class Int(Value):
    content = pyast.field(int)

### Operators

class UnaryOperator(Operator):
    token = pyast.field(("-", "+", "!", "~", "typeof", "void", "delete"))


class BinaryOperator(Operator):
    token = pyast.field(("==", "!=", "===", "!==", "<", "<=", ">", ">=",
                           "<<", ">>", ">>>", "+", "-", "*", "/", "%", "|",
                           "^", "in", "instanceof", ".."))


class LogicalOperator(Operator):
    token = pyast.field(("||", "&&"))


class AssignmentOperator(Operator):
    token = pyast.field(("=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=",
                         ">>>=", "|=", "^=", "&="))

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
    prefix = pyast.field(bool, default=False)

class CallExpression(Expression):
    callee = pyast.field(Expression)
    arguments = pyast.seq(Expression, null=True)

class LogicalExpression(Expression):
    pass

class MemberExpression(Expression):
    pass

class AttributeExpression(Expression):
    pass

class ParenthesisExpression(Expression):
    pass
