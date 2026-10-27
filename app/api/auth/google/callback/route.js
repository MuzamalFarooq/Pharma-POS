import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import { getGoogleOAuthConfig, getGoogleRedirectUri, exchangeGoogleCode, getGoogleUserProfile } from '@/lib/google-auth';
import { isPlatformOwnerEmail } from '@/lib/platform-owner';
import { logAuditEvent } from '@/lib/tenant';

const SESSION_COOKIE_NAME = 'pharma_pos_session';
const STATE_COOKIE_NAME = 'pharma_google_oauth';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  // Handle user cancellation or denial gracefully
  if (oauthError) {
    const errorRedirect = NextResponse.redirect(
      new URL(
        oauthError === 'access_denied'
          ? '/login?info=google_cancelled'
          : `/login?error=${encodeURIComponent(oauthError)}`,
        req.url
      )
    );
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }

  // Retrieve stored state cookie
  const storedStateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!storedStateCookie || !state || !code) {
    const errorRedirect = NextResponse.redirect(new URL('/login?error=invalid_state', req.url));
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }

  let parsedState;
  try {
    parsedState = JSON.parse(storedStateCookie);
  } catch {
    const errorRedirect = NextResponse.redirect(new URL('/login?error=invalid_state', req.url));
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }

  // Strictly verify state to prevent CSRF and login injection
  if (parsedState.state !== state) {
    const errorRedirect = NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }

  const safeReturnTo =
    parsedState.returnTo &&
    parsedState.returnTo.startsWith('/') &&
    !parsedState.returnTo.startsWith('//') &&
    !parsedState.returnTo.includes('\\')
      ? parsedState.returnTo
      : null;

  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    const errorRedirect = NextResponse.redirect(new URL('/login?error=google_not_configured', req.url));
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }

  try {
    const redirectUri = getGoogleRedirectUri(req);

    // 1. Exchange authorization code with Google token endpoint
    const tokens = await exchangeGoogleCode({
      code,
      codeVerifier: parsedState.codeVerifier,
      redirectUri,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    // 2. Fetch authenticated profile from Google
    const profile = await getGoogleUserProfile(tokens.access_token, tokens.id_token);

    if (!profile.email) {
      const errorRedirect = NextResponse.redirect(new URL('/login?error=email_missing', req.url));
      errorRedirect.cookies.delete(STATE_COOKIE_NAME);
      return errorRedirect;
    }

    // 3. Security check: Only accept verified email addresses
    if (!profile.emailVerified) {
      const errorRedirect = NextResponse.redirect(new URL('/login?error=unverified_email', req.url));
      errorRedirect.cookies.delete(STATE_COOKIE_NAME);
      return errorRedirect;
    }

    const normalizedEmail = profile.email;

    // 4. Check if this Google account is already linked
    let existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.sub,
        },
      },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    let user = existingAccount?.user;

    // 5. If not found by Google sub, check by verified email address
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          memberships: {
            include: {
              organization: true,
              branch: true,
            },
          },
        },
      });

      if (user) {
        // Securely link Google account to existing verified user
        try {
          await prisma.account.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerAccountId: profile.sub,
            },
          });
        } catch (err) {
          // Ignore P2002 if concurrent linking attempt succeeded
          if (err.code !== 'P2002') throw err;
        }

        // Update avatar if not present
        if (!user.avatar && profile.picture) {
          await prisma.user.update({
            where: { id: user.id },
            data: { avatar: profile.picture },
          }).catch(() => {});
        }
      } else {
        // 6. User does not exist: Register new user with default least-privileged role (CUSTOMER)
        try {
          user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                name: profile.name || 'Google User',
                email: normalizedEmail,
                avatar: profile.picture || null,
                passwordHash: null,
              },
            });

            await tx.account.create({
              data: {
                userId: newUser.id,
                provider: 'google',
                providerAccountId: profile.sub,
              },
            });

            return newUser;
          });
        } catch (createErr) {
          // If race condition on concurrent registration, fetch created user
          if (createErr.code === 'P2002') {
            user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
              include: {
                memberships: {
                  include: {
                    organization: true,
                    branch: true,
                  },
                },
              },
            });
          } else {
            throw createErr;
          }
        }

        if (!user.memberships) {
          user.memberships = [];
        }
      }
    }

    // 7. Role resolution and multi-tenant authorization
    let destination = '/customer';
    let tokenPayload = {
      userId: user.id,
      tokenVersion: user.passwordVersion || 1,
    };

    const isPlatformOwner = isPlatformOwnerEmail(user.email);
    if (isPlatformOwner) {
      tokenPayload.role = 'PLATFORM_OWNER';
      tokenPayload.platformOwner = true;
      destination = '/owner';
    } else {
      const activeMemberships = (user.memberships || []).filter(
        (m) => m.status === 'ACTIVE' && m.organization.status === 'ACTIVE'
      );

      // If user has organization memberships but none are ACTIVE, account is awaiting approval
      if (activeMemberships.length === 0 && (user.memberships || []).length > 0) {
        const errorRedirect = NextResponse.redirect(new URL('/login?error=pending_approval', req.url));
        errorRedirect.cookies.delete(STATE_COOKIE_NAME);
        return errorRedirect;
      }

      if (activeMemberships.length > 0) {
        const activeMembership = activeMemberships[0];
        const branches = await prisma.branch.findMany({
          where: { organizationId: activeMembership.organizationId, status: 'ACTIVE' },
          select: { id: true },
        });
        const activeBranchId = activeMembership.branchId || branches[0]?.id || null;

        tokenPayload.activeOrganizationId = activeMembership.organizationId;
        tokenPayload.activeBranchId = activeBranchId;
        tokenPayload.role = activeMembership.role;
        destination = '/dashboard';

        await logAuditEvent({
          organizationId: activeMembership.organizationId,
          branchId: activeBranchId,
          userId: user.id,
          action: 'USER_LOGIN_GOOGLE',
          entity: 'User',
          entityId: user.id,
          metadata: { role: activeMembership.role, provider: 'google' },
        }).catch(() => {});
      } else {
        // Customer account (least-privileged default)
        tokenPayload.role = 'CUSTOMER';
        destination = safeReturnTo || '/customer';
      }
    }

    // 8. Generate session JWT token and set HTTP-only cookie
    const sessionToken = await createSessionToken(tokenPayload);

    const redirectResponse = NextResponse.redirect(new URL(destination, req.url));

    redirectResponse.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear state cookie
    redirectResponse.cookies.delete(STATE_COOKIE_NAME);

    return redirectResponse;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const errorRedirect = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'authentication_failed')}`, req.url)
    );
    errorRedirect.cookies.delete(STATE_COOKIE_NAME);
    return errorRedirect;
  }
}
