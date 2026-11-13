/**
 * /api/admin - login session for the admin panel.
 *   GET    -> { configured, authenticated }
 *   POST   -> { password } logs in (sets the session cookie)
 *   DELETE -> logs out
 */
import { checkPassword, clearedCookie, isAdminConfigured, isAuthenticated, json, sessionCookie } from '../server/auth.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  async fetch(request) {
    if (request.method === 'GET') {
      return json({ configured: isAdminConfigured(), authenticated: isAuthenticated(request) });
    }

    if (request.method === 'POST') {
      if (!isAdminConfigured()) {
        return json({ error: 'Admin password is not set up yet. Add ADMIN_PASSWORD (8+ characters) in the Vercel project settings and redeploy.' }, 503);
      }

      let password;
      try {
        password = (await request.json()).password;
      } catch {
        return json({ error: 'Invalid request.' }, 400);
      }

      if (!checkPassword(password)) {
        await wait(1000); // slows down password guessing
        return json({ error: 'Wrong password.' }, 401);
      }
      return json({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(request) });
    }

    if (request.method === 'DELETE') {
      return json({ authenticated: false }, 200, { 'Set-Cookie': clearedCookie(request) });
    }

    return json({ error: 'Method not allowed.' }, 405);
  }
};
