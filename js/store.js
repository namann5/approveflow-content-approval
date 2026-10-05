const STORAGE_KEY = "content-approval-portal-v1";

function load() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) return { ...Store.DEFAULT_STATE };

        const parsed = JSON.parse(raw);

        return {
            ...Store.DEFAULT_STATE,
            ...parsed,
            agency: { ...Store.DEFAULT_STATE.agency, ...(parsed.agency || {}) },
            creatives: Array.isArray(parsed.creatives) ? parsed.creatives : [],
            reviews: Array.isArray(parsed.reviews) ? parsed.reviews : []
        };

    } catch (error) {

        console.warn("Could not read saved state", error);

        return { ...Store.DEFAULT_STATE };
    }
}

function save(state) {

    try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        return { ok: true };

    } catch (error) {

        const quota = error && error.name === "QuotaExceededError";

        return {
            ok: false,
            reason: quota
                ? "Browser storage is full. Remove some creatives with large files or clear demo data."
                : "Could not save to browser storage"
        };
    }
}

function clear() {

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn("Could not clear saved state", error);
    }
}

function summary(state) {

    const creatives = state.creatives;

    const byStatus = {};

    for (const key of Store.STATUS_ORDER) byStatus[key] = 0;

    for (const creative of creatives) {
        if (byStatus[creative.status] !== undefined) byStatus[creative.status]++;
    }

    const awaitingClient = creatives.filter(c => c.status === "pending").length;

    const needsWork = creatives.filter(c => c.status === "changesRequested").length;

    const submitted = creatives.filter(c => c.status !== "draft").length;

    const approved = byStatus.approved;

    const turnaround = averageTurnaroundDays(state);

    return {
        total: creatives.length,
        drafts: byStatus.draft,
        pending: awaitingClient,
        changesRequested: needsWork,
        approved,
        rejected: byStatus.rejected,
        submitted,
        approvalRate: submitted ? Math.round(approved / submitted * 100) : 0,
        turnaround
    };
}

function averageTurnaroundDays(state) {

    const approved = state.creatives.filter(c => c.status === "approved" && c.submittedAt);

    if (!approved.length) return null;

    const total = approved.reduce((sum, creative) => sum + (Date.now() - creative.submittedAt), 0);

    return Math.round((total / approved.length) / 86400000);
}

function reviewsFor(state, creativeId) {

    return state.reviews
        .filter(review => review.creativeId === creativeId)
        .sort((a, b) => b.at - a.at);
}

function latestReview(state, creativeId) {

    return reviewsFor(state, creativeId)[0] || null;
}

const FLOW = {
    addCreative(state, input) {

        const creative = {
            id: Store.newId("cr"),
            title: input.title || "Untitled creative",
            clientId: input.clientId,
            type: input.type || "instagram",
            campaign: input.campaign || "Uncategorised",
            caption: input.caption || "",
            scheduledFor: input.scheduledFor || Store.todayISO(),
            status: "draft",
            imageData: input.imageData || null,
            submittedAt: null,
            updatedAt: Date.now()
        };

        state.creatives.unshift(creative);

        return creative;
    },

    submitCreative(state, creativeId) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return null;

        if (creative.status !== "draft") return null;

        if (!creative.title.trim() || !creative.clientId) return null;

        creative.status = "pending";
        creative.submittedAt = Date.now();
        creative.updatedAt = Date.now();

        return creative;
    },

    submitAllDrafts(state) {

        let count = 0;

        for (const creative of state.creatives) {

            if (creative.status === "draft" && creative.title.trim() && creative.clientId) {

                creative.status = "pending";
                creative.submittedAt = Date.now();
                creative.updatedAt = Date.now();
                count++;

            }

        }

        return count;
    },

    recordReview(state, creativeId, decision, comment, reviewerName) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return null;

        const trimmed = (comment || "").trim();

        if (decision !== "approve" && !trimmed) {
            return { ok: false, reason: "A comment is required to reject or request changes" };
        }

        if (creative.status === "draft") {
            return { ok: false, reason: "This creative has not been submitted to the client yet" };
        }

        const review = {
            id: Store.newId("rv"),
            creativeId,
            decision,
            comment: trimmed,
            reviewer: (reviewerName || "").trim() || "Client",
            at: Date.now()
        };

        state.reviews.unshift(review);

        creative.status = Store.nextStatusFor(decision);
        creative.updatedAt = review.at;

        return { ok: true, review, creative };
    },

    resubmit(state, creativeId) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return null;

        creative.status = "pending";
        creative.submittedAt = Date.now();
        creative.updatedAt = Date.now();

        return creative;
    },

    removeCreative(state, creativeId) {

        state.creatives = state.creatives.filter(c => c.id !== creativeId);
        state.reviews = state.reviews.filter(r => r.creativeId !== creativeId);
    },

    updateCreative(state, creativeId, patch) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return null;

        Object.assign(creative, patch, { updatedAt: Date.now() });

        return creative;
    }
};

const Portal = { STORAGE_KEY, load, save, clear, summary, reviewsFor, latestReview, ...FLOW };

if (typeof module !== "undefined" && module.exports) {
    module.exports = Portal;
}
