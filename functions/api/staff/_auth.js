
const enc = new TextEncoder();

export const permissions = [
  'chat_reply',
  'orders_view',
  'payment_change',
  'orders_cancel',
  'orders_edit',
  'refund_request',
  'ticket_assign',
  'pin_recovery'
];

export const result = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });

export const originOK = req =>
  req.headers.get('Origin') === new URL(req.url).origin;

const hex = bytes =>
  Array.from(
    new Uint8Array(bytes),
    x => x.toString(16).padStart(2, '0')
  ).join('');

const unhex = s =>
  new Uint8Array(
    s.match(/../g).map(x => parseInt(x, 16))
  );

export async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return hex(
    await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(value)
    )
  );
}

export async function verify(value, signature, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    'HMAC',
    key,
    unhex(signature),
    enc.encode(value)
  );
}

export async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return hex(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: unhex(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    )
  );
}

export function newSalt() {
  return hex(
    crypto.getRandomValues(new Uint8Array(16))
  );
}

export async function staffAuth(request, env) {
  if (!env.DB || !env.ADMIN_SESSION_SECRET) return null;

  const cookie = (request.headers.get('Cookie') || '')
    .split(';')
    .map(x => x.trim())
    .find(x => x.startsWith('dd_staff='));

  if (!cookie) return null;

  const m =
    /^dd_staff=([a-f0-9-]{36})\.(\d+)\.(\d+)\.([a-f0-9]{64})$/.exec(cookie);

  if (!m || Number(m[2]) <= Date.now() / 1000) return null;

  const payload = `${m[1]}.${m[2]}.${m[3]}`;

  if (!await verify(
    payload,
    m[4],
    env.ADMIN_SESSION_SECRET
  )) return null;

  const staff = await env.DB.prepare(
    'SELECT id,username,display_name,permissions_json,active,session_version FROM dd_support_staff WHERE id=?'
  ).bind(m[1]).first();

  if (
    !staff ||
    !staff.active ||
    staff.session_version !== Number(m[3])
  ) return null;

  try {
    staff.permissions = JSON.parse(staff.permissions_json);
  } catch {
    staff.permissions = [];
  }

  return staff;
}

export const can = (staff, permission) =>
  staff?.permissions?.includes(permission);

export async function audit(
  env,
  actorType,
  actorId,
  action,
  targetId = null,
  details = null
) {
  await env.DB.prepare(
    'INSERT INTO dd_support_audit(id,actor_type,actor_id,action,target_id,details) VALUES(?,?,?,?,?,?)'
  ).bind(
    crypto.randomUUID(),
    actorType,
    actorId,
    action,
    targetId,
    details
  ).run();
}
