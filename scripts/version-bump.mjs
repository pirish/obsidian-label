#!/usr/bin/env node
/**
 * Synchronizes SemVer version across package.json, manifest.json, and versions.json.
 * Usage:
 *   node scripts/version-bump.mjs <version|patch|minor|major|--auto|--sync>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)$/;

export function parseSemver(versionStr) {
  const match = String(versionStr || '')
    .trim()
    .match(SEMVER_REGEX);
  if (!match) {
    throw new Error(`Invalid SemVer string: "${versionStr}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

export function incrementSemver(versionStr, bumpType = 'patch') {
  const { major, minor, patch } = parseSemver(versionStr);
  if (bumpType === 'major') {
    return `${major + 1}.0.0`;
  }
  if (bumpType === 'minor') {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

export function detectBumpTypeFromCommitMessage(message) {
  const text = String(message || '');
  if (/BREAKING CHANGE/i.test(text) || /^[a-z]+(\([^)]+\))?!:/m.test(text)) {
    return 'major';
  }
  if (/^feat(\([^)]+\))?:/im.test(text)) {
    return 'minor';
  }
  return 'patch';
}

export function syncVersionFiles(rootDir, targetVersion) {
  parseSemver(targetVersion);
  const cleanVersion = targetVersion.replace(/^v/, '');

  const pkgPath = path.join(rootDir, 'package.json');
  const manifestPath = path.join(rootDir, 'manifest.json');
  const versionsPath = path.join(rootDir, 'versions.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = cleanVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const minAppVersion = manifest.minAppVersion || '1.0.0';
  manifest.version = cleanVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  let versions = {};
  if (fs.existsSync(versionsPath)) {
    versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
  }
  versions[cleanVersion] = minAppVersion;
  fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n', 'utf8');

  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    const updatedReadme = readme.replace(
      /img\.shields\.io\/badge\/version-v\d+\.\d+\.\d+-blue/g,
      `img.shields.io/badge/version-v${cleanVersion}-blue`,
    );
    if (updatedReadme !== readme) {
      fs.writeFileSync(readmePath, updatedReadme, 'utf8');
    }
  }

  return {
    version: cleanVersion,
    minAppVersion,
  };
}

export function resolveNextVersionFromGit(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const pkgVersion = pkg.version || '0.1.0';

  let latestTag = null;
  try {
    const rawTags = execSync('git tag --list --sort=-v:refname', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter((t) => SEMVER_REGEX.test(t));

    if (rawTags.length > 0) {
      latestTag = rawTags[0].replace(/^v/, '');
    }
  } catch {
    latestTag = null;
  }

  let commitMessage = '';
  try {
    const range = latestTag ? `HEAD` : '-1';
    commitMessage = execSync(`git log -1 --pretty=%B ${range}`, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    commitMessage = '';
  }

  const bumpType = detectBumpTypeFromCommitMessage(commitMessage);

  if (!latestTag) {
    return incrementSemver(pkgVersion, bumpType);
  }

  // If package.json was manually bumped above the latest tag, use package.json's version
  if (compareSemver(pkgVersion, latestTag) > 0) {
    return pkgVersion;
  }

  return incrementSemver(latestTag, bumpType);
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const arg = process.argv[2] || '--sync';
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

  let targetVersion = pkg.version;
  if (arg === '--auto') {
    targetVersion = resolveNextVersionFromGit(rootDir);
  } else if (arg === '--sync') {
    targetVersion = pkg.version;
  } else if (['patch', 'minor', 'major'].includes(arg)) {
    targetVersion = incrementSemver(pkg.version, arg);
  } else if (SEMVER_REGEX.test(arg)) {
    targetVersion = arg.replace(/^v/, '');
  } else {
    console.error(
      `Usage: node scripts/version-bump.mjs <version|patch|minor|major|--auto|--sync>`,
    );
    process.exit(1);
  }

  const result = syncVersionFiles(rootDir, targetVersion);
  process.stdout.write(`${result.version}\n`);
}
