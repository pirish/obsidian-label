#!/usr/bin/env node
/**
 * Builds and packages the Obsidian Label plugin into a ready-to-install Obsidian release.
 * Produces:
 *   - release/main.js
 *   - release/manifest.json
 *   - release/styles.css
 *   - release/versions.json
 *   - release/obsidian-label-<version>.zip
 *   - release/obsidian-label.zip
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const EXTERNAL_MODULES = new Set([
  'obsidian',
  'electron',
  'fs',
  'path',
  'os',
  'child_process',
  'crypto',
  'stream',
  'util',
  'events',
  'buffer',
  'url',
  'http',
  'https',
  'zlib',
  'assert',
  'tty',
  'net',
  'tls',
  'worker_threads',
]);

/**
 * Computes standard CRC32 for ZIP archive entries.
 */
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Creates a standard PKZIP (.zip) buffer from an array of { name: string, data: Buffer } entries.
 */
export function createZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const uncompressed = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const compressed = zlib.deflateRawSync(uncompressed);
    const checksum = crc32(uncompressed);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // compression method: deflate
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // relative offset

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir start disk
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localParts, centralBuffer, eocd]);
}

/**
 * Bundles compiled dist/ modules and runtime npm dependencies into a single self-contained main.js
 * compatible with Obsidian's CommonJS plugin loader.
 */
