class RBACService {
  constructor() {
    this.roles = {
      admin: {
        permissions: ['*'], // All permissions
        description: 'Full system access'
      },
      manager: {
        permissions: [
          'income:read', 'income:write',
          'tax:read', 'streams:read', 'streams:write',
          'ai:read', 'ai:configure',
          'compliance:read', 'audit:read',
          'users:read'
        ],
        description: 'Management access'
      },
      user: {
        permissions: [
          'income:read', 'income:write',
          'tax:read', 'streams:read',
          'ai:read', 'compliance:read'
        ],
        description: 'Standard user access'
      },
      viewer: {
        permissions: [
          'income:read', 'tax:read',
          'streams:read', 'compliance:read'
        ],
        description: 'Read-only access'
      }
    };
  }

  hasPermission(userRole, permission) {
    const role = this.roles[userRole];
    if (!role) return false;
    
    // Admin has all permissions
    if (role.permissions.includes('*')) return true;
    
    // Check specific permission
    if (role.permissions.includes(permission)) return true;
    
    // Check wildcard permissions
    const [resource, action] = permission.split(':');
    return role.permissions.includes(`${resource}:*`);
  }

  middleware(requiredPermission) {
    return (req, res, next) => {
      const userRole = req.user?.role || 'viewer';
      
      if (this.hasPermission(userRole, requiredPermission)) {
        next();
      } else {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermission,
          userRole
        });
      }
    };
  }

  getUserPermissions(userRole) {
    const role = this.roles[userRole];
    return role ? role.permissions : [];
  }

  getAllRoles() {
    return Object.entries(this.roles).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  createCustomRole(roleName, permissions, description) {
    this.roles[roleName] = {
      permissions,
      description,
      custom: true
    };
  }

  validatePermissions(permissions) {
    const validResources = ['income', 'tax', 'streams', 'ai', 'compliance', 'audit', 'users', 'admin'];
    const validActions = ['read', 'write', 'delete', 'configure', '*'];
    
    return permissions.every(permission => {
      if (permission === '*') return true;
      
      const [resource, action] = permission.split(':');
      return validResources.includes(resource) && validActions.includes(action);
    });
  }
}

module.exports = RBACService;