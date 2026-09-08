// ========== Contact Button Animation ==========
document.querySelector('.contact-btn').addEventListener('click',function(){
    this.style.transform="scale(0.95)";
    setTimeout(()=>{
        this.style.transform = "scale(1)";
    },150);
});

// ========== Desktop Menu Hover ==========
const menuItems = document.querySelectorAll(".menu-item");
const header = document.querySelector(".header");

menuItems.forEach(item => {
  item.addEventListener("mouseenter", function () {
    // Close all menus
    menuItems.forEach(i => i.classList.remove("open"));
    // Open current menu
    this.classList.add("open");
  });

  header.addEventListener("mouseleave", function () {
    menuItems.forEach(i => i.classList.remove("open"));
  });
});

// ========== Mobile Menu Toggle ==========
const menuToggle = document.getElementById("menuToggle");
const headerRight = document.getElementById("headerRight");

menuToggle.addEventListener("click", function() {
    this.classList.toggle("active");
    headerRight.classList.toggle("active");
});

// Close menu when clicking on a link
const navLinks = document.querySelectorAll(".nav a, .contact-btn");
navLinks.forEach(link => {
    link.addEventListener("click", function() {
        menuToggle.classList.remove("active");
        headerRight.classList.remove("active");
    });
});

// Close menu when clicking submenu items
const subMenus = document.querySelectorAll(".submenu a");
subMenus.forEach(submenu => {
    submenu.addEventListener("click", function() {
        menuToggle.classList.remove("active");
        headerRight.classList.remove("active");
    });
});

const flowItems = document.querySelectorAll(
  ".flow.inheritance, .flow.permission"
);

flowItems.forEach((item, index) => {
  if (index % 2 === 0) {
    item.classList.add("slide-left");
  } else {
    item.classList.add("slide-right");
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, {
  threshold: 0.2
});

flowItems.forEach((item) => {
  observer.observe(item);
});