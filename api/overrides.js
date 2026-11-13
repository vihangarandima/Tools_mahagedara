/**
 * /api/overrides - the admin panel's product edits.
 *   GET            -> public; the storefront lays these edits over the ERP catalog
 *   GET ?admin=1   -> logged-in admin; always the latest saved version
 *   POST           -> logged-in admin; applies one change { op, sku, fields? }
 */
import { isAuthenticated, json } from '../server/auth.js';
import { ChangeError, applyChange, emptyDoc, readOverrides, writeOverrides } from '../server/overridesStore.js';

const MAX_BODY_BYTES = 20_000;

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=30'
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const adminView = url.searchParams.has('admin');
      if (adminView && !isAuthenticated(request)) return json({ error: 'Please log in.' }, 401);

      try {
        const doc = await readOverrides({ fresh: adminView });
        // Shoppers: browsers always re-check, Vercel's CDN may reuse the answer for 30 seconds
        return json(doc, 200, adminView ? {} : PUBLIC_CACHE_HEADERS);
      } catch (err) {
        console.error('Reading product overrides failed:', err);
        // Shoppers still get the plain ERP catalog if storage is unavailable
        if (!adminView) return json(emptyDoc());
        return json({ error: `Could not load saved changes: ${err.message || 'storage error'}` }, 500);
      }
    }

    if (request.method === 'POST') {
      if (!isAuthenticated(request)) return json({ error: 'Please log in.' }, 401);

      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);

      let change;
      try {
        change = JSON.parse(raw);
      } catch {
        return json({ error: 'Invalid request.' }, 400);
      }

      try {
        const current = await readOverrides({ fresh: true });
        const saved = await writeOverrides(applyChange(current, change));
        return json(saved);
      } catch (err) {
        if (err instanceof ChangeError) return json({ error: err.message }, 400);
        console.error('Saving product overrides failed:', err);
        return json({ error: `Could not save: ${err.message || 'storage error'}` }, 500);
      }
    }

    return json({ error: 'Method not allowed.' }, 405);
  }
};
