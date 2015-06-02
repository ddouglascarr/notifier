var config = require('../../config');
var db = require('../db')(config.db);
var logger = require('../utils/logger');
var name = require('../utils/name');
var templates = require('../templates');
var t = require('../translations').t;
var eventName = 'topic-published';

module.exports = function (notifier) {
  if (!notifier || typeof notifier != 'object') throw new Error('Unable to initialize ' + eventName + ' event - Undefined notifier');

  // Receiver
  notifier
    .receive(eventName, function (event, actions, callback) {
      logger.info('Received event ' + JSON.stringify(event));

      db.user.find({ 'notifications.new-topic': true }, function (err, users) {
        if (err) return callback(err);

        users.forEach(function (user) {
          actions.create(eventName,
            {
              topic: event.topic,
              url: event.url,
              user: { name: name.format(user), email: user.email }
            },
            function (err) {
              logger.info({ message: 'Created ' + eventName + ' action for topic ' + event.topic });
              callback && callback(err);
            }
          );
        });
      })

    })

  // Resolver
    .resolve(eventName, function (action, actions, callback) {
      logger.info('Resolving action ' + JSON.stringify(action));

      var data = {
        url: action.url,
        topic: action.topic,
        user: action.user
      };

      actions.resolved(action, data, callback);
    })

    // Executor
    .execute(eventName, function (action, transport, callback) {
        var topic = action.data.topic;
        var url = action.data.url;
        var user = action.data.user;

        var vars = [
          {name: 'LAW', content: topic.mediaTitle},
          {name: 'URL', content: url},
          {name: 'USER_NAME', content: user.name}
        ];

        templates.jade(eventName, vars, function (err, content) {
          logger.info('Notifying user ' + user.email);

          transport.mandrill('/messages/send', {
            message: {
              auto_html: null,
              to: [{email: user.email}],
              preserve_recipients: false,
              from_email: config.transport.mandrill.from.email,
              from_name: config.transport.mandrill.from.name,
              subject: t('templates.topic-published.subject'),
              text: content,
              html: content,
              auto_text: true
            }
          }, function (err) {
            callback && callback(err);
          });
        });
    });
}