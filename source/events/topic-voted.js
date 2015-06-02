var config = require('../../config');
var db = require('../db')(config.db);
var logger = require('../utils/logger');
var ObjectId = require('mongojs').ObjectId;
var eventName = 'topic-voted';

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
          vote: event.vote
        },
        function (err) {
          logger.info({message: 'Created ' + eventName + ' action for topic ' + event.topic + ' in ' });
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
        vote: action.vote
      }

      actions.resolved(action, feed, callback);
    })

    // Executor
    .execute(eventName, function (action, transport, callback) {
      db.topics.findOne({_id: ObjectId(action.topic)}, function (err, topic) {
        if (err) return logger.err('Error found %s', err), callback(err);

        db.feeds.findOne({ forum: topic.forum }, function (err, feed) {
          if (err) return logger.err('Error found %s', err), callback(err);

          feed = feed || {};
          feed.type = eventName;
          feed.createdAt = Date.now();
          feed.topic = action.topic;
          feed.forum = topic.forum;
          feed.data = { user: action.user, vote: action.vote };

          db.feeds.save(feed, function (err, feed) {
            if (err) return logger.err('Error found %s', err), callback(err);

            logger.info('Saved feed for published topic %s', action.data.topic);
            if (callback) callback(null, feed);
          });
        });

      });
      
    });
}
