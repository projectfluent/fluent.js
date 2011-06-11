import pyast

class Node(pyast.Node):
    _debug = False

class Entry(Node):
    pass

class WS(Node):
    content = pyast.field(str)

class Value(Node):
    pass

class Expression(Node):
    pass

class Operator(Node):
    pass

class Identifier(Node):
    name = pyast.field(str)

class Expander(Node):
    expression = pyast.field(Expression)

class LOL(Node):
    body = pyast.seq((Entry, WS), null=True)

class KeyValuePair(Node):
    key = pyast.field(Identifier)
    value = pyast.field(Value)

class Entity(Entry):
    id = pyast.field(Identifier)
    index = pyast.seq(Expression, null=True)
    value = pyast.field(Value)
    attrs = pyast.seq(KeyValuePair, null=True)

class ComplexStringValue(Value):
    content = pyast.seq((str, Expander))

class StringValue(Value):
    content = pyast.field(str)

class ArrayValue(Value):
    content = pyast.seq(Value)

class ObjectValue(Value):
    content = pyast.seq(KeyValuePair)

class Comment(Entry):
    content = pyast.field(str, null=True)

class Macro(Entry):
    id = pyast.field(Identifier)
    args = pyast.seq(Identifier)
    body = pyast.field(Expression)

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
