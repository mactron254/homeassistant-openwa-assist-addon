'use strict';

const fs = require('node:fs');

const [, , file, key, fallback = ''] = process.argv;

function readPath(value, dottedKey) {
  return dottedKey.split('.').reduce((current, part) => (current && Object.prototype.hasOwnProperty.call(current, part) ? current[part] : undefined), value);
}

try {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const value = readPath(data, key);
  if (value === undefined || value === null) {
    process.stdout.write(fallback);
  } else if (typeof value === 'object') {
    process.stdout.write(JSON.stringify(value));
  } else {
    process.stdout.write(String(value));
  }
} catch {
  process.stdout.write(fallback);
}

