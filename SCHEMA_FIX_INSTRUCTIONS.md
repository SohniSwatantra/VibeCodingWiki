# Schema Validation Fix Instructions

The Convex database has some pages with missing required fields that are preventing deployment. Here's how to fix them:

## Option 1: Fix via Convex Dashboard (Recommended)

1. **Open the Convex Dashboard:**
   - Go to: https://dashboard.convex.dev/d/clean-pika-695

2. **Navigate to the Functions tab**

3. **Create a temporary mutation to fix the data:**

   Click "New Function" and paste this code:

   ```typescript
   import { mutation } from "./_generated/server";

   export const fixSchemaIssues = mutation({
     args: {},
     handler: async (ctx) => {
       // Get all pages
       const pages = await ctx.db.query("pages").collect();

       let fixed = 0;
       for (const page of pages) {
         const updates: any = {};

         // Add missing status field
         if (!(page as any).status) {
           updates.status = (page as any).approvedRevisionId ? "published" : "pending";
         }

         // Add missing updatedAt field
         if (!(page as any).updatedAt) {
           updates.updatedAt = page.createdAt;
         }

         // Remove deprecated latestRevisionId field if it exists
         if ((page as any).latestRevisionId !== undefined) {
           // Can't remove fields in Convex, but we can note it
           console.log(\`Page \${page.slug} has deprecated latestRevisionId field\`);
         }

         // Apply updates if needed
         if (Object.keys(updates).length > 0) {
           await ctx.db.patch(page._id, updates);
           console.log(\`Fixed page: \${page.slug}\`);
           fixed++;
         }
       }

       return {
         total: pages.length,
         fixed,
         message: \`Fixed \${fixed} pages with missing fields\`
       };
     },
   });
   ```

4. **Run the mutation:**
   - After saving, click "Run" on the mutation
   - It will fix all pages with missing fields

5. **Remove the temporary mutation:**
   - After it runs successfully, you can delete this function

6. **Remove the latestRevisionId field from the schema:**
   - Since Convex doesn't allow removing fields from documents, we need to keep `latestRevisionId` as optional in the schema

## Option 2: Fix Individual Pages Manually

Go to the "Data" tab and for each page missing fields:

### Page: openai (ID: js70dkhtnma4hj7gva1qk7gj2h7v2kcd)
- Add field: `status` = `"pending"`
- Add field: `updatedAt` = `1762648700786`

### Page: vibecoding (ID: js71gqfrsvj9jq2w46p9ersw757v3479)
- This page has `latestRevisionId` field pointing to old "revisions" table
- Just keep the schema field as optional

## After Fixing

Once the data is fixed:

1. **Revert schema changes** (make fields required again if desired):
   ```typescript
   // In convex/schema.ts, change back to:
   status: v.union(v.literal('draft'), v.literal('pending'), v.literal('published'), v.literal('archived')),
   updatedAt: v.number(),
   ```

2. **Deploy Convex:**
   ```bash
   npx convex dev
   ```

3. **Run the content update script:**
   ```bash
   npx tsx scripts/update-vibecoding-tools.ts
   ```

## Current Schema Issues

From the error logs, these are the problematic documents:

1. **Page "openai" (js70dkhtnma4hj7gva1qk7gj2h7v2kcd)**
   - Missing: `status`, `updatedAt`
   - Has extra: `pageType: "company"` (but now allowed in schema)

2. **Page "vibecoding" (js71gqfrsvj9jq2w46p9ersw757v3479)**
   - Has: `latestRevisionId` pointing to deprecated "revisions" table
   - Missing: `status`, `updatedAt` (probably)
