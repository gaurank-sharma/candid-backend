/**
 * Local development server — uses an in-memory MongoDB instance so
 * you never need network access to MongoDB Atlas.
 *
 * Usage:  npm run dev:local
 *
 * A superadmin account is seeded automatically on first run:
 *   Email:    admin@local.dev
 *   Password: admin123
 */

require("dotenv").config(); // Load JWT_SECRET, CLOUDINARY_*, etc. from .env first

// Force arm64 binary on Apple Silicon Macs
if (process.arch === "arm64") {
  process.env.MONGOMS_ARCH = "arm64";
}

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function start() {
  console.log("\n🔧  Starting local dev environment …\n");

  // 1. Boot in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri() + "CandidDB";

  // 2. Override MONGO_URI *before* server.js loads.
  //    dotenv.config() in server.js will not overwrite an already-set var.
  process.env.MONGO_URI = uri;

  // 3. Connect (caches the connection so server.js reuses it)
  await mongoose.connect(uri);
  console.log("✅  Local MongoDB ready");

  // 4. Seed a default superadmin if the collection is empty
  const User = require("./models/User");
  if ((await User.countDocuments()) === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Local Admin",
      email: "admin@local.dev",
      password: hash,
      role: "superadmin",
    });
    console.log("👤  Admin account seeded");
  }

  // 5. Load and start Express
  const app = require("./server");
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`\n🚀  API running   →  http://localhost:${PORT}`);
    console.log(`🌐  Frontend      →  http://localhost:5173`);
    console.log(`\n🔑  Admin login`);
    console.log(`    Email:    admin@local.dev`);
    console.log(`    Password: admin123\n`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑  Shutting down …");
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error("❌  Failed to start local server:", err.message);
  process.exit(1);
});
