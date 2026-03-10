import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Categories ────────────────────────────────────────────────────────────────

export const seedCategories = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "Categories already seeded";

    const mainCategories = [
      { name: "Plumbing", nameAr: "سباكة", slug: "plumbing", icon: "Wrench", order: 1 },
      { name: "Electrical", nameAr: "كهرباء", slug: "electrical", icon: "Zap", order: 2 },
      { name: "Carpentry", nameAr: "نجارة", slug: "carpentry", icon: "Hammer", order: 3 },
      { name: "Blacksmithing", nameAr: "حدادة", slug: "blacksmithing", icon: "Anvil", order: 4 },
      { name: "Painting", nameAr: "دهان", slug: "painting", icon: "Paintbrush", order: 5 },
      { name: "HVAC", nameAr: "تكييف وتبريد", slug: "hvac", icon: "Snowflake", order: 6 },
      { name: "Tiling & Flooring", nameAr: "بلاط وأرضيات", slug: "tiling-flooring", icon: "Grid3X3", order: 7 },
      { name: "General Maintenance", nameAr: "صيانة عامة", slug: "general-maintenance", icon: "Settings", order: 8 },
    ];

    for (const cat of mainCategories) {
      await ctx.db.insert("categories", cat);
    }

    const subcategories: Record<string, { name: string; nameAr: string; slug: string; order: number }[]> = {
      plumbing: [
        { name: "Faucet Repair", nameAr: "إصلاح حنفيات", slug: "faucet-repair", order: 1 },
        { name: "Pipe Installation", nameAr: "تمديد أنابيب", slug: "pipe-installation", order: 2 },
        { name: "Drain Cleaning", nameAr: "تنظيف مجاري", slug: "drain-cleaning", order: 3 },
      ],
      electrical: [
        { name: "Wiring", nameAr: "تمديدات كهربائية", slug: "wiring", order: 1 },
        { name: "Lighting", nameAr: "إضاءة", slug: "lighting", order: 2 },
        { name: "Panel Installation", nameAr: "تركيب لوحات كهربائية", slug: "panel-installation", order: 3 },
      ],
      carpentry: [
        { name: "Door Installation", nameAr: "تركيب أبواب", slug: "door-installation", order: 1 },
        { name: "Cabinet Making", nameAr: "صناعة خزائن", slug: "cabinet-making", order: 2 },
        { name: "Furniture Repair", nameAr: "إصلاح أثاث", slug: "furniture-repair", order: 3 },
      ],
      painting: [
        { name: "Interior Painting", nameAr: "دهان داخلي", slug: "interior-painting", order: 1 },
        { name: "Exterior Painting", nameAr: "دهان خارجي", slug: "exterior-painting", order: 2 },
        { name: "Decorative Painting", nameAr: "دهان ديكور", slug: "decorative-painting", order: 3 },
      ],
    };

    for (const [parentSlug, subs] of Object.entries(subcategories)) {
      const parent = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", parentSlug))
        .first();
      if (parent) {
        for (const sub of subs) {
          await ctx.db.insert("categories", { ...sub, parentId: parent._id });
        }
      }
    }

    return "Categories seeded successfully";
  },
});

// ─── Full Seed ──────────────────────────────────────────────────────────────────

