'use strict';

var Path = require('path');
var fs = require('fs');

var moduleIds = new Set();
var modules = [];

/*
    const modules = new Map();
    const moduleCache = new Map();

    function getModule(id) {
      if (!moduleCache.has(id)) {
        //if (!modules.has(id)) {
        //  throw "Missing module: " + id;
        //}
        moduleCache.set(id, modules.get(id)());
      }
      return moduleCache.get(id);
    }
*/
function getPreamble(babel) {
  var t = babel.types;
  var body = [];
  body.push(
    t.expressionStatement(
      t.literal('use strict')));
  body.push(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('modules'), t.newExpression(t.identifier('Map')))
    ]));
  body.push(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('moduleCache'), t.newExpression(t.identifier('Map')))
    ]));

  body.push(
    t.functionDeclaration(
      t.identifier('getModule'),
      [t.identifier('id')],
      t.blockStatement([
        t.ifStatement(
          t.unaryExpression('!',
            t.callExpression(
              t.memberExpression(
                t.identifier('moduleCache'),
                t.identifier('has')),
              [t.identifier('id')]
            )
          ),
          t.blockStatement([
            t.callExpression(
              t.memberExpression(
                t.identifier('moduleCache'),
                t.identifier('set')
              ),
              [
                t.identifier('id'),
                t.callExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('modules'),
                      t.identifier('get')
                    ),
                    [t.identifier('id')]
                  )
                )
              ])
          ])
        ),
        t.returnStatement(t.callExpression(
          t.memberExpression(
            t.identifier('moduleCache'),
            t.identifier('get')
          ),
          [t.identifier('id')]
        ))
      ]))
  );
  return body;
}

function getModuleIDFromPath(base, path) {
  var dir = Path.dirname(base);
  var res = Path.join(dir, path);
  res = Path.relative('./src', res);
  return res;
}

function getPathFromModuleID(id) {
  var path = Path.join('./src', id + '.js');
  return path;
}

function anonymousClosure(t, body) {
  var closure = t.callExpression(
    t.functionExpression(null, [], t.blockStatement(body))
  );
  return t.expressionStatement(closure);
}

function getModuleClosure(babel, id, body) {
  var t = babel.types;
  body = removeUseStrict(body);
  var closure = t.functionExpression(null, [], t.blockStatement(body));
  var def = t.callExpression(
    t.memberExpression(t.identifier('modules'), t.identifier('set')),
    [t.literal(id), closure]
  );
  return t.expressionStatement(def);
}

function removeUseStrict(body) {
  var pos = -1;
  for (var i = 0; i < body.length; i++) {
    if (body[i].type === 'ExpressionStatement' &&
        body[i].expression.type === 'Literal' &&
        body[i].expression.value === 'use strict') {
      pos = i;
      break;
    }
  }

  if (pos !== -1) {
    body.splice(pos, 1);
  }
  return body;
}

function addImports(babel, imports) {
  for (var i = 0; i < imports.length; i++) {
    if (!moduleIds.has(imports[i])) {
      addModule(babel, imports[i]);
    }
  }
}

function turnImportsIntoGetModule(babel, path, body) {
  var imports = [];
  for (var i = 0; i < body.length; i++) {
    if (body[i].type === 'ImportDeclaration') {
      imports.push(getModuleIDFromPath(path, body[i].source.value));

      var node = body[i];
      var id;

      if (node.specifiers.length === 1 &&
          node.specifiers[0].type === 'ImportDefaultSpecifier') {
        id = babel.types.identifier(node.specifiers[0].local.name);
      } else {
        var idents = [];
        for (var j = 0; j < node.specifiers.length; j++) {
          idents.push(babel.types.identifier(node.specifiers[j].local.name));
        }
        id = babel.types.objectPattern(idents);
      }

      var source = getModuleIDFromPath(path, node.source.value);

      var getModule = babel.types.callExpression(
        babel.types.identifier('getModule'),
        [babel.types.literal(source)]
      );

      body[i] = babel.types.variableDeclaration('const', [
        babel.types.variableDeclarator(id, getModule)
      ]);
    }
  }
  return imports;
}

function turnExportsIntoReturn(babel, body) {
  var returns = [];
  var defaultReturn;

  for (var i = 0; i < body.length; i++) {
    switch (body[i].type) {
      case 'ExportNamedDeclaration':
        if (body[i].declaration.type === 'VariableDeclaration') {
          returns.push(body[i].declaration.declarations[0].id);
        } else {
          returns.push(body[i].declaration.id);
        }
        body[i] = body[i].declaration;
        break;
      case 'ExportDefaultDeclaration':
        if (!body[i].declaration.id) {
          body[i] = babel.types.returnStatement(body[i].declaration);
        } else {
          defaultReturn = body[i].declaration.id;
          body[i] = body[i].declaration;
        }
        break;
    }
  }

  if (defaultReturn) {
    body.push(
      babel.types.returnStatement(defaultReturn));
  } else if (returns.length) {
    body.push(
      babel.types.returnStatement(
        babel.types.objectPattern(returns)
        ));
  }
}

function addModule(babel, id) {
  var path = getPathFromModuleID(id);
  var source = fs.readFileSync(path, {encoding: 'utf8'});
  var ast = babel.traverse.removeProperties(babel.parse(source));

  var imports = turnImportsIntoGetModule(babel, path, ast.body);
  turnExportsIntoReturn(babel, ast.body);

  modules.push({
    id: id,
    body: ast.body
  });
  moduleIds.add(id);

  addImports(babel, imports);
}

function turnMainIntoModule(babel, node, path, id) {
  var imports = turnImportsIntoGetModule(babel, path, node.body);
  turnExportsIntoReturn(babel, node.body);

  modules.push({
    id: id,
    body: node.body
  });

  addImports(babel, imports);
}

function getProgram(babel, id) {
  var body = [];

  getPreamble(babel).forEach(function(line) {
    body.push(line);
  });

  for (var i = modules.length - 1; i >= 0; i--) {
    var module = getModuleClosure(babel, modules[i].id, modules[i].body);
    body.push(module);
  }

  var call = babel.types.expressionStatement(babel.types.callExpression(
    babel.types.identifier('getModule'), [babel.types.literal(id)]));
  body.push(call);
  return anonymousClosure(babel.types, body);
}

module.exports = function (babel) {
  return new babel.Transformer('l20n-bundler', {
    Program: function (node) {
      var path = node._paths[0].parentPath.state.opts.filename;
      var id = Path.join(
        Path.relative('./src',
          Path.dirname(path)), Path.basename(path, '.js'));
        
      turnMainIntoModule(babel, node, path, id);
      return getProgram(babel, id);
    },
  });
};
