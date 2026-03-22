const BaseRepository = require('./BaseRepository');
const Warehouse = require('../../models/Warehouse');

class WarehouseRepository extends BaseRepository {
  constructor() {
    super(Warehouse);
  }

  findAllWithManager(organization) {
    return this.model.find({ organization })
      .populate('manager', 'name email')
      .populate('parentWarehouse', 'name');
  }

  findByIdWithManager(id, organization) {
    return this.model.findOne({ _id: id, organization })
      .populate('manager', 'name email')
      .populate('parentWarehouse', 'name');
  }
}

module.exports = new WarehouseRepository();
