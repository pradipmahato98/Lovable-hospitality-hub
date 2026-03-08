import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", ["admin", "manager", "staff", "user"]);

// Profiles Table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  isBlocked: boolean("is_blocked").default(false),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Roles Table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  role: appRoleEnum("role").notNull().default("user"),
});

// Role Permissions Table
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: appRoleEnum("role").notNull(),
  permission: text("permission").notNull(),
});

// Staff Members Table
export const staffMembers = pgTable("staff_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: text("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("active"),
  hireDate: timestamp("hire_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Housekeeping Tasks Table
export const housekeepingTasks = pgTable("housekeeping_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull(),
  taskType: text("task_type").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  notes: text("notes"),
  assignedTo: uuid("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lost and Found Table
export const lostAndFound = pgTable("lost_and_found", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemDescription: text("item_description").notNull(),
  foundLocation: text("found_location").notNull(),
  foundBy: text("found_by"),
  foundDate: timestamp("found_date").notNull(),
  category: text("category"),
  status: text("status").notNull().default("stored"),
  storageLocation: text("storage_location"),
  notes: text("notes"),
  claimedBy: text("claimed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OTA Channels Table
export const otaChannels = pgTable("ota_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  apiEndpoint: text("api_endpoint"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  syncStatus: text("sync_status"),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rooms Table
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomNumber: text("room_number").notNull().unique(),
  roomType: text("room_type").notNull(),
  floor: integer("floor").notNull(),
  capacity: integer("capacity").notNull(),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("available"),
  description: text("description"),
  imageUrl: text("image_url"),
  amenities: text("amenities").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guests Table
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  nationality: text("nationality"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  isVip: boolean("is_vip").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reservations Table
export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationCode: text("reservation_code").notNull().unique(),
  guestId: uuid("guest_id").references(() => guests.id).notNull(),
  roomId: uuid("room_id").references(() => rooms.id).notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  actualCheckIn: timestamp("actual_check_in"),
  actualCheckOut: timestamp("actual_check_out"),
  status: text("status").notNull().default("pending"),
  adults: integer("adults").notNull().default(1),
  children: integer("children").default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("unpaid"),
  specialRequests: text("special_requests"),
  rejectionReason: text("rejection_reason"),
  source: text("source"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Log Table
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
