const { z } = require('zod');

exports.expenseSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    amount: z.coerce.number().min(0, 'Amount must be at least 0'),
    category: z.enum(['rent', 'utilities', 'salary', 'marketing', 'maintenance', 'other']).default('other'),
    date: z.string().optional(),
    description: z.string().optional(),
    paidTo: z.string().optional(),
    paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'upi']).default('cash'),
  })
});
