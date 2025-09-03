import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/nodemailer";
import nodemailer from "nodemailer";

import { env } from "@/env.mjs";
import { db, users } from "@/lib/schema";
import { stripeServer } from "@/lib/stripe";

interface EmailTemplateOptions {
  url: string;
  email: string;
  companyName?: string;
  logoUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
  expirationMinutes?: number;
}

function gradioEmailHtml({
  url,
  email,
  companyName = "Gradio AI Assignment Reviewer",
  logoUrl,
  supportEmail = "support@gradio.app",
  unsubscribeUrl,
  expirationMinutes = 10,
}: EmailTemplateOptions): string {
  // Production hex colors with fallbacks
  const colors = {
    primary: "#ff6b35", // Orange primary
    primaryDark: "#e55a2b", // Darker orange for hover
    accent: "#f8f9fa", // Light gray accent
    cream: "#ffffff", // Pure white background
    border: "#e9ecef", // Light border
    text: "#212529", // Dark text
    textMuted: "#6c757d", // Muted text
    shadow: "rgba(0,0,0,0.1)", // Shadow color
  };

  // Comprehensive input sanitization
  const sanitizeHtml = (input: string): string => {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  };

  const sanitizeUrl = (input: string): string => {
    try {
      const urlObj = new URL(input);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol");
      }
      return urlObj.toString();
    } catch {
      return "#";
    }
  };

  // Validate and sanitize inputs
  const safeUrl = sanitizeUrl(url);
  const safeEmail = sanitizeHtml(email);
  const safeCompanyName = sanitizeHtml(companyName);
  const safeSupportEmail = sanitizeHtml(supportEmail);
  const safeUnsubscribeUrl = unsubscribeUrl
    ? sanitizeUrl(unsubscribeUrl)
    : null;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  if (!isValidEmail) {
    throw new Error("Invalid email address provided");
  }

  // Logo component
  const logoComponent = logoUrl
    ? `<img src="${sanitizeUrl(logoUrl)}" alt="${safeCompanyName}" width="40" height="40" style="display:block;border:0;outline:none;text-decoration:none;" />`
    : `<svg width="40" height="40" viewBox="0 0 32 32" style="display:block;border:0;">
        <polygon points="16,6 21,9 16,16 11,9" fill="${colors.cream}" />
        <polygon points="21,9 26,12 16,16 16,16" fill="${colors.accent}" />
        <polygon points="26,12 26,22 16,28 16,16" fill="${colors.primaryDark}" />
        <polygon points="16,16 16,28 6,22 6,12" fill="${colors.border}" />
        <circle cx="16" cy="16" r="4" fill="${colors.primary}" />
      </svg>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  
  <title>Sign in to ${safeCompanyName}</title>
  
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  
  <style>
    /* Reset styles */
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Client-specific fixes */
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    
    /* Prevent auto-linking */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1a1a1a !important; }
      .dark-mode-text { color: #ffffff !important; }
      .dark-mode-border { border-color: #333333 !important; }
    }
    
    /* Mobile responsiveness */
    @media screen and (max-width: 480px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-font-size { font-size: 16px !important; }
      .mobile-button { padding: 14px 24px !important; font-size: 16px !important; }
      .mobile-width { width: 100% !important; max-width: 100% !important; }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .button { border: 2px solid ${colors.text} !important; }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: ${colors.cream}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  
  <!-- Preview text (hidden but appears in email previews) -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${colors.cream}; opacity: 0;">
    Sign in to your ${safeCompanyName} account with this secure link. Valid for ${expirationMinutes} minutes.
  </div>

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.cream};">
    <tr>
      <td style="padding: 40px 20px;" class="mobile-padding">
        
        <!-- Main container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${colors.cream}; border-radius: 12px; box-shadow: 0 4px 16px ${colors.shadow}; border: 1px solid ${colors.border}; overflow: hidden;" class="mobile-width">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${colors.primary}; padding: 32px 40px; text-align: center;" class="mobile-padding">
              ${logoComponent}
              <h1 style="color: ${colors.cream}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 24px; font-weight: 600; margin: 16px 0 0 0; letter-spacing: 0.5px;">
                ${safeCompanyName}
              </h1>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 40px 24px 40px; text-align: center;" class="mobile-padding">
              <h2 style="color: ${colors.text}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;" class="mobile-font-size">
                Sign in to your account
              </h2>
              
              <p style="color: ${colors.text}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to sign in to your account as <strong style="color: ${colors.primary};">${safeEmail}</strong>
              </p>
              
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">
                This secure link will expire in <strong>${expirationMinutes} minutes</strong> for your security.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: ${colors.primary}; text-align: center;" class="button">
                    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 32px; background-color: ${colors.primary}; color: ${colors.cream}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; border: none; transition: all 0.2s ease;" class="mobile-button">
                      Sign in securely
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Alternative access -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center;" class="mobile-padding">
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">
                Having trouble with the button? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: ${colors.primary}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; text-decoration: underline; word-break: break-all;">
                  ${safeUrl}
                </a>
              </p>
            </td>
          </tr>
          
          <!-- Security notice -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${colors.accent}; border-top: 1px solid ${colors.border};" class="mobile-padding">
              <p style="color: ${colors.text}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0; font-weight: 600;">
                🔒 Security Notice
              </p>
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; line-height: 1.5; margin: 0;">
                If you didn't request this sign-in link, please ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid ${colors.border};" class="mobile-padding">
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.4; margin: 0 0 8px 0;">
                Need help? Contact us at <a href="mailto:${safeSupportEmail}" style="color: ${colors.primary}; text-decoration: none;">${safeSupportEmail}</a>
              </p>
              
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.4; margin: 0;">
                &copy; ${new Date().getFullYear()} ${safeCompanyName}. All rights reserved.
              </p>
              
              ${
                safeUnsubscribeUrl
                  ? `
              <p style="color: ${colors.textMuted}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; line-height: 1.4; margin: 16px 0 0 0;">
                <a href="${safeUnsubscribeUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">Unsubscribe</a> from these emails
              </p>
              `
                  : ""
              }
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>

  <!-- Tracking pixel placeholder (for analytics) -->
  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" style="display: block; border: 0;" />

</body>
</html>`;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: parseInt(env.EMAIL_SERVER_PORT, 10),
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const transport = nodemailer.createTransport(provider.server);

        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to Gradio`,
          html: gradioEmailHtml({ url, email: identifier }),
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // If OAuth and user exists with same email, link accounts
      if (account?.provider !== "email" && user?.email) {
        // Find user by email
        const existingUserArr = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        const existingUser = existingUserArr[0];
        if (
          existingUser &&
          account &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !(existingUser as Record<string, any>)[`${account.provider}Id`]
        ) {
          // Link OAuth account to user
          await db
            .update(users)
            .set({ [`${account.provider}Id`]: account.providerAccountId })
            .where(eq(users.id, existingUser.id));
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (!session.user) return session;

      session.user.id = user.id;
      session.user.stripeCustomerId = user.stripeCustomerId;
      session.user.isActive = user.isActive;
      session.user.role = user.role;
      session.user.isSuperAdmin = user.isSuperAdmin;
      console.log("Session user:", session.user);
      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.email || !user.name) return;

      await stripeServer.customers
        .create({
          email: user.email,
          name: user.name,
        })
        .then(async (customer) =>
          db
            .update(users)
            .set({ stripeCustomerId: customer.id })
            .where(eq(users.id, user.id!)),
        );
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
