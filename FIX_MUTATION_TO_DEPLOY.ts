// INSTRUCTIONS:
// 1. Add this file to your DEPLOYED Convex codebase (wherever functions/page.ts is located)
// 2. Deploy it: npx convex deploy
// 3. Run it: npx convex run <path-to-this-file>:fixAllPageSchemas
// 4. After success, delete this file

import { mutation } from "./_generated/server";

export const fixAllPageSchemas = mutation({
  args: {},
  handler: async (ctx) => {
    // Get ALL pages
    const pages = await ctx.db.query("pages").collect();

    console.log(`Found ${pages.length} total pages`);

    let fixed = 0;
    const results = [];

    for (const page of pages) {
      const updates: any = {};

      // Add missing status field
      if (!(page as any).status) {
        const status = (page as any).approvedRevisionId ? "published" : "pending";
        updates.status = status;
      }

      // Add missing updatedAt field
      if (!(page as any).updatedAt) {
        updates.updatedAt = page.createdAt;
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(page._id, updates);
        results.push(`Fixed: ${(page as any).slug} - added ${Object.keys(updates).join(", ")}`);
        fixed++;
      }
    }

    console.log(`\nFixed ${fixed} pages:`);
    results.forEach(r => console.log(r));

    return {
      total: pages.length,
      fixed,
      message: `Successfully fixed ${fixed} out of ${pages.length} pages`
    };
  },
});
