(() => {
  var plugin = M.Plugin.create('capitalm_extra.implementor');
  plugin.setMeta({
    documentation: `
      A plugin that provides an alternative to traditional OOP interfaces that
      does not have a possibility of method signature conflicts.
    `
  });
  plugin.setLoadtimeVar('awaitingImplement', {});
  plugin.registerFunction(M.Class, 'provides', (o, key) => {
    return o.cls_.implementors_.hasOwnProperty(key);
  });
  plugin.registerFunction(M.Class, 'provide', (o, key) => {
    // Fetch plugin data for the implementor
    var data = o.pluginData_[plugin.id];

    // Don't execute undefined behaviour for no implementor
    if ( ! o.cls_.implementors_.hasOwnProperty(key) )
      throw new Error(
        `${o.cls_.id} does not implement ${key}`);
    
    // Get model for the interface being provided
    var impl = M.__registry__[key];
    if ( ! impl ) throw new Error(`unknown model ${key}`);

    // 'agent' is the implementor; 'o' as 'key'
    return data.agents[key];
  });

  M.Class[plugin.id] = {};

  // Method which modifies 'user' so it can provide 'impl'
  M.Class[plugin.id].doImplement = (impl, user) => {
    // console.log(`HAPPEN<${impl.id},${user.id}>`);
    // Add property setup to the model "user"s create constructor corresponding
    // to the model "impl".
    user.create.chainAPI.insertBefore('M.CLASS.create.constructor', {
      name: `M.CLASS.create.(${plugin.id}).initImplementor(${impl.id})`,
      code: o => {
        // Create implementor properties
        var agent = { instance_: {} }, bound = {};

        // Add properties from definition in 'implementors' property
        let implDef = o.cls_.implementors_[impl.id];
        // TODO: move to an adapt on model
        let bindings = implDef.bindings || {};

        impl.properties.forEach(prop => {
          let bind;
          if ( bind = bindings[prop.key] ) {
            agent[prop.key] = o[bind];
          } else {
            prop.defineOn(agent);
          }
        });

        impl.methods.forEach(meth => {
          let bind;
          if ( bind = bindings[meth.key] ) {
            if ( typeof o[bind] != 'function' ) agent[meth.key] = () => o[bind];
            else agent[meth.key] = o[bind];
          } else {
            meth.defineOn(agent);
          }
        });

        // Store this "ghost object" in plugin data
        o.pluginData_[plugin.id].agents[impl.id] = agent;
        return o;
      }
    });

    return user;
  };

  // TODO: DRY: Concept of forward vs backward application of a relation should
  //            be generalized for use by any plugin.
  M.Class[plugin.id].processImplementors = M.Flow.syncChain([
    {
      name: `M.CLASS.(${plugin.id}).implementors.adapt`,
      code: m => {
        if ( ! m.implementors ) m.implementors = [];
        return m;
      }
    },
    {
      name: `M.CLASS.(${plugin.id}).implementors.hash`,
      doc: `
        Convert implementors list to a dictionary for more
        efficient query.
      `,
      code: m => {
        m.implementors_ = {};
        m.implementors.forEach(impl => {
          m.implementors_[impl.interface] = impl;
        })
        return m;
      }
    },
    {
      name: `M.CLASS.(${plugin.id}).initialize`,
      code: m => {
        m.create.chainAPI.insertBefore('M.CLASS.create.constructor', {
          name: `M.CLASS.create.(${plugin.id}).initProperties`,
          code: o => {
            // TODO: this shouldn't be plugin choice
            if ( ! o.pluginData_ ) o.pluginData_ = {};
            o.pluginData_[plugin.id] = {
              agents: {}
            };
            return o;
          }
        });
        return m;
      }
    },
    {
      name: `M.CLASS.(${plugin.id}).processProperImplements`,
      code: m => {
        var waiting = plugin.getLoadtimeVar('awaitingImplement');
        m.implementors.forEach(implData => {
          var id = implData.interface;
          var cls = M.__registry__[id];
          if ( ! cls ) {
            if ( ! waiting.hasOwnProperty(id) ) waiting[id] = [];
            waiting[id].push(m.id);
            return;
          }
          m = M.Class[plugin.id].doImplement(cls, m);
        })
        return m;
      },
    },
    {
      name: `M.CLASS.(${plugin.id}).processRetroImplements`,
      code: m => {
        var waiting = plugin.getLoadtimeVar('awaitingImplement');
        if ( waiting.hasOwnProperty(m.id) ) {
          waiting[m.id].forEach(user => {
            M.__registry__[user] = M.Class[plugin.id].doImplement(m, user);
          })
        }
        return m;
      },
    },
  ]);

  // Modify 'create' so that it creates unbound implementor properties
  M.CLASS.chainAPI.insertAfter('M.CLASS.create.factory', {
    name: `M.CLASS.(${plugin.id}).processImplementors`,
    code: M.Class[plugin.id].processImplementors,
  })
})();