const BaseRepository = require('./BaseRepository');
const Customer = require('../../models/Customer');

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  findAll(organization) {
    return this.model.find({ organization });
  }

  findByIdWithHistory(id, organization) {
    return this.model.findOne({ _id: id, organization }).populate('purchaseHistory.order');
  }
}

module.exports = new CustomerRepository();
