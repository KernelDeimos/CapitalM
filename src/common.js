var comn = {};

comn.Functions = {};

comn.Functions.ThirdPartySetter = (dest, name, func) => {
  dest[name] = func;
};
comn.Functions.ThirdPartySetter.__meta__ = {
  documentation: `
    ThirdPartySetter is used when the concern of how a property is set does not
    belong to the object holding the property, but rather some other interface.

    For instance, if a plugin wants to add a function to M.Class, the plugin
    API needs to verify that there is not a name conflict, whereas M.Class
    itself should work the same with or without the plugin API.
  `,
};

comn.String = {};
comn.String.capitalize = s => `${s[0].toUpperCase()}${s.slice(1)}`;

comn.Array = {};
comn.Array.maybePush = (arry, item) => {
  if ( arry.indexOf(item) != -1 ) return null;
  arry.push(item); return arry;
}
comn.Array.maybeRemove = (arry, item) => {
  let i = arry.indexOf(item);
  if ( i == -1 ) return null;
  arry = [
    ...arry.slice(0, i),
    ...arry.slice(i + 1),
  ]
  return arry;
}

comn.Util = {};
comn.Util.find = (arry, key, val) => {
  for ( let item of arry ) if ( item[key] == val ) return val;
}
(() => {
  let lastId_ = 0;
  comn.Util.uid = () => ++lastId_;
})();

module.exports = comn;