const App = (() => {

    let state = Portal.load();

    let page = "board";
    let clientFilter = "all";

    const el = {};

    function cacheElements() {

        el.navLinks = [...document.querySelectorAll("aside [data-page]")];
        el.mobileNav = [...document.querySelectorAll("[data-view]")];
        el.roleButtons = [...document.querySelectorAll("[data-role]")];
        el.pageTitle = document.getElementById("pageTitle");
        el.pageSubtitle = document.getElementById("pageSubtitle");
        el.sidebarLabel = document.getElementById("sidebarLabel");
        el.clientFilter = document.getElementById("clientFilter");
        el.statsRow = document.getElementById("statsRow");
        el.boardGrid = document.getElementById("boardGrid");
        el.calendarList = document.getElementById("calendarList");
        el.reviewPane = document.getElementById("reviewPane");
        el.activityList = document.getElementById("activityList");
        el.navBadge = document.getElementById("navBadge");

        el.detailModal = document.getElementById("detailModal");
        el.detailBody = document.getElementById("detailBody");
        el.uploadModal = document.getElementById("uploadModal");
        el.form = document.getElementById("creativeForm");
        el.toast = document.getElementById("toast");

        el.fTitle = document.getElementById("fTitle");
        el.fClient = document.getElementById("fClient");
        el.fType = document.getElementById("fType");
        el.fCampaign = document.getElementById("fCampaign");
        el.fDate = document.getElementById("fDate");
        el.fCaption = document.getElementById("fCaption");
        el.fImage = document.getElementById("fImage");
    }

    function isClientMode() {
        return state.activeRole === "client";
    }

    function visibleCreatives() {

        let rows = state.creatives;

        if (clientFilter !== "all") {
            rows = rows.filter(c => c.clientId === clientFilter);
        }

        if (isClientMode()) {
            rows = rows.filter(c => c.status !== "draft");
        }

        return rows;
    }

    function persist() {

        const result = Portal.save(state);

        if (!result.ok) showToast(result.reason, "error");
    }

    function showToast(message, type = "info") {

        const colors = {
            info: "bg-slate-800 text-white",
            error: "bg-red-600 text-white",
            success: "bg-emerald-600 text-white"
        };

        el.toast.textContent = message;
        el.toast.className = "fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg text-sm font-medium z-[60] " + colors[type];

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => el.toast.classList.add("hidden"), 4200);
    }

    function setPage(name) {

        page = name;

        el.navLinks.forEach(link => {

            const active = link.dataset.page === name;

            link.classList.toggle("bg-white/10", active);
            link.classList.toggle("text-white", active);
            link.classList.toggle("border-l-4", active);
            link.classList.toggle("border-blue-500", active);
            link.classList.toggle("text-slate-300", !active);

        });

        document.querySelectorAll("[data-view]").forEach(view => {
            view.classList.toggle("hidden", view.dataset.view !== name);
        });

        document.querySelectorAll(".lg\\:hidden [data-page]").forEach(button => {
            const active = button.dataset.page === name;
            button.classList.toggle("bg-blue-600", active);
            button.classList.toggle("text-white", active);
            button.classList.toggle("bg-slate-100", !active);
            button.classList.toggle("text-slate-600", !active);
        });

        const copy = {
            board: ["Content board", "Upload creatives, send them to clients, track every decision"],
            calendar: ["Content calendar", "Everything scheduled, grouped by date"],
            review: ["Review queue", "Approve, reject or request changes with comments"],
            activity: ["Decision history", "A record of what was decided, by whom and why"]
        }[name];

        el.pageTitle.textContent = copy[0];
        el.pageSubtitle.textContent = copy[1];
        el.sidebarLabel.textContent = isClientMode() ? "Client" : "Agency";

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderRoleToggle() {

        el.roleButtons.forEach(button => {

            const active = button.dataset.role === state.activeRole;

            button.classList.toggle("bg-blue-600", active);
            button.classList.toggle("text-white", active);
            button.classList.toggle("text-slate-400", !active);

        });

        document.getElementById("submitAllBtn").classList.toggle("hidden", isClientMode());
        document.querySelector("[data-open-upload]").classList.toggle("hidden", isClientMode());

        el.sidebarLabel.textContent = isClientMode() ? "Client" : "Agency";
    }

    function renderClientFilter() {

        const current = clientFilter;

        el.clientFilter.innerHTML = `<option value="all">All clients</option>`
            + state.agency.clients.map(client =>
                `<option value="${UI.escapeHtml(client.id)}">${UI.escapeHtml(client.name)}</option>`).join("");

        el.clientFilter.value = state.agency.clients.some(c => c.id === current) || current === "all" ? current : "all";

        el.fClient.innerHTML = state.agency.clients.map(client =>
            `<option value="${UI.escapeHtml(client.id)}">${UI.escapeHtml(client.name)}</option>`).join("");
    }

    function renderStats() {

        const s = Portal.summary(state);

        const cards = [
            { label: "Creatives", value: s.total, tone: "text-slate-800" },
            { label: "Waiting on client", value: s.pending, tone: s.pending ? "text-amber-600" : "text-slate-800" },
            { label: "Changes requested", value: s.changesRequested, tone: s.changesRequested ? "text-orange-600" : "text-slate-800" },
            { label: "Approved", value: s.approved, tone: "text-emerald-600" },
            { label: "Avg turnaround", value: s.turnaround === null ? "-" : s.turnaround + "d", tone: "text-blue-600" }
        ];

        el.statsRow.innerHTML = cards.map(card => `
            <div class="bg-white rounded-lg border border-slate-200 p-5">
                <p class="text-xs text-slate-500 uppercase tracking-wide">${card.label}</p>
                <p class="text-3xl font-bold mt-2 ${card.tone}">${card.value}</p>
            </div>`).join("");

        el.navBadge.textContent = s.pending;
        el.navBadge.classList.toggle("hidden", !s.pending);
    }

    function renderBoard() {

        const rows = visibleCreatives();

        if (!rows.length) {
            el.boardGrid.innerHTML = UI.emptyState(
                isClientMode() ? "Nothing waiting for you" : "No creatives yet",
                isClientMode() ? "Your agency has not sent anything for approval" : "Create one, or load the demo data"
            );
            return;
        }

        el.boardGrid.innerHTML = rows.map(creative => UI.creativeCard(state, creative)).join("");
    }

    function renderCalendar() {

        const rows = visibleCreatives()
            .filter(c => c.status !== "draft")
            .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

        if (!rows.length) {
            el.calendarList.innerHTML = UI.emptyState("Nothing scheduled", "Submitted creatives appear here by date", "fa-regular fa-calendar");
            return;
        }

        const groups = new Map();

        for (const creative of rows) {

            const key = creative.scheduledFor;

            if (!groups.has(key)) groups.set(key, []);

            groups.get(key).push(creative);
        }

        el.calendarList.innerHTML = [...groups.entries()].map(([date, items]) => `
            <div class="mb-5 last:mb-0">
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-sm font-bold text-slate-700">${UI.escapeHtml(Store.formatDate(date))}</span>
                    <span class="text-xs text-slate-400">${items.length} item${items.length === 1 ? "" : "s"}</span>
                    <div class="flex-1 h-px bg-slate-100"></div>
                </div>

                <div class="space-y-2">
                    ${items.map(creative => {
                        const client = UI.clientById(state, creative.clientId);
                        const meta = Store.TYPE_META[creative.type] || Store.TYPE_META.instagram;
                        return `
                        <button data-open="${UI.escapeHtml(creative.id)}"
                            class="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left">
                            <span class="w-1.5 h-8 rounded-full ${Store.STATUS_STYLE[creative.status].bar}"></span>
                            <span class="flex-1 min-w-0">
                                <span class="block text-sm font-medium text-slate-800 truncate">${UI.escapeHtml(creative.title)}</span>
                                <span class="block text-xs text-slate-500">${UI.escapeHtml(client ? client.name : "No client")} · ${UI.escapeHtml(creative.campaign)}</span>
                            </span>
                            <span class="text-xs text-slate-400 hidden sm:block">${UI.escapeHtml(meta.label)}</span>
                            ${UI.badge(creative.status)}
                        </button>`;
                    }).join("")}
                </div>
            </div>`).join("");
    }

    function renderReview() {

        const client = UI.clientById(state, clientFilter);

        const rows = visibleCreatives().filter(c => c.status === "pending");

        const list = rows.length
            ? `<div class="space-y-2">${rows.map(creative => {
                const c = UI.clientById(state, creative.clientId);
                return `
                <button data-review="${UI.escapeHtml(creative.id)}"
                    class="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 transition text-left">
                    <i class="${(Store.TYPE_META[creative.type] || Store.TYPE_META.instagram).icon} text-slate-400"></i>
                    <span class="flex-1 min-w-0">
                        <span class="block text-sm font-medium text-slate-800 truncate">${UI.escapeHtml(creative.title)}</span>
                        <span class="block text-xs text-slate-500">${UI.escapeHtml(c ? c.name : "")} · for ${UI.escapeHtml(Store.formatDate(creative.scheduledFor))}</span>
                    </span>
                    <span class="text-blue-600 text-xs font-semibold whitespace-nowrap">Review</span>
                </button>`;
            }).join("")}</div>`
            : UI.emptyState("Queue is clear", "Nothing is waiting for a decision", "fa-circle-check");

        el.reviewPane.innerHTML = `
            <div>
                <h3 class="font-bold text-lg mb-1">Waiting for a decision</h3>
                <p class="text-sm text-slate-500 mb-4">
                    ${isClientMode()
                        ? "As the client you can approve, reject or request changes"
                        : "Switch to the client view to record decisions"}
                </p>
                ${list}
            </div>

            <div class="bg-white rounded-lg border border-slate-200 p-6 h-fit">
                <h3 class="font-bold text-lg mb-4">Decide on one creative</h3>
                <p id="reviewHint" class="text-sm ${rows.length ? "" : "hidden"}">Pick an item from the queue, or open any creative and choose an action.</p>
                <div id="reviewForm" class="${rows.length ? "" : "hidden"}">
                    <div class="flex items-start gap-3 pb-4 border-b border-slate-100">
                        <div id="reviewPreview" class="w-20 h-20 rounded-lg overflow-hidden shrink-0"></div>
                        <div class="min-w-0">
                            <p id="reviewTitle" class="font-semibold text-slate-800 text-sm"></p>
                            <p id="reviewMeta" class="text-xs text-slate-500 mt-0.5"></p>
                        </div>
                    </div>

                    <label for="reviewComment" class="block text-sm font-semibold text-slate-700 mt-4">
                        Comment <span id="commentRequired" class="hidden text-red-500">*</span>
                    </label>
                    <textarea id="reviewComment" rows="3" placeholder="Can we change the discount to 30%? The logo is too small on mobile."
                        class="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>

                    <div class="flex flex-wrap gap-2 mt-4">
                        <button data-decision="approve"
                            class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-semibold transition">
                            <i class="fa-solid fa-check mr-1"></i>Approve
                        </button>
                        <button data-decision="requestChange"
                            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-semibold transition">
                            <i class="fa-solid fa-rotate mr-1"></i>Request changes
                        </button>
                        <button data-decision="reject"
                            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition">
                            <i class="fa-solid fa-xmark mr-1"></i>Reject
                        </button>
                    </div>

                    <p id="reviewError" class="hidden text-xs text-red-600 mt-3"></p>
                </div>
            </div>`;
    }

    function renderActivity() {

        const rows = [...state.reviews].sort((a, b) => b.at - a.at);

        if (!rows.length) {
            el.activityList.innerHTML = UI.emptyState("No decisions yet", "Approvals and feedback appear here", "fa-clock-rotate-left");
            return;
        }

        el.activityList.innerHTML = rows.map(review => {

            const creative = state.creatives.find(c => c.id === review.creativeId);

            if (!creative) return "";

            const style = UI.decisionStyle(review.decision);
            const client = UI.clientById(state, creative.clientId);

            return `
            <button data-open="${UI.escapeHtml(creative.id)}"
                class="w-full flex items-start gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded px-2 transition text-left">
                <span class="w-8 h-8 rounded-full ${style.chip} flex items-center justify-center shrink-0">
                    <i class="fa-solid ${style.icon} text-xs"></i>
                </span>
                <span class="flex-1 min-w-0">
                    <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span class="text-sm font-semibold text-slate-800">${UI.escapeHtml(creative.title)}</span>
                        <span class="text-[11px] font-semibold ${style.chip} px-1.5 py-0.5 rounded">${style.label}</span>
                    </span>
                    <span class="block text-sm text-slate-600 mt-1 leading-relaxed">${UI.escapeHtml(review.comment)}</span>
                    <span class="block text-xs text-slate-400 mt-1.5">
                        ${UI.escapeHtml(review.reviewer)} · ${UI.escapeHtml(client ? client.name : "")} · ${UI.escapeHtml(Store.relativeTime(review.at))}
                    </span>
                </span>
            </button>`;
        }).join("");
    }

    function renderDetail(creative) {

        const client = UI.clientById(state, creative.clientId);
        const meta = Store.TYPE_META[creative.type] || Store.TYPE_META.instagram;
        const history = Portal.reviewsFor(state, creative.id);

        const preview = creative.imageData
            ? `<img src="${creative.imageData}" alt="${UI.escapeHtml(creative.title)}" class="w-full object-cover max-h-72">`
            : `<div class="w-full h-56 bg-gradient-to-br ${meta.accent} flex flex-col items-center justify-center text-white">
                   <i class="${meta.icon} text-4xl opacity-90"></i>
                   <span class="text-xs font-semibold mt-3 uppercase tracking-wide opacity-90">${UI.escapeHtml(meta.label)}</span>
               </div>`;

        const timeline = history.length
            ? history.map(review => {
                const style = UI.decisionStyle(review.decision);
                return `
                <div class="flex items-start gap-3 pb-5 last:pb-0">
                    <span class="w-7 h-7 rounded-full ${style.chip} flex items-center justify-center shrink-0 mt-0.5">
                        <i class="fa-solid ${style.icon} text-[10px]"></i>
                    </span>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">
                            ${style.label}
                            <span class="text-xs font-normal text-slate-400 ml-1">${UI.escapeHtml(Store.relativeTime(review.at))}</span>
                        </p>
                        <p class="text-sm text-slate-600 mt-0.5 leading-relaxed">${UI.escapeHtml(review.comment)}</p>
                        <p class="text-xs text-slate-400 mt-1">${UI.escapeHtml(review.reviewer)}</p>
                    </div>
                </div>`;
            }).join("")
            : '<p class="text-sm text-slate-400">No decisions recorded yet</p>';

        const actions = creative.status === "draft"
            ? `<button data-submit="${UI.escapeHtml(creative.id)}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition">Submit to client</button>`
            : creative.status === "changesRequested" || creative.status === "rejected"
                ? `<button data-resubmit="${UI.escapeHtml(creative.id)}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition">Resubmit</button>`
                : "";

        el.detailBody.innerHTML = `
            <div class="relative">
                ${preview}
                <button data-close-detail class="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 w-8 h-8 rounded-full shadow text-xl leading-none">&times;</button>
            </div>

            <div class="p-6">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800">${UI.escapeHtml(creative.title)}</h3>
                        <p class="text-sm text-slate-500 mt-1">
                            ${UI.escapeHtml(meta.label)} · ${UI.escapeHtml(client ? client.name : "No client")}
                            <span class="mx-1 text-slate-300">|</span>${UI.escapeHtml(creative.campaign)}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                            <i class="fa-regular fa-calendar mr-1"></i>
                            ${creative.status === "draft" ? "Not scheduled" : "Scheduled for " + UI.escapeHtml(Store.formatDate(creative.scheduledFor))}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        ${UI.badge(creative.status)}
                        ${actions}
                        <button data-delete="${UI.escapeHtml(creative.id)}" class="bg-white border border-slate-300 hover:bg-red-50 hover:border-red-300 text-slate-600 hover:text-red-700 px-3 py-2 rounded text-sm font-semibold transition" title="Delete">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                ${creative.caption ? `
                <div class="mt-5">
                    <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Caption</h4>
                    <p class="text-sm text-slate-700 bg-slate-50 rounded p-3 leading-relaxed whitespace-pre-wrap">${UI.escapeHtml(creative.caption)}</p>
                </div>` : ""}

                <div class="mt-5">
                    <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Review history</h4>
                    ${timeline}
                </div>

                ${!isClientMode() && creative.status !== "draft" ? `
                <div class="mt-5 pt-5 border-t border-slate-100">
                    <p class="text-xs text-slate-500 mb-2">Record a decision as the client would</p>
                    <button data-open-review="${UI.escapeHtml(creative.id)}" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-sm font-semibold transition">
                        Decide on this creative
                    </button>
                </div>` : ""}
            </div>`;
    }

    function renderAll() {

        renderRoleToggle();
        renderClientFilter();
        renderStats();
        renderBoard();
        renderCalendar();
        renderReview();
        renderActivity();

        attachReviewForm();
    }

    function openDetail(creativeId) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return;

        renderDetail(creative);

        el.detailModal.classList.remove("hidden");
    }

    function closeDetail() {
        el.detailModal.classList.add("hidden");
    }

    function openUpload() {

        el.form.reset();
        el.fDate.value = Store.todayISO();
        el.fCampaign.placeholder = "e.g. Monsoon Sale 2026";

        el.uploadModal.classList.remove("hidden");
    }

    function closeUpload() {
        el.uploadModal.classList.add("hidden");
    }

    function readImage(file) {

        return new Promise(resolve => {

            if (!file || !file.type.startsWith("image/")) return resolve(null);

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);

            reader.readAsDataURL(file);

        });
    }

    let reviewTargetId = null;

    function attachReviewForm() {

        const commentBox = document.getElementById("reviewComment");
        const error = document.getElementById("reviewError");

        if (!commentBox) return;

        const decide = decision => {

            const creative = state.creatives.find(c => c.id === reviewTargetId);

            if (!creative) return;

            const client = UI.clientById(state, creative.clientId);

            const result = Portal.recordReview(state, creative.id, decision, commentBox.value, client ? client.contact : "");

            if (!result.ok) {
                error.textContent = result.reason;
                error.classList.remove("hidden");
                return;
            }

            persist();

            reviewTargetId = null;

            renderAll();
            closeDetail();

            showToast(
                decision === "approve" ? "Approved"
                    : decision === "reject" ? "Rejected with feedback"
                        : "Changes requested",
                decision === "approve" ? "success" : "info"
            );

        };

        el.reviewPane.querySelectorAll("[data-decision]").forEach(button => {
            button.onclick = () => decide(button.dataset.decision);
        });

        if (reviewTargetId) showReviewTarget(reviewTargetId);
    }

    function setReviewTarget(creativeId) {

        reviewTargetId = creativeId;

        showReviewTarget(creativeId);
    }

    function showReviewTarget(creativeId) {

        const creative = state.creatives.find(c => c.id === creativeId);

        if (!creative) return;

        const hint = document.getElementById("reviewHint");
        const form = document.getElementById("reviewForm");

        if (!hint || !form) return;

        hint.classList.add("hidden");
        form.classList.remove("hidden");

        const client = UI.clientById(state, creative.clientId);
        const meta = Store.TYPE_META[creative.type] || Store.TYPE_META.instagram;

        document.getElementById("reviewTitle").textContent = creative.title;
        document.getElementById("reviewMeta").textContent =
            (client ? client.name : "") + " · " + meta.label + " · for " + Store.formatDate(creative.scheduledFor);

        document.getElementById("reviewPreview").innerHTML = creative.imageData
            ? `<img src="${creative.imageData}" alt="${UI.escapeHtml(creative.title)}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-gradient-to-br ${meta.accent} flex items-center justify-center text-white">
                   <i class="${meta.icon}"></i>
               </div>`;
    }

    function bindEvents() {

        document.addEventListener("click", event => {

            const role = event.target.closest("[data-role]");

            if (role) {
                state.activeRole = role.dataset.role;
                persist();
                renderAll();
                showToast(state.activeRole === "client" ? "Now viewing as the client" : "Now viewing as the agency", "info");
                return;
            }

            const pick = event.target.closest("[data-review]");

            if (pick) {
                setPage("review");
                setReviewTarget(pick.dataset.review);
                return;
            }

            const nav = event.target.closest("[data-page]");

            if (nav) {
                event.preventDefault();
                setPage(nav.dataset.page);
                return;
            }

            if (event.target.closest("[data-open-upload]")) {
                openUpload();
                return;
            }

            if (event.target.closest("[data-close-upload]")) {
                closeUpload();
                return;
            }

            if (event.target.closest("[data-close-detail]") || event.target === el.detailModal) {
                closeDetail();
                return;
            }

            const open = event.target.closest("[data-open]");

            if (open) {
                openDetail(open.dataset.open);
                return;
            }

            const review = event.target.closest("[data-open-review]");

            if (review) {
                closeDetail();
                setPage("review");
                setReviewTarget(review.dataset.openReview);
                return;
            }

            const submit = event.target.closest("[data-submit]");

            if (submit) {
                const result = Portal.submitCreative(state, submit.dataset.submit);

                if (!result) {
                    showToast("Add a title and a client before submitting", "error");
                    return;
                }

                persist();
                renderAll();
                showToast("Sent to " + (UI.clientById(state, result.clientId) || {}).name, "success");
                return;
            }

            const resubmit = event.target.closest("[data-resubmit]");

            if (resubmit) {
                Portal.resubmit(state, resubmit.dataset.resubmit);
                persist();
                renderAll();
                showToast("Sent back to the client", "success");
                return;
            }

            const remove = event.target.closest("[data-delete]");

            if (remove) {
                if (!confirm("Delete this creative and its review history?")) return;
                Portal.removeCreative(state, remove.dataset.delete);
                persist();
                closeDetail();
                renderAll();
                return;
            }

        });

        el.clientFilter.addEventListener("change", () => {
            clientFilter = el.clientFilter.value;
            renderAll();
        });

        document.getElementById("submitAllBtn").addEventListener("click", () => {

            const count = Portal.submitAllDrafts(state);

            persist();
            renderAll();

            showToast(count ? "Submitted " + count + " draft" + (count === 1 ? "" : "s") : "No complete drafts to submit", count ? "success" : "info");

        });

        document.getElementById("samplesBtn").addEventListener("click", () => {

            const demo = JSON.parse(JSON.stringify(SAMPLE_STATE));

            state = { ...demo };

            persist();
            renderAll();

            showToast("Loaded demo data: " + state.creatives.length + " creatives across " + state.agency.clients.length + " clients", "success");

        });

        document.getElementById("resetBtn").addEventListener("click", () => {

            if (!confirm("Clear all creatives, reviews and clients from this browser?")) return;

            state = { ...Store.DEFAULT_STATE, agency: { ...Store.DEFAULT_STATE.agency } };

            Portal.clear();

            clientFilter = "all";
            reviewTargetId = null;

            renderAll();

            showToast("Cleared", "success");

        });

        el.form.addEventListener("submit", async event => {

            event.preventDefault();

            const imageData = await readImage(el.fImage.files[0]);

            const creative = Portal.addCreative(state, {
                title: el.fTitle.value.trim(),
                clientId: el.fClient.value,
                type: el.fType.value,
                campaign: el.fCampaign.value.trim(),
                caption: el.fCaption.value.trim(),
                scheduledFor: el.fDate.value,
                imageData
            });

            persist();
            closeUpload();
            renderAll();

            showToast("Saved as draft. Submit it when the client should see it.", "success");

        });

        document.addEventListener("keydown", event => {

            if (event.key !== "Escape") return;

            closeDetail();
            closeUpload();

        });
    }

    function init() {

        cacheElements();
        bindEvents();
        renderAll();
        setPage("board");

    }

    return { init, state: () => state, setReviewTarget };

})();

document.addEventListener("DOMContentLoaded", App.init);
