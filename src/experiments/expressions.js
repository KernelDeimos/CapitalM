var lib = {};

lib.gte = function (expr1, expr2) {
  return function () {
    return expr1.call(this) >= expr2.call(this);
  }
}

lib.get = function (expr1) {
  if ( typeof expr1 == 'string' && expr1.includes('.') ) {
    var i = expr1.lastIndexOf('.');
    return lib.dot(lib.get(expr1.slice(0, i)), expr1.slice(i+1));
  }
  return function () {
    var key = typeof expr1 == 'string' ? expr1 : expr1.call(this);
    return this[key]
  }
}

lib.dot = function (expr1, expr2) {
  return function () {
    var key = typeof expr2 == 'string' ? expr2 : expr2.call(this);
    return expr1.call(this)[key];
  }
}

M.Expr = lib;
module.exports = lib;
