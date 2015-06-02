var notifier = require('./source/notifier');
var config = require('./config');

// Custom event definitions
require('./source/events/signup')(notifier);
require('./source/events/forgot-password')(notifier);
require('./source/events/reply-argument')(notifier);
require('./source/events/law-published')(notifier);
require('./source/events/update-feed')(notifier);
require('./source/events/topic-voted')(notifier);
require('./source/events/law-commented')(notifier);

// start the server
notifier.start(config.port || 9001);
