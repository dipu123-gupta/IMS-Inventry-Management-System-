const { z } = require('zod');

exports.warehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Warehouse name is required'),
    location: z.string().min(1, 'Location is required'),
    manager: z.string().optional(),
    phone: z.string().optional(),
    capacity: z.coerce.number().optional(),
    isActive: z.boolean().optional().default(true),
  })
});
