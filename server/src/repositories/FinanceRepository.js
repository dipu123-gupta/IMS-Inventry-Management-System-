const BaseRepository = require('./BaseRepository');
const Finance = require('../../models/Finance');

class FinanceRepository extends BaseRepository {
  constructor() {
    super(Finance);
  }
}

module.exports = new FinanceRepository();
