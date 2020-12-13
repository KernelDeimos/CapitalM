(() => {
  var plugin = M.Plugin.create('capitalm_extra.interface');
  plugin.setMeta({
    documentation: `
      A plugin that provides traditional OOP-style interfaces.
    `
  });
  plugin.setLoadtimeVar('awaitingImplement', {});

  // TODO: DRY: Concept of forward vs backward application of a relation should
  //            be generalized for use by any plugin.
  M.Class.processImplements = M.Flow.syncChain([
    {
      name: 'M.CLASS.processProperImplements',
      code: m => {
        var waiting = plugin.getLoadtimeVar('awaitingImplement');
        m.implements.forEach(id => {
          var cls = M.__registry__[id];
          if ( ! cls ) {
            if ( ! waiting.hasOwnProperty(id) ) waiting[id] = [];
            waiting[id].push(m.id);
            return;
          }
          m = M.Class.doImplement(cls, m);
        })
        return m;
      },
    },
    {
      name: 'M.CLASS.processRetroImplements',
      code: m => {
        var waiting = plugin.getLoadtimeVar('awaitingImplement');
        if ( waiting.hasOwnProperty(m.id) ) {
          waiting[m.id].forEach(user => {
            M.__registry__[user] = M.Class.doImplement(m, user);
          })
        }
        return m;
      },
    },
  ])

  M.Class.doImplement = (impl, user) => {
    if ( typeof impl == 'string' ) impl = M.__registry__[impl];
    if ( typeof user == 'string' ) user = M.__registry__[impl];

    var m = {
      ...user,
      properties: [ ...impl.properties ],
      methods: [ ...impl.methods ],
    };
    user.properties.forEach(prop => {
      var i = M.ObjectList.find(m.properties, 'key', prop.key);
      if ( i < 0 ) m.properties.push(prop);
      else M.ObjectList.replace(m.properties, 'key', prop.key, prop);
    });
    user.methods.forEach(meth => {
      var i = M.ObjectList.find(m.methods, 'name', meth.name);
      if ( i < 0 ) m.methods.push(meth);
      else M.ObjectList.replace(m.methods, 'name', meth.name, meth);
    });

    return m;
  }

  M.CLASS.chainAPI.insertBefore('M.CLASS.create.factory', {
    name: 'M.CLASS.processImplements',
    code: M.Class.processImplements,
  })
})();