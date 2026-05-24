import { pool } from '../../db/index.js';

const createIssue = async (payload: any, reporter_id: number) => {
  const { title, description, type } = payload;
  
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, type, reporter_id]
  );
  
  return result.rows[0];
};

const getAllIssues = async (query: any) => {
  const { sort = 'newest', type, status } = query;
  
  let sql = `SELECT * FROM issues WHERE 1=1`;
  const params: any[] = [];
  let paramCount = 1;

  if (type && (type === 'bug' || type === 'feature_request')) {
    sql += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }

  if (status && (status === 'open' || status === 'in_progress' || status === 'resolved')) {
    sql += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (sort === 'oldest') {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }

  const issuesResult = await pool.query(sql, params);
  const issues = issuesResult.rows;

  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map(issue => issue.reporter_id))];
  
  const placeholders = reporterIds.map((_, i) => `$${i + 1}`).join(',');
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );
  
  const reportersMap = new Map();
  reportersResult.rows.forEach(reporter => {
    reportersMap.set(reporter.id, reporter);
  });

  const formattedIssues = issues.map(issue => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reportersMap.get(reporter_id)
    };
  });

  return formattedIssues;
};

const getSingleIssue = async (id: string) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  
  if (issueResult.rows.length === 0) {
    throw new Error('Issue not found');
  }

  const issue = issueResult.rows[0];
  const { reporter_id, ...issueData } = issue;

  const reporterResult = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`, [reporter_id]);

  return {
    ...issueData,
    reporter: reporterResult.rows[0]
  };
};

const updateIssue = async (id: string, payload: any, user: any) => {
  const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueCheck.rows.length === 0) {
    throw new Error('Issue not found');
  }
  
  const issue = issueCheck.rows[0];

  if (user.role !== 'maintainer') {
    if (issue.reporter_id !== user.id) {
      throw new Error('Forbidden: You can only update your own issues');
    }
    if (issue.status !== 'open') {
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

const deleteIssue = async (id: string) => {
  const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  if (result.rowCount === 0) {
    throw new Error('Issue not found');
  }
  return true;
};

export const issuesService = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};
