import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { AuditAction } from '@prisma/client';

export const authRouter = Router();

const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'Iit@roorkee';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().refine((e) => e.endsWith('@iitr.ac.in'), {
    message: 'Only @iitr.ac.in email addresses are allowed',
  }),
  password: z.string().min(6),
  adminCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
authRouter.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const isAdmin = data.adminCode && data.adminCode === ADMIN_SECRET_CODE;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: isAdmin ? 'ADMIN' : 'USER',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await createAuditLog({
      userId: user.id,
      action: AuditAction.USER_REGISTERED,
      entityType: 'User',
      entityId: user.id,
      details: { name: user.name, email: user.email },
      ipAddress: req.ip,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
authRouter.post('/login', async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordValid = await bcrypt.compare(data.password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await createAuditLog({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    const { password: _pw, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Get profile
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, department: true, phone: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
authRouter.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      department: z.string().optional(),
      phone: z.string().optional(),
    });
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, phone: true, createdAt: true },
    });
    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Update failed' });
  }
});

// Change password
authRouter.patch('/me/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Password change failed' });
  }
});
    