import { Hono } from "hono";
import { createCRUDRouter } from "@/utils/crud-factory";
import {
  rooms,
  guests,
  reservations,
  rolePermissions,
  auditLog,
  userRoles,
  profiles
} from "@/db/schema";

const api = new Hono();

// 🚀 Sentinel: Auto-generated CRUD for all core domains
api.route("/rooms", createCRUDRouter(rooms, "rooms"));
api.route("/guests", createCRUDRouter(guests, "guests"));
api.route("/reservations", createCRUDRouter(reservations, "reservations"));
api.route("/role_permissions", createCRUDRouter(rolePermissions, "role_permissions"));
api.route("/audit_log", createCRUDRouter(auditLog, "audit_log"));
api.route("/user_roles", createCRUDRouter(userRoles, "user_roles"));
api.route("/profiles", createCRUDRouter(profiles, "profiles"));

export default api;
