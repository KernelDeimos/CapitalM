var comn = require('../common');

(() => {
  var plugin = M.Plugin.create('capitalm_extra.topic');
  plugin.setMeta({
    documentation: `
      A plugin that makes it more convenient to define event emitters
      on any model.
    `
  });

  M.CLASS({
    package: plugin.package(),
    name: 'Topic',

    properties: [
      { name: 'name', value: null },
      { name: 'listeners', value: [] },
    ],

    methods: [
      {
        name: 'pub',
        code: function pub (...args) {
          for ( let i = 0 ; i < this.listeners.length ; i++ ) {
            this.listeners[i](this, ...args);
          }
        }
      },
      {
        name: 'sub',
        code: function sub (listener) {
          if ( typeof listener == 'function' ) {
            this.listeners.push(listener);
            return;
          }
          this.listeners.push(listener[
            'on' + comn.String.capitalize(this.name)
          ].bind(listener));
        }
      },
      {
        name: 'subAs',
        code: function subAs (asName, listener) {
          if ( typeof listener == 'function' ) {
            this.listeners.push(listener);
            return;
          }
          this.listeners.push(listener[
            'on' + comn.String.capitalize(asName)
          ].bind(listener));
        }
      }
    ]
  });

  M.Class.adapt.chainAPI.insertBefore('methods.adapt', {
    name: `M.Class.adapt.(${plugin.id}).processTopics`,
    code: m => {
      // 'properties' hasn't been adapted yet
      if ( ! m.properties ) m.properties = [];
      if ( ! m.topics ) m.topics = [];

      for ( let i = 0 ; i < m.topics.length ; i++ ) {
        m.properties.push({
          name: m.topics[i],
          factory: function () {
            return M.__registry__[plugin.package('Topic')].create({
              name: m.topics[i],
            });
          },
        })
      }

      return m;
    },
  })

  M.Topic = M.__registry__[plugin.package('Topic')];
})();
