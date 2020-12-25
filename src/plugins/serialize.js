var comn = require('../common');

(() => {
  var plugin = M.Plugin.create('serialize');
  plugin.setMeta({
    documentation: `
      A plugin that adds a serialization library to 'M'.
    `
  });

  M.Serialize = {};
  M.Serialize.parseVal = val => {
    if ( typeof val != 'object' ) return val;
    if ( Array.isArray(val) ) return val.map(v => M.Serialize.parseVal(v));
    if ( val.cls_ ) return M.Serialize.parse(val);
    return val;
  };
  M.Serialize.parse = json => {
    let clsId = json.cls_;
    if ( ! json.cls_ ) {
      console.log(json);
      throw new Error('not a serialized class');
    }
    let cls = M.__registry__[json.cls_];

    // TODO: not sure why this bug happens
    if ( ! cls.create ) {
      let node = window;
      let parts = json.cls_.split('.');
      for ( let i = 0 ; i < parts.length ; i++ ) {
        node = node[parts[i]];
      }
      cls = node;
    }

    if ( ! cls ) throw new Error(`class not found: ${json.class}`);
    let constructArgs = {};
    for ( k in json ) if ( k != 'cls_' && k != 'impl_' ) {
      constructArgs[k] = M.Serialize.parseVal(json[k]);
    }
    let o = cls.create(constructArgs);
    if ( json['impl_'] ) for ( implCls in json.impl_ ) {
      let impl = M.Class.provide(o, implCls);
      for ( let pname in json.impl_[implCls] ) {
        impl[pname] = M.Serialize.parseVal(json.impl_[implCls][pname]);
      }
    }
    return o;
  }
  M.Serialize.applyVal = (o, val) => {
    if ( typeof val != 'object' ) return val;
    if ( Array.isArray(val) ) return val.map(v => M.Serialize.parseVal(v));
    if ( val.cls_ && o.cls_ && o.cls_.id && val.cls_ == o.cls_.id )
      return M.Serialize.apply(o, val);
    if ( val.cls_ ) return M.Serialize.parse(val);
    return val;
  };
  M.Serialize.apply = (o, json) => {
    for ( k in json ) if ( k != 'cls_' && k != 'impl_' ) {
      o[k] = M.Serialize.applyVal(o[k], json[k]);
    }
    if ( json['impl_'] ) for ( implCls in json.impl_ ) {
      let impl = M.Class.provide(o, implCls);
      for ( let pname in json.impl_[implCls] ) {
        impl[pname] = M.Serialize.applyVal(impl[pname], json.impl_[implCls][pname]);
      }
    }
    return o;
  }
})();
