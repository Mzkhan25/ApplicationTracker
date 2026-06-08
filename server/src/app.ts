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

// DELETE /api/auth/account is authenticated — wire JWT before mounting
app.use('/api/auth/account', jwt({ secret: process.env.JWT_SECRET ?? 'dev', alg: 'HS256' }));
app.delete('/api/auth/account', async (c) => {
  const { db } = await import('./db/index.js');
  const { users } = await import('./db/schema.js');
  const { eq } = await import('drizzle-orm');
  const userId = (c.get('jwtPayload') as { sub: string }).sub;
  await db.delete(users).where(eq(users.id, userId));
  return new Response(null, { status: 204 });
});

app.use('/api/data/*', jwt({ secret: process.env.JWT_SECRET ?? 'dev', alg: 'HS256' }));
app.route('/api/data', dataRouter);

export default app;
