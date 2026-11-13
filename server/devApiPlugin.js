/**
 * Vite dev-server plugin: runs the Vercel functions in /api locally, so the
 * admin panel works with `npm run dev`. On Vercel the same files are deployed
 * as real serverless functions and this plugin is not involved.
 */
import { loadEnv } from 'vite';

const ROUTES = {
  '/api/admin': '/api/admin.js',
  '/api/overrides': '/api/overrides.js'
};

const SERVER_ENV_KEYS = ['ADMIN_PASSWORD', 'BLOB_READ_WRITE_TOKEN'];

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function devApiPlugin() {
  return {
    name: 'tools-mahagedara-dev-api',
    apply: 'serve',

    config(_config, { mode }) {
      // Server-only secrets from .env / .env.local (never exposed to browser code)
      const env = loadEnv(mode, process.cwd(), '');
      for (const key of SERVER_ENV_KEYS) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const modulePath = ROUTES[url.pathname];
        if (!modulePath) return next();

        try {
          const handler = (await server.ssrLoadModule(modulePath)).default;

          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
          }

          const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
          const request = new Request(url, {
            method: req.method,
            headers,
            body: hasBody ? await readBody(req) : undefined
          });

          const response = await handler.fetch(request);

          res.statusCode = response.status;
          response.headers.forEach((value, name) => {
            if (name.toLowerCase() !== 'set-cookie') res.setHeader(name, value);
          });
          const cookies = response.headers.getSetCookie();
          if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error(`[dev api] ${url.pathname} failed:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API error. See the dev server log.' }));
        }
      });
    }
  };
}
