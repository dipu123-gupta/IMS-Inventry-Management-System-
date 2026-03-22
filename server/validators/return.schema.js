const { z } = require('zod');

exports.returnSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    type: z.enum(['sale', 'purchase']),
    items: z.array(z.object({
      product: z.string().min(1, 'Product ID is required'),
      warehouse: z.string().min(1, 'Warehouse ID is required'),
      quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
      reason: z.string().optional(),
      condition: z.enum(['good', 'damaged', 'defective']).default('good'),
    })).min(1, 'At least one item is required'),
    notes: z.string().optional(),
    totalRefundAmount: z.coerce.number().min(0).optional(),
  })
});
