import { MinimalObsidianApp, MinimalTFile, ObsidianURIConfig } from './types';
import { validateURIConfig } from './validator';

/**
 * Encodes a query parameter value according to RFC 3986.
 * Standard encodeURIComponent does not encode !'()*; this function encodes them.
 */
export function encodeURIParam(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Normalizes a relative note file path:
 * - Converts backward slashes to forward slashes
 * - Strips leading slashes (to prevent %2F prefixes in Obsidian URIs)
 * - Strips trailing whitespace
 */
export function normalizeNotePath(filePath: string): string {
  let normalized = filePath.trim().replace(/\\/g, '/');
  // Strip all leading slashes
  normalized = normalized.replace(/^\/+/, '');
  return normalized;
}

/**
 * Generates an RFC 3986 compliant Obsidian URI.
 * Operates 100% offline with zero external network connectivity.
 *
 * @param vault Vault name (e.g. "Personal" or "Work & Life")
 * @param filePath Vault-relative path (e.g. "Projects/Notes.md" or "MyNote.md")
 * @param subpath Optional heading anchor (#Heading) or block identifier (^blockid)
 * @returns Canonical URI formatted as obsidian://open?vault=<vault>&file=<path>
 * @throws Error if validation fails
 */
export function generateObsidianURI(vault: string, filePath: string, subpath?: string): string {
  const config: ObsidianURIConfig = { vault, filePath, subpath };
  const validation = validateURIConfig(config);

  if (!validation.isValid) {
    const errorMsg = validation.errors[0]?.message || 'Invalid URI configuration.';
    throw new Error(errorMsg);
  }

  const cleanVault = vault.trim();
  let cleanPath = normalizeNotePath(filePath);

  if (subpath && subpath.trim().length > 0) {
    cleanPath += subpath.trim();
  }

  const encodedVault = encodeURIParam(cleanVault);
  const encodedFile = encodeURIParam(cleanPath);

  return `obsidian://open?vault=${encodedVault}&file=${encodedFile}`;
}

/**
 * Generates an Obsidian URI using Obsidian's native app.getObsidianUrl API
 * when running within Obsidian, falling back to generateObsidianURI for standalone/tests.
 *
 * @param app MinimalObsidianApp instance (optional)
 * @param file MinimalTFile instance (required)
 * @param vaultFallback Vault name fallback if app is undefined
 * @returns Canonical Obsidian URI
 * @throws Error if app is unavailable and vaultFallback is missing
 */
export function generateNativeObsidianURI(
  app: MinimalObsidianApp | undefined,
  file: MinimalTFile,
  vaultFallback?: string,
): string {
  if (app && typeof app.getObsidianUrl === 'function') {
    return app.getObsidianUrl(file);
  }

  if (vaultFallback && vaultFallback.trim().length > 0) {
    return generateObsidianURI(vaultFallback, file.path);
  }

  throw new Error('Cannot generate Obsidian URI without an active App instance or vaultFallback.');
}
