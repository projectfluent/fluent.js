import { default as AST } from '../ast/ast';

function toEntries([entries, curSection], entry) {
  if (entry.type === 'Section') {
    return [entries, entry.name];
  }

  if (curSection && !entry.ns) {
    entry.ns = curSection;
  }

  return [
    Object.assign(entries, {
      [transformIdentifier(entry.id)]: transformEntity(entry)
    }),
    curSection
  ];
}

function transformEntity(entity) {
  if (entity.value.elements.length === 1 &&
      entity.value.elements[0] instanceof AST.TextElement) {
    return entity.value.source;
  }
  return transformPattern(entity.value);
}

function transformPattern(pattern) {
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

function transformExpression(exp) {
  if (exp instanceof AST.EntityReference) {
    return {
      type: 'eref',
      value: transformIdentifier(exp)
    };
  }
  if (exp instanceof AST.BuiltinReference) {
    return {
      type: 'builtin',
      value: transformIdentifier(exp)
    };
  }
  if (exp instanceof AST.ExternalArgument) {
    return {
      type: 'arg',
      value: exp.id
    };
  }
  if (exp instanceof AST.SelectExpression) {
    return {
      type: 'select',
      exp: transformExpression(exp.expression),
      variants: transformVariants(exp.variants)
    };
  }
  if (exp instanceof AST.CallExpression) {
    return {
      type: 'call',
      id: transformExpression(exp.callee),
      args: exp.args.map(transformExpression)
    };
  }
  return exp;
}

function transformVariants(variants) {
  const result = {};
  let def = null;
  variants.forEach(variant => {
    result[transformIdentifier(variant.key)] = transformPattern(variant.value);
    if (variant.default) {
      def = transformIdentifier(variant.key);
    }
  });
  if (def) {
    result['[default]'] = def;
  }
  return result;
}

function transformIdentifier(id) {
  if (id.namespace) {
    return `${id.namespace}:${id.name}`;
  }
  return id.name;
}

export function createEntriesFromAST({body, _errors}) {
  const [entries] = body
    .filter(entry => entry.type === 'Entity' || entry.type === 'Section')
    .reduce(toEntries, [{}, null]);
  return {entries, _errors};
}
