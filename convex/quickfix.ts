import { mutation } from "./_generated/server";

export const fixAndUpdate = mutation({
  args: {},
  handler: async (ctx) => {
    // First, fix schema for all pages
    const pages = await ctx.db.query("pages").collect();
    let fixed = 0;
    for (const page of pages) {
      const updates: any = {};
      if (!(page as any).status) {
        updates.status = (page as any).approvedRevisionId ? "published" : "pending";
      }
      if (!(page as any).updatedAt) {
        updates.updatedAt = page.createdAt;
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(page._id, updates);
        fixed++;
      }
    }
    
    return {
      schemaFixed: fixed,
      totalPages: pages.length,
      message: `Fixed ${fixed} pages with missing schema fields`
    };
  }
});