export const seedAll = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Guard: skip if demo users already exist
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "ahmad.provider@hirfati.dev"))
      .first();
    if (existing) return "Demo data already seeded";

    // ── 1. Resolve category IDs ──────────────────────────────────────────────
    const catPlumbing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "plumbing"))
      .first();
    const catElectrical = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "electrical"))
      .first();
    const catCarpentry = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "carpentry"))
      .first();
    const catPainting = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "painting"))
      .first();
    const catHvac = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "hvac"))
      .first();
    const catGeneral = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", "general-maintenance"))
      .first();

    if (!catPlumbing || !catElectrical || !catCarpentry || !catPainting || !catHvac || !catGeneral) {
      return "Run seedCategories first";
    }

    // ── 2. Provider users ────────────────────────────────────────────────────
    const now = Date.now();

    const provider1Id = await ctx.db.insert("users", {
      name: "أحمد الزعبي",
      email: "ahmad.provider@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=ahmad",
      bio: "حرفي سباكة محترف بخبرة 12 عاماً في عمّان. متخصص في إصلاح تسريبات المياه وتمديد الأنابيب وتركيب السخانات. أعمل بدقة واحترافية وأضمن جودة عملي.",
      phone: "0791000001",
      role: "provider" as const,
      isProvider: true,
      tradeCategories: [catPlumbing._id, catGeneral._id],
      serviceArea: ["amman" as const, "zarqa" as const],
      isProfileComplete: true,
      isPremium: true,
    });

    const provider2Id = await ctx.db.insert("users", {
      name: "محمد الخطيب",
      email: "mohammad.provider@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=mohammad",
      bio: "كهربائي معتمد بخبرة 8 سنوات في إربد والمنطقة الشمالية. أتخصص في التمديدات الكهربائية للمنازل والمحلات وتركيب الإضاءة والأنظمة الذكية.",
      phone: "0792000002",
      role: "provider" as const,
      isProvider: true,
      tradeCategories: [catElectrical._id],
      serviceArea: ["irbid" as const, "amman" as const],
      isProfileComplete: true,
      isPremium: false,
    });

    const provider3Id = await ctx.db.insert("users", {
      name: "علي الحوراني",
      email: "ali.provider@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=ali",
      bio: "نجار ماهر متخصص في صناعة الأثاث والمطابخ والأبواب. أعمل في عمّان وإربد وأقدم تصاميم عصرية بأسعار تنافسية. جودتي تتحدث عن نفسها.",
      phone: "0793000003",
      role: "provider" as const,
      isProvider: true,
      tradeCategories: [catCarpentry._id],
      serviceArea: ["amman" as const, "irbid" as const],
      isProfileComplete: true,
      isPremium: false,
    });

    const provider4Id = await ctx.db.insert("users", {
      name: "خالد الرشيد",
      email: "khalid.provider@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=khalid",
      bio: "دهّان محترف بخبرة 15 عاماً في الدهان الداخلي والخارجي. أستخدم أفضل أنواع الدهانات وأقدم ضمان على عملي. متاح في عمّان والزرقاء.",
      phone: "0794000004",
      role: "provider" as const,
      isProvider: true,
      tradeCategories: [catPainting._id],
      serviceArea: ["amman" as const, "zarqa" as const],
      isProfileComplete: true,
      isPremium: true,
    });

    // ── 3. Customer users ────────────────────────────────────────────────────
    const customer1Id = await ctx.db.insert("users", {
      name: "سارة المجالي",
      email: "sara.customer@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=sara",
      role: "customer" as const,
      isProvider: false,
    });

    const customer2Id = await ctx.db.insert("users", {
      name: "يوسف النابلسي",
      email: "yousef.customer@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=yousef",
      role: "customer" as const,
      isProvider: false,
    });

    const customer3Id = await ctx.db.insert("users", {
      name: "ريم الشرايعة",
      email: "reem.customer@hirfati.dev",
      avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=reem",
      role: "customer" as const,
      isProvider: false,
    });

    // ── 4. Services ──────────────────────────────────────────────────────────
    await ctx.db.insert("services", {
      providerId: provider1Id,
      title: "إصلاح تسريبات المياه",
      description: "كشف وإصلاح جميع أنواع تسريبات المياه في المنازل والمباني التجارية. نستخدم أحدث الأجهزة للكشف بدون تكسير.",
      categoryId: catPlumbing._id,
      priceType: "flexible" as const,
      price: 25,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider1Id,
      title: "تمديد أنابيب ومواسير",
      description: "تمديد شبكات المياه الساخنة والباردة للمنازل الجديدة والترميم. نستخدم مواد عالية الجودة مع ضمان سنة.",
      categoryId: catPlumbing._id,
      priceType: "flexible" as const,
      price: 150,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider1Id,
      title: "تركيب وصيانة سخانات المياه",
      description: "تركيب جميع أنواع سخانات المياه الكهربائية والشمسية والغاز. صيانة دورية وإصلاح أعطال.",
      categoryId: catPlumbing._id,
      priceType: "fixed" as const,
      price: 40,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider2Id,
      title: "تمديدات كهربائية للمنازل",
      description: "تمديد كامل للتوصيلات الكهربائية في المنازل والشقق. تركيب مآخذ وأسلاك ومفاتيح حسب الكود الأردني.",
      categoryId: catElectrical._id,
      priceType: "flexible" as const,
      price: 200,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider2Id,
      title: "تركيب إضاءة وثريات",
      description: "تركيب جميع أنواع الإضاءة: LED، ثريات، سبوت لايت، إضاءة ديكور. نعمل بدقة وأمان.",
      categoryId: catElectrical._id,
      priceType: "fixed" as const,
      price: 15,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider3Id,
      title: "تصنيع وتركيب مطابخ خشبية",
      description: "تصميم وتصنيع مطابخ خشبية حسب المقاس. نستخدم خشب MDF وخشب طبيعي مع ضمان 3 سنوات.",
      categoryId: catCarpentry._id,
      priceType: "flexible" as const,
      price: 500,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider3Id,
      title: "تركيب أبواب خشبية",
      description: "توريد وتركيب أبواب خشبية داخلية وخارجية. جميع الأحجام والأشكال متوفرة.",
      categoryId: catCarpentry._id,
      priceType: "fixed" as const,
      price: 120,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider4Id,
      title: "دهان داخلي شامل",
      description: "دهان شامل للغرف والصالات والمداخل. نوفر الدهانات أو نعمل بدهانات العميل. ضمان سنتين.",
      categoryId: catPainting._id,
      priceType: "flexible" as const,
      price: 80,
      isActive: true,
    });

    await ctx.db.insert("services", {
      providerId: provider4Id,
      title: "دهان واجهات خارجية",
      description: "دهان وعزل الواجهات الخارجية للمباني والفلل. نستخدم دهانات مقاومة للعوامل الجوية.",
      categoryId: catPainting._id,
      priceType: "flexible" as const,
      price: 120,
      isActive: true,
    });

    // ── 5. Requests ──────────────────────────────────────────────────────────
    const request1Id = await ctx.db.insert("requests", {
      customerId: customer1Id,
      title: "إصلاح تسريب في الحمام",
      description: "يوجد تسريب مياه تحت حوض الغسيل في الحمام الرئيسي. المياه تقطر بشكل مستمر وأحتاج إصلاح عاجل.",
      categoryId: catPlumbing._id,
      city: "amman" as const,
      budgetMin: 20,
      budgetMax: 60,
      status: "assigned" as const,
    });

    const request2Id = await ctx.db.insert("requests", {
      customerId: customer2Id,
      title: "تمديد كهربائي لغرفة جديدة",
      description: "أحتاج تمديد كهربائي لغرفة إضافية في المنزل تشمل 4 مآخذ ومفتاحين وإضاءة سقفية.",
      categoryId: catElectrical._id,
      city: "irbid" as const,
      budgetMin: 100,
      budgetMax: 250,
      status: "open" as const,
    });

    const request3Id = await ctx.db.insert("requests", {
      customerId: customer3Id,
      title: "دهان شقة كاملة",
      description: "أحتاج دهان شقة من 3 غرف وصالة ومطبخ وحمامين. الشقة 120 متر مربع. أفضل ألوان فاتحة.",
      categoryId: catPainting._id,
      city: "amman" as const,
      budgetMin: 300,
      budgetMax: 600,
      status: "open" as const,
    });

    const request4Id = await ctx.db.insert("requests", {
      customerId: customer1Id,
      title: "تركيب مطبخ خشبي",
      description: "أريد تصنيع وتركيب مطبخ خشبي في شقة جديدة. المطبخ L-shape حجم متوسط تقريباً 3×4 متر.",
      categoryId: catCarpentry._id,
      city: "amman" as const,
      budgetMin: 800,
      budgetMax: 2000,
      status: "open" as const,
    });

    const request5Id = await ctx.db.insert("requests", {
      customerId: customer2Id,
      title: "صيانة جهاز تكييف",
      description: "جهاز التكييف لا يبرد جيداً رغم أنه شغّال. أحتاج فحص وصيانة. الجهاز سبليت 1.5 طن.",
      categoryId: catHvac._id,
      city: "zarqa" as const,
      budgetMin: 30,
      budgetMax: 100,
      status: "open" as const,
    });

    // ── 6. Quotes ────────────────────────────────────────────────────────────
    const quote1Id = await ctx.db.insert("quotes", {
      requestId: request1Id,
      providerId: provider1Id,
      price: 35,
      estimatedDuration: "2-3 ساعات",
      message: "يمكنني القدوم غداً لفحص التسريب وإصلاحه. لدي خبرة 12 عاماً في مثل هذه المشاكل.",
      status: "accepted" as const,
    });

    await ctx.db.insert("quotes", {
      requestId: request2Id,
      providerId: provider2Id,
      price: 180,
      estimatedDuration: "يوم عمل كامل",
      message: "أستطيع تنفيذ العمل خلال يوم واحد بمواد عالية الجودة وضمان سنة على التمديدات.",
      status: "pending" as const,
    });

    await ctx.db.insert("quotes", {
      requestId: request3Id,
      providerId: provider4Id,
      price: 450,
      estimatedDuration: "3-4 أيام",
      message: "سأقوم بدهان الشقة كاملة بأفضل أنواع الدهانات. السعر يشمل المواد والعمالة.",
      status: "pending" as const,
    });

    // ── 7. Jobs ──────────────────────────────────────────────────────────────

    // Job 1: Accepted quote → in_progress (from request1 + quote1)
    const job1Id = await ctx.db.insert("jobs", {
      requestId: request1Id,
      quoteId: quote1Id,
      customerId: customer1Id,
      providerId: provider1Id,
      title: "إصلاح تسريب في الحمام",
      description: "إصلاح تسريب مياه تحت حوض الغسيل في الحمام الرئيسي.",
      price: 35,
      status: "in_progress" as const,
      statusHistory: [
        { status: "accepted", timestamp: now - 3 * 24 * 60 * 60 * 1000, by: customer1Id },
        { status: "in_progress", timestamp: now - 2 * 24 * 60 * 60 * 1000, by: provider1Id },
      ],
      isDirectHire: false,
    });

    // Job 2: Direct hire → completed → confirmed → reviewed
    const job2Id = await ctx.db.insert("jobs", {
      customerId: customer2Id,
      providerId: provider3Id,
      title: "تركيب باب خشبي للغرفة الرئيسية",
      description: "أحتاج تركيب باب خشبي جديد للغرفة الرئيسية، القياس 90×210 سم.",
      price: 120,
      status: "reviewed" as const,
      statusHistory: [
        { status: "requested", timestamp: now - 10 * 24 * 60 * 60 * 1000, by: customer2Id },
        { status: "accepted", timestamp: now - 9 * 24 * 60 * 60 * 1000, by: provider3Id },
        { status: "in_progress", timestamp: now - 8 * 24 * 60 * 60 * 1000, by: provider3Id },
        { status: "completed", timestamp: now - 7 * 24 * 60 * 60 * 1000, by: provider3Id },
        { status: "confirmed", timestamp: now - 6 * 24 * 60 * 60 * 1000, by: customer2Id },
        { status: "reviewed", timestamp: now - 5 * 24 * 60 * 60 * 1000, by: customer2Id },
      ],
      isDirectHire: true,
    });

    // Job 3: Direct hire → accepted (pending provider response)
    const job3Id = await ctx.db.insert("jobs", {
      customerId: customer3Id,
      providerId: provider2Id,
      title: "تركيب 3 ثريات في الصالة",
      description: "أحتاج تركيب 3 ثريات زينة في الصالة الكبيرة، مع تمديد الكهرباء اللازمة.",
      price: 80,
      status: "accepted" as const,
      statusHistory: [
        { status: "requested", timestamp: now - 5 * 24 * 60 * 60 * 1000, by: customer3Id },
        { status: "accepted", timestamp: now - 4 * 24 * 60 * 60 * 1000, by: provider2Id },
      ],
      isDirectHire: true,
    });

    // Job 4: From quote → completed (awaiting confirmation)
    const quote4Id = await ctx.db.insert("quotes", {
      requestId: request4Id,
      providerId: provider3Id,
      price: 1200,
      estimatedDuration: "أسبوع",
      message: "خبرة 10 سنوات في المطابخ. يمكنني تصميم وتنفيذ المطبخ حسب ذوقك.",
      status: "accepted" as const,
    });

    const job4Id = await ctx.db.insert("jobs", {
      requestId: request4Id,
      quoteId: quote4Id,
      customerId: customer1Id,
      providerId: provider3Id,
      title: "تركيب مطبخ خشبي",
      description: "تصنيع وتركيب مطبخ خشبي L-shape في الشقة الجديدة.",
      price: 1200,
      status: "completed" as const,
      statusHistory: [
        { status: "accepted", timestamp: now - 14 * 24 * 60 * 60 * 1000, by: customer1Id },
        { status: "in_progress", timestamp: now - 12 * 24 * 60 * 60 * 1000, by: provider3Id },
        { status: "completed", timestamp: now - 1 * 24 * 60 * 60 * 1000, by: provider3Id },
      ],
      isDirectHire: false,
    });

    // ── 8. Messages ──────────────────────────────────────────────────────────
    await ctx.db.insert("messages", {
      jobId: job1Id,
      senderId: customer1Id,
      content: "مرحباً أحمد، متى تقدر تجي لإصلاح التسريب؟",
    });

    await ctx.db.insert("messages", {
      jobId: job1Id,
      senderId: provider1Id,
      content: "أهلاً سارة، بقدر أجي بكرا الصبح الساعة 9. هل يناسبك؟",
    });

    await ctx.db.insert("messages", {
      jobId: job1Id,
      senderId: customer1Id,
      content: "تمام، الساعة 9 يناسبني. شكراً!",
    });

    await ctx.db.insert("messages", {
      jobId: job1Id,
      senderId: provider1Id,
      content: "وصلت وشفت المشكلة. في صمام معطوب تحت الحوض. راح يأخذ ساعة ونص تقريباً.",
    });

    await ctx.db.insert("messages", {
      jobId: job2Id,
      senderId: customer2Id,
      content: "أهلاً علي، أريد الباب يكون بالخشب الزان إذا ممكن.",
    });

    await ctx.db.insert("messages", {
      jobId: job2Id,
      senderId: provider3Id,
      content: "بكل سرور يوسف! خشب الزان متوفر ومرتاح عليه. سعر ممتاز أيضاً.",
    });

    await ctx.db.insert("messages", {
      jobId: job2Id,
      senderId: customer2Id,
      content: "ممتاز! هل يمكنك إضافة قفل أمان جيد؟",
    });

    await ctx.db.insert("messages", {
      jobId: job2Id,
      senderId: provider3Id,
      content: "طبعاً، سأضيف قفل YALE أصلي. الشغل خلص والباب تم تركيبه بنجاح.",
    });

    await ctx.db.insert("messages", {
      jobId: job3Id,
      senderId: customer3Id,
      content: "محمد، لدي 3 ثريات جاهزة عندي. هل تحتاج شيء إضافي؟",
    });

    await ctx.db.insert("messages", {
      jobId: job3Id,
      senderId: provider2Id,
      content: "ممتاز ريم! أحتاج فقط معرفة ارتفاع السقف وموقع التوصيلات الحالية.",
    });

    await ctx.db.insert("messages", {
      jobId: job4Id,
      senderId: customer1Id,
      content: "علي، أريد الخزائن العلوية باللون الأبيض والسفلية بالرمادي الغامق.",
    });

    await ctx.db.insert("messages", {
      jobId: job4Id,
      senderId: provider3Id,
      content: "اختيار رائع سارة! هذا الكومبو ترند حالياً وسيعطي شكل عصري جميل.",
    });

    await ctx.db.insert("messages", {
      jobId: job4Id,
      senderId: provider3Id,
      content: "انتهيت من التركيب. المطبخ جاهز، الرجاء تفقده والتأكد من كل شيء.",
    });

    // ── 9. Reviews ───────────────────────────────────────────────────────────
    await ctx.db.insert("reviews", {
      jobId: job2Id,
      reviewerId: customer2Id,
      providerId: provider3Id,
      rating: 5,
      comment: "علي حرفي ممتاز! الباب جميل وعمله نظيف ومتقن. التزم بالموعد والسعر. أنصح به بشدة!",
    });

    // ── 10. Premium orders ───────────────────────────────────────────────────
    const premiumStart1 = now - 5 * 24 * 60 * 60 * 1000;
    const premiumEnd1 = premiumStart1 + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("premium_orders", {
      providerId: provider1Id,
      type: "visibility_boost" as const,
      duration: 30,
      startDate: premiumStart1,
      endDate: premiumEnd1,
      status: "active" as const,
    });

    const premiumStart2 = now - 2 * 24 * 60 * 60 * 1000;
    const premiumEnd2 = premiumStart2 + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("premium_orders", {
      providerId: provider4Id,
      type: "ad" as const,
      duration: 7,
      startDate: premiumStart2,
      endDate: premiumEnd2,
      status: "active" as const,
    });

    // Expired order example
    await ctx.db.insert("premium_orders", {
      providerId: provider2Id,
      type: "visibility_boost" as const,
      duration: 7,
      startDate: now - 20 * 24 * 60 * 60 * 1000,
      endDate: now - 13 * 24 * 60 * 60 * 1000,
      status: "expired" as const,
    });

    return {
      message: "Demo data seeded successfully",
      counts: {
        users: 7,
        services: 9,
        requests: 5,
        quotes: 4,
        jobs: 4,
        messages: 12,
        reviews: 1,
        premiumOrders: 3,
      },
    };
  },
});

