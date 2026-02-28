const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const dirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(migrationsDir, d.name));

for (const dir of dirs) {
  const sqlPath = path.join(dir, 'migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.log('Removing empty migration dir:', path.basename(dir));
    fs.rmSync(dir, { recursive: true });
  }
}
console.log('Done.');
