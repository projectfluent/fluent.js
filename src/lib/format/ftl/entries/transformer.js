import { default as AST } from '../ast/ast';

function toEntries([entries, curSection], entry) {
  if (entry.type === 'Section') {
    return [entries, entry.name.name];
  }

  if (curSection && !entry.id.namespace) {
    entry.id.namespace = curSection;
  }

  return [
    Object.assign(entries, {
      [stringifyIdentifier(entry.id)]: transformEntity(entry)
    }),
    curSection
  ];
}

function transformEntity(entity) {
  if (entity.traits.length === 0) {
    return transformPattern(entity.value);
  }

  return {
    val: transformPattern(entity.value),
    traits: entity.traits.map(transformMember),
  };
}

function transformExpression(exp) {
  if (exp instanceof AST.EntityReference) {
    return {
      type: 'eref',
      name: stringifyIdentifier(exp)
    };
  }
  if (exp instanceof AST.BuiltinReference) {
    return {
      type: 'builtin',
      name: stringifyIdentifier(exp)
    };
  }
  if (exp instanceof AST.ExternalArgument) {
    return {
      type: 'ext',
      name: exp.name
    };
  }
  if (exp instanceof AST.Pattern) {
    return transformPattern(exp);
  }
  if (exp instanceof AST.Identifier) {
    return transformIdentifier(exp);
  }
  if (exp instanceof AST.Number) {
    return {
      type: 'num',
      val: exp.value
    };
  }
  if (exp instanceof AST.KeyValueArg) {
    return {
      type: 'kv',
      name: exp.name,
      val: transformExpression(exp.value)
    };
  }

  if (exp instanceof AST.SelectExpression) {
    return {
      type: 'select',
      exp: transformExpression(exp.expression),
      vars: exp.variants.map(transformMember)
    };
  }
  if (exp instanceof AST.MemberExpression) {
    return {
      type: 'mem',
      obj: transformExpression(exp.object),
      key: transformExpression(exp.keyword)
    };
  }
  if (exp instanceof AST.CallExpression) {
    return {
      type: 'call',
      name: transformExpression(exp.callee),
      args: exp.args.map(transformExpression)
    };
  }
  return exp;
}

function transformPattern(pattern) {
  if (pattern === null) {
    return null;
  }

  if (pattern.elements.length === 1 &&
      pattern.elements[0] instanceof AST.TextElement) {
    return pattern.source;
  }

  return pattern.elements.map(chunk => {
    if (chunk instanceof AST.TextElement) {
      return chunk.value;
    }
    if (chunk instanceof AST.Placeable) {
      return chunk.expressions.map(transformExpression);
    }
    return chunk;
  });
}

function transformMember(member) {
  const type = member.key.type;
  const ret = {
    key: transformExpression(member.key),
    val: transformPattern(member.value),
  };

  if (member.default) {
    ret.def = true;
  }

  return ret;
}

function transformIdentifier(id) {
  const ret = {
    type: 'id',
    name: id.name
  };

  if (id.namespace) {
    ret.ns = id.namespace;
  }

  return ret;
}

function stringifyIdentifier(id) {
  if (id.namespace) {
    return `${id.namespace}/${id.name}`;
  }
  return id.name;
}

export function createEntriesFromAST({body, _errors}) {
  const [entries] = body
    .filter(entry => entry.type === 'Entity' || entry.type === 'Section')
    .reduce(toEntries, [{}, null]);
  return {entries, _errors};
}
