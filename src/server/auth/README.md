# Authentication System in EPR-LAPs Frontend

The EPR-LAPs frontend application implements **OAuth 2.0 with OpenID Connect (OIDC)** using **DEFRA ID** as the identity provider.

## Authentication Method

The application uses DEFRA ID as its OIDC provider, configured through the Bell plugin (@hapi/bell) for OAuth 2.0/OIDC protocol handling.

The OIDC configuration is fetched dynamically from DEFRA ID's well-known endpoint.

## Authentication Code Location

The authentication code is organized in the following locations:

### Main Authentication Plugin

- **`src/server/auth/`** - Contains the core authentication routes plugin
  - `index.js` - Registers authentication routes
  - `authorize-oidc.js` - Handles OAuth callback at `/auth-response`
  - `sign-out.js` - Implements sign-out flow
  - `utils.js` - Session management utilities

### Authentication Helpers

- **`src/server/common/helpers/auth/`** - Contains authentication helper modules
  - `defra-id.js` - Configures DEFRA ID OIDC strategy
  - `get-oidc-config.js` - Fetches OIDC configuration
  - `open-id.js` - Creates the OpenID provider configuration
  - `validate.js` - Validates and refreshes user sessions
  - `utils.js` - Session management functions

### Configuration

- **`src/config/config.js`** - Contains DEFRA ID configuration including OIDC URL, client credentials, service ID, scopes, and redirect URL

## How It Works

### 1. Plugin Registration

The server registers three authentication-related plugins: Bell (OAuth/OIDC handler), Cookie (session management), and the custom defraId plugin.

### 2. Authentication Strategies

Two authentication strategies are configured:

- **`defra-id` strategy**: Uses Bell plugin with DEFRA ID OIDC endpoints, includes PKCE (S256) for enhanced security
- **`session` strategy**: Cookie-based session management with automatic validation and token refresh

The session strategy is set as the default authentication strategy.

### 3. Authentication Flow

When a user accesses a protected route, they are redirected to `/auth-response` which initiates the DEFRA ID login.

After successful authentication at DEFRA ID, the user is redirected back to the `/auth-response` endpoint, which processes the authentication and stores the session.

### 4. Session Storage

User sessions are stored in Redis (production) or memory cache (development) with automatic expiration based on the token's expiration time.

Session data includes the user profile, tokens (access token, refresh token, ID token), authentication status, and expiration timestamps.

### 5. Token Refresh

The system automatically validates and refreshes access tokens before they expire (1 minute buffer). If the token has expired, it attempts to refresh using the refresh token.

### 6. Sign Out

Sign out removes the user session from cache and redirects to DEFRA ID's end session endpoint with the ID token hint and post-logout redirect URI.

## Notes

- The application uses **PKCE (Proof Key for Code Exchange)** with SHA-256 for enhanced security in the OAuth flow
- **Scopes requested** include `openid` and `offline_access` (for refresh tokens)
- **Session TTL** is 4 hours by default (14,400,000 milliseconds)
- The authentication system supports automatic token refresh to maintain user sessions seamlessly
- User profile information is extracted from the JWT access token and includes fields like contactId, serviceId, roles, relationships, and enrolment data
- The system uses the `try` authentication mode for the `/auth-response` endpoint to gracefully handle both successful and failed authentication attempts.
