
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // scrambles (hashes) passwords so they are never stored as plain text

const AdminSchema = new mongoose.Schema(
  {
    // Display name: at least 3 characters, must be unique
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
    },

    // Login email: must be unique and look like a real email
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email format"],
    },

    // Password: at least 6 characters.
    // select:false means it is hidden unless a query asks for it on purpose.
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    
    // ============ ROLE-BASED ACCESS CONTROL ============
    // The user's job level. New users default to the safest one: "viewer".
    role: {
      type: String,
      enum: {
        values: ["super_admin", "admin", "technician", "viewer"],
        message: "Role must be: super_admin, admin, technician, or viewer",
      },
      default: "viewer",
    },

    // ============ PERMISSIONS ============
    // A list of switches (true = allowed). They are filled in automatically
    // from the role by setRolePermissions() near the bottom of this file.
    permissions: {
      // Failure Management
      canViewFailures: { type: Boolean, default: true },
      canCreateFailures: { type: Boolean, default: true },
      canEditFailures: { type: Boolean, default: false },
      canResolveFailures: { type: Boolean, default: false },
      canDeleteFailures: { type: Boolean, default: false },

      // User Management
      canViewUsers: { type: Boolean, default: false },
      canCreateUsers: { type: Boolean, default: false },
      canEditUsers: { type: Boolean, default: false },
      canDeleteUsers: { type: Boolean, default: false },

      // Reports & Analytics
      canViewReports: { type: Boolean, default: false },
      canGenerateReports: { type: Boolean, default: false },

      // System Settings
      canAccessSettings: { type: Boolean, default: false },
      canModifySettings: { type: Boolean, default: false },
    },

    // Account Status: set to false to block someone from logging in
    isActive: {
      type: Boolean,
      default: true,
    },

    // Who created this account (links to another Admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Department/Location
    department: {
      type: String,
      default: "General",
    },

    // Phone for notifications (10 digits)
    phone: {
      type: String,
      match: [/^\d{10}$/, "Phone must be 10 digits"],
      default: null,
    },

    // Last login tracking
    lastLogin: {
      type: Date,
      default: null,
    },

    // Account lock after failed attempts (the methods below are not used by login yet)
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // Activity log: a list of things this user has done
    activityLog: [
      {
        action: String,
        timestamp: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Runs automatically BEFORE every save 
// Hash password before saving (only when the password is new or changed)
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);               // random extra data to make each hash unique
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//  METHODS: small actions every user object can do

// Check a typed password against the stored (scrambled) one → true / false
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Is the account currently locked? (true only while lockUntil is in the future)
AdminSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Add one failed login. After 5 failures, lock the account for 30 minutes.
AdminSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30; // 30 minutes

  // Lock account if we've reached max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Clear the failed-attempt counter and any lock (used after a good login)
AdminSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Remember when this user last logged in
AdminSchema.methods.setLastLogin = async function () {
  this.lastLogin = Date.now();
  await this.save();
};

// Does this user have one particular permission? → true / false
AdminSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

// Fill in all the permission switches according to the user's role.
// This table is the single place that decides what each role can do.
AdminSchema.methods.setRolePermissions = function () {
  const permissionsByRole = {
    // Super admin: everything is allowed
    super_admin: {
      canViewFailures: true,
      canCreateFailures: true,
      canEditFailures: true,
      canResolveFailures: true,
      canDeleteFailures: true,
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canViewReports: true,
      canGenerateReports: true,
      canAccessSettings: true,
      canModifySettings: true,
    },
    // Admin: manages failures and most things, but can't delete users or change settings
    admin: {
      canViewFailures: true,
      canCreateFailures: true,
      canEditFailures: true,
      canResolveFailures: true,
      canDeleteFailures: true,
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canViewReports: true,
      canGenerateReports: true,
      canAccessSettings: true,
      canModifySettings: false,
    },
    // Technician: fixes failures but cannot delete them or manage users
    technician: {
      canViewFailures: true,
      canCreateFailures: true,
      canEditFailures: true,
      canResolveFailures: true,
      canDeleteFailures: false,
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewReports: true,
      canGenerateReports: false,
      canAccessSettings: false,
      canModifySettings: false,
    },
    // Viewer: can only look
    viewer: {
      canViewFailures: true,
      canCreateFailures: false,
      canEditFailures: false,
      canResolveFailures: false,
      canDeleteFailures: false,
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewReports: false,
      canGenerateReports: false,
      canAccessSettings: false,
      canModifySettings: false,
    },
  };

  // Use the table row for this role (viewer if the role is unknown)
  this.permissions = permissionsByRole[this.role] || permissionsByRole.viewer;
};

// Runs automatically BEFORE every save 
// If the role was changed, refresh the permissions to match
AdminSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    this.setRolePermissions();
  }
  next();
});

export default mongoose.model("Admin", AdminSchema);
