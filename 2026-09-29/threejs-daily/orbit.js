/**
 * 3jS — Day Orbit
 * A real-time WebGL scene that renders a user's day as a small solar system.
 *
 *   · 24h mapped to a 360° orbital track (06:00 at the right, noon at the back)
 *   · every task is a glowing node; time = orbital angle, priority = orbit lane
 *   · drag a node around the ring to reschedule it
 *   · finishing a task bursts it into particles
 *   · the sun's colour follows the real local time
 *
 * Three.js is vendored in ./vendor so the site works fully offline.
 */

import * as THREE from "./vendor/three.module.min.js";

/* ------------------------------------------------------------------ utils */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (n, m) => ((n % m) + m) % m;
/** Frame-rate independent smoothing: same result at 15fps and 144fps. */
const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

const COL = {
    1: 0xff6f9c, // high
    2: 0xffb454, // medium
    3: 0x4fe3d0, // low / easy
    done: 0x46557a,
    track: 0x2c3a5c
};

const LANE = { 1: -0.95, 2: 0, 3: 0.95 };
const RING_R = 6.4;
const NODE_Y = 0.42;

const reducedMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** day fraction (0..1, 0 = midnight) → orbital angle, with 06:00 pinned to +X */
function angleForMinutes(mins) {
    return (mins / 1440) * TAU - Math.PI / 2;
}
function minutesForAngle(angle) {
    return mod((angle / TAU) * 1440 + 360, 1440);
}
function xForAngle(a, r) { return Math.cos(a) * r; }
function zForAngle(a, r) { return -Math.sin(a) * r; }
function fmtTime(mins) {
    const m = mod(Math.round(mins), 1440);
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mm} ${h >= 12 ? "PM" : "AM"}`;
}
function clipTitle(title) {
    const t = (title || "Untitled").trim() || "Untitled";
    return t.length > 22 ? t.slice(0, 21) + "…" : t;
}

/* --------------------------------------------------------- canvas assets */
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function makeTextTexture(text, opts = {}) {
    const {
        weight = 600,
        size = 52,
        family = '"JetBrains Mono", ui-monospace, monospace',
        color = "#eaf0ff",
        bg = null,
        border = null
    } = opts;

    const font = `${weight} ${size}px ${family}`;
    const pad = size * 0.46;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = font;
    const w = Math.max(12, Math.ceil(probe.measureText(text).width) + pad * 2);
    const h = Math.ceil(size * 1.65);

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    if (bg || border) {
        roundRectPath(ctx, 2, 2, w - 4, h - 4, h / 2);
        if (bg) { ctx.fillStyle = bg; ctx.fill(); }
        if (border) { ctx.strokeStyle = border; ctx.lineWidth = 3; ctx.stroke(); }
    }

    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 2);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return { tex, aspect: w / h };
}

const TITLE_STYLE = {
    size: 52,
    color: "#eaf0ff",
    weight: 700,
    family: '"Space Grotesk", system-ui, sans-serif',
    bg: "rgba(8,14,28,0.86)",
    border: "rgba(126,163,224,0.35)"
};

function makeGlowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.13, "rgba(255,255,255,0.7)");
    g.addColorStop(0.4, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/** Deep-space backdrop generated on the CPU: gradient + nebula clouds + dust stars. */
function makeSkyTexture() {
    const w = 1024;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#04060e");
    sky.addColorStop(0.42, "#060a16");
    sky.addColorStop(0.62, "#080e1e");
    sky.addColorStop(1, "#03050b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const clouds = [
        ["rgba(79,227,208,0.14)", 0.2, 0.4, 260],
        ["rgba(143,124,248,0.14)", 0.62, 0.52, 290],
        ["rgba(255,111,156,0.09)", 0.86, 0.34, 210],
        ["rgba(255,180,84,0.08)", 0.4, 0.7, 240],
        ["rgba(120,170,255,0.10)", 0.06, 0.62, 260]
    ];
    ctx.globalCompositeOperation = "lighter";
    for (const [color, fx, fy, radius] of clouds) {
        for (let i = 0; i < 3; i++) {
            const x = (fx * w + (Math.random() - 0.5) * w * 0.5) | 0;
            const y = (fy * h + (Math.random() - 0.5) * h * 0.45) | 0;
            const r = radius * (0.6 + Math.random() * 0.8);
            const faded = color.replace(/,[\d.]+\)$/, ",0.03)");
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, color);
            g.addColorStop(0.5, faded);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TAU);
            ctx.fill();
        }
    }
    for (let i = 0; i < 900; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const a = Math.random() * 0.5 + 0.06;
        const s = Math.random() < 0.92 ? 1 : 1.7;
        ctx.fillStyle = `rgba(${200 + ((Math.random() * 55) | 0)},${215 + ((Math.random() * 40) | 0)},255,${a})`;
        ctx.fillRect(x, y, s, s);
    }
    ctx.globalCompositeOperation = "source-over";

    // keep the void dark everywhere, whatever the camera faces
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, h * 0.82);
    vignette.addColorStop(0, "rgba(4,6,14,0)");
    vignette.addColorStop(1, "rgba(4,6,14,0.75)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/* ------------------------------------------------------------- ring shader */
const RING_VERT = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* t = day fraction, 0 = midnight, 0.25 = 06:00. The lit arc runs sunrise → now. */
const RING_FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vPos;
  uniform float uR;
  uniform float uNow;
  uniform float uOpacity;
  uniform vec3  uTrack;
  uniform vec3  uA;
  uniform vec3  uB;
  const float TAU = 6.28318530718;

  void main() {
    float r = length(vPos);
    float band = abs(r - uR);
    float core = smoothstep(0.075, 0.0, band);
    float halo = smoothstep(0.85, 0.0, band);

    float ang = atan(vPos.y, vPos.x);
    float t = fract(ang / TAU + 0.25);
    float hh = t * 24.0;
    float d = abs(fract(hh));
    d = min(d, 1.0 - d);
    float major = (mod(floor(hh + 0.5), 6.0) < 0.5) ? 1.0 : 0.0;
    float tickLen = mix(0.26, 0.62, major);
    float tick = smoothstep(0.0034, 0.0, d) * smoothstep(tickLen, tickLen * 0.25, band);

    float onArc = step(0.25, t) * step(t, uNow);
    vec3 arcCol = mix(uA, uB, clamp((t - 0.25) / 0.75, 0.0, 1.0));

    vec3 col = uTrack * (core * 0.5 + halo * 0.45);
    col += arcCol * (core * onArc * 1.15 + halo * onArc * 0.5);
    col += vec3(0.72, 0.83, 1.0) * tick * mix(0.2, 0.5, major);

    float head = exp(-pow((t - uNow) * 120.0, 2.0));
    col += uB * head * 1.4;

    float alpha = clamp(core * 0.5 + halo * 0.45 + tick * 0.4 + head * 0.7, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

/* =========================================================== DayOrbit class */
class DayOrbit {
    constructor(opts = {}) {
        this.mount = opts.mount;
        this.interactive = opts.mode === "interactive";
        this.showLabels = opts.showLabels !== false;
        this.api = opts.api || null;
        this.onSelect = opts.onSelect || (() => {});

        this.tasks = [];
        this.nodes = new Map();
        this.bursts = [];
        this.selectedId = null;
        this.hoverId = null;
        this.isToday = true;
        this.elapsed = 0.25;
        this.disposed = false;

        this._tmp = new THREE.Vector3();
        this._rayHit = new THREE.Vector3();
        this._dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -NODE_Y);

        this._initThree();
        this._initScene();
        this._initInput();

        this._loop = this._loop.bind(this);
        this._last = performance.now();
        this._running = true;
        this._raf = requestAnimationFrame(this._loop);
    }

    /* ---------------------------------------------------------- renderer */
    _initThree() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "sky-canvas";
        this.canvas.style.cssText = "width:100%;height:100%;display:block;touch-action:none;";
        this.mount.appendChild(this.canvas);

        const ctx =
            this.canvas.getContext("webgl2") ||
            this.canvas.getContext("webgl") ||
            this.canvas.getContext("experimental-webgl");
        if (!ctx) throw new Error("WebGL unavailable");

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            context: ctx,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x04060e, 1);

        this.scene = new THREE.Scene();
        this.scene.background = makeSkyTexture();

        this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);

        // camera rig — spherical coordinates around the origin
        this.az = 0.35;
        this.pol = this.interactive ? 1.0 : 0.95;
        this.rad = this.interactive ? 17 : 20;
        this.azV = 0;
        this.polV = 0;
        this.target = { az: this.az, pol: this.pol, rad: this.rad };
        this.easing = false;
        this.autoRotate = !this.interactive && !reducedMotion;

        // The planner panel occupies the right edge (and a sheet the bottom on
        // phones); nudge the orbit's focal point so the ring centres in the
        // space that is actually visible.
        this.shiftX = 0;
        this.shiftY = 0;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
    }

    /* ------------------------------------------------------------- scene */
    _initScene() {
        this.scene.add(new THREE.AmbientLight(0x9fb4dd, 0.5));

        this.sunLight = new THREE.PointLight(0xfff0cf, 240, 90, 2);
        this.sunLight.position.set(0, 1.2, 0);
        this.scene.add(this.sunLight);

        this.glowTex = makeGlowTexture();
        this._buildStars();
        this._buildGrid();
        this._buildTrack();
        this._buildSun();
        this._buildNowMarker();
        if (this.interactive) this._buildLanes();
    }

    _buildStars() {
        const layer = (count, size, opacity, spread, boost) => {
            const pos = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            const c = new THREE.Color();
            for (let i = 0; i < count; i++) {
                const theta = Math.random() * TAU;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = spread * (0.72 + Math.random() * 0.28);
                pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                pos[i * 3 + 1] = r * Math.cos(phi) * 0.7;
                pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

                const pick = Math.random();
                c.setHex(pick > 0.94 ? 0xffd9a8 : pick > 0.8 ? 0xbfe9ff : 0xffffff);
                c.multiplyScalar(0.45 + Math.random() * 0.55 + boost);
                col[i * 3] = c.r;
                col[i * 3 + 1] = c.g;
                col[i * 3 + 2] = c.b;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
            const mat = new THREE.PointsMaterial({
                size,
                sizeAttenuation: true,
                transparent: true,
                opacity,
                depthWrite: false,
                vertexColors: true,
                blending: THREE.AdditiveBlending
            });
            this.scene.add(new THREE.Points(geo, mat));
        };
        layer(1400, 0.14, 0.7, 70, 0);
        layer(240, 0.34, 0.9, 58, 0.25);
    }

    _buildGrid() {
        const group = new THREE.Group();

        for (const radius of [3.2, 9.6, 13, 16.5]) {
            const pts = [];
            for (let i = 0; i <= 128; i++) {
                const a = (i / 128) * TAU;
                pts.push(new THREE.Vector3(Math.cos(a) * radius, -0.02, -Math.sin(a) * radius));
            }
            group.add(
                new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(pts),
                    new THREE.LineBasicMaterial({
                        color: 0x2b3c63,
                        transparent: true,
                        opacity: 0.3,
                        depthWrite: false
                    })
                )
            );
        }

        const spokes = [];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            spokes.push(
                new THREE.Vector3(xForAngle(a, 2.3), -0.03, zForAngle(a, 2.3)),
                new THREE.Vector3(xForAngle(a, 16.5), -0.03, zForAngle(a, 16.5))
            );
        }
        group.add(
            new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(spokes),
                new THREE.LineBasicMaterial({
                    color: 0x243352,
                    transparent: true,
                    opacity: 0.38,
                    depthWrite: false
                })
            )
        );

        this.scene.add(group);
        this.grid = group;
    }

    _buildTrack() {
        this.ringUniforms = {
            uR: { value: RING_R },
            uNow: { value: 0.25 },
            uOpacity: { value: 1 },
            uTrack: { value: new THREE.Color(COL.track) },
            uA: { value: new THREE.Color(0x2f7fd0) },
            uB: { value: new THREE.Color(0x6ff0dc) }
        };
        this.track = new THREE.Mesh(
            new THREE.RingGeometry(RING_R - 0.9, RING_R + 0.9, 512, 1),
            new THREE.ShaderMaterial({
                vertexShader: RING_VERT,
                fragmentShader: RING_FRAG,
                uniforms: this.ringUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            })
        );
        this.track.rotation.x = -Math.PI / 2;
        this.scene.add(this.track);

        this.hourLabels = [];
        const marks = [
            { h: 0, txt: "12 AM" },
            { h: 360, txt: "6 AM" },
            { h: 720, txt: "NOON" },
            { h: 1080, txt: "6 PM" }
        ];
        for (const m of marks) {
            const { tex, aspect } = makeTextTexture(m.txt, { size: 52, color: "#9fb3d8", weight: 700 });
            const sp = new THREE.Sprite(
                new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 })
            );
            const a = angleForMinutes(m.h);
            sp.position.set(xForAngle(a, RING_R + 1.8), 0.95, zForAngle(a, RING_R + 1.8));
            sp.scale.set(0.78 * aspect, 0.78, 1);
            this.scene.add(sp);
            this.hourLabels.push(sp);
        }
    }

    _buildLanes() {
        this.lanes = new THREE.Group();
        for (const key of [1, 2, 3]) {
            const pts = [];
            const radius = RING_R + LANE[key];
            for (let i = 0; i <= 160; i++) {
                const a = (i / 160) * TAU;
                pts.push(new THREE.Vector3(Math.cos(a) * radius, 0.01, -Math.sin(a) * radius));
            }
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineDashedMaterial({
                    color: new THREE.Color(COL[key]),
                    transparent: true,
                    opacity: 0.2,
                    dashSize: 0.22,
                    gapSize: 0.3,
                    depthWrite: false
                })
            );
            line.computeLineDistances();
            this.lanes.add(line);
        }
        this.scene.add(this.lanes);
    }

    _buildSun() {
        this.sunGroup = new THREE.Group();

        this.sun = new THREE.Mesh(
            new THREE.SphereGeometry(1.05, 48, 32),
            new THREE.MeshBasicMaterial({ color: 0xfff1cf })
        );
        this.sunGroup.add(this.sun);

        this.corona = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 40, 28),
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                uniforms: { uColor: { value: new THREE.Color(0xffc978) } },
                vertexShader: /* glsl */ `
                    varying vec3 vN;
                    varying vec3 vV;
                    void main() {
                        vN = normalize(mat3(modelMatrix) * normal);
                        vec4 wp = modelMatrix * vec4(position, 1.0);
                        vV = normalize(cameraPosition - wp.xyz);
                        gl_Position = projectionMatrix * viewMatrix * wp;
                    }
                `,
                fragmentShader: /* glsl */ `
                    precision mediump float;
                    varying vec3 vN;
                    varying vec3 vV;
                    uniform vec3 uColor;
                    void main() {
                        float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.4);
                        gl_FragColor = vec4(uColor, f * 0.7);
                    }
                `
            })
        );
        this.sunGroup.add(this.corona);

        this.glow = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.glowTex,
                color: 0xffc978,
                transparent: true,
                opacity: 0.55,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        this.glow.scale.set(11, 11, 1);
        this.sunGroup.add(this.glow);

        this.scene.add(this.sunGroup);
    }

    _buildNowMarker() {
        const g = new THREE.Group();

        this.nowDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0x8dfbe8 })
        );
        g.add(this.nowDot);

        this.nowHalo = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.glowTex,
                color: 0x8dfbe8,
                transparent: true,
                opacity: 0.8,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        this.nowHalo.scale.set(2.8, 2.8, 1);
        g.add(this.nowHalo);

        this.nowBeam = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0.08, 0),
                new THREE.Vector3(0, 0.08, 0)
            ]),
            new THREE.LineBasicMaterial({
                color: 0x7ef0dd,
                transparent: true,
                opacity: 0.45,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        g.add(this.nowBeam);

        this.scene.add(g);
        this.nowGroup = g;
    }

    /* --------------------------------------------------------------- data */
    setTasks(tasks) {
        this.tasks = (tasks || []).slice();
        const seen = new Set();
        const now = performance.now();

        for (const task of this.tasks) {
            seen.add(task.id);
            let node = this.nodes.get(task.id);
            const isNew = !node;
            if (isNew) {
                node = this._createNode(task);
                this.nodes.set(task.id, node);
                this.scene.add(node.group);
            }
            this._applyTask(node, task);
            if (isNew) {
                node.born = now;
                node.scale = 0;
            } else if (!node.wasDone && node.done && node.target) {
                // just completed → particle burst
                this._burst(node.group.position, COL.done === 0 ? 0x4fe3d0 : 0x8dfbe8);
            }
            node.wasDone = node.done;
        }

        for (const [id, node] of [...this.nodes]) {
            if (seen.has(id)) continue;
            this.scene.remove(node.group);
            this._disposeNode(node);
            this.nodes.delete(id);
        }

        this._layout();
    }

    _createNode(task) {
        const group = new THREE.Group();

        const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.3, 2),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: new THREE.Color(0x000000),
                roughness: 0.28,
                metalness: 0.15,
                flatShading: true
            })
        );
        group.add(mesh);

        const halo = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.glowTex,
                transparent: true,
                opacity: 0.6,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        halo.scale.set(2.6, 2.6, 1);
        group.add(halo);

        const stem = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -NODE_Y, 0)
            ]),
            new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                depthWrite: false
            })
        );
        group.add(stem);

        const timeSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 0.92 })
        );
        timeSprite.position.set(0, 0.95, 0);
        group.add(timeSprite);

        const titleSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                transparent: true,
                depthWrite: false,
                opacity: 0,
                visible: false
            })
        );
        titleSprite.position.set(0, 1.95, 0);
        group.add(titleSprite);

        return {
            id: task.id,
            group,
            mesh,
            halo,
            stem,
            timeSprite,
            titleSprite,
            born: performance.now(),
            scale: 0,
            focus: 1,
            placed: false,
            bobPhase: Math.random() * TAU,
            minutes: task.minutes,
            done: !!task.done,
            wasDone: !!task.done,
            priority: task.priority,
            title: clipTitle(task.title),
            timeText: "",
            target: null
        };
    }

    _disposeNode(node) {
        node.group.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats) {
                    if (m.map) m.map.dispose();
                    m.dispose();
                }
            }
        });
    }

    _applyTask(node, task) {
        const base = task.done ? COL.done : COL[task.priority] || COL[3];
        const c = new THREE.Color(base);
        node.mesh.material.color.copy(c);
        node.mesh.material.emissive.copy(c).multiplyScalar(task.done ? 0.2 : 0.6);
        node.halo.material.color.copy(c);
        node.halo.material.opacity = task.done ? 0.18 : 0.62;
        node.stem.material.color.copy(c);
        node.stem.material.opacity = task.done ? 0.12 : 0.32;
        node.timeSprite.material.opacity = task.done ? 0.4 : 0.92;
        node.minutes = task.minutes;
        node.done = !!task.done;
        node.priority = task.priority;

        const text = clipTitle(task.title);
        if (text !== node.title) {
            node.title = text;
            this._refreshTitle(node);
        }
        this._refreshTime(node);
    }

    _refreshTitle(node) {
        const { tex, aspect } = makeTextTexture(node.title, TITLE_STYLE);
        if (node.titleSprite.material.map) node.titleSprite.material.map.dispose();
        node.titleSprite.material.map = tex;
        node.titleSprite.material.needsUpdate = true;
        node.titleSprite.scale.set(0.72 * aspect, 0.72, 1);
    }

    _refreshTime(node) {
        const text = fmtTime(node.minutes);
        if (text === node.timeText) return;
        node.timeText = text;
        const { tex, aspect } = makeTextTexture(text, { size: 46, color: "#d7e2ff", weight: 600 });
        if (node.timeSprite.material.map) node.timeSprite.material.map.dispose();
        node.timeSprite.material.map = tex;
        node.timeSprite.material.needsUpdate = true;
        node.timeSprite.scale.set(0.46 * aspect, 0.46, 1);
    }

    /** Spread nodes that share a slot so nothing overlaps. */
    _layout() {
        const items = [...this.nodes.values()].sort((a, b) => a.minutes - b.minutes);
        const minGap = 10; // minutes

        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < items.length - 1; i++) {
                const a = items[i];
                const b = items[i + 1];
                const gap = mod(b.minutes - a.minutes, 1440);
                if (gap === 0 || gap >= minGap) continue;
                const shift = (minGap - gap) / 2;
                a.minutes = mod(a.minutes - shift, 1440);
                b.minutes = mod(b.minutes + shift, 1440);
            }
            items.sort((x, y) => x.minutes - y.minutes);
        }

        for (const node of items) {
            const lane = LANE[node.priority] || 0;
            const radius = RING_R + lane * (node.done ? 0.8 : 1);
            const angle = angleForMinutes(node.minutes);
            const x = xForAngle(angle, radius);
            const z = zForAngle(angle, radius);

            node.angle = angle;
            node.radius = radius;
            node.target = { x, y: NODE_Y, z };

            // stem reaches back from the node to the main track
            const k = (RING_R - radius) / radius;
            const pos = node.stem.geometry.attributes.position;
            pos.setXYZ(0, 0, 0, 0);
            pos.setXYZ(1, x * k, -NODE_Y, z * k);
            pos.needsUpdate = true;
            node.stem.geometry.computeBoundingSphere();
        }
    }

    setDay({ isToday, elapsed }) {
        this.isToday = isToday;
        this.elapsed = clamp(elapsed, 0, 1);
        this.nowGroup.visible = isToday;
    }

    select(id) {
        this.selectedId = id;
        for (const [nid, node] of this.nodes) {
            const sel = nid === id;
            node.titleSprite.visible = sel && this.showLabels;
            node.titleSprite.material.opacity = sel ? 1 : 0;
        }
    }

    setView(view) {
        const views = {
            iso: { az: 0.35, pol: 1.0, rad: 17 },
            top: { az: 0, pol: 0.22, rad: 15.5 },
            close: { az: 0.9, pol: 1.22, rad: 11.5 },
            wide: { az: 0.6, pol: 0.92, rad: 25 }
        };
        const v = views[view] || views.iso;
        this.target = { az: v.az, pol: v.pol, rad: v.rad };
        this.easing = true;
        this.autoRotate = view === "wide" && !reducedMotion;
        return view;
    }

    /* ---------------------------------------------------------- particles */
    _burst(position, color) {
        const count = reducedMotion ? 8 : 44;
        const pos = new Float32Array(count * 3);
        const vel = [];
        for (let i = 0; i < count; i++) {
            pos[i * 3] = position.x;
            pos[i * 3 + 1] = position.y;
            pos[i * 3 + 2] = position.z;
            const th = Math.random() * TAU;
            const ph = Math.acos(2 * Math.random() - 1);
            const sp = 1.3 + Math.random() * 3.2;
            vel.push(
                new THREE.Vector3(
                    Math.sin(ph) * Math.cos(th) * sp,
                    Math.cos(ph) * sp * 0.7 + 0.9,
                    Math.sin(ph) * Math.sin(th) * sp
                )
            );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.24,
            sizeAttenuation: true,
            color,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        this.bursts.push({ points, vel, age: 0, life: 1.5 });

        while (this.bursts.length > 14) {
            const old = this.bursts.shift();
            this.scene.remove(old.points);
            old.points.geometry.dispose();
            old.points.material.dispose();
        }
    }

    /* -------------------------------------------------------------- input */
    _initInput() {
        const el = this.canvas;
        let dragging = null;
        let camDown = false;
        let moved = 0;
        let lastX = 0;
        let lastY = 0;
        let pinch = 0;

        const setPointer = (e) => {
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const pick = () => {
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const meshes = [];
            for (const n of this.nodes.values()) meshes.push(n.mesh);
            const hits = this.raycaster.intersectObjects(meshes, false);
            return hits.length ? hits[0].object : null;
        };

        el.addEventListener("pointerdown", (e) => {
            setPointer(e);
            moved = 0;
            lastX = e.clientX;
            lastY = e.clientY;
            camDown = true;
            if (!this.interactive) return;
            const mesh = pick();
            if (mesh) {
                dragging = mesh;
                this.autoRotate = false;
                el.style.cursor = "grabbing";
                try { el.setPointerCapture(e.pointerId); } catch (_) {}
            }
        });

        el.addEventListener("pointermove", (e) => {
            setPointer(e);
            if (dragging) {
                moved += 1;
                this._dragNode(dragging);
                return;
            }
            if (camDown) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                this.autoRotate = false;
                this.azV -= dx * 0.0042;
                this.polV -= dy * 0.0035;
                return;
            }
            if (!this.interactive) return;
            const mesh = pick();
            const id = mesh ? this._idOf(mesh) : null;
            el.style.cursor = mesh ? "grab" : "default";
            if (id !== this.hoverId) {
                this.hoverId = id;
                if (this.api && this.api.onHover) this.api.onHover(id);
            }
        });

        const release = (e) => {
            camDown = false;
            if (!dragging) return;
            if (moved < 4) this.onSelect(this._idOf(dragging));
            try { el.releasePointerCapture(e.pointerId); } catch (_) {}
            dragging = null;
            el.style.cursor = "grab";
        };
        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
        window.addEventListener("blur", () => { camDown = false; dragging = null; });

        el.addEventListener(
            "wheel",
            (e) => {
                e.preventDefault();
                const next = clamp(this.rad * (1 + Math.sign(e.deltaY) * 0.09), 8.5, 34);
                this.rad = next;
                this.target.rad = next;
                this.easing = false;
            },
            { passive: false }
        );

        el.addEventListener(
            "touchmove",
            (e) => {
                if (e.touches.length !== 2) return;
                const d = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (pinch) {
                    const next = clamp(this.rad * (1 - (d - pinch) * 0.004), 8.5, 34);
                    this.rad = next;
                    this.target.rad = next;
                    this.easing = false;
                }
                pinch = d;
            },
            { passive: true }
        );
        el.addEventListener("touchend", () => { pinch = 0; });

        if (!this.interactive) return;

        el.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") { this.az -= 0.14; this.easing = false; }
            if (e.key === "ArrowRight") { this.az += 0.14; this.easing = false; }
        });
        el.tabIndex = 0;
        el.setAttribute("role", "application");
        el.setAttribute("aria-label", "Three-dimensional day orbit. Drag a task to move it in time.");
    }

    _idOf(mesh) {
        for (const [id, node] of this.nodes) if (node.mesh === mesh) return id;
        return null;
    }

    _nodeOf(mesh) {
        for (const node of this.nodes.values()) if (node.mesh === mesh) return node;
        return null;
    }

    _dragNode(mesh) {
        const node = this._nodeOf(mesh);
        if (!node) return;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        if (!this.raycaster.ray.intersectPlane(this._dragPlane, this._rayHit)) return;
        const radius = Math.hypot(this._rayHit.x, this._rayHit.z);
        if (radius < 1.2) return;

        let minutes = Math.round(minutesForAngle(Math.atan2(-this._rayHit.z, this._rayHit.x)) / 5) * 5;
        minutes = mod(minutes, 1440);
        if (minutes === node.minutes) return;

        node.minutes = minutes;
        this._layout();
        this._refreshTime(node);
        if (this.api && this.api.onMove) this.api.onMove(node.id, minutes);
    }

    /* ---------------------------------------------------------- animation */
    _loop(now) {
        if (this.disposed || !this._running) return;
        this._raf = requestAnimationFrame(this._loop);

        const dt = Math.min((now - this._last) / 1000, 0.05);
        this._last = now;
        const t = now / 1000;

        this._updateCamera(dt, t);
        this._updateSun(t);
        this._updateRing(dt);
        this._updateNodes(now, t, dt);
        this._updateBursts(dt);

        this.grid.rotation.y += dt * 0.008;
        if (!reducedMotion) {
            for (let i = 0; i < this.hourLabels.length; i++) {
                this.hourLabels[i].material.opacity = 0.6 + Math.sin(t * 1.1 + i * 1.6) * 0.22;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    _updateCamera(dt, t) {
        if (this.autoRotate) this.az += dt * 0.055;

        this.az += this.azV;
        this.pol += this.polV;
        this.azV *= 0.9;
        this.polV *= 0.9;
        if (Math.abs(this.azV) < 1e-5) this.azV = 0;
        if (Math.abs(this.polV) < 1e-5) this.polV = 0;

        if (this.easing) {
            this.az = damp(this.az, this.target.az, 6, dt);
            this.pol = damp(this.pol, this.target.pol, 6, dt);
            this.rad = damp(this.rad, this.target.rad, 7, dt);
            const settled =
                Math.abs(this.az - this.target.az) < 0.004 &&
                Math.abs(this.pol - this.target.pol) < 0.004 &&
                Math.abs(this.rad - this.target.rad) < 0.05;
            if (settled) {
                this.az = this.target.az;
                this.pol = this.target.pol;
                this.rad = this.target.rad;
                this.easing = false;
            }
        }

        this.pol = clamp(this.pol, 0.12, 1.42);
        const drift = reducedMotion ? 0 : Math.sin(t * 0.23) * 0.035;
        const p = clamp(this.pol + drift, 0.1, 1.45);

        // orbit the focal point, which is offset sideways so the ring is not
        // hidden behind the task panel
        const halfH = this.rad * Math.tan((this.camera.fov * Math.PI) / 360);
        const halfW = halfH * this.camera.aspect;
        const kx = this.shiftX * halfW;
        const ky = -this.shiftY * halfH;
        const rx = Math.sin(this.az);
        const rz = -Math.cos(this.az);

        this.camera.position.set(
            Math.cos(p) * Math.cos(this.az) * this.rad + rx * kx,
            Math.sin(p) * this.rad + ky,
            Math.cos(p) * Math.sin(this.az) * this.rad + rz * kx
        );
        this.camera.lookAt(rx * kx, 0.2 + ky, rz * kx);
    }

    _updateSun(t) {
        const d = new Date();
        const hours = d.getHours() + d.getMinutes() / 60;
        const day = clamp((hours - 6) / 12, 0, 1);
        const arc = Math.sin(day * Math.PI);
        const warm = clamp(1 - arc * 1.5, 0, 1);
        const night = clamp(1 - arc * 2.2, 0, 1);

        const c = new THREE.Color(0xfff3d6)
            .lerp(new THREE.Color(0xff8f45), warm)
            .lerp(new THREE.Color(0x5a7bd6), night * 0.8);

        this.sun.material.color.copy(c);
        this.sunLight.color.copy(c);
        this.sunLight.intensity = lerp(60, 280, arc);
        this.corona.material.uniforms.uColor.value.copy(c);
        this.glow.material.color.copy(c);
        this.glow.material.opacity = lerp(0.3, 0.62, arc);

        this.sunGroup.scale.setScalar(1 + (reducedMotion ? 0 : Math.sin(t * 1.25) * 0.03));
    }

    _updateRing(dt) {
        const d = new Date();
        const dayFrac = this.isToday ? (d.getHours() * 60 + d.getMinutes()) / 1440 : this.elapsed;
        this.ringUniforms.uNow.value = damp(this.ringUniforms.uNow.value, dayFrac, 6, dt);
        if (!this.isToday) return;

        const a = angleForMinutes(dayFrac * 1440);
        const x = xForAngle(a, RING_R);
        const z = zForAngle(a, RING_R);
        this.nowDot.position.set(x, 0.2, z);
        this.nowHalo.position.set(x, 0.2, z);

        const pos = this.nowBeam.geometry.attributes.position;
        pos.setXYZ(1, xForAngle(a, RING_R - 1.3), 0.08, zForAngle(a, RING_R - 1.3));
        pos.needsUpdate = true;
        this.nowBeam.geometry.computeBoundingSphere();
    }

    _updateNodes(now, t, dt) {
        for (const node of this.nodes.values()) {
            if (!node.target) continue;

            // growth is absolute (time-driven), so a slow device still lands on time
            const grow = clamp((now - node.born) / 620, 0, 1);
            const focus = this.selectedId === node.id ? 1.45 : this.hoverId === node.id ? 1.22 : 1;
            node.focus = grow > 0.99 ? damp(node.focus, focus, 9, dt) : focus;
            node.scale = (1 - Math.pow(1 - grow, 3)) * node.focus;
            node.group.scale.setScalar(node.scale);

            const bob = reducedMotion ? 0 : Math.sin(t * 1.1 + node.bobPhase) * 0.07;
            this._tmp.set(node.target.x, node.target.y + bob, node.target.z);
            if (!node.placed) {
                node.group.position.copy(this._tmp);
                node.placed = true;
            } else {
                node.group.position.lerp(this._tmp, 1 - Math.exp(-9 * dt));
            }

            node.mesh.rotation.y = t * 0.5 + node.bobPhase;
            node.mesh.rotation.x = t * 0.22;
        }
    }

    _updateBursts(dt) {
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const b = this.bursts[i];
            b.age += dt;
            const k = b.age / b.life;
            const arr = b.points.geometry.attributes.position;
            for (let j = 0; j < b.vel.length; j++) {
                const v = b.vel[j];
                v.y -= dt * 1.6;
                arr.setXYZ(j, arr.getX(j) + v.x * dt, arr.getY(j) + v.y * dt, arr.getZ(j) + v.z * dt);
            }
            arr.needsUpdate = true;
            b.points.material.opacity = clamp(1 - k, 0, 1);
            b.points.material.size = 0.24 * (1 - k * 0.5);
            if (b.age >= b.life) {
                this.scene.remove(b.points);
                b.points.geometry.dispose();
                b.points.material.dispose();
                this.bursts.splice(i, 1);
            }
        }
    }

    /* ------------------------------------------------------------- resize */
    resize() {
        const w = this.mount.clientWidth || window.innerWidth;
        const h = this.mount.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.shiftX = 0;
        this.shiftY = 0;
        if (this.interactive) {
            const panel = document.querySelector(".panel");
            if (panel) {
                const fixed = getComputedStyle(panel).position === "fixed";
                if (fixed) {
                    // bottom sheet: the closed sliver is 148px tall (see styles.css)
                    this.shiftY = Math.min(148, h * 0.22) / h;
                } else {
                    this.shiftX = Math.min(panel.offsetWidth / w, 0.45);
                }
            }
        }
    }

    destroy() {
        this.disposed = true;
        this._running = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        this.scene.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats) {
                    if (m.map) m.map.dispose();
                    m.dispose();
                }
            }
        });
        this.renderer.dispose();
    }
}

/* ===================================================================== boot */
function boot() {
    const mount = document.getElementById("sky");
    if (!mount) return;

    let cfg = {};
    const cfgEl = document.getElementById("orbit-config");
    if (cfgEl) {
        try { cfg = JSON.parse(cfgEl.textContent); } catch (_) { cfg = {}; }
    }

    const api = window.TodoApp || null;
    let orbit;
    try {
        orbit = new DayOrbit({
            mount,
            mode: cfg.mode,
            showLabels: cfg.showLabels,
            api,
            onSelect: (id) => { if (api && api.onSelect) api.onSelect(id); }
        });
    } catch (err) {
        document.documentElement.classList.add("no-webgl");
        return;
    }

    window.DayOrbit = orbit;
    orbit.resize();
    if (api && api.getTasks) orbit.setTasks(api.getTasks());

    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => orbit.resize(), 90);
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            orbit._running = false;
        } else if (!orbit.disposed) {
            orbit._running = true;
            orbit._last = performance.now();
            orbit._raf = requestAnimationFrame(orbit._loop);
        }
    });

    // redraw text labels once webfonts land so type is crisp
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            for (const node of orbit.nodes.values()) {
                node.timeText = "";
                orbit._refreshTime(node);
                orbit._refreshTitle(node);
            }
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
