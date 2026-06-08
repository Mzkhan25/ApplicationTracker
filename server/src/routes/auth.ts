import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export const authRouter = new Hono();

// Pre-hashed dummy used to keep login timing constant whether or not the username exists
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuvuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

function tokenExpiry() {
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
}

authRouter.post('/register', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  if (!body.username || !body.password) {
    return c.json({ error: 'username and password required' }, 400);
  }
  const { username, password } = body;
  // bcrypt silently truncates inputs > 72 bytes — reject rather than silently weaken
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return c.json({ error: 'Password must be 72 characters or fewer' }, 400);
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: 'Username already taken' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash })
    .returning({ id: users.id });

  const token = await sign(
    { sub: user.id, username, exp: tokenExpiry() },
    process.env.JWT_SECRET!,
  );
  return c.json({ token, username }, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  if (!body.username || !body.password) {
    return c.json({ error: 'username and password required' }, 400);
  }
  const { username, password } = body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const passwordMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordMatch) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await sign(
    { sub: user.id, username, exp: tokenExpiry() },
    process.env.JWT_SECRET!,
  );
  return c.json({ token, username });
});
