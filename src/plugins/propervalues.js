var comn = require('../common');

(() => {
  var plugin = M.Plugin.create('capitalm_extra.propervalues');
  plugin.setMeta({
    documentation: `
      A plugin that does not pass references provided as a property's
      "value" in a model definition, which can result in confusing
      behaviour.
    `
  });

  M.Property.adapt.chainAPI.insertBefore('set.factory', {
    name: `get.refine.(${plugin.id})`,
    code: p => {
      if ( ! p.value ) return p;
      if ( typeof p.value != 'object' ) return p;

      let get_ = p.get_;
      p.get_ = function () {
        if ( ! this.instance_.hasOwnProperty(p.key) ) {
          let val = Array.isArray(p.value)
            ? [ ...p.value ] : { ...p.value } ;
          this.instance_[p.key] = val;
        }
        return get_.call(this)
      }

      return p;
    },
  })
})();
