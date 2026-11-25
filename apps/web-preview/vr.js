const vrCopy = {
  "en": {
    "title": "Virtual walkthrough",
    "back": "Mobile AR",
    "language": "Interface language",
    "location": "ASTANA · DEMO APARTMENT",
    "subtitle": "Explore the same room at full scale and switch the renovation finish.",
    "canvas": "Interactive 3D view of the living room",
    "finishes": "Renovation finish",
    "before": "Unfinished",
    "warm": "Warm Oak",
    "light": "Soft Light",
    "beforeDetail": "Concrete walls and floor",
    "warmDetail": "Beige plaster · dark parquet",
    "lightDetail": "White paint · light oak",
    "entry": "Entrance",
    "window": "Window",
    "viewpoints": "Viewpoints",
    "reset": "Reset view",
    "headset": "Enter VR",
    "exit": "Exit VR",
    "desktopHelp": "Drag to look around. Use WASD or the arrow keys to walk.",
    "touchHelp": "Drag to look around. Tap a viewpoint to move.",
    "vrHelp": "Left stick: walk · Trigger: change finish",
    "startFailed": "Couldn't start VR. Check the headset and browser, then try again.",
    "unsupported": "A compatible headset browser is needed for immersive VR. You can still explore the room in 3D.",
    "loading": "Checking VR availability…",
    "no3D": "3D rendering is unavailable in this browser. The finish image is shown instead.",
    "ready": "Headset detected. Enter VR to start."
  },
  "kk": {
    "title": "Виртуалды тур",
    "back": "Телефондағы AR",
    "language": "Интерфейс тілі",
    "location": "АСТАНА · ДЕМО ПӘТЕР",
    "subtitle": "Бір бөлмені нақты өлшемде аралап, жөндеу нұсқасын ауыстыр.",
    "canvas": "Қонақ бөлменің интерактивті 3D көрінісі",
    "finishes": "Жөндеу нұсқасы",
    "before": "Черновой",
    "warm": "Жылы реңк",
    "light": "Ашық реңк",
    "beforeDetail": "Бетон қабырға мен еден",
    "warmDetail": "Сарғыш сылақ · қоңыр паркет",
    "lightDetail": "Ақ бояу · ашық емен",
    "entry": "Кіреберіс",
    "window": "Терезе",
    "viewpoints": "Қарау нүктелері",
    "reset": "Көріністі қалпына келтіру",
    "headset": "VR-ға кіру",
    "exit": "VR-дан шығу",
    "desktopHelp": "Қарау үшін сүйре. Жүру үшін WASD не көрсеткі пернелерін бас.",
    "touchHelp": "Қарау үшін сүйре. Орын ауыстыру үшін қарау нүктесін бас.",
    "vrHelp": "Сол жақ таяқша: жүру · Триггер: нұсқаны ауыстыру",
    "startFailed": "VR ашылмады. Көзілдірік пен браузерді тексеріп, қайта көр.",
    "unsupported": "VR көзілдірігінде үйлесімді браузер керек. Бөлмені 3D режимінде аралай аласың.",
    "loading": "VR қолжетімділігі тексерілуде…",
    "no3D": "Бұл браузерде 3D ашылмады. Жөндеу суреті көрсетіледі.",
    "ready": "VR көзілдірігі анықталды. Бастау үшін VR-ға кір."
  },
  "ru": {
    "title": "Виртуальный тур",
    "back": "AR на телефоне",
    "language": "Язык интерфейса",
    "location": "АСТАНА · ДЕМО-КВАРТИРА",
    "subtitle": "Пройдись по одной комнате в натуральном масштабе и смени отделку.",
    "canvas": "Интерактивная 3D-модель гостиной",
    "finishes": "Вариант отделки",
    "before": "Черновая",
    "warm": "Тёплый тон",
    "light": "Светлый тон",
    "beforeDetail": "Бетонные стены и пол",
    "warmDetail": "Бежевая штукатурка · тёмный паркет",
    "lightDetail": "Белая краска · светлый дуб",
    "entry": "У входа",
    "window": "У окна",
    "viewpoints": "Точки обзора",
    "reset": "Сбросить вид",
    "headset": "Войти в VR",
    "exit": "Выйти из VR",
    "desktopHelp": "Перетаскивай, чтобы осмотреться. Движение — WASD или стрелки.",
    "touchHelp": "Перетаскивай, чтобы осмотреться. Для перехода нажми на точку обзора.",
    "vrHelp": "Левый стик: ходить · Триггер: сменить отделку",
    "startFailed": "Не удалось запустить VR. Проверь гарнитуру и браузер и попробуй снова.",
    "unsupported": "Для VR нужен совместимый браузер гарнитуры. Комната доступна в обычном 3D-режиме.",
    "loading": "Проверяем доступность VR…",
    "no3D": "В этом браузере 3D недоступно. Показано изображение отделки.",
    "ready": "Гарнитура обнаружена. Войди в VR, чтобы начать."
  }
};
const canvas = document.querySelector("#room");
const view = document.querySelector("#view");
const headset = document.querySelector("#headset");
const languageSelect = document.querySelector("#language");
const options = [...document.querySelectorAll("[data-style]")];
const coarsePointer = matchMedia("(pointer: coarse)");
const viewpoints = {
  entry: { x: -1.02, z: 1.48, yaw: 0.26, pitch: -0.12 },
  window: { x: 1.73, z: 0.83, yaw: -1.30, pitch: -0.05 },
};
const position = { y: 1.60, ...viewpoints.entry };
const languageKey = "aftro.language";
const finishKey = "aftro.vr.finish";
const keysDown = new Set();
let language = preference(languageKey) || navigator.languages.map((tag) => tag.split("-")[0].toLowerCase()).find((code) => Object.hasOwn(vrCopy, code)) || "en";
if (!Object.hasOwn(vrCopy, language)) language = "en";
let finish = preference(finishKey) || "warm";
if (!Object.hasOwn(aftroPresets, finish)) finish = "warm";
let status = "loading";
let activeXR = null;
let requesting = false;
let dragging = null;
let lastFrame = null;
let renderer;
try {
  renderer = createAftroScene(canvas);
} catch (error) {
  console.warn("Aftro could not initialize 3D rendering", error);
}

