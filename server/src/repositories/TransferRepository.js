const BaseRepository = require('./BaseRepository');
const Transfer = require('../../models/Transfer');

class TransferRepository extends BaseRepository {
  constructor() {
    super(Transfer);
  }

  findTransfersWithDetails(organization) {
    return this.model.find({ organization })
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .populate('items.product', 'name sku');
  }

  findTransferByIdWithDetails(id, organization, session = null) {
    let query = this.model.findOne({ _id: id, organization })
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name');
    if (session) {
      query = query.session(session);
    }
    return query;
  }
}

module.exports = new TransferRepository();
