const { z } = require('zod');

exports.billSchema = z.object({
  body: z.object({
    vendor: z.string().min(1, 'Valid vendor ID is required'),
    dueDate: z.string().min(1, 'Valid due date is required'),
    purchaseOrder: z.string().optional(),
    items: z.array(
      z.object({
        product: z.string().min(1, 'Valid product ID is required'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        price: z.coerce.number().optional()
      })
    ).min(1, 'At least one item is required')
  })
});
