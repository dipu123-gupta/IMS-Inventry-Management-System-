const { z } = require('zod');

exports.batchSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    cost: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
  })
});
