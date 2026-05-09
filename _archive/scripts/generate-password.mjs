/**
 * Generate a bcrypt hash of a password.
 *
 * Usage:
 *   npx tsx scripts/generate-password.mjs yourpassword
 *   npm run hash-password -- yourpassword
 *
 * Copy the output hash. Use it as ADMIN_PASSWORD_HASH in .env
 * or pass it to your friend so they can seed without ever seeing
 * your plaintext password.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/generate-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("");
console.log("Password hash (for .env as ADMIN_PASSWORD_HASH):");
console.log(hash);
console.log("");
console.log("Copy the line above. Nobody can reverse this hash to");
console.log("recover your password — it's a one-way bcrypt hash.");
