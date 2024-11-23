const accessToken = localStorage.getItem("accessToken");
const baseUrl = "http://localhost:3000/api";

if (accessToken) {
  window.location.replace("/dev_task_flow_frontend/index.html");
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      login();
    });
  }
});

// start with authentication
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }
  fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status?.code === 200) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("employee", JSON.stringify(data.data));
        alert(data.status.message);

        window.location.replace("/dev_task_flow_frontend/index.html");
        return;
      } else {
        alert("Login failed: " + (data.message || "Unknown error"));
      }
    });
}

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  if (!email || !password || !confirmPassword) {
    alert("Please fill in all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
        return;
      }
    });
  // clear the form fields
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("confirmPassword").value = "";
  // redirect to the login page
  window.location.href = "/login.html";
}
