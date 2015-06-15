var config = require('../../config');
var db = require('../db')(config.db);
var logger = require('../utils/logger');
var name = require('../utils/name');
var templates = require('../templates');
var t = require('../translations').t;

module.exports = function (notifier) {
  if (!notifier || typeof notifier != 'object') throw new Error('Unable to initialize law-published event - Undefined notifier');

  // Receiver
  notifier
    .receive('law-published', function (event, actions, callback) {
      logger.info('Received event ' + JSON.stringify(event));

      db.user.find({ 'notifications.new-topic': true }, function (err, users) {
        if (err) return callback(err);

        users.forEach(function (user) {
          actions.create('law-published',
            {
              law: event.law,
              url: event.url,
              user: { name: name.format(user), email: user.email }
            },
            function (err) {
              logger.info({ message: 'Created "law-published" action for law ' + event.law.mediaTitle });
              callback && callback(err);
            }
          );
        });
      })

    })

  // Resolver
    .resolve('law-published', function (action, actions, callback) {
      logger.info('Resolving action ' + JSON.stringify(action));

      var data = {
        url: action.url,
        law: action.law,
        user: action.user
      };

      actions.resolved(action, data, callback);
    })

    // Executor
    .execute('law-published', function (action, transport, callback) {
        var law = action.data.law;
        var url = action.data.url;
        var user = action.data.user;

        var vars = [
          { name: 'LAW', content: law.mediaTitle },
          { name: 'URL', content: url },
          { name: 'USER_NAME', content: user.name },
          { name: 'SIGNATURE', content: config.transport.mandrill.from.name }
        ];

        templates.jade('law-published', vars, function (err, content) {
          logger.info('Notifying user ' + user.email);

          transport.mandrill('/messages/send', {
            message: {
              auto_html: null,
              to: [{email: user.email}],
              preserve_recipients: false,
              from_email: config.transport.mandrill.from.email,
              from_name: config.transport.mandrill.from.name,
              subject: t('templates.law-published.subject'),
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