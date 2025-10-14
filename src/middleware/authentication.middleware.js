import { decodedToken } from "../utils/security/token.security.js";
import mongoose from "mongoose";
export const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ message: "No token provided" });
    }
    const { user } = await decodedToken({ authorization });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({ message: err.message || "Invalid token" });
  }
};
export const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new Error("Not authorized", { cause: 403 }));
    }
    next();
  };
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    
    if (!authorization) {
      req.user = null;
      return next();
    }
    
    const { user } = await decodedToken({ authorization });
    if (!user) {
      req.user = null;
      return next();
    }
    
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// Middleware للتحقق من أن المستخدم يمكنه الوصول للـ shipment
export const checkShipmentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // للـ admin يمكنه الوصول لجميع الـ shipments
    if (req.user.role === 'admin') {
      return next();
    }
    
    // البحث عن الـ shipment والتأكد من أن المستخدم هو صاحبها
    const shipment = await mongoose.model('Shipment').findById(id);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    
    if (shipment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied. You can only access your own shipments" });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};