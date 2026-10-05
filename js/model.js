const STATUS = {
    draft: "Draft",
    pending: "Pending",
    changesRequested: "Changes requested",
    approved: "Approved",
    rejected: "Rejected"
};

const STATUS_STYLE = {
    draft: { badge: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
    pending: { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
    changesRequested: { badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
    approved: { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
    rejected: { badge: "bg-red-100 text-red-700", bar: "bg-red-500" }
};

const TYPE_META = {
    instagram: { label: "Instagram Post", icon: "fa-brands fa-instagram", accent: "from-pink-500 to-rose-500" },
    reel: { label: "Reel", icon: "fa-solid fa-clapperboard", accent: "from-fuchsia-500 to-purple-600" },
    banner: { label: "Banner Ad", icon: "fa-solid fa-rectangle-ad", accent: "from-sky-500 to-blue-600" },
    carousel: { label: "Carousel", icon: "fa-solid fa-images", accent: "from-violet-500 to-indigo-600" },
    story: { label: "Story", icon: "fa-solid fa-mobile-screen", accent: "from-amber-500 to-orange-600" },
    video: { label: "Video Ad", icon: "fa-solid fa-circle-play", accent: "from-emerald-500 to-teal-600" }
};

const CAMPAIGN_COLORS = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500",
    "bg-purple-500", "bg-rose-500", "bg-teal-500"
];

function newId(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function formatDate(iso) {

    if (!iso) return "No date";

    const date = new Date(iso + "T00:00:00");

    if (Number.isNaN(date.getTime())) return iso;

    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDateTime(ts) {

    if (!ts) return "";

    return new Date(ts).toLocaleString("en-GB", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
}

function relativeTime(ts) {

    const diff = Date.now() - ts;
    const mins = Math.round(diff / 60000);

    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";

    const hours = Math.round(mins / 60);

    if (hours < 24) return hours + "h ago";

    const days = Math.round(hours / 24);

    return days + "d ago";
}

const STATUS_ORDER = ["draft", "pending", "changesRequested", "approved", "rejected"];

const DEFAULT_STATE = {
    agency: { name: "Pixelcraft Social", clients: [] },
    activeRole: "agency",
    activeClientId: null,
    activeCreativeId: null,
    creatives: [],
    reviews: []
};

const Store = {
    STATUS,
    STATUS_STYLE,
    TYPE_META,
    CAMPAIGN_COLORS,
    STATUS_ORDER,
    DEFAULT_STATE,
    nextStatusFor: decision =>
        decision === "approve" ? "approved"
            : decision === "reject" ? "rejected" : "changesRequested",
    newId,
    todayISO,
    daysFromNow,
    formatDate,
    formatDateTime,
    relativeTime
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = Store;
}
