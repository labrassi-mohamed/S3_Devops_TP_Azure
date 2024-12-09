const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const prioritySelector = document.getElementById('priority');
const addTaskBtn = document.getElementById('add-task-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

addTaskBtn.addEventListener('click', addTask);

function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelector.value;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const taskItem = document.createElement('li');
    taskItem.classList.add('task-item', priority);

    const taskContent = document.createElement('span');
    taskContent.textContent = taskText;

    const completeBtn = document.createElement('button');
    completeBtn.innerHTML = '✔️';
    completeBtn.addEventListener('click', () => {
        taskItem.classList.toggle('completed');
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '❌';
    deleteBtn.addEventListener('click', () => {
        taskItem.remove();
    });

    taskItem.append(taskContent, completeBtn, deleteBtn);
    taskList.appendChild(taskItem);

    taskInput.value = '';
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        const tasks = document.querySelectorAll('.task-item');

        tasks.forEach(task => {
            switch (filter) {
                case 'all':
                    task.style.display = 'flex';
                    break;
                case 'completed':
                    task.style.display = task.classList.contains('completed') ? 'flex' : 'none';
                    break;
                case 'active':
                    task.style.display = task.classList.contains('completed') ? 'none' : 'flex';
                    break;
            }
        });
    });
});
