import { db } from "./index";
import { profiles, rooms, guests } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed Rooms
  await db.insert(rooms).values([
    { roomNumber: "101", roomType: "Deluxe", floor: 1, capacity: 2, pricePerNight: "150.00" },
    { roomNumber: "102", roomType: "Suite", floor: 1, capacity: 4, pricePerNight: "300.00" },
  ]);

  // Seed Guests
  await db.insert(guests).values([
    { firstName: "John", lastName: "Doe", email: "john@example.com" },
    { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
  ]);

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
