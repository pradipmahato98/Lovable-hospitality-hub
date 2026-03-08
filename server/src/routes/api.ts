import { Hono } from "hono";
import { createCRUDRouter } from "@/utils/crud-factory";
import {
  rooms,
  guests,
  reservations,
  rolePermissions,
  auditLog,
  userRoles,
  profiles,
  otaChannels,
  staffMembers,
  housekeepingTasks,
  lostAndFound
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
api.route("/ota_channels", createCRUDRouter(otaChannels, "ota_channels"));
api.route("/staff_members", createCRUDRouter(staffMembers, "staff_members"));
api.route("/housekeeping_tasks", createCRUDRouter(housekeepingTasks, "housekeeping_tasks"));
api.route("/lost_and_found", createCRUDRouter(lostAndFound, "lost_and_found"));

export default api;
