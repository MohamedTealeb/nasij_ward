import { decodedToken } from "../utils/security/token.security.js";
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