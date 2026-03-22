const { z } = require('zod');

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'staff']).optional(),
    orgName: z.string().optional()
  })
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required')
  })
});

exports.verify2FASchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
    token: z.string().length(6, 'Token must be exactly 6 characters')
  })
});
