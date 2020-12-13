var comn = require('../common');

(() => {
  var plugin = M.Plugin.create('capitalm_extra.monitor');
  plugin.setMeta({
    documentation: `
      A plugin that makes it more convenient to define event emitters
      on any model.
    `
  });

  M.CLASS({
    package: plugin.package(),
    name: 'Entry',

    properties: [
      { name: 'rollMax', value: 30 },
      { name: 'name', value: '<error>' },
      { name: 'lastStart', value: Infinity },
      { name: 'calls', value: 0 },
      { name: 'rollingData', value: [] }
    ],

    methods: [
      { name: 'end', code: function (ts) {
        this.calls++;
        if ( this.rollingData.length >= this.rollMax ) this.rollingData.shift();
        this.rollingData.push(ts - this.lastStart);
      } },
      { name: 'getAverage', code: function () {
        return this.rollingData.reduce(
          (s, v) => s + v) / this.rollingData.length;
      } },
      { name: 'getEstImpact', code: function () {
        return this.getAverage() * this.calls;
      } }
    ]
  });

  M.CLASS({
    package: plugin.package(),
    name: 'Monitor',

    properties: [
      { name: 'entries', value: {} }
    ],

    methods: [
      {
        name: 'startMethod',
        code: function (name) {
          if ( ! this.entries[name] ) this.entries[name] =
            M.__registry__[plugin.package('Entry')].create({ name: name });
          this.entries[name].lastStart = new Date().getTime();
        }
      },
      {
        name: 'endMethod',
        code: function (name) {
          let ts = new Date().getTime();
          this.entries[name].end(ts);
        }
      },
      {
        name: 'getAverages',
        code: function () {
          let o = {};
          for ( let name in this.entries ) {
            o[name] = this.entries[name].getAverage();
          }
          return o;
        }
      },
      {
        name: 'getWorstFirst',
        code: function () {
          let entries = [];
          for ( let name in this.entries ) entries.push(this.entries[name]);
          return entries.sort(
            (e1, e2) => e2.getEstImpact() - e1.getEstImpact()
          ).map(e => [e.name, e.getEstImpact(), e.calls]);
        }
      }
    ]
  });

  let instance_ = M.__registry__[plugin.package('Monitor')].create();
  M.Monitor = instance_;

  M.CLASS.chainAPI.insertAfter('M.CLASS.adapt', {
    name: `M.CLASS.(${plugin.id}).installMonitor`,
    code: m => {
      for ( let method of m.methods ) {
        let code_ = method.code;
        let monitorName = `${m.id}->${method.name}`;
        method.code = function (...args) {
          instance_.startMethod(monitorName);
          let ret = code_.call(this, ...args);
          instance_.endMethod(monitorName);
          return ret;
        };
      }

      return m;
    },
  })
})();
