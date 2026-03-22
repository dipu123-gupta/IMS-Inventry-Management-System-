const VendorRepository = require('../repositories/VendorRepository');
const { eventBus, EVENTS } = require('../../utils/eventBus');

class VendorService {
  async getVendors(organization, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { organization };
    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { email: { $regex: queryParams.search, $options: 'i' } },
        { company: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      VendorRepository.findPaginated(filter, skip, limit),
      VendorRepository.countDocuments(filter),
    ]);

    return {
      vendors,
      page,
      pages: Math.ceil(total / limit),
      total,
    };
  }

  async getVendorById(id, organization) {
    const vendor = await VendorRepository.findByIdWithProducts(id, organization);
    if (!vendor) {
      const error = new Error('Vendor not found');
      error.statusCode = 404;
      throw error;
    }
    return vendor;
  }

  async createVendor(data, organization) {
    const vendor = await VendorRepository.create({ ...data, organization });
    eventBus.emit(EVENTS.VENDOR_CREATED, { orgId: organization, vendor });
    return vendor;
  }

  async updateVendor(id, data, organization) {
    const vendor = await VendorRepository.updateOne(
      { _id: id, organization },
      data
    );
    if (!vendor) {
      const error = new Error('Vendor not found');
      error.statusCode = 404;
      throw error;
    }
    eventBus.emit(EVENTS.VENDOR_UPDATED, { orgId: organization, vendor });
    return vendor;
  }

  async deleteVendor(id, organization) {
    const vendor = await VendorRepository.deleteOne({ _id: id, organization });
    if (!vendor) {
      const error = new Error('Vendor not found');
      error.statusCode = 404;
      throw error;
    }
    eventBus.emit(EVENTS.VENDOR_DELETED, { orgId: organization, vendorId: id });
    return { message: 'Vendor deleted' };
  }
}

module.exports = new VendorService();
