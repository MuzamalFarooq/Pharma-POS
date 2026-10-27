import { NextResponse } from 'next/server';
import { getGoogleOAuthConfig, getGoogleRedirectUri, generateOAuthState } from '@/lib/google-auth';

export async function GET(req) {
  try {
    const config = getGoogleOAuthConfig();
    if (!config.isConfigured) {
      return NextResponse.redirect(new URL('/login?error=google_not_configured', req.url));
    }

    const { searchParams } = new URL(req.url);
    const returnTo = searchParams.get('returnTo');

    // Ensure returnTo is strictly a relative path on the same origin (prevents Open Redirects)
    const safeReturnTo =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
        ? returnTo
        : null;

    const redirectUri = getGoogleRedirectUri(req);
    const { state, codeVerifier, codeChallenge } = generateOAuthState();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('prompt', 'select_account');

    const res = NextResponse.redirect(authUrl.toString());

    // Secure HTTP-only state cookie to verify callback and prevent CSRF
    const statePayload = JSON.stringify({ state, codeVerifier, returnTo: safeReturnTo });
    res.cookies.set('pharma_google_oauth', statePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return res;
  } catch (error) {
    console.error('Google OAuth initialization error:', error);
    return NextResponse.redirect(new URL('/login?error=google_init_failed', req.url));
  }
}
