const BaseRepository = require('./BaseRepository');
const User = require('../../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmailWithPassword(email) {
    return this.model.findOne({ email }).select('+password').populate('organization', 'name');
  }

  findByIdWithSecret(id) {
    return this.model.findById(id).select('+twoFactorSecret').populate('organization', 'name');
  }

  findByIdWithOrg(id) {
    return this.model.findById(id).populate('organization', 'name');
  }
}

module.exports = new UserRepository();
