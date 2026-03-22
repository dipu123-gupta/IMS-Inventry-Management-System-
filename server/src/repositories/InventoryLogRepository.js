const BaseRepository = require('./BaseRepository');
const InventoryLog = require('../../models/InventoryLog');

class InventoryLogRepository extends BaseRepository {
  constructor() {
    super(InventoryLog);
  }
}

module.exports = new InventoryLogRepository();
