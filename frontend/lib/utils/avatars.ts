/**
 * Avatar Bank — 50 unique seeds, deterministic assignment by user ID, role-based styles.
 * Client-only: no server calls. Uses DiceBear CDN (free, no auth needed).
 */

// 50 unique seeds
const AVATAR_SEEDS = [
  'alpha', 'bravo', 'charlie', 'delta', 'echo',
  'foxtrot', 'golf', 'hotel', 'india', 'juliet',
  'kilo', 'lima', 'mike', 'november', 'oscar',
  'papa', 'quebec', 'romeo', 'sierra', 'tango',
  'uniform', 'victor', 'whiskey', 'xray', 'yankee',
  'zulu', 'amber', 'blaze', 'cedar', 'drift',
  'ember', 'fable', 'grove', 'haven', 'ivory',
  'jade', 'knoll', 'lunar', 'mango', 'nexus',
  'orbit', 'prism', 'quartz', 'ridge', 'solstice',
  'terra', 'umbra', 'vortex', 'willow', 'zenith',
];

// DiceBear v9 styles per role — each role gets a distinct visual identity
const ROLE_STYLE: Record<string, string> = {
  creator: 'avataaars',   // Colorful cartoon — expressive creators
  sme: 'micah',           // Clean line-art — professional SMEs
  admin: 'bottts',        // Robot/tech — platform admins
  user: 'thumbs',         // Simple illustrated — generic users
};

// Role-specific background color sets for DiceBear
const ROLE_BG: Record<string, string> = {
  creator: 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
  sme:     'EFF4FF,D3E4FE,E5EEFF',
  admin:   '0B1C30,006D32,1e3a5f',
  user:    'f0f0f0,e8e8e8,d4d4d4',
};

/** Simple string hash → number (no external deps) */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns a deterministic DiceBear avatar URL for a user.
 * Same user ID + role always returns the same avatar.
 */
export function getAvatarUrl(userId: string, role: string, displayName?: string): string {
  // Use a combination of ID and optional display name for maximum uniqueness
  const seed = userId || displayName || 'default-seed';
  const style = ROLE_STYLE[role] || ROLE_STYLE.user;
  const bg = ROLE_BG[role] || ROLE_BG.user;

  // DiceBear handles the randomness based on the seed string itself. 
  // Direct seeding provides millions of unique variations.
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=8`;
}

/**
 * Returns a DiceBear avatar URL as an <img> src.
 * DiceBear returns SVG — works in any <img> tag.
 */
export function getAvatarSrc(userId: string, role: string, displayName?: string): string {
  return getAvatarUrl(userId, role, displayName);
}

/** Role display label */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    creator: 'Creator',
    sme: 'SME Partner',
    admin: 'Administrator',
    user: 'Member',
  };
  return labels[role] ?? role;
}
