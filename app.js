// Registrar o service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(reg => console.log('Service Worker registrado', reg))
  .catch(err => console.warn('Erro ao registrar o Service Worker', err));
}

// IndexedDB setup
let db;
const request = indexedDB.open('taskDatabase', 1);

request.onerror = (event) => {
  console.error('Erro no banco de dados:', event.target.errorCode);
};

request.onsuccess = (event) => {
  db = event.target.result;
  loadTasks();
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('task', 'task', { unique: false });
};

// Adicionar tarefa
document.getElementById('task-form').onsubmit = (event) => {
  event.preventDefault();
  const taskInput = document.getElementById('task-input').value;
  const transaction = db.transaction(['tasks'], 'readwrite');
  const objectStore = transaction.objectStore('tasks');
  const request = objectStore.add({ task: taskInput });

  request.onsuccess = () => {
      document.getElementById('task-input').value = '';
      loadTasks();
  };

  request.onerror = (event) => {
      console.error('Erro ao adicionar tarefa:', event.target.errorCode);
  };
};

// Carregar tarefas
function loadTasks() {
  const transaction = db.transaction(['tasks'], 'readonly');
  const objectStore = transaction.objectStore('tasks');
  const request = objectStore.getAll();

  request.onsuccess = (event) => {
      const taskList = document.getElementById('task-list');
      taskList.innerHTML = '';
      event.target.result.forEach(item => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.textContent = item.task;

          const buttonGroup = document.createElement('div');
          
          const editButton = document.createElement('button');
          editButton.textContent = 'Editar';
          editButton.className = 'btn btn-warning btn-sm mr-2';
          editButton.onclick = () => editTask(item.id);
          
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Deletar';
          deleteButton.className = 'btn btn-danger btn-sm';
          deleteButton.onclick = () => deleteTask(item.id);
          
          buttonGroup.appendChild(editButton);
          buttonGroup.appendChild(deleteButton);
          li.appendChild(buttonGroup);
          taskList.appendChild(li);
      });
  };

  request.onerror = (event) => {
      console.error('Erro ao carregar tarefas:', event.target.errorCode);
  };
}

// Deletar tarefa
function deleteTask(id) {
  const transaction = db.transaction(['tasks'], 'readwrite');
  const objectStore = transaction.objectStore('tasks');
  const request = objectStore.delete(id);

  request.onsuccess = () => {
      loadTasks();
  };

  request.onerror = (event) => {
      console.error('Erro ao deletar tarefa:', event.target.errorCode);
  };
}

// Editar tarefa
function editTask(id) {
  const transaction = db.transaction(['tasks'], 'readwrite');
  const objectStore = transaction.objectStore('tasks');
  const request = objectStore.get(id);

  request.onsuccess = (event) => {
      const task = event.target.result.task;
      const newTask = prompt('Editar tarefa:', task);
      if (newTask !== null) {
          const updateRequest = objectStore.put({ id, task: newTask });
          updateRequest.onsuccess = () => {
              loadTasks();
          };
          updateRequest.onerror = (event) => {
              console.error('Erro ao editar tarefa:', event.target.errorCode);
          };
      }
  };
}
