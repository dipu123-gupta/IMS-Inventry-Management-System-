const WarehouseRepository = require('../repositories/WarehouseRepository');
const ProductRepository = require('../repositories/ProductRepository');

class WarehouseService {
  async getWarehouses(organization) {
    const warehouses = await WarehouseRepository.findAllWithManager(organization);
    return { success: true, count: warehouses.length, warehouses };
  }

  async getWarehouseById(id, organization) {
    const warehouse = await WarehouseRepository.findByIdWithManager(id, organization);
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, warehouse };
  }

  async createWarehouse(data, organization) {
    if (data.parentWarehouse && data.parentWarehouse === data._id) {
       const error = new Error('A warehouse cannot be its own parent');
       error.statusCode = 400;
       throw error;
    }
    if (!data.location) {
      data.location = data.address || data.city || data.name;
    }
    const warehouse = await WarehouseRepository.create({ ...data, organization });
    return { success: true, warehouse };
  }

  async updateWarehouse(id, data, organization) {
    const warehouse = await WarehouseRepository.updateOne(
      { _id: id, organization },
      data
    );
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, warehouse };
  }

  async deleteWarehouse(id, organization) {
    const warehouse = await WarehouseRepository.findOne({ _id: id, organization });
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }

    // Prevent deletion if it has stock
    const productsInWarehouse = await ProductRepository.findOne({
      'warehouseStock.warehouse': id,
      'warehouseStock.quantity': { $gt: 0 },
      organization
    });

    if (productsInWarehouse) {
      const error = new Error('Cannot delete warehouse that still has stock. Please transfer or adjust stock first.');
      error.statusCode = 400;
      throw error;
    }

    await WarehouseRepository.deleteOne({ _id: id, organization });
    return { success: true, message: 'Warehouse deleted' };
  }
}

module.exports = new WarehouseService();
