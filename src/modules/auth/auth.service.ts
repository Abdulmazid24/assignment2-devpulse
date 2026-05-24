import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/index.js';
import config from '../../config/env.js';

const signupUser = async (payload: any) => {
  const { name, email, password, role = 'contributor' } = payload;
  
  const userCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (userCheck.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );
  
  return result.rows[0];
};

const loginUser = async (payload: any) => {
  const { email, password } = payload;

  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (userResult.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = userResult.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const tokenPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, config.secret, { expiresIn: '1d' });

  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

export const authService = {
  signupUser,
  loginUser
};
