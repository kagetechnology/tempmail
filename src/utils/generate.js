const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ADJECTIVES = ['swift','dark','cool','bright','silent','hidden','quick','lucky','brave','calm'];
const NOUNS = ['fox','wolf','hawk','bear','tiger','eagle','panda','lion','cat','owl'];

export function generateRandomEmail(domain) {
  // Format: adj-noun-XXXX@domain (e.g. swift-fox-k2m9@kagemail.my.id)
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const suffix = Array.from(arr).map(b => CHARS[b % CHARS.length]).join('');
  return `${adj}-${noun}-${suffix}@${domain}`;
}

export function validateLocalPart(name) {
  // Only alphanumeric, dots, hyphens, underscores. 3-30 chars.
  return /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/.test(name.toLowerCase());
}

export function normalizeLocalPart(name) {
  return name.toLowerCase().trim();
}
