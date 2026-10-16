document.addEventListener("DOMContentLoaded", function () {
    const fadeElements = document.querySelectorAll(".fade-in");

    const onScroll=()=>{
        fadeElements.forEach(el =>{
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if(rect.top<windowHeight-100){
                el.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll",onScroll);
    onScroll();

    // その他セクションのアコーディオン
    const otherToggle = document.getElementById("other-toggle");
    const otherContent = document.getElementById("other-content");
    otherToggle.addEventListener("click", function() {
        otherToggle.classList.toggle("open");
        otherContent.classList.toggle("open");
    });
});

