// validate the input and post to the api endpoints
const baseUrl = "http://localhost:3000/api";
const accessToken = localStorage.getItem("accessToken");

if (!accessToken) {
  // alert("Please login to access the tasks");
  window.location.href = "/dev_task_flow_frontend/login.html";
}

// fetch tasks when the page loads
fetchTasks();

function fetchTasks() {
  let tasks = [];
  // fetch tasks for the current organization using the token stored in local storage
  fetch(`${baseUrl}/tasks`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      tasks = data;
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";
      renderTaskList(tasks);
    });
}

function renderTaskList(tasks) {
  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  sortedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item task-priority-${task.priority} ${
      task.status === "done" ? "task-completed" : ""
    }`;

    li.innerHTML = `
              <div class="task-list-item">
                  <span style="font-weight: bold; font-size: 15px">${
                    task.title
                  }</span>
                  <small> | ${task.priority} | ${
      task.created_date.split("T")[0]
    }</small>
              </div>
              <div class="task-actions">
                  <button id="complete-task-btn" data-task-id="${
                    task.task_id
                  }" type="button" data-status-name="${task.status}">
                      ${task.status === "done" ? "Undo" : "Complete"}
                  </button>
                  <button onclick="openEditModal(${task.task_id}, '${
      task.description
    }', '${task.priority}')">Edit</button>
                  <button id="deleteTaskButton" type="button" data-task-id="${
                    task.task_id
                  }">Delete</button>
              </div>
          `;

    taskList.appendChild(li);

    // attach event listeners to delete button
    const deleteButton = li.querySelector("#deleteTaskButton");
    deleteButton.addEventListener("click", (e) => {
      const taskId = e.target.dataset.taskId;
      deleteTask(taskId);
    });

    const confirmTaskCompleteButton = li.querySelector("#complete-task-btn");
    confirmTaskCompleteButton.addEventListener("click", (e) => {
      const { taskId, statusName } = e.target.dataset;
      changeTaskStatus(taskId, statusName === "todo" ? "done" : "todo");
    });
  });
}

function deleteTask(taskId) {
  fetch(`${baseUrl}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status.code === 204) {
        alert(data.status.message);
        fetchTasks();
      } else {
        alert(data.status.message);
      }
    })
    .catch((error) => console.error("Error:", error));
}

// add new task
const submitTaskBtn = document.getElementById("addTaskForm");

submitTaskBtn.addEventListener("submit", function (event) {
  event.preventDefault();
  addTask();
});

function addTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const assigned_to = document.getElementById("assigned_to")?.value;
  const priority = document.getElementById("priority").value;
  const due_date = document.getElementById("due_date").value;

  const newTask = {
    title,
    description,
    assigned_to,
    priority,
    due_date,
  };

  // api call
  fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(newTask),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status.code === 201) {
        alert(data.status.message);
        fetchTasks();
        resetForm();
      } else {
        alert(data.status.message);
      }
    });
}

function changeTaskStatus(task_id, statusName) {
  //   const confirmed = confirm("Are you sure you want to complete this task?");
  fetch(`${baseUrl}/tasks/mark-as-complete/${task_id}`, {
    body: JSON.stringify({ statusName }),
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((res) => {
      console.log(res);
      if (res.code === 200) {
        fetchTasks();
      } else {
        alert(res.error);
      }
    });
}

// logout
function logout() {}

function resetForm() {
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("assigned_to").value = "";
  document.getElementById("priority").value = "";
  document.getElementById("due_date").value = "";
}
