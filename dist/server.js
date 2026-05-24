
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = err.message || "Something went wrong";
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.message === "Unauthorized") {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.message === "Forbidden") {
    statusCode = 403;
    message = "Forbidden";
  } else if (err.message.includes("not found")) {
    statusCode = 404;
    message = "Not Found";
  } else if (err.message.includes("already exists") || err.message.includes("duplicate")) {
    statusCode = 409;
    message = "Conflict";
  } else if (err.message.includes("Validation")) {
    statusCode = 400;
    message = "Bad Request";
  }
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

// src/middleware/notFound.ts
var notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API Not Found",
    errors: `Route ${req.originalUrl} does not exist`
  });
};

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
var catchAsync_default = catchAsync;

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  const responseData = {
    success: data.success
  };
  if (data.message !== void 0) {
    responseData.message = data.message;
  }
  if (data.data !== void 0) {
    responseData.data = data.data;
  }
  res.status(data.statusCode).json(responseData);
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/env.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT || 5e3,
  secret: process.env.JWT_SECRET
};
var env_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: env_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Database connected & synced successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// src/modules/auth/auth.service.ts
var signupUser = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const userCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (userCheck.rows.length > 0) {
    throw new Error("User with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (userResult.rows.length === 0) {
    throw new Error("Invalid credentials");
  }
  const user = userResult.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  const tokenPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(tokenPayload, env_default.secret, { expiresIn: "1d" });
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};
var authService = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.controller.ts
var signupUser2 = catchAsync_default(async (req, res) => {
  const result = await authService.signupUser(req.body);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result
  });
});
var loginUser2 = catchAsync_default(async (req, res) => {
  const result = await authService.loginUser(req.body);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: result
  });
});
var authController = {
  signupUser: signupUser2,
  loginUser: loginUser2
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssue = async (payload, reporter_id) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssues = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues WHERE 1=1`;
  const params = [];
  let paramCount = 1;
  if (type && (type === "bug" || type === "feature_request")) {
    sql += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }
  if (status && (status === "open" || status === "in_progress" || status === "resolved")) {
    sql += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }
  const issuesResult = await pool.query(sql, params);
  const issues = issuesResult.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const placeholders = reporterIds.map((_, i) => `$${i + 1}`).join(",");
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );
  const reportersMap = /* @__PURE__ */ new Map();
  reportersResult.rows.forEach((reporter) => {
    reportersMap.set(reporter.id, reporter);
  });
  const formattedIssues = issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reportersMap.get(reporter_id)
    };
  });
  return formattedIssues;
};
var getSingleIssue = async (id) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const { reporter_id, ...issueData } = issue;
  const reporterResult = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`, [reporter_id]);
  return {
    ...issueData,
    reporter: reporterResult.rows[0]
  };
};
var updateIssue = async (id, payload, user) => {
  const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueCheck.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueCheck.rows[0];
  if (user.role !== "maintainer") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden: You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error('Conflict: Contributors can only update issues that are in "open" status');
    }
  }
  const { title, description, type, status } = payload;
  const result = await pool.query(
    `UPDATE issues 
     SET title = COALESCE($1, title), 
         description = COALESCE($2, description), 
         type = COALESCE($3, type), 
         status = COALESCE($4, status), 
         updated_at = NOW() 
     WHERE id = $5 RETURNING *`,
    [title, description, type, status, id]
  );
  return result.rows[0];
};
var deleteIssue = async (id) => {
  const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }
  return true;
};
var issuesService = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.controller.ts
var createIssue2 = catchAsync_default(async (req, res) => {
  const reporter_id = req.user.id;
  const result = await issuesService.createIssue(req.body, reporter_id);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "Issue created successfully",
    data: result
  });
});
var getAllIssues2 = catchAsync_default(async (req, res) => {
  const result = await issuesService.getAllIssues(req.query);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    data: result
  });
});
var getSingleIssue2 = catchAsync_default(async (req, res) => {
  const id = req.params.id;
  const result = await issuesService.getSingleIssue(id);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    data: result
  });
});
var updateIssue2 = catchAsync_default(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const result = await issuesService.updateIssue(id, req.body, user);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue updated successfully",
    data: result
  });
});
var deleteIssue2 = catchAsync_default(async (req, res) => {
  const id = req.params.id;
  await issuesService.deleteIssue(id);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue deleted successfully"
  });
});
var issuesController = {
  createIssue: createIssue2,
  getAllIssues: getAllIssues2,
  getSingleIssue: getSingleIssue2,
  updateIssue: updateIssue2,
  deleteIssue: deleteIssue2
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "Missing authentication token"
        });
      }
      const decoded = jwt2.verify(token, env_default.secret);
      const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);
      const user = userData.rows[0];
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "User associated with this token does not exist"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "You do not have the required role to access this resource"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.post("/", auth("contributor", "maintainer"), issuesController.createIssue);
router2.patch("/:id", auth("contributor", "maintainer"), issuesController.updateIssue);
router2.delete("/:id", auth("maintainer"), issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to DevPulse API",
    data: null
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
app.use(notFound);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(env_default.port, () => {
      console.log(`Server is running on port ${env_default.port}`);
    });
  } catch (error) {
    console.error(error);
  }
};
main();
//# sourceMappingURL=server.js.map