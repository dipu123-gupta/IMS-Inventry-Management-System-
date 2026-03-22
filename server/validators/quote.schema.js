const { z } = require('zod');

exports.quoteSchema = z.object({
  body: z.object({
    customer: z.string().min(1, 'Valid customer ID is required'),
    items: z.array(
      z.object({
        product: z.string().min(1, 'Valid product ID is required'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        price: z.coerce.number().optional(),
        discount: z.coerce.number().optional(),
        tax: z.coerce.number().optional()
      })
    ).min(1, 'At least one item is required'),
    validUntil: z.string().datetime({ message: 'Valid date is required for validUntil' }),
    notes: z.string().optional()
  })
});
