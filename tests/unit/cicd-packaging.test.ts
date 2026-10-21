import fs from 'fs';
import os from 'os';
import path from 'path';

describe('CI/CD Pipeline & Obsidian Release Packaging', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('maintains synchronized versions across package.json, manifest.json, and versions.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
    const versions = JSON.parse(fs.readFileSync(path.join(rootDir, 'versions.json'), 'utf8'));

    expect(manifest.id).toBe('obsidian-label');
    expect(manifest.version).toBe(pkg.version);
    expect(versions[manifest.version]).toBe(manifest.minAppVersion);
    expect(fs.existsSync(path.join(rootDir, 'styles.css'))).toBe(true);

    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
    expect(readme).toContain('actions/workflows/ci-cd.yml/badge.svg');
    expect(readme).toContain(`img.shields.io/badge/version-v${pkg.version}-blue`);
    expect(readme).toContain('img.shields.io/github/v/release/pirish/obsidian-label');
  });

  it('defines GitHub Actions CI/CD workflow with PR checks, main push tests, and automated Obsidian release', () => {
    const workflowPath = path.join(rootDir, '.github/workflows/ci-cd.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowYaml = fs.readFileSync(workflowPath, 'utf8');
    expect(workflowYaml).toContain('pull_request:');
    expect(workflowYaml).toContain('branches:\n      - main');
    expect(workflowYaml).toContain('npm run test:coverage');
    expect(workflowYaml).toContain('npm run package');
    expect(workflowYaml).toContain('gh release create');
    expect(workflowYaml).toContain('obsidian-label-${VERSION}.zip');
  });

  it('synchronizes version files and computes SemVer increments via version-bump.mjs', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-label-ver-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'obsidian-label', version: '0.1.0' }, null, 2),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'manifest.json'),
        JSON.stringify({ id: 'obsidian-label', version: '0.1.0', minAppVersion: '1.0.0' }, null, 2),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'versions.json'),
        JSON.stringify({ '0.1.0': '1.0.0' }, null, 2),
      );

      const { execFileSync } = await import('child_process');
      const out = execFileSync(
        process.execPath,
        [path.join(rootDir, 'scripts/version-bump.mjs'), 'minor'],
        {
          cwd: tmpDir,
          encoding: 'utf8',
        },
      ).trim();

      expect(out).toBe('0.2.0');

      const updatedPkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
      const updatedManifest = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'manifest.json'), 'utf8'),
      );
      const updatedVersions = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'versions.json'), 'utf8'),
      );

      expect(updatedPkg.version).toBe('0.2.0');
      expect(updatedManifest.version).toBe('0.2.0');
      expect(updatedVersions['0.2.0']).toBe('1.0.0');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('produces valid Obsidian release artifacts (main.js, manifest.json, styles.css, and .zip)', async () => {
    const { execFileSync } = await import('child_process');
    execFileSync(process.execPath, [path.join(rootDir, 'scripts/package-plugin.mjs')], {
      cwd: rootDir,
      stdio: 'ignore',
    });

    const releaseDir = path.join(rootDir, 'release');
    expect(fs.existsSync(path.join(releaseDir, 'main.js'))).toBe(true);
    expect(fs.existsSync(path.join(releaseDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(releaseDir, 'styles.css'))).toBe(true);
    expect(fs.existsSync(path.join(releaseDir, 'versions.json'))).toBe(true);
    expect(fs.existsSync(path.join(releaseDir, 'obsidian-label.zip'))).toBe(true);

    const zipBuf = fs.readFileSync(path.join(releaseDir, 'obsidian-label.zip'));
    // Verify PKZIP magic header (0x50 0x4b 0x03 0x04 = "PK\x03\x04")
    expect(zipBuf.subarray(0, 4).toString('binary')).toBe('PK\x03\x04');

    // Verify bundled main.js exports the ObsidianLabelPlugin constructor
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BundledPlugin = require(path.join(releaseDir, 'main.js'));
    expect(typeof BundledPlugin).toBe('function');
  });
});
