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
        name: 'canSub',
        code: function canSub (listener) {
          if ( typeof listener == 'function' ) {
            return true;
          }
          return !! this.canSubAs(this.name, listener);
        }
      },
      {
        name: 'canSubAs',
        code: function canSub (asName, listener) {
          return !! listener['on' + comn.String.capitalize(asName)];
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
      },
      {
        name: 'unsub',
        code: function unsub (listener) {
          let i = this.listeners.indexOf(listener);
          if ( i == -1 ) return;
          this.listeners.splice(i, 1);
        }
      },
      {
        name: 'subOnce',
        code: function subOnce (listener) {
          let f; f = (topic, ...args) => {
            listener(topic, ...args);
            this.unsub(f);
          };
          this.sub(f);
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
