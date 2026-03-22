const { z } = require('zod');

exports.productSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    cost: z.coerce.number().min(0, 'Cost price must be a positive number'),
    category: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    lowStockThreshold: z.coerce.number().optional(),
    supplier: z.string().optional()
  })
});
