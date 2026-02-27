import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { unlinkSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');
const browser = process.argv[2] || 'chrome';
const outFile = resolve(root, `superflux-${browser}.zip`);

// Remove existing zip
if (existsSync(outFile)) unlinkSync(outFile);

// Use 7z which produces POSIX-compliant paths (forward slashes)
execSync(`7z a -tzip "${outFile}" ./*`, { cwd: dist, stdio: 'inherit' });
console.log(`\nPacked: superflux-${browser}.zip`);
