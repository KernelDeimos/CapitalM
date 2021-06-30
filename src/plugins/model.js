(() => {
  var plugin = M.Plugin.create('capitalm_extra.model');
  plugin.setMeta({
    documentation: `
      A plugin that adds support for defining model types in CapitalM.
    `
  });

  M.Of = {};

  M.CLASS.chainAPI.insertBefore('M.CLASS.globalize', {
    name: 'M.CLASS.model',
    code: m => {
      if ( ! m.modeltype ) return m;
      let modelName = m.name.replace(/([a-z])([^0-9a-z_])/g, '$1_$2');
      M.Of[modelName] = def => {
        let superDef = {
          name: def.name,
          package: def.package ? def.package : m.package,
          extends: m.id,
          properties: []
        };
        for ( k in def ) {
          properties.push({ name: k, value: def[k] });
        }
        return M.CLASS(superDef);
      };
      return m;
    }
  })
})();
