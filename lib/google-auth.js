import crypto from 'crypto';
import { getAppBaseUrl } from './email.js';

/**
 * Returns Google OAuth client configuration from server environment.
 */
export function getGoogleOAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

  return {
    clientId,
    clientSecret,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

/**
 * Derives the canonical Google OAuth callback URI based on current request environment.
 * Prevents host header poisoning while allowing seamless local development.
 *
 * @param {Request} [req]
 * @returns {string}
 */
export function getGoogleRedirectUri(req) {
  // If explicitly overridden in environment:
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }

  // If in production, strictly use the verified production domain
  if (process.env.NODE_ENV === 'production') {
    const configuredBase = (process.env.NEXTAUTH_URL || process.env.APP_URL || '').trim();
    const base = configuredBase || 'https://pharmapulse.muzamal.site';
    return `${base.replace(/\/+$/, '')}/api/auth/google/callback`;
  }

  // In local development, determine origin from request if on localhost / 127.0.0.1
  if (req) {
    try {
      const url = new URL(req.url);
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        const protocol = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'http';
        return `${protocol}://${host}/api/auth/google/callback`;
      }
    } catch {
      // Fallback below
    }
  }

  const base = getAppBaseUrl();
  return `${base.replace(/\/+$/, '')}/api/auth/google/callback`;
}

/**
 * Generates cryptographically secure random state & PKCE pair
 */
export function generateOAuthState() {
  const state = crypto.randomBytes(24).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { state, codeVerifier, codeChallenge };
}

/**
 * Exchanges authorization code with Google OAuth 2.0 token endpoint
 */
export async function exchangeGoogleCode({ code, codeVerifier, redirectUri, clientId, clientSecret }) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorDescription = data.error_description || data.error || 'Google token exchange failed';
    throw new Error(errorDescription);
  }

  return data;
}

/**
 * Fetches user profile using Google access token and/or ID token
 */
export async function getGoogleUserProfile(accessToken, idToken) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve user profile from Google');
  }

  const profile = await response.json();

  if (!profile || !profile.sub) {
    throw new Error('Invalid profile received from Google');
  }

  return {
    sub: profile.sub,
    email: profile.email ? profile.email.toLowerCase().trim() : null,
    emailVerified: profile.email_verified === true || profile.email_verified === 'true',
    name: profile.name || profile.given_name || 'Google User',
    picture: profile.picture || null,
  };
}
