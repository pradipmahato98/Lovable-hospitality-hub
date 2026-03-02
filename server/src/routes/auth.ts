import { Router } from 'express';
import * as authService from '../services/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.findUserByEmail(email);

    if (!user || !(await authService.comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = authService.generateToken(user.user_id, user.role || 'user');
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: any, res) => {
  res.json(req.user);
});

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await authService.listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
