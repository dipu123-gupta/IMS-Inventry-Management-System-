const { z } = require('zod');

exports.customerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
    gstNumber: z.string().optional(),
    openingBalance: z.coerce.number().optional().default(0),
  })
});