function preference(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // Selections still work for the current session if storage is blocked.
  }
}

function renderUI() {
  const copy = vrCopy[language];
  document.documentElement.lang = language;
  document.title = "Aftro — " + copy.title;
  languageSelect.value = language;
  languageSelect.setAttribute("aria-label", copy.language);
  for (const node of document.querySelectorAll("[data-copy]")) node.textContent = copy[node.dataset.copy];
  document.querySelector("#finishes").setAttribute("aria-label", copy.finishes);
  document.querySelector(".viewpoints").setAttribute("aria-label", copy.viewpoints);
  document.querySelector(".stage").setAttribute("aria-label", copy.canvas);
  document.querySelector("#current-finish").textContent = copy[finish];
  document.querySelector("#guide").textContent = renderer ? copy[coarsePointer.matches ? "touchHelp" : "desktopHelp"] : "";
  document.querySelector("#status").textContent = copy[status];
  canvas.setAttribute("aria-label", copy.canvas);
  headset.textContent = copy[activeXR ? "exit" : "headset"];
  headset.disabled = !renderer || requesting || (!activeXR && status !== "ready" && status !== "startFailed");
  options.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.style === finish)));
  view.dataset.finish = finish;
  renderer?.setPanel(copy[finish], copy.vrHelp);
}

function setFinish(next) {
  finish = next;
  preference(finishKey, finish);
  renderer?.setFinish(finish);
  renderUI();
}

function move(point, dx, dz) {
  point.x = Math.min(2.00, Math.max(-2.00, point.x + dx));
  point.z = Math.min(1.55, Math.max(-1.55, point.z + dz));
}

function reset(key = "entry") {
  Object.assign(position, viewpoints[key]);
}

function animationFrame(time) {
  requestAnimationFrame(animationFrame);
  const seconds = lastFrame === null ? 0 : Math.min(0.06, (time - lastFrame) / 1000);
  lastFrame = time;
  if (activeXR || !renderer) return;

  const forward = (keysDown.has("w") || keysDown.has("arrowup") ? 1 : 0) -
    (keysDown.has("s") || keysDown.has("arrowdown") ? 1 : 0);
  const side = (keysDown.has("d") || keysDown.has("arrowright") ? 1 : 0) -
    (keysDown.has("a") || keysDown.has("arrowleft") ? 1 : 0);
  if (forward || side) {
    const distance = 1.35 * seconds / Math.hypot(forward, side);
    const sin = Math.sin(position.yaw), cos = Math.cos(position.yaw);
    move(position, distance * (forward*sin + side*cos), distance * (-forward*cos + side*sin));
  }
  const gl = renderer.gl;
  const scale = Math.min(devicePixelRatio || 1, 1.65);
  const width = Math.max(1, Math.round(canvas.clientWidth * scale));
  const height = Math.max(1, Math.round(canvas.clientHeight * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  renderer.clear();
  renderer.draw(aftroProjection(width / height), aftroView(position));
}

canvas.addEventListener("pointerdown", (event) => {
  if (!renderer) return;
  dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== dragging?.id) return;
  position.yaw -= (event.clientX - dragging.x) * 0.006;
  position.pitch = Math.min(1.35, Math.max(-1.35, position.pitch + (event.clientY - dragging.y) * 0.006));
  dragging.x = event.clientX;
  dragging.y = event.clientY;
});
canvas.addEventListener("lostpointercapture", () => { dragging = null; });
canvas.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    keysDown.add(key);
    event.preventDefault();
  }
});
canvas.addEventListener("keyup", (event) => keysDown.delete(event.key.toLowerCase()));
canvas.addEventListener("blur", () => keysDown.clear());
window.addEventListener("blur", () => keysDown.clear());
coarsePointer.addEventListener("change", renderUI);

