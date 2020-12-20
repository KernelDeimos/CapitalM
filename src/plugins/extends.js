(() => {
  var plugin = M.Plugin.create('capitalm_extra.extends');
  plugin.setMeta({
    documentation: `
      A plugin that provides behaviour for 'extends'
    `
  });

  M.CLASS.chainAPI.insertBefore('M.CLASS.adapt', {
    name: 'M.CLASS.extend',
    code: m => {
      if ( ! m.extends ) return m;
      let ex = M.__registry__[m.extends];
      if ( ! ex ) throw new Error(`missing extends: ${m.extends}`);

      for ( k in ex ) if ( ex.hasOwnProperty(k) ) {
        if ( typeof ex[k] != 'object' ) continue;
        if ( Array.isArray(ex[k]) ) {
          m[k] = [ ...ex[k], ...(m[k] ? m[k] : []) ];
        } else {
          m[k] = { ...ex[k], ...(m[k] ? m[k] : {}) };
        }
      }
      return m;
    }
  })
})();
