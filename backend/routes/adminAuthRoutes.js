

import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  getAllAdmins,
  deleteAdmin,
} from "../controllers/adminAuthController.js";
import { verifyToken, isSuperAdmin } from "../middleware/authMiddleware.js";

const route = express.Router();

// Public routes (no token needed)
route.post("/register", registerAdmin);    // Create a new user
route.post("/login", loginAdmin);          // Sign in

// Protected routes (must be logged in: verifyToken checks the token)
route.get("/profile", verifyToken, getAdminProfile);     // See my own profile
route.post("/logout", verifyToken, logoutAdmin);         // Sign out

// Super admin only routes (logged in AND role must be super_admin)
route.get("/all-admins", verifyToken, isSuperAdmin, getAllAdmins);     // List all users
route.delete("/:id", verifyToken, isSuperAdmin, deleteAdmin);          // Delete a user

export default route;
