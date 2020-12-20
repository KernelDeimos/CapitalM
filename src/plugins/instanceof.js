(() => {
  var plugin = M.Plugin.create('capitalm_extra.instanceof');
  plugin.setMeta({
    documentation: `
      A plugin that provides behaviour for 'extends'
    `
  });

  plugin.registerFunction(M.Class, 'instanceOf', (o, key) => {
    return !! o.cls_.instanceofs[key];
  });

  M.CLASS.chainAPI.insertBefore('M.CLASS.create.factory', {
    name: 'M.CLASS.instaceofs.factory',
    code: m => {
      let instanceofs = m.instanceofs || {};
      instanceofs[m.id] = true;
      // if ( m.implementors ) for ( let impl of m.implementors ) {
      //   instanceofs[impl.interface] = true;
      // }
      if ( m.implements ) for ( let impl of m.implements ) {
        instanceofs[impl] = true;
      }
      if ( m.extends ) instanceofs[m.extends] = true;
      m.instanceofs = instanceofs;
      return m;
    }
  });
})();
