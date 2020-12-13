M = {};
require('./expressions.js');

var f = M.Expr.gte(M.Expr.get('a'), M.Expr.get('d.b'));

console.log(f.call({
  a:1,
  d: { b:2 },
}));

console.log(f.call({
  a:3,
  d: { b:2 },
}));