import dbConnect from "@/lib/db";
import Supplier from "@/models/SupplierModel";

/**
 * Migration: remove 'status' field from all Supplier documents.
 * Usage:
 *  ts-node -r tsconfig-paths/register scripts/migrations/remove-supplier-status.ts
 * or add an npm script to run with ts-node.
 */
async function main() {
  try {
    console.log("Connecting to DB...")
    await dbConnect()
    console.log("Connected. Removing 'status' from suppliers...")

    const res = await Supplier.updateMany(
      { status: { $exists: true } as any },
      { $unset: { status: "" } as any }
    )

    console.log(`Done. Matched: ${res.matchedCount ?? (res as any).n}, Modified: ${res.modifiedCount ?? (res as any).nModified}`)
    process.exit(0)
  } catch (e) {
    console.error("Migration failed:", e)
    process.exit(1)
  }
}

main()
