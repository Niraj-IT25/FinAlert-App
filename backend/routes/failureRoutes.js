
import express from "express";
import {
  createFailure,
  getFailures,
  updateFailure,
  deleteFailure,
} from "../controllers/failureController.js";
import {
  verifyToken,      // checks the user is logged in
  checkPermission,  // checks the user's role is allowed to do this
} from "../middleware/authMiddleware.js";

const route = express.Router();

// ============ PUBLIC ROUTES (No authentication required) ============

// Report a new failure (anyone can report, e.g. a customer at the ATM)
route.post("/failures", createFailure);

// Get all failures (anyone can view)
route.get("/failures", getFailures);

// ============ PROTECTED ROUTES (Requires login + permission) ============
// The functions run left to right: verifyToken → checkPermission → the controller.
// If any step fails, the request stops there with an error (401 or 403).

// Update a failure's status (needs the "canResolveFailures" permission)
// Allowed: technician, admin, super admin
route.put("/failures/:id", verifyToken, checkPermission("canResolveFailures"), updateFailure);

// Delete a failure (needs the "canDeleteFailures" permission)
// Allowed: admin, super admin. Technicians and viewers get 403 Forbidden.
route.delete("/failures/:id", verifyToken, checkPermission("canDeleteFailures"), deleteFailure);

export default route;
