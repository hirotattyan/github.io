const pauseButton = document.querySelector(".hero-pause");
const slides = document.querySelectorAll(".hero-slide");
const pauseIcon = pauseButton.querySelector("span");

pauseButton.addEventListener("click", () => {
    const isPaused = pauseButton.getAttribute("aria-pressed") === "true";

    slides.forEach((slide) => {
        slide.style.animationPlayState = isPaused ? "running" : "paused"
    });
    pauseButton.setAttribute("aria-pressed", String(!isPaused));
    pauseButton.setAttribute(
        "aria-label",
        isPaused ? "背景の切り替えを一時停止" : "背景の切り替えを再開"
    );
    pauseIcon.textContent = isPaused ? "Ⅱ" : "▶";
});