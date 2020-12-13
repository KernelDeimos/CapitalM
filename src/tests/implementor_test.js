require('../M');
require('../plugins/interface');
require('../plugins/implementor');

M.CLASS({
  package: 'test',
  name: 'A',

  properties: [
    {
      name: 'thing',
      value: 1
    }
  ],

  methods: [
    {
      name: 'tester',
      code: function tester() {
        return 'a';
      }
    }
  ]
});

M.CLASS({
  package: 'test',
  name: 'B',

  methods: [
    {
      name: 'tester',
      code: function tester() {
        return 'b';
      }
    }
  ],

  implementors: [
    {
      interface: 'test.A',
    }
  ]
});


M.CLASS({
  package: 'test',
  name: 'C',

  methods: [
    {
      name: 'myTester',
      code: function tester() {
        return 'c';
      }
    }
  ],

  properties: [
    {
      name: 'myThing',
      value: 2
    }
  ],

  implementors: [
    {
      interface: 'test.A',
      bindings: {
        thing: 'myThing',
        tester: 'myTester'
      }
    }
  ]
});

var a = test.A.create();
var b = test.B.create();
var c = test.C.create();

var assertValue = (name, actual, expected, strict) => {
  var ok = strict ? actual === expected : actual == expected;
  console.log(ok
    ? `\x1B[32;1m+\x1B[0m ${name}`
    : `\x1B[31;1m+\x1B[0m ${name} (${actual} is not ${expected})`
    )
}

assertValue('a.thing', a.thing, 1, true);
assertValue('b.thing', b.thing, undefined, true);

var b_as_a = M.Class.provide(b, 'test.A');
assertValue('b/a.thing', b_as_a.thing, 1, true);
assertValue('b/a.tester', b_as_a.tester(), 'a', true);

var c_as_a = M.Class.provide(c, 'test.A');
assertValue('c/a.thing', c_as_a.thing, 2, true);
assertValue('c/a.tester', c_as_a.tester(), 'c', true);
