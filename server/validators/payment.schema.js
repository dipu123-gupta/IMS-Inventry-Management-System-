const { z } = require('zod');

exports.paymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().min(0.01, 'Valid amount is required'),
    type: z.enum(['payable', 'receivable']),
    paymentMode: z.enum(['cash', 'bank_transfer', 'cheque', 'card', 'upi']),
    bill: z.string().optional(),
    supplier: z.string().optional(),
    customer: z.string().optional(),
    reference: z.string().optional(),
    date: z.string().datetime().optional(),
    notes: z.string().optional()
  })
});