// ─── Clear all seed data ────────────────────────────────────────────────────────

export const clearSeedData = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Remove all demo users and cascade-delete related data
    const demoEmails = [
      "ahmad.provider@hirfati.dev",
      "mohammad.provider@hirfati.dev",
      "ali.provider@hirfati.dev",
      "khalid.provider@hirfati.dev",
      "sara.customer@hirfati.dev",
      "yousef.customer@hirfati.dev",
      "reem.customer@hirfati.dev",
    ];

    const userIds = [];
    for (const email of demoEmails) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (user) {
        userIds.push(user._id);
        await ctx.db.delete("users", user._id);
      }
    }

    // Delete related records for demo users
    let deleted = { users: userIds.length, services: 0, requests: 0, quotes: 0, jobs: 0, messages: 0, reviews: 0, premiumOrders: 0 };

    for (const uid of userIds) {
      const services = await ctx.db.query("services").withIndex("by_providerId", (q) => q.eq("providerId", uid)).collect();
      for (const s of services) { await ctx.db.delete("services", s._id); deleted.services++; }

      const requests = await ctx.db.query("requests").withIndex("by_customerId", (q) => q.eq("customerId", uid)).collect();
      for (const r of requests) { await ctx.db.delete("requests", r._id); deleted.requests++; }

      const quotes = await ctx.db.query("quotes").withIndex("by_providerId", (q) => q.eq("providerId", uid)).collect();
      for (const q of quotes) { await ctx.db.delete("quotes", q._id); deleted.quotes++; }

      const jobsAsCustomer = await ctx.db.query("jobs").withIndex("by_customerId", (q) => q.eq("customerId", uid)).collect();
      const jobsAsProvider = await ctx.db.query("jobs").withIndex("by_providerId", (q) => q.eq("providerId", uid)).collect();
      const allJobs = [...jobsAsCustomer, ...jobsAsProvider];
      const uniqueJobIds = [...new Set(allJobs.map((j) => j._id))];

      for (const jid of uniqueJobIds) {
        const msgs = await ctx.db.query("messages").withIndex("by_jobId", (q) => q.eq("jobId", jid)).collect();
        for (const m of msgs) { await ctx.db.delete("messages", m._id); deleted.messages++; }
        const job = await ctx.db.get("jobs", jid);
        if (job) { await ctx.db.delete("jobs", jid); deleted.jobs++; }
      }

      const reviews = await ctx.db.query("reviews").withIndex("by_reviewerId", (q) => q.eq("reviewerId", uid)).collect();
      for (const rv of reviews) { await ctx.db.delete("reviews", rv._id); deleted.reviews++; }

      const premiums = await ctx.db.query("premium_orders").withIndex("by_providerId", (q) => q.eq("providerId", uid)).collect();
      for (const p of premiums) { await ctx.db.delete("premium_orders", p._id); deleted.premiumOrders++; }
    }

    return { message: "Seed data cleared", deleted };
  },
});

