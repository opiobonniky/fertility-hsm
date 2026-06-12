import { prisma } from "../config/db.js";
import jwt from "jsonwebtoken";

/**
 * Authentication middleware.
 * Decodes JWT, loads full user from DB with role relation,
 * and attaches { id, email, firstName, lastName, role: { id, name, label, hierarchy } }
 * to req.user for downstream RBAC middleware.
 */
const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          select: { id: true, name: true, label: true, hierarchy: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated. Contact an administrator." });
    }

    // Attach minimal user payload with role object to request
    req.user = {
      id: user.id,
      email: user.email,
      staffCode: user.staffCode,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,          // { id, name, label, hierarchy }
      roleId: user.roleId,      // UUID for DB joins
      phone: user.phone,
      isActive: user.isActive,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export default authenticate;
export { authenticate };
