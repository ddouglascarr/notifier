var config = require('../../config');
var db = require('../db')(config.db);
var logger = require('../utils/logger');
var ObjectId = require('mongojs').ObjectId;
var eventName = 'topic-commented';

module.exports = function (notifier) {
  if (!notifier || typeof notifier != 'object') throw new Error('Unable to initialize lished event - Undefined notifier');

  // Receiver
  notifier
    .receive(eventName, function (event, actions, callback) {
      logger.info('Received event ' + JSON.stringify(event));

      actions.create(eventName,
        {
          topic: event.topic,
          user: event.user,
          comment: event.comment
        },
        function (err) {
          logger.info({ message: 'Created ' + eventName + ' action for topic ' + event.topic });
          if (callback) callback(err);
        }
      );
    })

  // Resolver
    .resolve(eventName, function (action, actions, callback) {
      logger.info('Resolving action ' + JSON.stringify(action));

      var feed = {
        topic: action.topic,
        user: action.user,
        comment: action.comment
      }

      actions.resolved(action, feed, callback);
    })

    // Executor
    .execute(eventName, function (action, transport, callback) {
      db.topics.findOne({_id: ObjectId(action.topic)}, function (err, topic) {
        if (err) return logger.err('Error found %s', err), callback(err);

        db.feeds.findOne({ url: action.instance }, function (err, feed) {
          if (err) return logger.err('Error found %s', err), callback(err);

          feed = feed || {};
          feed.type = eventName;
          feed.createdAt = Date.now();
          feed.topic = action.topic;
          feed.comment = action.comment;
          feed.data = { user: action.user };

          db.feeds.save(feed, function (err, feed) {
            if (err) return logger.err('Error found %s', err), callback(err);

            logger.info('Saved feed for commented topic %s', action.data.topic);
            if (callback) callback(null, feed);
          });
        });

      });
    });
}
