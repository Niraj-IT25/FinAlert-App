import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d"; // a token stops working after 7 days

// Make a token that contains the user's id, role and permissions
const generateToken = (admin) => {
  return jwt.sign(
    { 
      id: admin._id,
      role: admin.role,
      permissions: admin.permissions  // permissions travel inside the token
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRE }
  );
};

// REGISTER: create a new user account 
// Route: POST /admin/auth/register
export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    // Basic checks
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Refuse if the email OR username is already taken
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Validate role: if missing or unknown, fall back to the safest one (viewer)
    const validRoles = ["super_admin", "admin", "technician", "viewer"];
    const userRole = role && validRoles.includes(role) ? role : "viewer";

    // Build the user (the password is scrambled automatically when saved)
    const admin = new Admin({
      username,
      email,
      password,
      role: userRole,
    });

    // Fill in the permissions that match the role
    admin.setRolePermissions();

    await admin.save();

    // Generate token WITH permissions
    const token = generateToken(admin);

    console.log(`✓ New user: ${username} role: ${userRole}`);

    // Send back the token and the basic details (never the password)
    res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error registering admin" });
  }
};

// LOGIN: sign in with email and password
// Route: POST /admin/auth/login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user. ".select('+password')" is needed because the password
    // is hidden by default (see the Admin model).
    const admin = await Admin.findOne({ email }).select("+password");

    // Same message for "no such email" and "wrong password" so attackers learn nothing
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // A disabled account cannot log in
    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    // Compare the typed password with the scrambled one in the database
    const isPasswordCorrect = await admin.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token WITH permissions
    const token = generateToken(admin);

    console.log(`✓ Login: ${email} role: ${admin.role}`);

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error during login" });
  }
};

// PROFILE: details of the logged-in user 
// Route: GET /admin/auth/profile   (needs token)
export const getAdminProfile = async (req, res) => {
  try {
    // req.admin was filled in by verifyToken from the token
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Error fetching profile" });
  }
};

// LOGOUT 
// Route: POST /admin/auth/logout   (needs token)
// Tokens are not stored on the server, so there is nothing to delete here.
// The app forgets its own copy of the token, and that is the real logout.
export const logoutAdmin = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error during logout" });
  }
};

// LIST USERS 
// Route: GET /admin/auth/all-admins   (super admin only, set in the route file)
export const getAllAdmins = async (req, res) => {
  try {
    // Print who is asking (useful while testing)
    console.log(`\n[REQUEST] getAllAdmins`);
    console.log(`  Admin ID: ${req.admin.id}`);
    console.log(`  Admin Role: ${req.admin.role}`);
    console.log(`  Permissions: ${JSON.stringify(req.admin.permissions)}`);

    // Double-check against the database that the user still exists
    const currentAdmin = await Admin.findById(req.admin.id);

    if (!currentAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // Only admin and super_admin can view users
    if (!["admin", "super_admin"].includes(currentAdmin.role)) {
      console.log(`  ❌ DENIED: User role ${currentAdmin.role} not allowed`);
      return res.status(403).json({ message: "You do not have permission to view users" });
    }

    // Get every user but leave the password out ("-password" means exclude it)
    const admins = await Admin.find({}, "-password");

    console.log(`  ✓ SUCCESS: Returning ${admins.length} users\n`);

    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Error fetching admins" });
  }
};

// DELETE A USER 
// Route: DELETE /admin/auth/:id   (super admin only, set in the route file)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params; // the id of the user to delete
    
    console.log(`\n[REQUEST] deleteAdmin`);
    console.log(`  Admin ID: ${req.admin.id}`);
    console.log(`  Admin Role: ${req.admin.role}`);
    console.log(`  Target ID: ${id}`);

    // Make sure the person asking still exists
    const currentAdmin = await Admin.findById(req.admin.id);

    if (!currentAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // Only admin and super_admin can delete
    if (!["admin", "super_admin"].includes(currentAdmin.role)) {
      console.log(`  ❌ DENIED: User role ${currentAdmin.role} not allowed`);
      return res.status(403).json({ message: "You do not have permission to delete users" });
    }

    // Make sure the user being deleted exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Safety rule: nobody can delete their own account
    if (admin._id.toString() === currentAdmin._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await Admin.findByIdAndDelete(id);

    console.log(`  ✓ SUCCESS: User ${admin.username} deleted\n`);

    res.status(200).json({
      message: "Admin deleted successfully",
      deletedUser: admin.username
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Error deleting admin" });
  }
};
