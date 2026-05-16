const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

function escapeForEnv(pem) {
  return pem.replace(/\r?\n/g, '\\n');
}

const access = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const refresh = generateKeyPairSync('ec', {
  namedCurve: 'secp521r1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const envPath = path.resolve(__dirname, '..', '.env');
let env = fs.readFileSync(envPath, 'utf8');

const accessPriv = escapeForEnv(access.privateKey);
const accessPub = escapeForEnv(access.publicKey);
const refreshPriv = escapeForEnv(refresh.privateKey);
const refreshPub = escapeForEnv(refresh.publicKey);

// Replace the entire AUTHENTICATION & SECURITY block to avoid leftover lines
const anchorText = '# AUTHENTICATION & SECURITY';
const anchorPos = env.indexOf(anchorText);
if (anchorPos === -1) {
  throw new Error('Could not find AUTHENTICATION & SECURITY anchor in .env');
}

// Find the start of the preceding separator line
const sepLine = '################################################################################';
const startIndex = env.lastIndexOf(sepLine, anchorPos);
if (startIndex === -1) {
  throw new Error('Could not find preceding separator line for AUTHENTICATION block');
}

// Find end marker at ADMIN_SIGNUP_KEY (we'll preserve it)
const endMarker = '\nADMIN_SIGNUP_KEY=';
const endIndex = env.indexOf(endMarker, anchorPos);
if (endIndex === -1) {
  throw new Error('Could not find ADMIN_SIGNUP_KEY marker in .env');
}

const before = env.slice(0, startIndex);
const after = env.slice(endIndex + 1); // keep the 'A' of ADMIN_SIGNUP_KEY for reinsertion

const newBlock = `################################################################################\n# AUTHENTICATION & SECURITY\n################################################################################\nBCRYPT_ROUNDS=10\nJWT_ACCESS_EXPIRES_IN=15m\nJWT_REFRESH_EXPIRES_IN=7d\nJWT_ACCESS_PRIVATE_KEY=${accessPriv}\nJWT_ACCESS_PUBLIC_KEY=${accessPub}\nJWT_REFRESH_PRIVATE_KEY=${refreshPriv}\nJWT_REFRESH_PUBLIC_KEY=${refreshPub}\n`;

env = before + newBlock + after;

fs.writeFileSync(envPath, env, 'utf8');
console.log('Replaced AUTHENTICATION & SECURITY block in .env with generated keys');
console.log({ JWT_ACCESS_PRIVATE_KEY: accessPriv.slice(0, 80) + '...'});
