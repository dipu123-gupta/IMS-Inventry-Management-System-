const BaseRepository = require('./BaseRepository');
const Quote = require('../../models/Quote');

class QuoteRepository extends BaseRepository {
  constructor() {
    super(Quote);
  }

  findQuotes(filter, skip, limit) {
    return this.model.find(filter)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findQuoteByIdWithDetails(id, organization) {
    return this.model.findOne({ _id: id, organization })
      .populate('customer', 'name email phone address')
      .populate('createdBy', 'name')
      .populate('items.product', 'name sku price');
  }
}

module.exports = new QuoteRepository();
