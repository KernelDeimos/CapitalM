(() => {
  var plugin = M.Plugin.create('capitalm_extra.context');
  plugin.setMeta({
    documentation: `
      A plugin that provides contexts, similar to FOAM contexts.
    `
  });

  M.CLASS({
    package: plugin.package(),
    name: 'Context',
    properties: [
      { name: 'delegate', value: null },
      { name: 'values', factory: () => {} },
    ],
  });

  M.CLASS.chainAPI.insertAfter('M.CLASS.create.factory', {
    name: 'M.CLASS.context',
    code: m => {
      m.create.chainAPI.insertAfter('M.CLASS.create.constructor', {
        name: 'M.CLASS.create.contextualize',
        code: o => {
          var ctx = M.__registry__[plugin.package('Context')].create();
          if ( o.info.createArgs > 1 ) {
            let parentCtx = o.info.createArgs[1];
            if ( parentCtx.cls_.id != plugin.package('Context') ) {
              parentCtx = parentCtx.exportCtx_;
            }
            ctx.delegate = parentCtx;
          }
          o.ctx_ = ctx;
        },
      });
      m.create.chainAPI.insertAfter('M.CLASS.create.contextualize', {
        name: 'M.CLASS.create.imports',
        code: o => {
          for ( let impName of o.cls_.imports ) {
            let optional = impName.endsWith('?');
            if ( optional ) impName = impName.slice(0, -1);
            if ( ! o.ctx_.values[impName]) {
              if ( optional ) continue;
              throw new Error(`missing import (${o.cls_.id}): ${impName}`);
            }
            o[impName] = o.ctx_.values[impName];
          }
        },
      });
      m.create.chainAPI.insertAfter('M.CLASS.create.contextualize', {
        name: 'M.CLASS.create.exports',
        code: o => {
          var sub = M.__registry__[plugin.package('Context')].create({
            delegate: o.ctx_,
          });

          for ( let expName of o.cls_.exports ) {
            Object.defineProperty(sub.values, expName, {
              get: () => o[expName],
              set: v => o[expName] = v;
            });
          }

          o.exportCtx_ = sub;
        },
      });
    }
  })
})();
