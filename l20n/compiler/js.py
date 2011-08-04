import l20n.ast as l20n
import pyjs.ast as js
from copy import deepcopy

import sys

if sys.version >= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)

class CompilerError(Exception):
    pass

###
# Don't bother reading it for the sake of learning
# It's just a temporary code that evolves over time and gets ugly in the 
# process
# as we're trying to come up with what should the JS code look like
###
class Compiler(object):

    @classmethod
    def compile(cls, lol, insert_header=False):
        prog = cls.transform_into_js(lol)
        if insert_header:
            cls.insert_header_func(prog.body)
        return prog

    @classmethod
    def insert_header_func(cls, prog):
        body = js.BlockStatement([
            js.VariableDeclaration(
                js.LET,
                [js.VariableDeclarator(js.Identifier("entity"),
                                       init=js.Literal(js.NULL))]),
            js.IfStatement(
                js.BinaryExpression(
                    js.BinaryOperator("=="),
                    js.UnaryExpression(
                        js.UnaryOperator("typeof"),
                        js.MemberExpression(
                            obj=js.Identifier("env"),
                            prop=js.Identifier("name"),
                            computed=True),
                        prefix=True),
                    js.Literal("function")),
                js.ExpressionStatement(
                    js.AssignmentExpression(
                        js.AssignmentOperator('='),
                        js.Identifier('entity'),
                        js.CallExpression(
                            js.MemberExpression(
                                js.Identifier('env'),
                                js.Identifier('name'),
                                True),
                            [js.Identifier('env'), js.Identifier('index')]))),
                js.ExpressionStatement(
                    js.AssignmentExpression(
                        js.AssignmentOperator('='),
                        js.Identifier('entity'),
                        js.MemberExpression(
                            js.Identifier('env'),
                            js.Identifier('name'),
                            True)))),
            js.IfStatement(
                js.BinaryExpression(
                    js.BinaryOperator('!=='),
                    js.Identifier('index'),
                    js.Identifier('undefined')),
                js.ForInStatement(
                    js.Identifier('i'),
                    js.Identifier('index'),
                    js.ExpressionStatement(
                        js.AssignmentExpression(
                            js.AssignmentOperator('='),
                            js.Identifier('entity'),
                            js.MemberExpression(
                                js.Identifier('entity'),
                                js.MemberExpression(
                                    js.Identifier('index'),
                                    js.Identifier('i'),
                                    True),
                                True))))),
            js.IfStatement(
                js.BinaryExpression(
                    js.BinaryOperator('=='),
                    js.UnaryExpression(
                        js.UnaryOperator("typeof"),
                        js.Identifier("entity"),
                        prefix=True),
                    js.Literal("function")),
                js.ReturnStatement(
                    js.CallExpression(
                        js.Identifier('entity'),
                        [js.Identifier('env')])),
                ),
            js.ReturnStatement(js.Identifier('entity'))
        ])
        f = js.FunctionDeclaration(id=js.Identifier("getent"),
                                   params=[js.Identifier('env'),
                                           js.Identifier('name'),
                                           js.Identifier('index')],
                                   body=body)
        prog.append(f)
        prog.append(js.ExpressionStatement(
            js.AssignmentExpression(
                js.AssignmentOperator('='),
                js.MemberExpression(
                    js.ThisExpression(),
                    js.Identifier('getent'),
                    False),
                js.Identifier('getent'))))
        body =  js.BlockStatement([
            js.ReturnStatement(
                js.CallExpression(
                    js.MemberExpression(
                        js.Identifier('env'),
                        js.Identifier('name'),
                        True),
                [js.Identifier('env'), js.Identifier('args')]))])

        f = js.FunctionDeclaration(id=js.Identifier("getmacro"),
                                   params=[js.Identifier('env'),
                                           js.Identifier('name'),
                                           js.Identifier('args')],
                                   body=body)
        prog.append(f)
        body = js.BlockStatement([
            js.VariableDeclaration(
                js.LET,
                [js.VariableDeclarator(js.Identifier("attr"),
                                       init=js.MemberExpression(
                                               js.MemberExpression(
                                                   js.MemberExpression(
                                                       js.Identifier('env'),
                                                       js.Identifier('name'),
                                                       True),
                                                   js.Identifier('attrs'),
                                                   False),
                                               js.Identifier('param'),
                                               True))]),
            js.IfStatement(
                js.BinaryExpression(
                    js.BinaryOperator('=='),
                    js.UnaryExpression(
                        js.UnaryOperator("typeof"),
                        js.Identifier("attr"),
                        prefix=True),
                    js.Literal("function")),
                js.ReturnStatement(
                    js.CallExpression(
                        js.Identifier('attr'),
                        [js.Identifier('env')])),
                ),
            js.ReturnStatement(js.Identifier('attr'))
        ])

        f = js.FunctionDeclaration(id=js.Identifier("getattr"),
                                   params=[js.Identifier('env'),
                                           js.Identifier('name'),
                                           js.Identifier('param')],
                                   body=body)
        prog.append(f)
        return prog

    @classmethod
    def transform_into_js(cls, lol):
        script = js.Program()
        for elem in lol.body:
            if isinstance(elem, l20n.Comment):
                cls.transform_comment(elem, script)
            elif isinstance(elem, l20n.Entity):
                cls.transform_entity(elem, script)
            elif isinstance(elem, l20n.Macro):
                cls.transform_macro(elem, script)
        return script

    @classmethod
    def transform_comment(cls, comment, script):
        c = js.Comment(comment.content)
        script.append(c)

    @classmethod
    def transform_entity(cls, entity, script):
        name = js.MemberExpression(
                    js.ThisExpression(),
                    js.Identifier(entity.id.name),
                    False)
        l20nval = entity.value
        # do we need to keep the entity resolvable per call
        is_static = True
        has_attrs = bool(entity.attrs)
        has_index = bool(entity.index)
        requires_object = not has_index and has_attrs
        
        if has_index:
            is_static = False
        
        (jsval, breaks_static) = cls.transform_value(l20nval, requires_object=requires_object)
        if breaks_static:
            is_static = False
        
        if is_static:
            script.body.append(js.ExpressionStatement(
                js.AssignmentExpression(
                    js.AssignmentOperator('='),
                    name,
                    jsval)))
        else:
            func = js.FunctionExpression(params=[js.Identifier('env'),],
                                         body=js.BlockStatement())

            if has_index:
                func.params.append(js.Identifier('index'))
                ret = js.ReturnStatement(js.Identifier('x'))
                func.body.body.append(js.IfStatement(
                                 js.BinaryExpression(
                                    js.BinaryOperator('!=='),
                                    js.Identifier('index'),
                                    js.Identifier('undefined')),
                                ret))

                obj = js.Identifier('x')
                for i in entity.index:
                    obj = js.MemberExpression(
                        obj,
                        cls.transform_expression(i),
                        True)
                func.body.body.append(js.ReturnStatement(obj))
                if isinstance(jsval, js.BinaryExpression):
                    jsval = js.FunctionExpression(
                        id=None,
                        params=['env'],
                        body=js.ReturnStatement(jsval))
                val = js.VariableDeclarator(js.Identifier("x"), jsval) 
                let = js.LetExpression([val], func)
                script.body.append(js.ExpressionStatement(
                    js.AssignmentExpression(js.AssignmentOperator('='), name, let)))
            else:
                func.body.body.append(js.ReturnStatement(jsval))
                script.body.append(js.ExpressionStatement(
                    js.AssignmentExpression(js.AssignmentOperator('='), name, func)))
        
        if has_attrs:
            attrs = js.ObjectExpression()
            for kvp in entity.attrs:
                (val, breaks_static) = cls.transform_value(kvp.value, requires_object=False)
                if breaks_static:
                    val = js.FunctionExpression(
                        id=None,
                        params=[js.Identifier('env')],
                        body=js.BlockStatement([js.ReturnStatement(val)])
                    )
                attrs.properties.append(js.Property(js.Identifier(kvp.key.name), val))
            script.body.append(
                js.ExpressionStatement(
                    js.AssignmentExpression(
                        js.AssignmentOperator('='),
                        js.MemberExpression(name, js.Identifier('attrs'), False),
                        attrs)))

    @classmethod
    def transform_macro(cls, macro, script):
        name = js.MemberExpression(js.ThisExpression(),js.Identifier(macro.id.name), False)
        exp = cls._transform_macro_idrefs(macro.expression, [arg.name for arg in macro.args])
        body = cls.transform_expression(exp)
        func = js.FunctionExpression(
            params = [js.Identifier('env'), js.Identifier('data')],
            body = js.BlockStatement([js.ReturnStatement(body)])

        )
        script.body.append(js.ExpressionStatement(
            js.AssignmentExpression(js.AssignmentOperator('='), name, func)))

    @classmethod
    def _transform_macro_idrefs(cls, expression, ids):
        exp = deepcopy(expression)
        for field in exp._fields:
            attr = getattr(exp, field)
            if isinstance(attr, l20n.Identifier):
                if attr.name in ids:
                    n = l20n.PropertyExpression(l20n.Identifier('data'),
                                                l20n.Literal(ids.index(attr.name)))

                    setattr(exp, field, n)
            elif isinstance(attr, l20n.Expression):
                setattr(exp, field, cls._transform_macro_idrefs(attr, ids))
        return exp

    @classmethod
    def transform_index(cls, index):
        func = js.Function()
        selector = js.Array()
        for i in index:
            selector.append(cls.transform_expression(i))
        selid = js.Idref('selector')
        func.append(js.Let(selid, selector))
        ret = js.Idref('this')
        num = 0
        for i in index:
            ret = js.Index(ret, js.Index(selid, js.Int(num)))
            num += 1
        ret = js.Return(ret)
        func.append(ret)
        return func

    @classmethod
    def transform_value(cls, l20nval, requires_object=False):
        val = None
        
        # does the value brake static?
        breaks_static = False

        if isinstance(l20nval, l20n.String):
            if isinstance(l20nval, l20n.ComplexString):
                s = cls.transform_complex_string(l20nval)
                breaks_static = True
                val = s
            else:
                s = js.Literal(l20nval.content)
                if requires_object:
                    val = js.NewExpression(
                        js.Identifier("String"),
                        [s])
                else:
                    val = s
        elif isinstance(l20nval, l20n.Array):
            vals = [cls.transform_value(i, requires_object=False) for i in l20nval.content]
            val = js.ArrayExpression()
            for v in vals:
                if v[1]:
                    breaks_static = True
                val.elements.append(v[0])
        elif isinstance(l20nval, l20n.Hash):
            vals = []
            for kvp in l20nval.content:
                (subval, b_static) = cls.transform_value(kvp.value)
                if b_static:
                    vals.append(
                        js.Property(
                            js.Literal(kvp.key.name),
                            js.FunctionExpression(
                                params=[js.Identifier('env')],
                                body=js.BlockStatement([js.ReturnStatement(subval)]))
                        )
                    )
                else:
                    vals.append(js.Property(js.Literal(kvp.key.name), subval))
            val = js.ObjectExpression(vals)
        elif l20nval is None:
            if requires_object:
                val = js.NewExpression(js.CallExpression(js.Identifier('Object')))
            else:
                val = js.Literal(js.NULL)
        else:
            #print(is_string(l20nval))
            #print(type(l20nval))
            raise Exception("Unknown l20nval")
        return (val, breaks_static)

    @classmethod
    def transform_complex_string(cls, val):
        if len(val.content)<2:
            piece = val.content[0]
            if isinstance(piece, l20n.Expression):
                return cls.transform_expression(piece)
            else:
                return val.pieces[0]
        pieces = val.content[:]
        r = cls.transform_expression(pieces.pop())
        while len(pieces)>0:
            l = cls.transform_expression(pieces.pop())
            r = js.BinaryExpression(js.BinaryOperator('+'), l, r)
        return r

    @classmethod
    def transform_identifier(cls, exp):
        idref = js.CallExpression(js.Identifier('getent'))
        idref.arguments.append(js.Identifier('env'))
        idref.arguments.append(js.Literal(exp.name))
        return idref

    @classmethod
    def transform_expression(cls, exp):
        if isinstance(exp, l20n.Expander):
            return cls.transform_expression(exp.expression)
        if isinstance(exp, l20n.ConditionalExpression):
            jsexp = js.ConditionalExpression(
                cls.transform_expression(exp.test),
                cls.transform_expression(exp.consequent),
                cls.transform_expression(exp.alternate)
            )
            return jsexp
        if isinstance(exp, l20n.LogicalExpression):
            return js.LogicalExpression(
                js.LogicalOperator(exp.operator.token),
                cls.transform_expression(exp.left),
                cls.transform_expression(exp.right)
            )
        elif isinstance(exp, l20n.BinaryExpression):
            return js.BinaryExpression(
                js.BinaryOperator(exp.operator.token),
                cls.transform_expression(exp.left),
                cls.transform_expression(exp.right)
            )
        elif isinstance(exp, l20n.UnaryExpression):
            jsexp = js.UnaryExpression()
        if isinstance(exp, l20n.ParenthesisExpression):
            jsexp = js.BraceExpression()
            jsexp.append(cls.transform_expression(exp[0]))
            return jsexp 
        if isinstance(exp, l20n.Identifier):
            return cls.transform_identifier(exp)
        if isinstance(exp, l20n.Literal):
            val = exp.value
            if isinstance(val, int):
                return js.Literal(val)
            elif isinstance(val, str):
                return js.Literal(val)
        if isinstance(exp, l20n.Value):
            return cls.transform_value(exp, requires_object=False)[0]
        if isinstance(exp, int):
            return js.Literal(exp)
        if isinstance(exp, l20n.CallExpression):
            args = map(cls.transform_expression, exp.arguments)
            return js.CallExpression(js.Identifier('getmacro'),
                           [js.Identifier('env'),
                            js.Literal(exp.callee.name),
                            js.ArrayExpression(args)])
        elif isinstance(exp, (l20n.AttributeExpression, l20n.PropertyExpression)):
            name = None
            index = []
            attr = None
            subexp = exp
            while isinstance(subexp, l20n.PropertyExpression):
                if isinstance(subexp.property, l20n.Identifier):
                    index.append(js.Literal(subexp.property.name))
                else:
                    arg = cls.transform_expression(subexp.property)
                    if isinstance(arg, js.Literal):
                        index.append(arg)
                if isinstance(subexp.expression, l20n.Identifier):
                    name = js.Literal(subexp.expression.name)
                    break
                elif isinstance(subexp.expression, l20n.PropertyExpression):
                    subexp = subexp.expression
                else:
                    subexp = subexp.expression
                    break
            index.reverse()
            if isinstance(subexp, l20n.AttributeExpression):
                name = js.Literal(subexp.expression.name)
                if isinstance(subexp.attribute, l20n.Identifier):
                    attr = js.Literal(subexp.attribute.name)
                else:
                    attr = cls.transform_expression(subexp.attribute)
            if attr:
                idref = js.CallExpression(js.Identifier('getattr'))
                idref.arguments.append(js.Identifier('env'))
                idref.arguments.append(name)
                idref.arguments.append(attr)
                if index:
                    idref.arguments.append(js.ArrayExpression(index))
                return idref
            else:
                idref = js.CallExpression(js.Identifier('getent'))
                idref.arguments.append(js.Identifier('env'))
                idref.arguments.append(name)
                if index:
                    idref.arguments.append(js.ArrayExpression(index))
                return idref
        print(exp)

