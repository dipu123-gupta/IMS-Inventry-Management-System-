const BaseRepository = require('./BaseRepository');
const ActivityLog = require('../../models/ActivityLog');

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super(ActivityLog);
  }

  async findPaginatedLogs(filter, skip, limit) {
    return this.model.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new ActivityLogRepository();
