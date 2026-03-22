const { ZodError } = require('zod');

const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const errorsList = error.issues || error.errors || [];
        const errors = errorsList.map((e) => `${e.path ? e.path.join('.') : 'Field'} - ${e.message}`);
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors
        });
      }
      next(error);
    }
  };
};

module.exports = validateZod;
