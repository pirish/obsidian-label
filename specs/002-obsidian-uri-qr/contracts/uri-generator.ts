/**
 * Contract: Obsidian URI Generator
 * Feature: 002-obsidian-uri-qr
 */

import { ValidationResult } from '../../../src/core/types';

/**
 * Input configuration for constructing an Obsidian URI.
 */
export interface ObsidianURIConfig {
  /** Target vault name (required) */
  vault: string;
  /** Relative note path from vault root (e.g. "Folder/Note.md") (required) */
  filePath: string;
  /** Optional heading (#Heading) or block identifier (^blockid) */
  subpath?: string;
}

/**
 * Minimal Obsidian App interface subset required for native URI generation.
 */
export interface MinimalObsidianApp {
  getObsidianUrl(file: MinimalTFile): string;
}

/**
 * Minimal Obsidian TFile interface subset.
 */
export interface MinimalTFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
}

/**
 * Validates the parameters of an ObsidianURIConfig.
 *
 * @param config The URI configuration to validate
 * @returns ValidationResult containing isValid flag and structured error array
 */
export declare function validateURIConfig(config: ObsidianURIConfig): ValidationResult;

/**
 * Generates an RFC 3986 compliant Obsidian URI.
 * Operates offline with zero external network dependencies.
 *
 * @param vault Vault name (e.g., "Personal Vault")
 * @param filePath Relative path to note (e.g., "Projects/My Note.md")
 * @param subpath Optional heading or block reference
 * @returns Standardized URI string: obsidian://open?vault=<vault>&file=<path>
 * @throws Error if vault or filePath validation fails
 */
export declare function generateObsidianURI(
  vault: string,
  filePath: string,
  subpath?: string
): string;

/**
 * Native Obsidian helper: generates the Obsidian URI using Obsidian's
 * built-in app.getObsidianUrl(file) method if available, falling back to
 * generateObsidianURI.
 *
 * @param app Obsidian App instance
 * @param file Active TFile instance
 * @returns Canonical Obsidian URI
 */
export declare function generateNativeObsidianURI(
  app: MinimalObsidianApp | undefined,
  file: MinimalTFile,
  vaultFallback?: string
): string;
