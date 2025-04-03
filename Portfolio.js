document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", function (event) {
        let isValid = true;
        let errorMessage = "";

        // 名前の入力チェック
        const nameInput = document.getElementById("name");
        if (nameInput.value.trim() === "") {
            errorMessage += "お名前を入力してください。\n";
            isValid = false;
        }

        // メールの入力チェック
        const emailInput = document.getElementById("email");
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailInput.value.trim() === "") {
            errorMessage += "メールアドレスを入力してください。\n";
            isValid = false;
        } else if (!emailPattern.test(emailInput.value.trim())) {
            errorMessage += "正しいメールアドレスを入力してください。\n";
            isValid = false;
        }

        // お問い合わせ内容のチェック
        const messageInput = document.getElementById("message");
        if (messageInput.value.trim() === "") {
            errorMessage += "お問い合わせ内容を入力してください。\n";
            isValid = false;
        }

        // エラーメッセージがある場合は送信を止める
        if (!isValid) {
            alert(errorMessage);
            event.preventDefault();
        }
    });

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
});

