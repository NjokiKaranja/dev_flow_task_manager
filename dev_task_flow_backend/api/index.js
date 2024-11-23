const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());

const jwt_token =
  "cbc4ac084a79d6aac1744ed62dced524b4f62bb31dbd7414123f957b4a88a97e";

// Authentication - login and registration methods
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwt_token, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Authentication Routes
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, dept_id, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO employees (name, email, password, dept_id, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, dept_id, role]
    );

    res.status(201).json({ message: "Employee registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  console.log("Request has began...");
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute("SELECT * FROM employees WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const employee = rows[0];
    const validPassword = await bcrypt.compare(password, employee.password);

    if (!validPassword) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee.emp_id, role: employee.role },
      jwt_token,
      { expiresIn: "168h" }
    );

    res.json({
      status: {
        code: 200,
        message: "Success",
      },
      accessToken: token,
      data: {
        id: employee.emp_id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        dept_id: employee.dept_id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Organization Routes - just for demo purposes - post and get
app.get("/api/organizations", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM organizations");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/organizations", async (req, res) => {
  try {
    const { name, description, contact_email, contact_phone } = req.body;
    await db.execute(
      "INSERT INTO organizations (name, description, contact_email, contact_phone) VALUES (?, ?, ?, ?)",
      [name, description, contact_email, contact_phone]
    );

    res.status(201).json({ message: "Organization created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Department Routes - just for demo purposes
app.get("/api/departments", async (req, res) => {
  try {
    await db.execute("SELECT * FROM departments WHERE org_id =?", [
      req.query.org_id,
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// create a department
app.post("/api/departments", async (req, res) => {
  try {
    const { name, org_id } = req.body;
    await db.execute("INSERT INTO departments (name, org_id) VALUES (?,?)", [
      name,
      org_id,
    ]);
    res.status(201).json({ message: "Department created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task Routes
app.post("/api/tasks", authenticateToken, async (req, res) => {
  console.log(req.user.id);
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    await db.execute(
      "INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)",
      [
        title,
        description,
        assigned_to ?? req.user.id,
        req.user.id,
        priority,
        due_date,
      ]
    );
    res.status(201).json({
      status: {
        code: 201,
        message: "Task created successfully",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tasks", authenticateToken, async (req, res) => {
  console.log("Fetch all tasks...");
  try {
    const [rows] = await db.execute(
      `
            SELECT t.*, e.name as assigned_to_name, e2.name as assigned_by_name 
            FROM tasks t 
            JOIN employees e ON t.assigned_to = e.emp_id 
            JOIN employees e2 ON t.assigned_by = e2.emp_id 
            `
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/tasks/mark-as-complete/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const statusName = req.body.statusName;
      const [rows] = await db.execute("SELECT * FROM tasks WHERE task_id =?", [
        id,
      ]);


      // Check if user is allowed to confirm this task
      if (rows[0].assigned_to !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to confirm this task" });
      }

      // Confirm the task using the query statusName parameter
      await db.execute("UPDATE tasks SET status = ? WHERE task_id =?", [
        statusName,
        id,
      ]);

      res.json({ message: "Success", code: 200 });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(`/api/tasks/:id`, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute("DELETE FROM tasks WHERE task_id =?", [id]);
    res
      .status(200)
      .json({ status: { message: "Task deleted successfully", code: 204 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
