import { default as AST } from '../ast/ast';

function transformEntity(entity) {
  if (entity.traits.length === 0) {
    return transformPattern(entity.value);
  }

  const ret = {
    traits: entity.traits.map(transformMember),
  };

  return entity.value !== null ?
    Object.assign(ret, { val: transformPattern(entity.value) }) :
    ret;
}

function transformExpression(exp) {
  if (exp instanceof AST.EntityReference) {
    return {
      type: 'ref',
      name: exp.name
    };
  }
  if (exp instanceof AST.BuiltinReference) {
    return {
      type: 'blt',
      name: exp.name
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
  if (exp instanceof AST.Number) {
    return {
      type: 'num',
      val: exp.value
    };
  }
  if (exp instanceof AST.Keyword) {
    const ret = {
      type: 'kw',
      name: exp.name
    };

    return exp.namespace ?
      Object.assign(ret, { ns: exp.namespace }) :
      ret;
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
      type: 'sel',
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

function toEntries(entries, entry) {
  return Object.assign(entries, {
    [entry.id.name]: transformEntity(entry)
  });
}

export function createEntriesFromAST({body, _errors}) {
  const entries = body
    .filter(entry => entry.type === 'Entity')
    .reduce(toEntries, {});
  return {entries, _errors};
}
