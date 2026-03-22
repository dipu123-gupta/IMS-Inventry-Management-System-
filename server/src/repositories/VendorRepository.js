const BaseRepository = require('./BaseRepository');
const Vendor = require('../../models/Vendor');

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor);
  }

  findPaginated(filter, skip, limit) {
    return this.model.find(filter)
      .populate('products', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findByIdWithProducts(id, organization) {
    return this.model.findOne({ _id: id, organization })
      .populate('products', 'name sku price');
  }
}

module.exports = new VendorRepository();
