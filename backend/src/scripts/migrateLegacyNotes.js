import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Note from "../model/note.js";
import User from "../model/user.js";
import { runLegacyNoteMigration } from "../utils/legacyNoteMigration.js";

const args = process.argv.slice(2);
const ownerArgs = args.filter((arg) => arg.startsWith("--owner="));
const confirmationArgs = args.filter((arg) => arg.startsWith("--confirm-owner="));
const applyArgs = args.filter((arg) => arg === "--apply");
const knownArgs = [...ownerArgs, ...confirmationArgs, ...applyArgs];
const ownerEmail = ownerArgs[0]?.slice("--owner=".length);
const confirmedOwnerEmail = confirmationArgs[0]?.slice("--confirm-owner=".length);
const apply = applyArgs.length === 1;

if (knownArgs.length !== args.length) throw new Error("Unknown argument. Use --owner=email [--apply --confirm-owner=email].");
if (ownerArgs.length !== 1 || confirmationArgs.length > 1 || applyArgs.length > 1) {
  throw new Error("Pass --owner once, and pass --apply/--confirm-owner at most once.");
}
if (!ownerEmail) throw new Error("A target account is required. Use --owner=email.");
if (apply && !confirmedOwnerEmail) throw new Error("Applying changes requires --confirm-owner=email matching --owner.");
if (!apply && confirmedOwnerEmail) throw new Error("--confirm-owner is only valid together with --apply.");

await connectDB();
try {
  const result = await runLegacyNoteMigration({ Note, User, ownerEmail, apply, confirmedOwnerEmail });
  console.log(JSON.stringify(result, null, 2));
  if (!apply && result.matched > 0) {
    if (result.safeToApply) {
      console.log("Dry run only. Stop the app, back up MongoDB, then rerun with --apply and matching --confirm-owner to assign these legacy notes.");
    } else {
      console.log("Automatic migration is blocked because multiple accounts exist and legacy note ownership cannot be inferred. Do not apply this migration; manually map the legacy notes first.");
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
