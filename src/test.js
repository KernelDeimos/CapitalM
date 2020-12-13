require('./M.js');
// require('./plugins/interface');

M.CLASS({
  package: 'test',
  name: 'Base',

  properties: [
    {
      name: 'egg',
      factory: function () { return 'salad'; }
    }
  ],

  methods: [
    function hello() {
      console.log('world');
      return 2;
    }
  ]
});

M.CLASS({
  package: 'test',
  name: 'Test',

  implements: ['test.Base'],

  properties: [
    {
      name: 'pie',
      factory: function () { return true; }
    }
  ],

  methods: [
    function hello() {
      console.log('hello');
      return 2;
    }
  ]
});

var i = test.Base.create();
var i = test.Test.create();
i.hello();
console.log(i.pie);
console.log(i.egg);
console.log(i.PIE); // In FOAM mode
