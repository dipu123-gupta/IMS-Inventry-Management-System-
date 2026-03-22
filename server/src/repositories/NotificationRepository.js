const BaseRepository = require('./BaseRepository');
const Notification = require('../../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }
}

module.exports = new NotificationRepository();
