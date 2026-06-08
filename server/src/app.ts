import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRouter);

app.use('/api/data/*', jwt({ secret: process.env.JWT_SECRET!, alg: 'HS256' }));
app.route('/api/data', dataRouter);

export default app;