// ─── Seed Auth Users (email/password credentials) ───────────────────────────
// Call this action after seedAll to create loginable demo accounts.
// Pass your Convex site URL, e.g. https://coordinated-dalmatian-355.convex.site
// All demo accounts use password: Hirfati123!

export const seedAuthUsers = action({
  args: {
    siteUrl: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const { siteUrl } = args;
    const base = siteUrl.replace(/\/$/, "");

    const demoUsers = [
      { name: "أحمد الزعبي", email: "ahmad.provider@hirfati.dev", password: "Hirfati123!" },
      { name: "محمد الخطيب", email: "mohammad.provider@hirfati.dev", password: "Hirfati123!" },
      { name: "علي الحوراني", email: "ali.provider@hirfati.dev", password: "Hirfati123!" },
      { name: "خالد الرشيد", email: "khalid.provider@hirfati.dev", password: "Hirfati123!" },
      { name: "سارة المجالي", email: "sara.customer@hirfati.dev", password: "Hirfati123!" },
      { name: "يوسف النابلسي", email: "yousef.customer@hirfati.dev", password: "Hirfati123!" },
      { name: "ريم الشرايعة", email: "reem.customer@hirfati.dev", password: "Hirfati123!" },
    ];

    const results: { email: string; status: string; detail?: string }[] = [];

    for (const user of demoUsers) {
      try {
        const res = await fetch(`${base}/api/auth/sign-up/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const text = await res.text();
        let detail: string;
        try {
          const json = JSON.parse(text) as Record<string, unknown>;
          detail = (json.message as string | undefined) ?? text.slice(0, 120);
        } catch {
          detail = text.slice(0, 120);
        }
        results.push({
          email: user.email,
          status: res.ok ? "created" : `error ${res.status}`,
          detail,
        });
      } catch (e) {
        results.push({ email: user.email, status: "fetch_error", detail: String(e) });
      }
    }

    return { results, password: "Hirfati123!" };
  },
});
