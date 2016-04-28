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
  switch (exp.type) {
    case 'EntityReference':
      return {
        type: 'ref',
        name: exp.name
      };
    case 'BuiltinReference':
      return {
        type: 'blt',
        name: exp.name
      };
    case 'ExternalArgument':
      return {
        type: 'ext',
        name: exp.name
      };
    case 'Pattern':
      return transformPattern(exp);
    case 'Number':
      return {
        type: 'num',
        val: exp.value
      };
    case 'Keyword':
      const kw = {
        type: 'kw',
        name: exp.name
      };

      return exp.namespace ?
        Object.assign(kw, { ns: exp.namespace }) :
        kw;
    case 'KeyValueArg':
      return {
        type: 'kv',
        name: exp.name,
        val: transformExpression(exp.value)
      };
    case 'SelectExpression':
      return {
        type: 'sel',
        exp: transformExpression(exp.expression),
        vars: exp.variants.map(transformMember)
      };
    case 'MemberExpression':
      return {
        type: 'mem',
        obj: transformExpression(exp.object),
        key: transformExpression(exp.keyword)
      };
    case 'CallExpression':
      return {
        type: 'call',
        name: transformExpression(exp.callee),
        args: exp.args.map(transformExpression)
      };
    default:
      return exp;
  }
}

function transformPattern(pattern) {
  if (pattern === null) {
    return null;
  }

  if (pattern.elements.length === 1 &&
      pattern.elements[0].type === 'TextElement') {
    return pattern.source;
  }

  return pattern.elements.map(chunk => {
    if (chunk.type === 'TextElement') {
      return chunk.value;
    }
    if (chunk.type === 'Placeable') {
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
