const { z } = require('zod');

exports.vendorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Vendor name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    company: z.string().optional(),
    gstNumber: z.string().optional(),
  })
});
