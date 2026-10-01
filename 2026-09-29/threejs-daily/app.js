/**
 * 3jS — application logic
 * Shared across every page: the task store, the planner panel, the HUD,
 * navigation, accordions and scroll reveals.
 *
 * Data lives in localStorage under `3js.v1`. No account, no server, no tracking.
 */
(function () {
    "use strict";

    /* ================================================================ utils */
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    const pad = (n) => String(n).padStart(2, "0");

    function dayKey(d) {
        const date = d || new Date();
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
    }
    function keyToDate(key) {
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function shiftDay(key, delta) {
        const d = keyToDate(key);
        d.setDate(d.getDate() + delta);
        return dayKey(d);
    }
    function prettyDate(key) {
        const d = keyToDate(key);
        return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    }
    function shortDate(key) {
        const d = keyToDate(key);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    function fmtTime(mins) {
        const m = ((Math.round(mins) % 1440) + 1440) % 1440;
        const h = Math.floor(m / 60);
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return h12 + ":" + pad(m % 60) + " " + (h >= 12 ? "PM" : "AM");
    }
    function fmtClock(d) {
        return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }

    const PRIORITY = { 1: "High", 2: "Medium", 3: "Low" };

    /* ============================================================== storage */
    const KEY = "3js.v1";

    const memory = {};
    let usable = true;
    try {
        window.localStorage.setItem("3js.probe", "1");
        window.localStorage.removeItem("3js.probe");
    } catch (_) {
        usable = false;
    }

    function read() {
        if (!usable) return memory.data || null;
        try {
            return JSON.parse(window.localStorage.getItem(KEY));
        } catch (_) {
            return null;
        }
    }
    function write(data) {
        if (!usable) {
            memory.data = data;
            return;
        }
        try {
            window.localStorage.setItem(KEY, JSON.stringify(data));
        } catch (_) {
            memory.data = data;
        }
    }

    const SEED = [
        { title: "Morning pages & coffee", minutes: 7 * 60 + 30, priority: 3, done: true },
        { title: "Inbox to zero", minutes: 9 * 60 + 15, priority: 2 },
        { title: "Ship the orbit renderer", minutes: 10 * 60 + 30, priority: 1 },
        { title: "Walk — no phone", minutes: 12 * 60 + 45, priority: 3 },
        { title: "Standup + retro", minutes: 15 * 60 + 15, priority: 2 },
        { title: "Deep work: drag-to-reschedule", minutes: 17 * 60, priority: 1 },
        { title: "Dinner with Sam", minutes: 19 * 60 + 30, priority: 2 },
        { title: "Read twenty pages", minutes: 22 * 60, priority: 3 }
    ];

    let state = read();
    if (!state || typeof state !== "object" || !state.days) {
        const today = dayKey();
        const tasks = SEED.map((t, i) => ({
            id: "seed-" + i,
            title: t.title,
            minutes: t.minutes,
            priority: t.priority,
            done: !!t.done,
            createdAt: Date.now() - i * 60000
        }));
        state = { version: 1, days: { [today]: { tasks } }, seeded: true, lastDate: today };
        write(state);
    }

    const listeners = new Set();
    function emit() {
        for (const fn of listeners) fn();
    }
    function subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    function tasksFor(key) {
        const day = state.days[key];
        return day && day.tasks ? day.tasks : [];
    }
    function ensureDay(key) {
        if (!state.days[key]) state.days[key] = { tasks: [] };
        return state.days[key];
    }
    function persist() {
        write(state);
        emit();
    }

    function uid() {
        return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function addTask(key, { title, minutes, priority }) {
        const clean = (title || "").trim();
        if (!clean) return null;
        const day = ensureDay(key);
        const task = {
            id: uid(),
            title: clean.slice(0, 80),
            minutes: ((Math.round(minutes) % 1440) + 1440) % 1440,
            priority: [1, 2, 3].includes(priority) ? priority : 2,
            done: false,
            createdAt: Date.now()
        };
        day.tasks.push(task);
        persist();
        return task;
    }

    function updateTask(key, id, patch) {
        const list = tasksFor(key);
        const t = list.find((x) => x.id === id);
        if (!t) return null;
        Object.assign(t, patch);
        if (patch.minutes !== undefined) {
            t.minutes = ((Math.round(patch.minutes) % 1440) + 1440) % 1440;
        }
        persist();
        return t;
    }

    function removeTask(key, id) {
        const day = state.days[key];
        if (!day) return;
        day.tasks = day.tasks.filter((t) => t.id !== id);
        persist();
    }

    function clearDay(key) {
        ensureDay(key).tasks = [];
        persist();
    }

    function statsFor(key) {
        const list = tasksFor(key);
        const done = list.filter((t) => t.done).length;
        const focus = list.filter((t) => t.priority === 1).length;
        return {
            total: list.length,
            done: done,
            focus: focus,
            remaining: list.length - done,
            pct: list.length ? Math.round((done / list.length) * 100) : 0
        };
    }

    /** Consecutive days (ending today or yesterday) with at least one finished task. */
    function streak() {
        const today = dayKey();
        let start = today;
        if (statsFor(today).done === 0) start = shiftDay(today, -1);
        let n = 0;
        let cursor = start;
        for (let i = 0; i < 400; i++) {
            if (statsFor(cursor).done > 0) {
                n += 1;
                cursor = shiftDay(cursor, -1);
            } else break;
        }
        return n;
    }

    /* =============================================== public bridge for 3D */
    const bridge = {
        key: state.lastDate || dayKey(),
        selected: null,
        getTasks: () => tasksFor(bridge.key),
        getKey: () => bridge.key,
        setKey(key) {
            bridge.key = key;
            state.lastDate = key;
            write(state);
        },
        onMove(id, minutes) {
            updateTask(bridge.key, id, { minutes });
        },
        onSelect(id) {
            bridge.selected = id;
            document.dispatchEvent(new CustomEvent("todoapp:select", { detail: { id } }));
        },
        onHover() {}
    };
    window.TodoApp = bridge;

    /* ======================================================== 1. navigation */
    function initNav() {
        const toggle = $(".nav-toggle");
        const list = $("#nav-list");
        if (toggle && list) {
            toggle.addEventListener("click", () => {
                const open = list.classList.toggle("open");
                toggle.setAttribute("aria-expanded", String(open));
                document.body.classList.toggle("is-locked", open);
            });
            $$("a", list).forEach((a) =>
                a.addEventListener("click", () => {
                    list.classList.remove("open");
                    toggle.setAttribute("aria-expanded", "false");
                    document.body.classList.remove("is-locked");
                })
            );
        }

        const header = $(".site-header");
        if (header) {
            const onScroll = () => header.classList.toggle("stuck", window.scrollY > 12);
            window.addEventListener("scroll", onScroll, { passive: true });
            onScroll();
        }

        // mark the current page in the nav
        const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
        $$(".nav-list a[href]").forEach((a) => {
            const target = a.getAttribute("href").split("#")[0].toLowerCase();
            if (target === here) a.setAttribute("aria-current", "page");
        });
    }

    /* ==================================================== 2. scroll reveals */
    function initReveal() {
        const items = $$(".reveal");
        if (!items.length) return;
        if (!("IntersectionObserver" in window)) {
            items.forEach((i) => i.classList.add("is-in"));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("is-in");
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
        );
        items.forEach((i) => io.observe(i));
    }

    /* ====================================================== 3. accordions */
    function initAccordions() {
        $$(".acc-trigger").forEach((btn) => {
            btn.addEventListener("click", () => {
                const open = btn.getAttribute("aria-expanded") === "true";
                $$(".acc-trigger").forEach((b) => b.setAttribute("aria-expanded", "false"));
                btn.setAttribute("aria-expanded", String(!open));
            });
        });
    }

    /* =================================================== 4. pointer glow */
    function initPointerGlow() {
        if (window.matchMedia("(hover: none)").matches) return;
        $$(".card").forEach((card) => {
            card.addEventListener("pointermove", (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty("--mx", (e.clientX - r.left) + "px");
                card.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* ================================================ 5. live clock (all) */
    function initClock() {
        const time = $("[data-clock]");
        const date = $("[data-clock-date]");
        if (!time) return;
        const tick = () => {
            const now = new Date();
            time.textContent = fmtClock(now);
            if (date) date.textContent = now.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric"
            });
        };
        tick();
        setInterval(tick, 1000);
    }

    /* ================================ 6. landing page: today in miniature */
    function initHeroInstrument() {
        const list = $("#hero-tasks");
        if (!list) return;
        const bar = $("#hero-bar");
        const meta = $("#hero-progress-text");

        function render() {
            const key = dayKey();
            const tasks = tasksFor(key).slice().sort((a, b) => a.minutes - b.minutes);
            const s = statsFor(key);

            list.innerHTML = "";
            if (!tasks.length) {
                const li = document.createElement("li");
                li.className = "instrument__row";
                li.innerHTML = '<span>Nothing planned yet — the sky is clear.</span>';
                list.appendChild(li);
            } else {
                tasks.slice(0, 5).forEach((t) => {
                    const li = document.createElement("li");
                    li.className = "instrument__row" + (t.done ? " is-done" : "");
                    li.innerHTML =
                        "<time>" + fmtTime(t.minutes) + "</time><span></span>";
                    li.querySelector("span").textContent = t.title;
                    list.appendChild(li);
                });
            }

            if (bar) bar.style.width = s.pct + "%";
            if (meta) meta.innerHTML = "<strong>" + s.done + "</strong> of " + s.total + " complete";
        }

        render();
        subscribe(render);
    }

    /* ================================================= 7. landing: stat tiles */
    function initStats() {
        const doneEl = $("[data-stat='done']");
        if (!doneEl) return;
        const totalEl = $("[data-stat='total']");
        const streakEl = $("[data-stat='streak']");
        const focusEl = $("[data-stat='focus']");
        const planEl = $("[data-stat='planned']");

        function render() {
            const key = dayKey();
            const s = statsFor(key);
            const times = tasksFor(key).map((t) => t.minutes);
            const span = times.length ? (Math.max.apply(null, times) - Math.min.apply(null, times)) : 0;
            doneEl.textContent = s.done;
            if (totalEl) totalEl.textContent = s.total;
            if (streakEl) streakEl.textContent = streak();
            if (focusEl) focusEl.textContent = s.focus;
            if (planEl) planEl.textContent = (span / 60).toFixed(1) + "h";
        }
        render();
        subscribe(render);
    }

    /* ====================================================== 8. the planner */
    function initPlanner() {
        const listEl = $("#task-list");
        if (!listEl) return;

        const form = $("#composer");
        const titleInput = $("#task-title");
        const timeInput = $("#task-time");
        const prioBtns = $$(".prio-btn");
        const chips = $$(".chip");
        const ring = $("#progress-ring");
        const ringPct = $("#progress-pct");
        const progressText = $("#progress-text");
        const dayLabel = $("#day-label");
        const prevBtn = $("#day-prev");
        const nextBtn = $("#day-next");
        const todayBtn = $("#day-today");
        const donePill = $("#pill-done");
        const streakPill = $("#pill-streak");
        const focusPill = $("#pill-focus");
        const footCount = $("#foot-count");
        const toastEl = $("#toast");
        const clearBtn = $("#clear-day");
        const panel = $(".panel");
        const panelToggle = $("#panel-toggle");

        let priority = 2;
        let filter = "all";
        let selected = null;

        /* toast ------------------------------------------------------------ */
        let toastTimer = null;
        function toast(message) {
            if (!toastEl) return;
            toastEl.textContent = message;
            toastEl.classList.add("show");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
        }

        /* default a sensible time when opening the composer -------------------- */
        function defaultTime() {
            const now = new Date();
            const next = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
            const m = ((next % 1440) + 1440) % 1440;
            return pad(Math.floor(m / 60)) + ":" + pad(m % 60);
        }
        if (timeInput) timeInput.value = defaultTime();

        /* priority ---------------------------------------------------------- */
        function setPriority(p) {
            priority = p;
            prioBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.p) === p)));
        }
        prioBtns.forEach((b) => b.addEventListener("click", () => setPriority(Number(b.dataset.p))));
        setPriority(2);

        /* filters ----------------------------------------------------------- */
        function setFilter(f) {
            filter = f;
            chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === f)));
            render();
        }
        chips.forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));

        /* rendering --------------------------------------------------------- */
        function visibleTasks() {
            let list = tasksFor(bridge.key).slice();
            if (filter === "open") list = list.filter((t) => !t.done);
            if (filter === "done") list = list.filter((t) => t.done);
            if (filter === "high") list = list.filter((t) => t.priority === 1 && !t.done);
            return list.sort((a, b) => a.minutes - b.minutes || a.createdAt - b.createdAt);
        }

        function render() {
            const key = bridge.key;
            const tasks = visibleTasks();
            const s = statsFor(key);

            listEl.innerHTML = "";

            if (!tasks.length) {
                const li = document.createElement("li");
                li.className = "empty";
                li.innerHTML =
                    '<div class="empty__orb">✦</div><p>' +
                    (tasksFor(key).length
                        ? "Nothing matches that filter."
                        : "The orbit is empty. Add your first task above — it becomes a light.") +
                    "</p>";
                listEl.appendChild(li);
            }

            for (const task of tasks) {
                const li = document.createElement("li");
                li.className =
                    "task" + (task.done ? " is-done" : "") + (selected === task.id ? " is-selected" : "");
                li.dataset.id = task.id;

                const check = document.createElement("button");
                check.className = "task__check";
                check.type = "button";
                check.textContent = "✓";
                check.setAttribute("aria-pressed", String(task.done));
                check.setAttribute("aria-label", (task.done ? "Mark " : "Mark ") + task.title + (task.done ? " as not done" : " as done"));
                check.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const next = !task.done;
                    updateTask(key, task.id, { done: next, doneAt: next ? Date.now() : null });
                    if (next) {
                        const s2 = statsFor(key);
                        if (s2.total && s2.done === s2.total) {
                            toast("Whole orbit complete. Take the rest of the day off. ✦");
                        }
                    }
                });

                const time = document.createElement("div");
                time.className = "task__time";
                time.textContent = fmtTime(task.minutes);

                const body = document.createElement("div");
                body.className = "task__body";
                const title = document.createElement("div");
                title.className = "task__title";
                title.textContent = task.title;
                const sub = document.createElement("div");
                sub.className = "task__sub";
                sub.innerHTML = '<i class="p' + task.priority + '"></i>';
                sub.appendChild(document.createTextNode(PRIORITY[task.priority] + " · " + Math.round(task.minutes / 6) / 10 + "h from midnight"));
                body.appendChild(title);
                body.appendChild(sub);

                const actions = document.createElement("div");
                actions.className = "task__actions";
                const earlier = document.createElement("button");
                earlier.className = "icon-btn icon-btn--shift";
                earlier.type = "button";
                earlier.textContent = "◀";
                earlier.title = "Move 15 minutes earlier";
                earlier.setAttribute("aria-label", "Move " + task.title + " 15 minutes earlier");
                earlier.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // updateTask mutates the task in place, so read the landed
                    // time off its return value rather than the pre-click one
                    const moved = updateTask(key, task.id, { minutes: task.minutes - 15 });
                    if (moved) toast(fmtTime(moved.minutes));
                });
                const later = document.createElement("button");
                later.className = "icon-btn icon-btn--shift";
                later.type = "button";
                later.textContent = "▶";
                later.title = "Move 15 minutes later";
                later.setAttribute("aria-label", "Move " + task.title + " 15 minutes later");
                later.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const moved = updateTask(key, task.id, { minutes: task.minutes + 15 });
                    if (moved) toast(fmtTime(moved.minutes));
                });
                const del = document.createElement("button");
                del.className = "icon-btn";
                del.type = "button";
                del.textContent = "✕";
                del.title = "Delete task";
                del.setAttribute("aria-label", "Delete " + task.title);
                del.addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeTask(key, task.id);
                    if (selected === task.id) select(null);
                    toast("Task removed");
                });
                actions.append(earlier);
                actions.append(later);
                actions.append(del);

                li.append(check, time, body, actions);
                li.addEventListener("click", () => select(task.id));
                listEl.appendChild(li);
            }

            /* header + hud */
            if (ring) ring.style.setProperty("--pct", s.pct);
            if (ringPct) ringPct.textContent = s.pct + "%";
            if (progressText) {
                progressText.innerHTML =
                    s.total === 0
                        ? "Nothing on the rail yet."
                        : "<strong>" + s.done + "</strong> of " + s.total + " landed · " +
                          "<strong>" + s.remaining + "</strong> still in orbit";
            }
            if (dayLabel) dayLabel.textContent = (key === dayKey() ? "Today · " : "") + shortDate(key);
            if (donePill) donePill.textContent = s.done + "/" + s.total;
            if (streakPill) streakPill.textContent = streak();
            if (focusPill) focusPill.textContent = s.focus;
            if (footCount) footCount.textContent = s.total + " task" + (s.total === 1 ? "" : "s");
            if (nextBtn) nextBtn.disabled = key >= dayKey();
            if (todayBtn) todayBtn.classList.toggle("btn--primary", key === dayKey());

            if (window.DayOrbit) {
                window.DayOrbit.setTasks(tasksFor(key));
                window.DayOrbit.setDay({
                    isToday: key === dayKey(),
                    elapsed: key === dayKey() ? 0.25 : 0.999
                });
            }
        }

        function select(id) {
            selected = id;
            if (window.DayOrbit) window.DayOrbit.select(id);
            render();
            if (id) {
                if (panel) panel.classList.add("is-open");
                const row = listEl.querySelector('.task[data-id="' + id + '"]');
                if (row && row.scrollIntoView) row.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }

        /* composer ---------------------------------------------------------- */
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const title = titleInput ? titleInput.value : "";
                if (!title.trim()) {
                    if (titleInput) titleInput.focus();
                    return;
                }
                const mins = timeInput && timeInput.value
                    ? Number(timeInput.value.split(":")[0]) * 60 + Number(timeInput.value.split(":")[1])
                    : defaultTime();
                const task = addTask(bridge.key, { title, minutes: mins, priority });
                if (titleInput) {
                    titleInput.value = "";
                    titleInput.focus();
                }
                if (timeInput) timeInput.value = defaultTime();
                toast("Added to orbit at " + fmtTime(mins));
                if (task) select(task.id);
            });
        }

        /* day switching ------------------------------------------------------ */
        function go(key) {
            bridge.setKey(key);
            selected = null;
            if (window.DayOrbit) window.DayOrbit.select(null);
            render();
        }
        if (prevBtn) prevBtn.addEventListener("click", () => go(shiftDay(bridge.key, -1)));
        if (nextBtn) nextBtn.addEventListener("click", () => go(shiftDay(bridge.key, 1)));
        if (todayBtn) todayBtn.addEventListener("click", () => go(dayKey()));
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (!tasksFor(bridge.key).length) {
                    toast("Nothing to clear");
                    return;
                }
                clearDay(bridge.key);
                toast("Day cleared");
            });
        }

        /* tools -------------------------------------------------------------- */
        const viewBtn = $("#tool-view");
        let view = "iso";
        if (viewBtn) {
            viewBtn.addEventListener("click", () => {
                view = view === "iso" ? "top" : "iso";
                viewBtn.textContent = view === "iso" ? "◱" : "◰";
                viewBtn.setAttribute("aria-label", view === "iso" ? "Switch to top-down view" : "Switch to orbit view");
                if (window.DayOrbit) window.DayOrbit.setView(view);
                toast(view === "iso" ? "Orbit view" : "Top-down view");
            });
        }
        const zoomBtn = $("#tool-zoom");
        if (zoomBtn) {
            zoomBtn.addEventListener("click", () => {
                if (!window.DayOrbit) return;
                const wide = window.DayOrbit.rad > 20;
                window.DayOrbit.setView(wide ? "iso" : "wide");
                toast(wide ? "Zoomed in" : "Zoomed out");
            });
        }
        const helpBtn = $("#tool-help");
        const controlsEl = $("#controls");
        let controlsTimer = null;
        const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        function setControls(open) {
            if (!helpBtn || !controlsEl) return;
            clearTimeout(controlsTimer);
            helpBtn.setAttribute("aria-expanded", String(open));
            if (open) {
                controlsEl.hidden = false;
                // flush the closed styles first so the transition has a start
                // value — a rAF here would stall on a busy render loop
                void controlsEl.offsetWidth;
                controlsEl.classList.add("is-open");
                const close = controlsEl.querySelector(".controls__close");
                if (close) close.focus();
            } else {
                controlsEl.classList.remove("is-open");
                controlsTimer = setTimeout(
                    () => { controlsEl.hidden = true; },
                    calmMotion.matches ? 0 : 260
                );
                helpBtn.focus();
            }
        }

        if (helpBtn && controlsEl) {
            helpBtn.addEventListener("click", () => {
                setControls(helpBtn.getAttribute("aria-expanded") !== "true");
            });
            controlsEl.addEventListener("click", (e) => {
                if (e.target.closest("[data-controls-close]")) setControls(false);
            });
        }

        /* mobile sheet -------------------------------------------------------- */
        if (panelToggle && panel) {
            panelToggle.addEventListener("click", () => {
                panel.classList.toggle("is-open");
            });
        }

        /* keyboard ------------------------------------------------------------ */
        document.addEventListener("keydown", (e) => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
            if (e.key === "Escape") {
                if (controlsEl && !controlsEl.hidden) {
                    setControls(false);
                    return;
                }
                select(null);
                if (typing && document.activeElement.blur) document.activeElement.blur();
                return;
            }
            if (typing) return;
            if (e.key === "n" || e.key === "N") {
                e.preventDefault();
                if (titleInput) titleInput.focus();
            } else if (e.key === "/") {
                e.preventDefault();
                if (titleInput) titleInput.focus();
            } else if (e.key === "t" || e.key === "T") {
                go(dayKey());
            }
        });

        /* 3D → list selection -------------------------------------------------- */
        document.addEventListener("todoapp:select", (e) => {
            select(e.detail && e.detail.id);
        });

        subscribe(render);
        go(bridge.key || dayKey());
    }

    /* =============================================================== launch */
    function init() {
        initNav();
        initReveal();
        initAccordions();
        initPointerGlow();
        initClock();
        initHeroInstrument();
        initStats();
        initPlanner();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
