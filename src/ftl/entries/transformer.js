function transformEntity(entity) {
  if (entity.traits.length === 0) {
    const val = transformPattern(entity.value);
    return Array.isArray(val) ? { val } : val;
  }

  const [traits, def] = transformMembers(entity.traits);
  const ret = {
    traits,
    def
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
    case 'FunctionReference':
      return {
        type: 'fun',
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
      const [vars, def] = transformMembers(exp.variants);
      return {
        type: 'sel',
        exp: transformExpression(exp.expression),
        vars,
        def
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

function transformMembers(members) {
  let def = members.findIndex(member => member.default);
  if (def === -1) {
    def = undefined;
  }
  const traits = members.map(transformMember);
  return [traits, def];
}

function transformMember(member) {
  const ret = {
    key: transformExpression(member.key),
    val: transformPattern(member.value),
  };

  return ret;
}

function getEntitiesFromBody(body) {
  const entities = {};
  body.forEach(entry => {
    if (entry.type === 'Entity') {
      entities[entry.id.name] = transformEntity(entry);
    } else if (entry.type === 'Section') {
      Object.assign(entities, getEntitiesFromBody(entry.body));
    }
  });
  return entities;
}

export function createEntriesFromAST([resource, errors]) {
  const entities = getEntitiesFromBody(resource.body);
  return [entities, errors];
}
