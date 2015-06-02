var config = require('../../config');
var db = require('../db')(config.db);
var logger = require('../utils/logger');
var ObjectId = require('mongojs').ObjectId;
var eventName = 'topic-published';
var updateFeed = 'update-feed';

module.exports = function (notifier) {
  if (!notifier || typeof notifier != 'object') throw new Error('Unable to initialize lished event - Undefined notifier');

  // Receiver
  notifier
    .receive(eventName, function (event, actions, callback) {
      logger.info('Received event ' + JSON.stringify(event));

      var topic = event.topic;

      actions.create(updateFeed,
        {
          type: eventName,
          topic: topic.id
        },
        function (err) {
          logger.info({message: 'Created "update-feed" action for topic ' + topic.id });
          if (callback) callback(err);
        }
      );
    })

  // Resolver
    .resolve(updateFeed, function (action, actions, callback) {
      logger.info('Resolving action ' + JSON.stringify(action));

      var feed = { topic: action.topic };

      actions.resolved(action, feed, callback);
    })

    // Executor
    .execute(updateFeed, function (action, transport, callback) {
      db.feeds.findOne({ url: action.instance }, function (err, feed) {
        if (err) return logger.err('Error found %s', err), callback(err);

        feed = feed || {};
        feed.type = eventName;
        feed.topic = action.topic;
        feed.createdAt = Date.now();

        db.feeds.save(feed, function (err, feed) {
          if (err) return logger.err('Error found %s', err), callback(err);

          logger.info('Saved feed for published law %s', action.data.law);
          if (callback) callback(null, feed);
        });
      });
    });
}
