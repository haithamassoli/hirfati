import { mutation } from "./_generated/server";

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "Categories already seeded";

    const categories = [
      { name: "Plumbing", nameAr: "سباكة", slug: "plumbing", icon: "Wrench", order: 1 },
      { name: "Electrical", nameAr: "كهرباء", slug: "electrical", icon: "Zap", order: 2 },
      { name: "Carpentry", nameAr: "نجارة", slug: "carpentry", icon: "Hammer", order: 3 },
      { name: "Blacksmithing", nameAr: "حدادة", slug: "blacksmithing", icon: "Anvil", order: 4 },
      { name: "Painting", nameAr: "دهان", slug: "painting", icon: "Paintbrush", order: 5 },
      { name: "HVAC", nameAr: "تكييف وتبريد", slug: "hvac", icon: "Snowflake", order: 6 },
      { name: "Tiling & Flooring", nameAr: "بلاط وأرضيات", slug: "tiling-flooring", icon: "Grid3X3", order: 7 },
      { name: "General Maintenance", nameAr: "صيانة عامة", slug: "general-maintenance", icon: "Settings", order: 8 },
    ];

    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }

    // Subcategories
    const plumbing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "plumbing"))
      .first();

    if (plumbing) {
      const plumbingSubs = [
        { name: "Faucet Repair", nameAr: "إصلاح حنفيات", slug: "faucet-repair", order: 1 },
        { name: "Pipe Installation", nameAr: "تمديد أنابيب", slug: "pipe-installation", order: 2 },
        { name: "Drain Cleaning", nameAr: "تنظيف مجاري", slug: "drain-cleaning", order: 3 },
      ];
      for (const sub of plumbingSubs) {
        await ctx.db.insert("categories", { ...sub, parentId: plumbing._id });
      }
    }

    const electrical = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "electrical"))
      .first();

    if (electrical) {
      const electricalSubs = [
        { name: "Wiring", nameAr: "تمديدات كهربائية", slug: "wiring", order: 1 },
        { name: "Lighting", nameAr: "إضاءة", slug: "lighting", order: 2 },
        { name: "Panel Installation", nameAr: "تركيب لوحات كهربائية", slug: "panel-installation", order: 3 },
      ];
      for (const sub of electricalSubs) {
        await ctx.db.insert("categories", { ...sub, parentId: electrical._id });
      }
    }

    return "Categories seeded successfully";
  },
});
