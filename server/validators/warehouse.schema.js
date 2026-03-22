const { z } = require('zod');

exports.warehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Warehouse name is required'),
    location: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    contactNumber: z.string().optional(),
    parentWarehouse: z.string().nullable().optional(),
    manager: z.string().optional(),
    capacity: z.coerce.number().optional(),
    isActive: z.boolean().optional().default(true),
  })
});
