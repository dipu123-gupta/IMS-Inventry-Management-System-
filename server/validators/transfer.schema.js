const { z } = require('zod');

exports.transferSchema = z.object({
  body: z.object({
    fromWarehouse: z.string().min(1, 'Source warehouse is required'),
    toWarehouse: z.string().min(1, 'Destination warehouse is required'),
    items: z.array(z.object({
      product: z.string().min(1, 'Product ID is required'),
      quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    })).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  })
});
