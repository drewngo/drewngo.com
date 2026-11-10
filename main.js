(function () {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGsap = typeof window.gsap !== "undefined";

    /* ------ helpers */
    function css(name) {
        return getComputedStyle(root).getPropertyValue(name).trim();
    }

    function fitCanvas(cv) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = cv.getBoundingClientRect();
        cv.width = Math.max(1, Math.round(r.width * dpr));
        cv.height = Math.max(1, Math.round(r.height * dpr));
        const ctx = cv.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w: r.width, h: r.height };
    }

    function withAlpha(hex, a) {
        const n = parseInt(hex.replace("#", ""), 16);
        return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
    }

    /* seeded value noise, so the "satellite image" is the same every visit */
    function hash(x, y) {
        const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return s - Math.floor(s);
    }

    function noise(x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    function fbm(x, y) {
        let s = 0, amp = .5, f = 1;
        for (let i = 0; i < 4; i++) {
            s += amp * noise(x * f, y * f);
            amp *= .5;
            f *= 2;
        }
        return s;
    }

    /* one APT line, u in [0, 1): sync A, space, image A, telemetry, sync B, space, image B, telemetry */
    function aptLine(u, row) {
        if (u < .04) return Math.floor(u / .04 * 14) % 2 ? 1 : .05;
        if (u < .065) return .08;
        if (u < .47) {
            const c = fbm((u - .065) * 9, row * .09);
            return Math.min(1, Math.max(.05, (c - .3) * 2.1));
        }
        if (u < .5) return .25 + .6 * (Math.floor(row / 8) % 8) / 8;
        if (u < .54) return Math.floor((u - .5) / .04 * 14) % 2 ? .95 : .1;
        if (u < .565) return .92;
        if (u < .97) {
            const c = fbm((u - .565) * 9, row * .09);
            return Math.min(1, Math.max(.1, 1.15 - (c - .25) * 1.6));
        }
        return .3 + .5 * (Math.floor(row / 8) % 8) / 8;
    }

    /* ------ hero orbit: holds still under reduced motion */
    const orbit = document.querySelector(".orbit");
    if (orbit && reduced && orbit.pauseAnimations) orbit.pauseAnimations();

    /* ------ clock (Wichita is US Central) */
    const clock = document.getElementById("clock");
    if (clock) {
        const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hour12: false });
        const tick = () => { clock.textContent = fmt.format(new Date()); };
        tick();
        setInterval(tick, 15000);
    }

    /* ------ current section in the nav */
    const navLinks = document.querySelectorAll(".bar__nav a");
    if ("IntersectionObserver" in window && navLinks.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        ["work", "signal", "projects", "whoami"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) io.observe(el);
        });
    }

    /* ------ hero trace: the APT envelope drawn across the bottom of the photo */
    const trace = document.querySelector(".hero__trace");
    const traceState = { p: reduced || !hasGsap ? 1 : 0 };

    function drawTrace() {
        if (!trace) return;
        const { ctx, w, h } = fitCanvas(trace);
        const accent = css("--accent") || "#f2a33a";
        const n = Math.max(60, Math.floor(w / 3));
        const end = Math.floor(n * traceState.p);
        const base = h - 2;

        ctx.clearRect(0, 0, w, h);
        if (end < 2) return;

        const pts = [];
        for (let i = 0; i <= end; i++) {
            const u = (i / n * 1.6) % 1;
            const row = Math.floor(i / n * 1.6) * 3;
            pts.push([i / n * w, base - aptLine(u, row) * (h * .72)]);
        }

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, withAlpha(accent, .12));
        grad.addColorStop(1, withAlpha(accent, 0));

        ctx.beginPath();
        ctx.moveTo(pts[0][0], base);
        pts.forEach((p) => ctx.lineTo(p[0], p[1]));
        ctx.lineTo(pts[pts.length - 1][0], base);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.strokeStyle = withAlpha(accent, .55);
        ctx.lineWidth = 1.25;
        ctx.stroke();
    }

    /* ------ hero entrance: the name rises out of word masks, then the rest settles */
    function enter() {
        const h1 = document.querySelector(".hero__h");
        const kicker = document.querySelector(".hero__kicker");
        const row = document.querySelector(".hero__row");
        const img = document.querySelector(".hero__img");

        if (!hasGsap || reduced || !h1) {
            root.classList.add("m-enter-done");
            drawTrace();
            return;
        }

        const original = h1.textContent;
        h1.setAttribute("aria-label", original);
        h1.innerHTML = original.split(" ").map((w) => '<span class="w" aria-hidden="true"><span>' + w + "</span></span>").join(" ");
        const words = h1.querySelectorAll(".w > span");

        gsap.set([h1, kicker, row], { opacity: 1 });
        root.classList.add("m-enter-done");

        const tl = gsap.timeline({
            defaults: { ease: "expo.out" },
            onComplete: () => {
                h1.textContent = original;
                h1.removeAttribute("aria-label");
            },
        });

        tl.from(img, { scale: 1.05, duration: 1.1, ease: "power3.out" }, 0)
          .from(words, { yPercent: 110, duration: .7, stagger: .08 }, 0)
          .from(kicker, { y: 12, opacity: 0, duration: .52 }, 0)
          .from(row.children, { y: 12, opacity: 0, duration: .52, stagger: .06 }, .4)
          .to(traceState, { p: 1, duration: 1.1, ease: "power2.inOut", onUpdate: drawTrace }, .3);
    }

    /* ------ the moment: the decoder chain, stage by stage */
    const scope = document.getElementById("scope");
    const stageEls = document.querySelectorAll(".stage");
    const label = document.getElementById("scope-label");
    const rate = document.getElementById("scope-rate");
    const prog = document.getElementById("scope-prog");
    const credit = document.getElementById("scope-credit");
    const STAGES = [
        ["a / iq recording", "raw iq"],
        ["b / channel select", "kaiser fir"],
        ["c / fm demod", "62,400 Hz"],
        ["d / decimate", "4,160 Hz"],
        ["e / image", "2 lines / s"],
    ];
    let scopeCtx = null, sw = 0, sh = 0, current = -1;
    const scopeState = { p: 0 };

    function sizeScope() {
        if (!scope) return;
        const f = fitCanvas(scope);
        scopeCtx = f.ctx;
        sw = f.w;
        sh = f.h;
    }

    function axes(ctx, colors) {
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 10; i++) {
            const x = Math.round(sw * i / 10) + .5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sh);
        }
        for (let j = 1; j < 6; j++) {
            const y = Math.round(sh * j / 6) + .5;
            ctx.moveTo(0, y);
            ctx.lineTo(sw, y);
        }
        ctx.stroke();
    }

    function iq(ctx, colors, t, noiseAmt) {
        const n = 320, mid = sh / 2, amp = sh * .26;
        let phase = 0;
        const I = [], Q = [];
        for (let i = 0; i < n; i++) {
            const env = aptLine((i / n * .9) % 1, 4);
            phase += .2 + .18 * env;
            const nz1 = (hash(i, 1) - .5) * 2 * noiseAmt;
            const nz2 = (hash(i, 2) - .5) * 2 * noiseAmt;
            I.push(Math.cos(phase) + nz1);
            Q.push(Math.sin(phase) + nz2);
        }
        [[Q, colors.muted, 1], [I, colors.accent, 1.4]].forEach(([s, col, lw]) => {
            ctx.beginPath();
            s.forEach((v, i) => {
                const x = i / (n - 1) * sw, y = mid - v * amp;
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.stroke();
        });
    }

    function subcarrier(ctx, colors) {
        const n = 520, mid = sh / 2, amp = sh * .36;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const env = .12 + .88 * aptLine(i / n * .45, 4);
            const x = i / (n - 1) * sw, y = mid - Math.sin(i * .9) * env * amp;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const env = .12 + .88 * aptLine(i / n * .45, 4);
            const x = i / (n - 1) * sw;
            i ? ctx.lineTo(x, mid - env * amp) : ctx.moveTo(x, mid - env * amp);
        }
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function decimated(ctx, colors) {
        const n = 64, base = sh * .86, amp = sh * .7;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
            const v = aptLine(i / 200 * .45, 4);
            const x = i / 200 * sw;
            i ? ctx.lineTo(x, base - v * amp) : ctx.moveTo(x, base - v * amp);
        }
        ctx.strokeStyle = colors.line2;
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let i = 0; i < n; i++) {
            const v = aptLine(i / n * .45, 4);
            const x = (i + .5) / n * sw, y = base - v * amp;
            ctx.beginPath();
            ctx.moveTo(x, base);
            ctx.lineTo(x, y);
            ctx.strokeStyle = colors.muted;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = colors.accent;
            ctx.fill();
        }
    }

    /* the decoded picture is built once at its native size, then scaled up row by row */
    const RASTER_COLS = 420, RASTER_ROWS = 90;
    let rasterImg = null;

    /* a real NOAA-19 APT decode (public domain, Wikimedia Commons), drawn in scanline by scanline */
    const aptPhoto = new Image();
    aptPhoto.onload = () => { current = -1; renderScope(); };
    aptPhoto.src = "img/noaa19-apt.jpg";

    function raster(ctx, t) {
        const reveal = Math.max(.02, Math.min(1, t));
        if (aptPhoto.complete && aptPhoto.naturalWidth) {
            const iw = aptPhoto.naturalWidth, ih = aptPhoto.naturalHeight;
            let sx = 0, sy = 0, sWidth = iw, sHeight = ih;
            if (iw / ih > sw / sh) {
                sWidth = ih * sw / sh;
                sx = (iw - sWidth) / 2;
            } else {
                sHeight = iw * sh / sw;
                sy = (ih - sHeight) / 2;
            }
            const dh = sh * reveal;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(aptPhoto, sx, sy, sWidth, sHeight * reveal, 0, 0, sw, dh);
            if (reveal < 1) {
                ctx.fillStyle = css("--accent");
                ctx.fillRect(0, dh - 1, sw, 1.5);
            }
            return;
        }
        if (!rasterImg) {
            rasterImg = document.createElement("canvas");
            rasterImg.width = RASTER_COLS;
            rasterImg.height = RASTER_ROWS;
            const rctx = rasterImg.getContext("2d");
            const data = rctx.createImageData(RASTER_COLS, RASTER_ROWS);
            for (let r = 0; r < RASTER_ROWS; r++) {
                for (let c = 0; c < RASTER_COLS; c++) {
                    const g = Math.round(aptLine(c / RASTER_COLS, r) * 235 + 10);
                    const o = (r * RASTER_COLS + c) * 4;
                    data.data[o] = data.data[o + 1] = data.data[o + 2] = g;
                    data.data[o + 3] = 255;
                }
            }
            rctx.putImageData(data, 0, 0);
        }
        const shown = Math.max(1, Math.round(RASTER_ROWS * Math.min(1, t)));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(rasterImg, 0, 0, RASTER_COLS, shown, 0, 0, sw, sh * shown / RASTER_ROWS);
    }

    function drawStage(k, alpha, t, colors) {
        const ctx = scopeCtx;
        ctx.save();
        ctx.globalAlpha = alpha;
        if (k === 0) iq(ctx, colors, t, .55);
        if (k === 1) iq(ctx, colors, t, .05);
        if (k === 2) subcarrier(ctx, colors);
        if (k === 3) decimated(ctx, colors);
        if (k === 4) raster(ctx, t);
        ctx.restore();
    }

    function renderScope() {
        if (!scopeCtx) return;
        const colors = { accent: css("--accent"), muted: css("--muted"), ink: css("--ink"), line: css("--line"), line2: css("--line-strong") };
        const x = Math.min(4.999, Math.max(0, scopeState.p * 5));
        const k = Math.floor(x), f = x - k;
        const blend = !reduced && k < 4 && f > .8 ? (f - .8) / .2 : 0;
        const t = k === 4 ? f / .8 : Math.min(1, f / .8);

        scopeCtx.clearRect(0, 0, sw, sh);
        axes(scopeCtx, colors);
        drawStage(k, 1 - blend, t, colors);
        if (blend > 0) drawStage(k + 1, blend, 0, colors);

        const active = blend > .5 ? k + 1 : k;
        if (active !== current) {
            current = active;
            stageEls.forEach((el, i) => el.classList.toggle("is-on", i === active));
            label.textContent = STAGES[active][0];
            rate.textContent = STAGES[active][1];
        }
        if (prog) prog.style.transform = "scaleX(" + scopeState.p + ")";
        if (credit) credit.classList.toggle("is-on", k === 4 && t >= 1);
    }

    function initScope() {
        if (!scope) return;
        sizeScope();
        renderScope();

        if (hasGsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            gsap.to(scopeState, {
                p: 1,
                ease: "none",
                onUpdate: renderScope,
                scrollTrigger: {
                    trigger: "#signal",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: reduced ? true : .6,
                    invalidateOnRefresh: true,
                },
            });
        } else {
            const sec = document.getElementById("signal");
            const onScroll = () => {
                const r = sec.getBoundingClientRect();
                scopeState.p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
                renderScope();
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            onScroll();
        }
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            drawTrace();
            sizeScope();
            current = -1;
            renderScope();
        }, 120);
    });

    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
        drawTrace();
        current = -1;
        renderScope();
    });

    const start = () => { enter(); initScope(); };
    if (document.fonts && document.fonts.ready) {
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]).then(start);
    } else {
        start();
    }

    /* ------ currently reading / watching / listening, from the gist */
    const GIST_URL = "https://gist.githubusercontent.com/drewngo/86e6049381f2a0b9dcfb0e731ec97c48/raw/currently.json";
    const CATEGORIES = ["reading", "watching", "listening"];

    function buildCard(item, category) {
        const card = document.createElement("div");
        card.className = "currently-card currently-card--" + category;

        if (item.cover) {
            const img = document.createElement("img");
            img.src = item.cover;
            img.alt = item.title;
            img.className = "currently-cover";
            img.loading = "lazy";
            card.appendChild(img);
        }

        const info = document.createElement("div");
        info.className = "currently-info";

        const title = document.createElement("div");
        title.className = "currently-title";
        if (item.link) {
            const a = document.createElement("a");
            a.className = "link";
            a.target = "_blank";
            a.rel = "noopener";
            a.href = item.link;
            a.textContent = item.title;
            title.appendChild(a);
        } else {
            title.textContent = item.title;
        }
        info.appendChild(title);

        const creator = item.author || item.creator;
        if (creator) {
            const byline = document.createElement("div");
            byline.className = "currently-byline";
            byline.textContent = creator;
            info.appendChild(byline);
        }

        const meta = [item.status, item.progress].filter(Boolean).join(" · ");
        if (meta) {
            const status = document.createElement("div");
            status.className = "currently-status";
            status.textContent = meta;
            info.appendChild(status);
        }

        if (item.note) {
            const note = document.createElement("div");
            note.className = "currently-note";
            note.textContent = item.note;
            info.appendChild(note);
        }

        card.appendChild(info);
        return card;
    }

    fetch(GIST_URL + "?t=" + Date.now(), { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
            const container = document.getElementById("currently-content");
            let rendered = false;

            CATEGORIES.forEach((category) => {
                const items = data[category];
                if (!items || items.length === 0) return;

                let lastLabel = null;
                items.forEach((item) => {
                    const label = (item.status === "finished" ? "finished " : "currently ") + category;
                    if (label !== lastLabel) {
                        const heading = document.createElement("div");
                        heading.className = "currently-category";
                        heading.textContent = label;
                        container.appendChild(heading);
                        lastLabel = label;
                    }
                    container.appendChild(buildCard(item, category));
                });
                rendered = true;
            });

            if (!rendered) {
                container.textContent = "nothing to show right now.";
            }
        })
        .catch(() => {
            document.getElementById("currently-content").textContent = "couldn't load right now.";
        });
})();
