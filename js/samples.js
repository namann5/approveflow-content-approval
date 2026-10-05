const SAMPLE_STATE = (() => {

    const agency = {
        name: "Pixelcraft Social",
        clients: [
            { id: "cl_zara", name: "Zara Trends", contact: "Meera Joshi", channel: "WhatsApp", brand: "#0f172a" },
            { id: "cl_brew", name: "Brew & Co Cafes", contact: "Rohit Menon", channel: "Email", brand: "#78350f" },
            { id: "cl_fit", name: "FitPulse Gym", contact: "Sana Khan", channel: "WhatsApp", brand: "#065f46" }
        ]
    };

    const hour = 3600000;
    const day = 86400000;

    const now = Date.now();

    const creatives = [
        {
            id: "cr_01", title: "Monsoon Sale Carousel", clientId: "cl_zara", type: "carousel",
            campaign: "Monsoon Sale 2026", caption: "Monsoon Sale is live. Up to 40% off new arrivals. Shop the collection before it goes.",
            scheduledFor: Store.daysFromNow(2), status: "pending", imageData: null,
            submittedAt: now - 2 * day, updatedAt: now - 2 * day
        },
        {
            id: "cr_02", title: "Cold Brew Launch Reel", clientId: "cl_brew", type: "reel",
            campaign: "Cold Brew Season", caption: "Slow drip, single origin, served over ice. Our cold brew is back for summer.",
            scheduledFor: Store.daysFromNow(5), status: "approved", imageData: null,
            submittedAt: now - 5 * day, updatedAt: now - 3 * day
        },
        {
            id: "cr_03", title: "New Member Offer Banner", clientId: "cl_fit", type: "banner",
            campaign: "Membership Drive", caption: "First month at 40% off. No joining fee this week.",
            scheduledFor: Store.daysFromNow(1), status: "changesRequested", imageData: null,
            submittedAt: now - 4 * day, updatedAt: now - 1 * day
        },
        {
            id: "cr_04", title: "Diwali Gift Guide Post", clientId: "cl_zara", type: "instagram",
            campaign: "Festive 2026", caption: "Ten gifts under 1500 that everyone will actually use.",
            scheduledFor: Store.daysFromNow(21), status: "draft", imageData: null,
            submittedAt: null, updatedAt: now - 6 * hour
        },
        {
            id: "cr_05", title: "Trainer Spotlight Story", clientId: "cl_fit", type: "story",
            campaign: "Membership Drive", caption: "Meet our head coach. Six years of strength coaching.",
            scheduledFor: Store.daysFromNow(8), status: "approved", imageData: null,
            submittedAt: now - 9 * day, updatedAt: now - 7 * day
        },
        {
            id: "cr_06", title: "Weekend Brunch Story", clientId: "cl_brew", type: "story",
            campaign: "Weekend Brunch", caption: "Free refills on all brunch plates, 11am to 3pm, Saturdays and Sundays.",
            scheduledFor: Store.daysFromNow(-2), status: "rejected", imageData: null,
            submittedAt: now - 8 * day, updatedAt: now - 6 * day
        }
    ];

    const reviews = [
        {
            id: "rv_01", creativeId: "cr_03", decision: "requestChange",
            comment: "Can we change the discount to 30%? 40% breaks our margin on the 12-month plan. Also the gym logo is too small on mobile.",
            reviewer: "Sana Khan", at: now - 1 * day
        },
        {
            id: "rv_02", creativeId: "cr_02", decision: "approve",
            comment: "Looks great. Go ahead with Thursday.",
            reviewer: "Rohit Menon", at: now - 3 * day
        },
        {
            id: "rv_03", creativeId: "cr_05", decision: "approve",
            comment: "Approved. Nice framing on the first slide.",
            reviewer: "Sana Khan", at: now - 7 * day
        },
        {
            id: "rv_04", creativeId: "cr_06", decision: "reject",
            comment: "This is last year's offer, the free refills ended in June. Please do not post it.",
            reviewer: "Rohit Menon", at: now - 6 * day
        }
    ];

    return {
        agency,
        activeRole: "agency",
        activeClientId: null,
        activeCreativeId: null,
        creatives,
        reviews
    };

})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = SAMPLE_STATE;
}
