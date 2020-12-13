require('../M');
require('../plugins/topic');

M.CLASS({
  package: 'test',
  name: 'HasTopic',
  topics: [ 'greeting' ],
});

M.CLASS({
  package: 'test',
  name: 'Subscriber',

  methods: [
    {
      name: 'onGreeting',
      code: function (topic, msg) {
        console.log(topic.cls_.id + ` said "${msg}" to ` + this.cls_.id);
      }
    }
  ]
});

var hasTopic = test.HasTopic.create();
var subs = test.Subscriber.create();

hasTopic.greeting.sub((topic, msg) => {
  console.log(topic.cls_.id + ` said "${msg}"`);
});
hasTopic.greeting.sub(subs);

hasTopic.greeting.pub('Hello!');
