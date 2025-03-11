// 単語リスト
const words = ["apple", "banana", "cherry", "dog", "elephant", 
    "flower", "guitar", "happy", "ice", "jungle",
    "keyboard", "monitor", "notebook", "ocean", "penguin",
    "quartz", "rainbow", "sunshine", "tiger", "umbrella"];

let currentWord = ""; // 現在の単語
let score = 0; // スコア
let timeLeft = 30;//制限時間
let timer;//タイマー用の変数

const wordDisplay = document.getElementById("word-display");
const wordInput = document.getElementById("word-input");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");//タイマー表示用
document.body.insertBefore(timerDisplay,wordInput);
const restartButton = document.getElementById("restart-button");
const BONUS_TIME = 3;//正解時に増やす秒数

// ランダムな単語を選んで表示する関数
function setNewWord() {
    currentWord = words[Math.floor(Math.random() * words.length)];
    wordDisplay.textContent = currentWord;
    wordInput.value = ""; // 入力欄をクリア
}

function startTimer(){
        timer = setInterval(() =>{
             timeLeft--;
             timerDisplay.textContent=`残り時間：${timeLeft}秒`;

            if(timeLeft <=0){
                clearInterval(timer);
                endGame();

            }

        },1000);
}

function endGame(){
    wordDisplay.textContent="GAME OVER";
    wordInput.disabled = true;//入力を無効化
    alert(`GAMEOVER スコア:${score}`);
}

// ユーザーの入力をチェックするイベントリスナー
wordInput.addEventListener("input", () => {
    if (wordInput.value === currentWord) {
        score++; // スコアを増やす
        scoreDisplay.textContent = score;
        timeLeft += BONUS_TIME;
        setNewWord(); // 次の単語に変更
    }
});

function startGame(){
    score = 0;
    timeLeft = 30;
    wordInput.disabled = false;//入力を有効化
    scoreDisplay.textContent = score;
    setNewWord();
    startTimer();
}

restartButton.addEventListener("click",()=>{
    clearInterval(timer);
    startGame();
},false);


// ゲームの初期化
startGame()

