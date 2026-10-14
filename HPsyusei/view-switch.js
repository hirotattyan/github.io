const comparison = document.querySelector("#works");
const viewButtons = document.querySelectorAll(".view-switch");

function setPreviewMode(mode) {
  comparison.classList.toggle("is-pc", mode === "pc");
  comparison.classList.toggle("is-mobile", mode === "mobile");

  viewButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive);
  });
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPreviewMode(button.dataset.mode);
  });
});

const initialMode = window.matchMedia("(max-width: 700px)").matches
  ? "mobile"
  : "pc";

setPreviewMode(initialMode);