import l20n.ast as l20n
from pyjs.serializer import Serializer
import pyjs.ast as js
from copy import deepcopy

import sys

if sys.version >= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)

###
# Don't bother reading it for the sake of learning
# It's just a temporary code that evolves over time and gets ugly in the 
# process
# as we're trying to come up with what should the JS code look like
###
class Compiler(object):

    def compile(self, lol):
        prog = self.transform_into_js(lol)
        self.insert_header_func(prog.body)
        serializer = Serializer()
        string = serializer.dump_program(prog)
        return string

    def insert_header_func(self, prog):
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
        
        prog.insert(0, f)
        prog.insert(1, js.ExpressionStatement(
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
        prog.insert(2, f)
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
        prog.insert(3, f)
        return prog

    def transform_into_js(self, lol):
        script = js.Program()
        for elem in lol:
            if isinstance(elem, l20n.Comment):
                self.transform_comment(elem, script)
            if isinstance(elem, l20n.Entity):
                self.transform_entity(elem, script)
            if isinstance(elem, l20n.Macro):
                self.transform_macro(elem, script)
        return script

    def transform_comment(self, comment, script):
        c = js.Comment(comment.content)
        script.append(c)

    def _replace_local_idrefs(self, eid, attr):
        if isinstance(attr, js.Idref):
            if attr[1] == eid:
                attr = js.Idref('x')+attr[2:]
        elif isinstance(attr, js.OperatorExpression):
            for i,elem in enumerate(attr):
                attr[i] = self._replace_local_idrefs(eid, elem)
        elif isinstance(attr, js.String):
            attr = js.String(self._replace_local_idrefs(eid, attr.data))
        return attr

    def transform_entity(self, entity, script):
        name = js.MemberExpression(
                    js.ThisExpression(),
                    js.Identifier(str(entity.id)),
                    False)
        l20nval = entity.values
        # do we need to keep the entity resolvable per call
        is_static = True
        has_attrs = len(entity.kvplist)>0
        has_index = len(entity.index)>0
        requires_object = not has_index and has_attrs
        
        if has_index:
            is_static = False
        
        (jsval, breaks_static) = self.transform_value(l20nval, requires_object=requires_object)
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
                        self.transform_expression(i),
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
            for k,v in entity.kvplist.items():
                (val, breaks_static) = self.transform_value(v, requires_object=False)
                if breaks_static:
                    val = js.FunctionExpression(
                        id=None,
                        params=[js.Identifier('env')],
                        body=js.BlockStatement([js.ReturnStatement(val)])
                    )
                attrs.properties.append(js.Property(js.Literal(k), val))
            script.body.append(
                js.ExpressionStatement(
                    js.AssignmentExpression(
                        js.AssignmentOperator('='),
                        js.MemberExpression(name, js.Identifier('attrs'), False),
                        attrs)))

    def transform_macro(self, macro, script):
        name = js.MemberExpression(js.ThisExpression(),js.Identifier(macro.id), False)
        exp = self._transform_macro_idrefs(macro.structure[0], macro.idlist)
        body = self.transform_expression(exp)
        func = js.FunctionExpression(
            params = [js.Identifier('env'), js.Identifier('data')],
            body = js.BlockStatement([js.ReturnStatement(body)])

        )
        script.body.append(js.ExpressionStatement(
            js.AssignmentExpression(js.AssignmentOperator('='), name, func)))

    def _transform_macro_idrefs(self, expression, ids):
        exp = deepcopy(expression)
        for n,elem in enumerate(exp):
            if isinstance(elem, l20n.Idref):
                if elem.name in ids:
                    exp[n] = l20n.ObjectIndex(l20n.Idref("data"), ids.index(elem.name))
            elif isinstance(elem, (l20n.OperatorExpression, l20n.BraceExpression)):
                exp[n] = self._transform_macro_idrefs(elem, ids)
            elif isinstance(elem, l20n.MacroCall):
                exp[n].args = self._transform_macro_idrefs(exp[n].args, ids)
        return exp

    def transform_index(self, index):
        func = js.Function()
        selector = js.Array()
        for i in index:
            selector.append(self.transform_expression(i))
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

    def transform_value(self, l20nval, requires_object=False):
        val = None
        
        # does the value brake static?
        breaks_static = False

        if is_string(l20nval):
            if isinstance(l20nval, l20n.ComplexStringValue):
                s = self.transform_complex_string(l20nval)
                breaks_static = True
                val = s
            else:
                s = js.Literal(str(l20nval))
                if requires_object:
                    val = js.NewExpression(
                        js.Identifier("String"),
                        [s])
                else:
                    val = s
        elif isinstance(l20nval, list):
            vals = [self.transform_value(i, requires_object=False) for i in l20nval]
            val = js.ArrayExpression()
            for v in vals:
                if v[1]:
                    breaks_static = True
                val.elements.append(v[0])
        elif isinstance(l20nval, dict):
            vals = []
            for k,v in l20nval.items():
                (subval, b_static) = self.transform_value(v)
                if b_static:
                    vals.append(
                        js.Property(
                            js.Literal(k),
                            js.FunctionExpression(
                                params=[js.Identifier('env')],
                                body=js.BlockStatement([js.ReturnStatement(subval)]))
                        )
                    )
                else:
                    vals.append(js.Property(js.Literal(k), subval))
            val = js.ObjectExpression(vals)
        else:
            print(is_string(l20nval))
            print(type(l20nval))
            raise Exception("Unknown l20nval")
        return (val, breaks_static)

    def transform_complex_string(self, val):
        if len(val.pieces)<2:
            piece = val.pieces[0]
            if isinstance(piece, l20n.Expander):
                return self.transform_expression(piece)
            else:
                return val.pieces[0]
        pieces = val.pieces[:]
        r = self.transform_expression(pieces.pop())
        while len(pieces)>0:
            l = self.transform_expression(pieces.pop())
            r = js.BinaryExpression(js.BinaryOperator('+'), l, r)
        return r

    def transform_identifier(self, exp):
        if isinstance(exp, l20n.Idref):
            idref = js.CallExpression(js.Identifier('getent'))
            idref.arguments.append(js.Identifier('env'))
            idref.arguments.append(js.Literal(exp.name))
            return idref
        elif isinstance(exp, l20n.AttrIndex):
            idref = js.CallExpression(js.Identifier('getattr'))
            idref.arguments.append(js.Identifier('env'))
            idref.arguments.append(js.Literal(exp.idref.name))
            if isinstance(exp.arg, (l20n.Idref, l20n.ObjectIndex, l20n.AttrIndex)):
                idref.arguments.append(self.transform_identifier(exp.arg))
            else:
                idref.arguments.append(js.Literal(exp.arg))
            return idref
        else:
            idref = js.CallExpression(js.Identifier('getent'))
            idref.arguments.append(js.Identifier('env'))
            idref.arguments.append(js.Literal(exp.idref.name))
            idref.arguments.append(js.ArrayExpression([js.Literal(exp.arg)]))
            return idref


    def transform_expression(self, exp):
        if isinstance(exp, l20n.Expander):
            return self.transform_expression(exp.expression)
        if isinstance(exp, l20n.ConditionalExpression):
            jsexp = js.ConditionalExpression(
                self.transform_expression(exp[0]),
                self.transform_expression(exp[1]),
                self.transform_expression(exp[2])
            )
            return jsexp
        if isinstance(exp, l20n.OperatorExpression):
            left = self.transform_expression(exp[0])
            right = self.transform_expression(exp[2])
        if isinstance(exp, l20n.EqualityExpression):
            jsexp = js.BinaryExpression(js.BinaryOperator('=='),
                                        left,
                                        right)
        if isinstance(exp, l20n.RelationalExpression):
            jsexp = js.RelationalExpression()
        if isinstance(exp, l20n.OrExpression):
            jsexp = js.OrExpression()
        if isinstance(exp, l20n.AdditiveExpression):
            jsexp = js.AdditiveExpression()
        if isinstance(exp, l20n.AndExpression):
            jsexp = js.AndExpression()
        if isinstance(exp, l20n.MultiplicativeExpression):
            jsexp = js.MultiplicativeExpression()
        if isinstance(exp, l20n.UnaryExpression):
            jsexp = js.UnaryExpression()
        if isinstance(exp, l20n.OperatorExpression):
            jsexp.left = self.transform_expression(exp[0])
            jsexp.right = self.transform_expression(exp[2])
            return jsexp
        if isinstance(exp, l20n.BraceExpression):
            jsexp = js.BraceExpression()
            jsexp.append(self.transform_expression(exp[0]))
            return jsexp 
        if isinstance(exp, l20n.Idref):
            jsidref = js.CallExpression(js.Identifier('getent'))
            jsidref.arguments.append(js.Identifier('env'))
            jsidref.arguments.append(js.Literal(exp.name))
            return jsidref
        if is_string(exp):
            return js.Literal(unicode(exp))
        if isinstance(exp, int):
            return js.Literal(exp)
        if isinstance(exp, l20n.MacroCall):
            args = map(self.transform_expression, exp.args)
            return js.CallExpression(js.Identifier('getmacro'),
                           [js.Identifier('env'),
                            js.Literal(exp.idref.name),
                            js.ArrayExpression(args)])
            return js.Call(self.transform_expression(exp.idref), args2)
        if isinstance(exp, (l20n.ObjectIndex, l20n.AttrIndex)):

            if exp.idref.name == "data":
                idref = js.MemberExpression(js.Identifier("data"),
                                            js.Literal(exp.arg),
                                            computed=True)
                return idref
            idref = self.transform_identifier(exp)
            return idref

