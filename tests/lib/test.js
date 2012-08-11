var ctx = L20n.getContext();

ctx.addResource('/l20n/js/tests/lib/data/example1.lol')

ctx.addResource('/l20n/js/tests/lib/data/example2.lol')

//ctx.__addResourceAST('path1')

ctx.onReady = function() {
  console.log('-- ready!')
  console.log(ctx.getAST());
  console.log(ctx.get('foo'))
  console.log(ctx.get('foo2'))
  console.log(ctx.get('foo3'))
}

//console.log('01 Firefox', obj['brandName1'].get(obj));
