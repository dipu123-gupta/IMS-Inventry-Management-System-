const BaseRepository = require('./BaseRepository');
const Organization = require('../../models/Organization');

class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }
}

module.exports = new OrganizationRepository();
