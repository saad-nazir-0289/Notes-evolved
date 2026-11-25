const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";

const createLegacyNoteFilter = () => ({
  $or: [
    { owner: { $exists: false } },
    { owner: null },
  ],
});

export const runLegacyNoteMigration = async ({ Note, User, ownerEmail, apply = false, confirmedOwnerEmail } = {}) => {
  const normalizedOwnerEmail = normalizeEmail(ownerEmail);
  if (!normalizedOwnerEmail) throw new Error("A target owner email is required");
  if (apply && normalizeEmail(confirmedOwnerEmail) !== normalizedOwnerEmail) {
    throw new Error("Applying the migration requires --confirm-owner to match --owner");
  }

  const user = await User.findOne({ email: normalizedOwnerEmail });
  if (!user) throw new Error("No registered account found for " + normalizedOwnerEmail);
  const ownerId = user._id ?? user.id;
  if (!ownerId) throw new Error("The target account does not have an id");

  const userCount = await User.countDocuments();
  const matched = await Note.countDocuments(createLegacyNoteFilter());
  const safeToApply = matched === 0 || userCount === 1;
  if (apply && matched > 0 && userCount !== 1) {
    throw new Error("Cannot automatically assign legacy notes because multiple accounts exist; manually map ownership before applying a migration");
  }
  if (!apply || matched === 0) {
    return {
      ownerEmail: normalizedOwnerEmail,
      ownerId: String(ownerId),
      userCount,
      matched,
      modified: 0,
      remaining: matched,
      safeToApply,
      applied: false,
    };
  }

  const updateResult = await Note.updateMany(createLegacyNoteFilter(), { $set: { owner: ownerId } });
  const remaining = await Note.countDocuments(createLegacyNoteFilter());
  if (remaining > 0) throw new Error("Migration incomplete: " + remaining + " ownerless notes remain");

  return {
    ownerEmail: normalizedOwnerEmail,
    ownerId: String(ownerId),
    userCount,
    matched,
    modified: updateResult.modifiedCount ?? updateResult.nModified ?? 0,
    remaining,
    safeToApply: true,
    applied: true,
  };
};
