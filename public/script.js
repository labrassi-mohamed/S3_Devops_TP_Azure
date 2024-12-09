document.getElementById('add-task').addEventListener('click', function () {
    const taskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');

    if (taskInput.value.trim() === '') {
        alert('Task cannot be empty');
        return;
    }

    // Create task item
    const taskItem = document.createElement('li');
    taskItem.classList.add('task-item');

    // Create checkbox
    const taskCheckbox = document.createElement('input');
    taskCheckbox.type = 'checkbox';
    taskCheckbox.classList.add('task-checkbox');
    taskCheckbox.addEventListener('change', function () {
        if (this.checked) {
            taskItem.classList.add('completed');
        } else {
            taskItem.classList.remove('completed');
        }
    });

    // Create task text
    const taskText = document.createElement('span');
    taskText.textContent = taskInput.value;

    // Create delete button with X icon
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-times"></i>';
    deleteButton.classList.add('delete-btn');
    deleteButton.addEventListener('click', function () {
        taskList.removeChild(taskItem);
    });

    // Assemble task item
    taskItem.appendChild(taskCheckbox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteButton);
    taskList.appendChild(taskItem);

    // Clear input
    taskInput.value = '';
});