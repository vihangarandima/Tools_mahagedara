/**
 * Admin login for the /admin panel.
 *
 * The password lives only in the ADMIN_PASSWORD environment variable (Vercel
 * project settings, or .env.local on a dev PC). A successful login sets an
 * HttpOnly cookie holding a signed expiry time, so page scripts can never read it.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'tm_admin';
const SESSION_HOURS = 12;
const MIN_PASSWORD_LENGTH = 8;

function adminPassword() {
  const value = (process.env.ADMIN_PASSWORD || '').trim();
  return value.length >= MIN_PASSWORD_LENGTH ? value : null;
}

export function isAdminConfigured() {
  return adminPassword() !== null;
}

function sha256(text) {
  return createHash('sha256').update(text).digest();
}

function sign(expiresAt, password) {
  const key = sha256(`tools-mahagedara-admin-session:${password}`);
  return createHmac('sha256', key).update(String(expiresAt)).digest('hex');
}

/** Constant-time password check. */
export function checkPassword(candidate) {
  const password = adminPassword();
  if (!password || typeof candidate !== 'string') return false;
  return timingSafeEqual(sha256(candidate), sha256(password));
}

function isHttps(request) {
  return new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
}

function cookieAttributes(request, maxAgeSeconds) {
  const parts = ['Path=/api', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`];
  if (isHttps(request)) parts.push('Secure');
  return parts.join('; ');
}

export function sessionCookie(request) {
  const password = adminPassword();
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = `${expiresAt}.${sign(expiresAt, password)}`;
  return `${COOKIE_NAME}=${token}; ${cookieAttributes(request, SESSION_HOURS * 60 * 60)}`;
}

export function clearedCookie(request) {
  return `${COOKIE_NAME}=; ${cookieAttributes(request, 0)}`;
}

export function isAuthenticated(request) {
  const password = adminPassword();
  if (!password) return false;

  const cookies = request.headers.get('cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;

  const [expiresRaw, signature] = match.slice(COOKIE_NAME.length + 1).split('.');
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) return false;

  const expected = Buffer.from(sign(expiresAt, password));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}
