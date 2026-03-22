class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  find(query = {}, projection = null, options = {}) {
    return this.model.find(query, projection, options);
  }

  findOne(query = {}, projection = null, options = {}) {
    return this.model.findOne(query, projection, options);
  }

  findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options);
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateOne(query, data, options = { new: true, runValidators: true }) {
    return this.model.findOneAndUpdate(query, data, options);
  }

  async deleteOne(query) {
    return this.model.findOneAndDelete(query);
  }

  async countDocuments(query = {}) {
    return this.model.countDocuments(query);
  }
}

module.exports = BaseRepository;
