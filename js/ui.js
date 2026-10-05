function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function truncate(value, length = 70) {

    const text = String(value ?? "").replace(/\s+/g, " ").trim();

    return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

function badge(status) {

    const style = Store.STATUS_STYLE[status] || Store.STATUS_STYLE.draft;

    return `<span class="inline-flex items-center ${style.badge} px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap">${Store.STATUS[status] || status}</span>`;
}

function decisionStyle(decision) {

    if (decision === "approve") return { chip: "bg-emerald-100 text-emerald-700", label: "Approved", icon: "fa-circle-check" };
    if (decision === "reject") return { chip: "bg-red-100 text-red-700", label: "Rejected", icon: "fa-circle-xmark" };

    return { chip: "bg-orange-100 text-orange-700", label: "Changes requested", icon: "fa-rotate" };
}

function clientById(state, clientId) {
    return state.agency.clients.find(c => c.id === clientId) || null;
}

function creativeCard(state, creative) {

    const client = clientById(state, creative.clientId);
    const meta = Store.TYPE_META[creative.type] || Store.TYPE_META.instagram;
    const latest = Portal.latestReview(state, creative.id);

    const preview = creative.imageData
        ? `<img src="${creative.imageData}" alt="${escapeHtml(creative.title)}" class="w-full h-full object-cover">`
        : `<div class="w-full h-full bg-gradient-to-br ${meta.accent} flex flex-col items-center justify-center text-white p-4 text-center">
               <i class="${meta.icon} text-2xl opacity-90"></i>
               <span class="text-[10px] font-semibold mt-2 uppercase tracking-wide opacity-90">${escapeHtml(meta.label)}</span>
           </div>`;

    return `
    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col">
        <button data-open="${escapeHtml(creative.id)}" class="block text-left w-full">
            <div class="h-28 ${creative.imageData ? "" : ""}">${preview}</div>
        </button>

        <div class="p-4 flex-1 flex flex-col">
            <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-slate-800 text-sm leading-snug">${escapeHtml(creative.title)}</h3>
                ${badge(creative.status)}
            </div>

            <p class="text-xs text-slate-500 mt-1">
                <i class="${meta.icon} mr-1 opacity-60"></i>${escapeHtml(meta.label)}
                <span class="mx-1 text-slate-300">|</span>
                ${escapeHtml(client ? client.name : "No client")}
            </p>

            <p class="text-xs text-slate-500 mt-1">
                <i class="fa-regular fa-calendar mr-1 opacity-60"></i>
                ${creative.status === "draft" ? "Not scheduled" : escapeHtml(Store.formatDate(creative.scheduledFor))}
                <span class="mx-1 text-slate-300">|</span>${escapeHtml(creative.campaign)}
            </p>

            ${latest && creative.status !== "draft" ? `
                <div class="mt-3 bg-slate-50 rounded p-2.5">
                    <div class="flex items-center gap-1.5 text-[11px] font-semibold ${decisionStyle(latest.decision).chip.replace("px-2.5 py-1 rounded text-xs", "px-1.5 py-0.5 rounded")}">
                        <i class="fa-solid ${decisionStyle(latest.decision).icon}"></i>
                        ${decisionStyle(latest.decision).label}
                        <span class="text-slate-400 font-normal ml-1">${escapeHtml(Store.relativeTime(latest.at))}</span>
                    </div>
                    <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">${escapeHtml(latest.comment)}</p>
                </div>` : ""}

            <div class="mt-auto pt-3 flex items-center gap-2">
                <button data-open="${escapeHtml(creative.id)}"
                    class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold transition">
                    ${latest ? "View review" : "Open"}
                </button>

                ${creative.status === "draft" ? `
                    <button data-submit="${escapeHtml(creative.id)}"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition">
                        Submit
                    </button>` : ""}

                ${creative.status === "changesRequested" || creative.status === "rejected" ? `
                    <button data-resubmit="${escapeHtml(creative.id)}"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition">
                        Resubmit
                    </button>` : ""}
            </div>
        </div>
    </div>`;
}

function emptyState(title, message, icon = "fa-folder-open") {
    return `
    <div class="col-span-full py-16 text-center">
        <i class="fa-solid ${icon} text-3xl text-slate-300"></i>
        <p class="text-sm font-semibold text-slate-600 mt-4">${escapeHtml(title)}</p>
        <p class="text-sm text-slate-400 mt-1">${escapeHtml(message)}</p>
    </div>`;
}

const UI = { escapeHtml, truncate, badge, decisionStyle, clientById, creativeCard, emptyState };

if (typeof module !== "undefined" && module.exports) {
    module.exports = UI;
}
