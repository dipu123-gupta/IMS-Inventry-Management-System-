const BaseRepository = require('./BaseRepository');
const Product = require('../../models/Product');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  findWithVendor(query, skip, limit) {
    return this.model.find(query)
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findByIdWithVendor(id, organization) {
    return this.model.findOne({ _id: id, organization })
      .populate('vendor', 'name email phone');
  }

  async getDistinctCategories(organization) {
    return this.model.distinct('category', { organization });
  }
}

module.exports = new ProductRepository();
