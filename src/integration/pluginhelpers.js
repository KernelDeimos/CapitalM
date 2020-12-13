var comn = require('../common');

M.Plugin = {};
M.Plugin.create = (id) => {
  var p = {
    id: id,
    __loadtime__: {},
    __meta__: {},
  };
  // TODO: setMeta should override instead of replace
  p.setMeta = metaObject => p.__meta__ = metaObject;
  p.setLoadtimeVar = (name, val) => {
    p.__loadtime__[name] = val;
  }
  p.getLoadtimeVar = name => {
    return p.__loadtime__[name];
  }
  p.registerFunction = comn.Functions.ThirdPartySetter;
  p.package = name => `plugins_.${p.id}${name ? `.${name}` : ''}`;
  return p;
};
