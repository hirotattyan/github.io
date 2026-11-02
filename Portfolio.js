    document.addEventListener("DOMContentLoaded",function() {
    const otherToggle = document.getElementById("other-toggle");
    const otherContent = document.getElementById("other-content");

    if (!otherToggle || !otherContent) {
        return;
    }
    
    otherToggle.addEventListener("click", function() {
        const isOpen = otherContent.classList.toggle("open");
    

        otherToggle.classList.toggle("open", isOpen);
        otherToggle.setAttribute("aria-expanded",String(isOpen));
    });
});
