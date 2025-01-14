import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import sql from '../sql';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, balance } = req.body;

  if (!name || !email || !password || balance == null) {
    res.status(400).send({ error: 'Name, email, password and balance are required' });
		return;
  }

  try {
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      res.status(400).send({ error: 'User already exists' });
			return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await sql`
      INSERT INTO users (name, email, balance, password)
      VALUES (${name}, ${email}, ${balance}, ${hashedPassword})
      RETURNING id, name, email, balance;
    `;

    res.status(201).send({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).send({ error: 'Error registering user' });
		return;
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({ error: 'Email and password are required' });
		return;
  }

  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) {
      res.status(400).send({ error: 'Invalid email or password' });
			return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).send({ error: 'Invalid email or password' });
			return;
    }

    res.cookie('userId', user.id, { httpOnly: true });
    res.send({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).send({ error: 'Error logging in' });
		return;
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.cookies.userId;

  if (!userId) {
    res.status(401).send({ error: 'Unauthorized' });
		return;
  }

  if (!oldPassword || !newPassword) {
    res.status(400).send({ error: 'Old password and new password are required' });
		return;
  }

  try {
    const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (!user) {
      res.status(404).send({ error: 'User not found' });
			return;
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      res.status(400).send({ error: 'Old password is incorrect' });
			return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await sql`
      UPDATE users
      SET password = ${hashedNewPassword}
      WHERE id = ${userId};
    `;

    res.send({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Error changing password' });
		return;
  }
});

export default router;
