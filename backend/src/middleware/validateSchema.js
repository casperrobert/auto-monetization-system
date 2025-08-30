// Simple schema validation middleware
const validateSchema = (schemaName) => {
  return (req, res, next) => {
    // Basic validation - in production use Joi or similar
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    next();
  };
};

module.exports = validateSchema;