async function checkVR() {
  if (!renderer) status = "no3D";
  else {
    try {
      const available = await navigator.xr?.isSessionSupported("immersive-vr");
      status = available ? "ready" : "unsupported";
    } catch {
      status = "unsupported";
    }
  }
  renderUI();
}

function startXRFrameLoop(session, base, layer) {
  const gl = renderer.gl;
  const player = { x: viewpoints.entry.x, z: viewpoints.entry.z };
  let previousTime;
  function frame(time, xrFrame) {
    session.requestAnimationFrame(frame);
    const elapsed = previousTime === undefined ? 0 : Math.min(0.06, (time - previousTime) / 1000);
    previousTime = time;
    const poseInRoom = xrFrame.getViewerPose(base);
    if (!poseInRoom) return;

    const inputs = [...session.inputSources];
    const input = inputs.find((source) => source.handedness === "left" && source.gamepad) ??
      inputs.find((source) => source.gamepad);
    const axes = input?.gamepad.axes;
    if (axes?.length >= 2) {
      const side = axes[axes.length - 2], fore = axes[axes.length - 1];
      const q = poseInRoom.transform.orientation;
      const fx = -2 * (q.x*q.z + q.w*q.y), fz = -(1 - 2*(q.x*q.x + q.y*q.y));
      const length = Math.hypot(fx, fz);
      if (length > 0.01 && Math.hypot(side, fore) > 0.18) {
        const speed = elapsed * 1.1 / length;
        move(player, (-fore * fx - side * fz) * speed, (-fore * fz + side * fx) * speed);
      }
    }

    const walkingSpace = base.getOffsetReferenceSpace(new XRRigidTransform({ x: -player.x, z: -player.z }));
    const pose = xrFrame.getViewerPose(walkingSpace);
    if (!pose) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
    renderer.clear();
    for (const eye of pose.views) {
      const rect = layer.getViewport(eye);
      gl.viewport(rect.x, rect.y, rect.width, rect.height);
      renderer.draw(eye.projectionMatrix, eye.transform.inverse.matrix, true);
    }
  }
  session.requestAnimationFrame(frame);
}

async function toggleVR() {
  if (activeXR) {
    await activeXR.end();
    return;
  }
  let session;
  requesting = true;
  renderUI();
  try {
    session = await navigator.xr.requestSession("immersive-vr", { requiredFeatures: ["local-floor"] });
    await renderer.gl.makeXRCompatible();
    const layer = new XRWebGLLayer(session, renderer.gl);
    session.updateRenderState({ baseLayer: layer });
    const base = await session.requestReferenceSpace("local-floor");
    session.addEventListener("select", () => {
      const order = Object.keys(aftroPresets);
      setFinish(order[(order.indexOf(finish) + 1) % order.length]);
    });
    session.addEventListener("end", () => {
      renderer.gl.bindFramebuffer(renderer.gl.FRAMEBUFFER, null);
      activeXR = null;
      lastFrame = null;
      checkVR();
    }, { once: true });
    activeXR = session;
    startXRFrameLoop(session, base, layer);
  } catch (error) {
    if (session) await session.end().catch(() => {});
    console.warn("Aftro could not start the immersive session", error);
    status = "startFailed";
  } finally {
    requesting = false;
    renderUI();
  }
}

for (const button of options) button.addEventListener("click", () => setFinish(button.dataset.style));
for (const button of document.querySelectorAll("[data-position]")) {
  button.addEventListener("click", () => { reset(button.dataset.position); canvas.focus({ preventScroll: true }); });
}
document.querySelector("#reset").addEventListener("click", () => reset());
languageSelect.addEventListener("change", () => {
  language = languageSelect.value;
  preference(languageKey, language);
  renderUI();
});
headset.addEventListener("click", toggleVR);
setFinish(finish);
checkVR();
if (renderer) requestAnimationFrame(animationFrame);
