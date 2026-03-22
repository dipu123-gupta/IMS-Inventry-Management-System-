/**
 * Middleware to ensure organization-based data isolation (Multi-tenancy).
 * Extracts organizationId from user and attaches it to the request object.
 */
const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.organization) {
    return res.status(403).json({ 
      message: 'Access denied. You must be part of an organization to access this resource.' 
    });
  }

  // Attach organization context to request (as string ID)
  req.organization = req.user.organization._id.toString();
  next();
};

module.exports = tenantMiddleware;
