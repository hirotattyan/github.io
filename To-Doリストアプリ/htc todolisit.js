document.addEventListener('DOMContentLoaded',loadTasks);
const taskinput = document.getElementById('task-input');
const addTaskButton = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');

//タスクを追加する
addTaskButton.addEventListener('click',()=>{
    const task = taskinput.value.trim();
    if (task) {
        addTask(task);
        saveTaskToLocalStorage(task);
        taskinput.value = '';//入力フィールドをクリア
    }
});

//タスクをリストに表示する関数
function addTask(task,color){
    const listItem = document.createElement('li');
    listItem.textContent = task;
    listItem.style.backgroundcolor = color;
    const deleteButton = document.createElement('button');
    deleteButton.textContent='削除';
    deleteButton.classList.add('delete-btn');
    deleteButton.addEventListener('click',()=>{
        taskList.removeChild(listItem);
        removeTaskFromLocakStorage(task);
    });
    listItem.appendChild(deleteButton);
    taskList.appendChild(listItem);
}

//ローカルストレージにタスクを保存
function saveTaskToLocalStorage(taskobj){
    let tasks = JSON.parse(localStorage.getItem('tasks'))||[];
    tasks.push(taskobj);
    localStorage.setItem('tasks',JSON.stringify(tasks));
}

//ローカルストレージからタスクを削除
function removeTaskFromLocakStorage(task){
    let tasks = JSON.parse(localStorage.getItem('tasks'))||[];
    tasks = tasks.filter(t=> t !== task);
    localStorage.setItem('tasks',JSON.stringify(tasks));
}

//ローカルストレージからタスクを読みこみ
function loadTasks(){
    let tasks = JSON.parse(localStorage.getItem('tasks'))||[];
    tasks.forEach(task=>addTask(task));
}