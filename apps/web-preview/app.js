const frames = [...document.querySelectorAll(".frame")];
const tabs = [...document.querySelectorAll(".screen-nav button")];
const finishCards = [...document.querySelectorAll("[data-finish]")];
const comparison = document.querySelector("#comparison");
const reveal = document.querySelector("#reveal");
const afterImage = document.querySelector("#after-image");
const selectedFinish = document.querySelector("#selected-finish");
const selectedMaterials = document.querySelector("#selected-materials");
const saveStatus = document.querySelector("#save-status");
const scene = document.querySelector("#camera-scene");
const cameraNext = document.querySelector("#camera-next");
const imageClasses = ["room-before", "room-warm", "room-light"];
const finishes = {
  warm: { name: "Warm Oak", materials: "Warm beige plaster · Walnut parquet" },
  light: { name: "Soft Light", materials: "Soft white paint · Light oak plank" },
};
const cameraSteps = [
  ["STEP 1 OF 2", "Find a floor corner.", "Point at the corner where two walls meet the floor.", "Mark corner"],
  ["STEP 2 OF 2", "Choose the direction.", "Mark a second point along the wall to orient the room.", "Place finish"],
  ["SIMULATION COMPLETE", "Preview in place.", "Walk around the room while the finish stays anchored in the real app.", "Start setup again"],
];

let activeFinish = "warm";
let cameraStep = 0;

function navigate(stage, focus = true) {
  const activeFrame = document.getElementById(stage);
  if (!activeFrame?.classList.contains("frame")) return;
  frames.forEach((frame) => frame.classList.toggle("is-active", frame === activeFrame));
  tabs.forEach((tab) => {
    if (tab.dataset.go === stage) tab.setAttribute("aria-current", "step");
    else tab.removeAttribute("aria-current");
  });
  if (focus) {
    activeFrame.scrollIntoView({ block: "nearest" });
    activeFrame.querySelector(".app-bar button")?.focus({ preventScroll: true });
  }
}

function setRoomImage(element, finish) {
  element.classList.remove(...imageClasses);
  element.classList.add("room-" + finish);
}

function updateCamera() {
  const [step, heading, instruction, action] = cameraSteps[cameraStep];
  scene.dataset.step = String(cameraStep);
  setRoomImage(scene, cameraStep === 2 ? activeFinish : "before");
  document.querySelector("#camera-step").textContent = step;
  document.querySelector("#camera-heading").textContent = heading;
  document.querySelector("#camera-instruction").textContent = instruction;
  cameraNext.firstChild.textContent = action + " ";
}

function selectFinish(slug) {
  if (!Object.hasOwn(finishes, slug)) return;
  activeFinish = slug;
  const finish = finishes[slug];
  selectedFinish.textContent = finish.name;
  selectedMaterials.textContent = finish.materials;
  setRoomImage(afterImage, slug);
  finishCards.forEach((card) => card.setAttribute("aria-pressed", String(card.dataset.finish === slug)));
  saveStatus.textContent = "";
  updateCamera();
}

function updateReveal() {
  comparison.style.setProperty("--reveal", reveal.value + "%");
  reveal.setAttribute("aria-valuetext", reveal.value + "% before, " + (100 - Number(reveal.value)) + "% after");
}

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.go, !button.closest(".screen-nav")));
});
finishCards.forEach((card) => {
  card.addEventListener("click", () => selectFinish(card.dataset.finish));
});
reveal.addEventListener("input", updateReveal);
cameraNext.addEventListener("click", () => {
  cameraStep = (cameraStep + 1) % cameraSteps.length;
  updateCamera();
});

document.querySelector("#save-finish").addEventListener("click", () => {
  try {
    localStorage.setItem("aftro.demo.finish", activeFinish);
    saveStatus.textContent = finishes[activeFinish].name + " saved on this device.";
  } catch {
    saveStatus.textContent = "This browser blocked local storage.";
  }
});

try {
  const saved = localStorage.getItem("aftro.demo.finish");
  if (saved) selectFinish(saved);
} catch {
  // The preview can still be used when storage is unavailable.
}

async function loadCatalog() {
  if (!["http:", "https:"].includes(location.protocol)) return;

  try {
    const response = await fetch("/api/v1/apartments/demo-apartment", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const apartment = await response.json();
    if (!Number.isFinite(apartment.width_m) || !Number.isFinite(apartment.length_m)) return;
    document.querySelector("[data-area]").textContent =
      (apartment.width_m * apartment.length_m).toFixed(1) + " m²";
    document.querySelector("[data-dimensions]").textContent =
      apartment.width_m + " × " + apartment.length_m + " m";
    for (const item of apartment.finishes) {
      if (!Object.hasOwn(finishes, item.slug)) continue;
      finishes[item.slug].materials = item.wall_finish + " · " + item.floor_finish;
      const card = finishCards.find((option) => option.dataset.finish === item.slug);
      card.querySelector("small").textContent = finishes[item.slug].materials;
    }
    selectedMaterials.textContent = finishes[activeFinish].materials;
    document.querySelector("#catalog-status").textContent = "Live apartment catalog";
  } catch {
    // The design review remains available with the bundled sample.
  }
}

updateReveal();
updateCamera();
loadCatalog();
