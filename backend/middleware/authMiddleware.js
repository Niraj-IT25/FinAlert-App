// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "No token provided. Please login first." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Add admin info to request object
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token. Please login again." });
    }
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (!["super_admin", "admin"].includes(req.admin.role)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// Middleware to check if user is super admin
export const isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ message: "Access denied. Super admin only." });
  }
  next();
};

// Middleware to check specific permission
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.admin.permissions?.[permission] !== true) {
      return res.status(403).json({
        message: `Access denied. You don't have permission to ${permission}`,
      });
    }
    next();
  };
};

// Middleware to check multiple permissions (user needs at least one)
export const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    const hasPermission = permissions.some((perm) => req.admin.permissions?.[perm] === true);

    if (!hasPermission) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

// Middleware to check all permissions (user needs all)
export const checkAllPermissions = (permissions) => {
  return (req, res, next) => {
    const hasAllPermissions = permissions.every((perm) => req.admin.permissions?.[perm] === true);

    if (!hasAllPermissions) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

// Middleware to log user actions
export const logAction = (action) => {
  return (req, res, next) => {
    // Log the action after response is sent
    res.on("finish", () => {
      console.log(`[${new Date().toISOString()}] ${req.admin.username} - ${action} - ${res.statusCode}`);
    });
    next();
  };
};
