import { Hono } from "hono";
import { createCRUDRouter } from "@/utils/crud-factory";
import { rooms, guests, reservations } from "@/db/schema";

const api = new Hono();

// Auto-generate CRUD for core tables
api.route("/rooms", createCRUDRouter(rooms, "rooms"));
api.route("/guests", createCRUDRouter(guests, "guests"));
api.route("/reservations", createCRUDRouter(reservations, "reservations"));

export default api;
