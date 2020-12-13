M = {};

M.ENGINE = 'CapitalM';
M.VERSION = '1.0.0-alpha';
M.documentation = `
  Capital M is a lightweight modelling engine inspired by FOAM.
  It is possible to later migrate to FOAM when a more comprehensive
  set of features is desired.
`;
M.__registry__ = {};
M.useFOAM = (path, version) => {
  if ( path ) require(path);
  foam.Flow = M.Flow;
  var foamCLASS = foam.CLASS;
  var MCLASS = M.CLASS;
  M.CLASS = m => {
    foamCLASS(m);
    return MCLASS(m);
  };
  foam.M = M;
  M = foam;

  M.ENGINE = 'FOAM';
  M.VERSION = version ? version : 'master';
}

M.Flow = {};
M.Flow.syncChain = funcs => {
  var data = {};
  data.chain = funcs;
  data.f = o => data.chain.reduce((o, f) =>
    typeof f === 'function' ? f(o) : f.code.bind(f)(o)
  , o)
  data.f.chain = data.chain;
  return data.f;
}

require('./integration/pluginhelpers');
require('./integration/chainapi');

M.ObjectList = {};
M.ObjectList.find = (lis, propName, key) => {
  for ( let i = 0 ; i < lis.length ; i++ ) {
    if ( lis[i][propName] && lis[i][propName] == key ) {
      return i;
    }
  }
  return -1;
}
M.ObjectList.replace = (lis, propName, key, value) => {
  for ( let i = 0 ; i < lis.length ; i++ ) {
    if ( lis[i][propName] && lis[i][propName] == key ) {
      lis[i] = value;
    }
  }
}

M.Property = {};
M.Property.adapt = M.Flow.syncChain([
  {
    name: 'key.factory',
    code: p => {
      if ( ! p.key ) p.key = p.name;
      return p;
    }
  },
  {
    name: 'get.factory',
    code: p => {
      p.get_ =
        p.getter ? p.getter :
        p.factory ? function () {
          if ( ! this.instance_.hasOwnProperty(p.key) ) {
            this.instance_[p.key] = p.factory.call(this);
          }
          return this.instance_[p.key];
        } :
        p.hasOwnProperty('value') ? function () {
          if ( ! this.instance_.hasOwnProperty(p.key) ) {
            this.instance_[p.key] = p.value;
          }
          return this.instance_[p.key];
        } :
        function () { return this.instance_[p.key] } ;
      return p;
    }
  },
  {
    name: 'set.factory',
    code: p => {
      p.set_ =
        p.setter ? p.setter :
        function (v) { this.instance_[p.key] = v } ;
      return p;
    }
  }
])

M.Class = {};
M.Class.adapt = M.Flow.syncChain([
  {
    name: 'id.adapt',
    code: m => ({
      ...m,
      id: m.id ? m.id : m.package + '.' + m.name,
    }),
  },
  {
    name: 'methods.adapt',
    code: m => {
      if ( ! m.methods ) m.methods = [];
      m.methods = m.methods.map(
        method => typeof method === 'function'
          ? { name: method.name, code: method }
          : method
      );
      m.methods.forEach(m => m.key = m.name);
      return m;
    },
  },
  {
    name: 'methods.enhance',
    code: m => {
      m.methods.forEach(
        method => method.defineOn = o => o[method.name] = method.code.bind(o)
      );
      return m;
    }
  },
  {
    name: 'properties.adapt',
    code: m => {
      if ( ! m.properties ) m.properties = [];
      m.properties = m.properties.map(
        prop => M.Property.adapt(prop)
      );
      return m;
    },
  },
  {
    name: 'properties.enhance',
    code: m => {
      m.properties.forEach(
        prop => prop.defineOn = o => Object.defineProperty(o, prop.name, {
          get: prop.get_.bind(o),
          set: prop.set_.bind(o),
          configurable: true,
        })
      );
      return m;
    },
  },
]);

M.CLASS = M.Flow.syncChain([
  {
    name: 'M.CLASS.adapt',
    code: M.Class.adapt
  },
  {
    name: 'M.CLASS.register',
    code: m => {
      return M.__registry__[m.id] = m;
    }
  },
  {
    name: 'M.CLASS.implements.factory',
    code: m => {
      if ( ! m.implements ) m.implements = [];
      return m;
    }
  },
  {
    name: 'M.CLASS.create.factory',
    code: m => {
      m.create = M.Flow.syncChain([
        {
          name: 'M.CLASS.create.init',
          code: args => {
            var o = {};
            o.cls_ = m;
            o.instance_ = {};
            o.info_ = {
              initArgs: args
            };
            return o;
          }
        },
        {
          name: 'M.CLASS.create.properties',
          code: o => {
            o.cls_.properties.forEach(prop => prop.defineOn(o));
            return o;
          }
        },
        {
          name: 'M.CLASS.create.methods',
          code: o => {
            o.cls_.methods.forEach(method => method.defineOn(o));
            return o;
          }
        },
        {
          name: 'M.CLASS.create.constructor',
          code: o => {
            var args = o.info_.initArgs;
            if ( ! args ) args = {};
            Object.keys(args).forEach(k => {
              o[k] = args[k];
            });
            return o;
          }
        }
      ]);
      return m;
    },
  },
  {
    name: 'M.CLASS.globalize',
    code: m => {
      if ( M.ENGINE != 'CapitalM' ) return m;
      var path = m.package.split('.');
      var node = global;
      for ( let i = 0 ; i < path.length ; i++ ) {
        if ( node.hasOwnProperty(path[i]) ) {
          node = node[path[i]];
          continue;
        }
        node = node[path[i]] = {};
      }

      return node[m.name] = m;
    }
  }
]);

M.ENUM = m => {
  if ( ! m.properties ) m.properties = [];
  m.properties.push({
    name: 'ordinal', value: 0,
  });
  m.properties.push({
    name: 'label', value: '',
  });
  m = M.CLASS(m);
  var ordinal = 0;
  m.values.forEach(v => {
    var args = { ordinal: ordinal };
    ordinal++;
    if ( typeof v == 'string' ) {
      args.name = v.toUpperCase();
      args.label = v;
    } else {
      v.name = v.name.toUpperCase();
      args = v;
    }
    M.__registry__[m.id][args.name] = m.create(args);
  });
};