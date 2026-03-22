const { z } = require('zod');

exports.orderSchema = z.object({
  body: z.object({
    type: z.enum(['purchase', 'sale']),
    items: z.array(
      z.object({
        product: z.string().min(1, 'Product ID is required'),
        warehouse: z.string().min(1, 'Warehouse ID is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be a positive number')
      })
    ).min(1, 'At least one item is required'),
    customer: z.string().optional(),
    supplier: z.string().optional(),
    quoteReference: z.string().optional(),
    paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'credit']).optional()
  })
});