export function bundlePluginMainJs(rootDir) {
  const distDir = path.join(rootDir, 'dist');
  const entryFile = path.join(distDir, 'main.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`Compiled entrypoint not found at ${entryFile}. Run "npm run build" first.`);
  }

  const modules = new Map();
  const visited = new Set();

  function normalizeModuleId(absPath) {
    return path.relative(rootDir, absPath).replace(/\\/g, '/');
  }

  function traceFile(absFilePath) {
    const realFile = fs.realpathSync(absFilePath);
    if (visited.has(realFile)) return normalizeModuleId(realFile);
    visited.add(realFile);

    const modId = normalizeModuleId(realFile);
    let code = fs.readFileSync(realFile, 'utf8');
    const fileRequire = createRequire(realFile);

    // Rewrite require('...') calls to resolved module IDs unless external
    const requireRegex = /\brequire\(\s*(['"])([^'"]+)\1\s*\)/g;
    code = code.replace(requireRegex, (fullMatch, quote, spec) => {
      const cleanSpec = spec.replace(/^node:/, '');
      if (EXTERNAL_MODULES.has(cleanSpec) || EXTERNAL_MODULES.has(spec)) {
        return fullMatch;
      }

      try {
        const resolved = fileRequire.resolve(spec);
        // Skip native binary addons (.node)
        if (resolved.endsWith('.node')) {
          return fullMatch;
        }
        const childId = traceFile(resolved);
        return `__obs_require__(${JSON.stringify(childId)})`;
      } catch {
        return fullMatch;
      }
    });

    modules.set(modId, code);
    return modId;
  }

  const entryId = traceFile(entryFile);

  const moduleEntries = [];
  for (const [id, code] of modules.entries()) {
    if (id.endsWith('.json')) {
      moduleEntries.push(
        `  ${JSON.stringify(id)}: function(module) {\n    module.exports = ${code.trim()};\n  }`,
      );
    } else {
      moduleEntries.push(
        `  ${JSON.stringify(id)}: function(module, exports, __obs_require__, __filename, __dirname) {\n${code}\n  }`,
      );
    }
  }

  const bundleSource = `/*
 * Obsidian Label Plugin - Bundled Release Artifact (main.js)
 * Generated automatically by scripts/package-plugin.mjs
 */
"use strict";
var __native_require__ = typeof require === "function" ? require : function(id) {
  throw new Error("Dynamic require of " + id + " is not supported");
};
var __modules__ = {
${moduleEntries.join(',\n')}
};
var __cache__ = {};
function __obs_require__(id) {
  if (__cache__[id]) {
    return __cache__[id].exports;
  }
  if (!Object.prototype.hasOwnProperty.call(__modules__, id)) {
    return __native_require__(id);
  }
  var module = { id: id, loaded: false, exports: {} };
  __cache__[id] = module;
  __modules__[id](module, module.exports, __obs_require__, id, "");
  module.loaded = true;
  return module.exports;
}
var __entry__ = __obs_require__(${JSON.stringify(entryId)});
var __exported__ = (__entry__ && __entry__.__esModule && __entry__.default) ? __entry__.default : __entry__;
if (typeof __exported__ === "function" && __entry__ && typeof __entry__ === "object") {
  Object.assign(__exported__, __entry__);
}
module.exports = __exported__;
`;

  return bundleSource;
}

export function packageObsidianPlugin(rootDir = process.cwd(), options = { runTsc: true }) {
  if (options.runTsc) {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  }

  const manifestPath = path.join(rootDir, 'manifest.json');
  const stylesPath = path.join(rootDir, 'styles.css');
  const versionsPath = path.join(rootDir, 'versions.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json is missing in repository root.');
  }
  if (!fs.existsSync(stylesPath)) {
    throw new Error('styles.css is missing in repository root.');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;
  const pluginId = manifest.id || 'obsidian-label';

  const mainJsContent = bundlePluginMainJs(rootDir);

  // Write root main.js for local Obsidian vault testing
  const rootMainJsPath = path.join(rootDir, 'main.js');
  fs.writeFileSync(rootMainJsPath, mainJsContent, 'utf8');

  // Prepare release directory
  const releaseDir = path.join(rootDir, 'release');
  const pluginStageDir = path.join(releaseDir, pluginId);
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(pluginStageDir, { recursive: true });

  // Copy core Obsidian release files to both release/ and release/obsidian-label/
  fs.writeFileSync(path.join(releaseDir, 'main.js'), mainJsContent, 'utf8');
  fs.copyFileSync(manifestPath, path.join(releaseDir, 'manifest.json'));
  fs.copyFileSync(stylesPath, path.join(releaseDir, 'styles.css'));
  if (fs.existsSync(versionsPath)) {
    fs.copyFileSync(versionsPath, path.join(releaseDir, 'versions.json'));
  }

  fs.writeFileSync(path.join(pluginStageDir, 'main.js'), mainJsContent, 'utf8');
  fs.copyFileSync(manifestPath, path.join(pluginStageDir, 'manifest.json'));
  fs.copyFileSync(stylesPath, path.join(pluginStageDir, 'styles.css'));
  if (fs.existsSync(versionsPath)) {
    fs.copyFileSync(versionsPath, path.join(pluginStageDir, 'versions.json'));
  }

  const zipEntries = [
    { name: `${pluginId}/main.js`, data: Buffer.from(mainJsContent, 'utf8') },
    { name: `${pluginId}/manifest.json`, data: fs.readFileSync(manifestPath) },
    { name: `${pluginId}/styles.css`, data: fs.readFileSync(stylesPath) },
  ];

  if (fs.existsSync(versionsPath)) {
    zipEntries.push({
      name: `${pluginId}/versions.json`,
      data: fs.readFileSync(versionsPath),
    });
  }

  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, path.join(pluginStageDir, 'README.md'));
    zipEntries.push({
      name: `${pluginId}/README.md`,
      data: fs.readFileSync(readmePath),
    });
  }

  // Include optional printer helper scripts in the packaged archive
  const helperScripts = ['scripts/print-label.sh', 'scripts/print-label.ps1'];
  for (const relScript of helperScripts) {
    const absScript = path.join(rootDir, relScript);
    if (fs.existsSync(absScript)) {
      const targetScript = path.join(pluginStageDir, relScript);
      fs.mkdirSync(path.dirname(targetScript), { recursive: true });
      fs.copyFileSync(absScript, targetScript);
      zipEntries.push({
        name: `${pluginId}/${relScript}`,
        data: fs.readFileSync(absScript),
      });
    }
  }

  const zipBuffer = createZipArchive(zipEntries);
  const versionedZipPath = path.join(releaseDir, `${pluginId}-${version}.zip`);
  const latestZipPath = path.join(releaseDir, `${pluginId}.zip`);

  fs.writeFileSync(versionedZipPath, zipBuffer);
  fs.writeFileSync(latestZipPath, zipBuffer);

  return {
    version,
    pluginId,
    releaseDir,
    mainJsPath: path.join(releaseDir, 'main.js'),
    manifestPath: path.join(releaseDir, 'manifest.json'),
    stylesPath: path.join(releaseDir, 'styles.css'),
    versionedZipPath,
    latestZipPath,
    zipSize: zipBuffer.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = packageObsidianPlugin(process.cwd(), { runTsc: true });
  console.log(
    `Packaged ${result.pluginId} v${result.version}: ${path.relative(process.cwd(), result.versionedZipPath)} (${result.zipSize} bytes)`,
  );
}
