import { type Configuration } from '@azure/msal-browser';

/**
 * Microsoft Graph permission scopes we request.
 * Calendars.ReadWrite lets us read the user's calendar and create events.
 */
export const GRAPH_SCOPES = ['User.Read', 'Calendars.ReadWrite'];

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

const clientId = import.meta.env.VITE_MS_CLIENT_ID as string | undefined;
const tenantId = (import.meta.env.VITE_MS_TENANT_ID as string | undefined) ?? 'common';

/**
 * Graph integration is only active when an Azure app client ID is provided
 * at build time via VITE_MS_CLIENT_ID. Without it, the app falls back to the
 * fully-functional mock Outlook calendar.
 */
export const isGraphConfigured = Boolean(clientId);

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? 'not-configured',
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};
