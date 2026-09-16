// IMPORTANT: MSW handler code runs inside the page's own JS realm (the
// service worker forwards intercepted requests to the page and runs your
// handler there) -- so any plain in-memory Map used as "server-side"
// session state gets wiped on every full page reload, even though
// localStorage (and a real backend's database) would survive fine.
//
// Fix: make these tokens self-contained, the way a real JWT actually is --
// decode the user id straight out of the token string instead of looking
// it up in a Map. This is a closer mock of real JWT behavior anyway (a
// real access token doesn't need a server-side lookup to validate).
//
// A denylist for logout/revocation is kept in sessionStorage (not a plain
// Map) specifically so it survives reload within the same tab too.

function encodeToken(prefix, userId) {
  const payload = btoa(JSON.stringify({ uid: userId, iat: Date.now() }));
  const random = Math.random().toString(36).slice(2);
  return `${prefix}.${payload}.${random}`;
}

function decodeUserId(token) {
  try {
    const [, payload] = token.split(".");
    const { uid } = JSON.parse(atob(payload));
    return uid;
  } catch {
    return null;
  }
}

function getDenylist() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem("mock.revokedRefreshTokens") || "[]"));
  } catch {
    return new Set();
  }
}

function saveDenylist(set) {
  sessionStorage.setItem("mock.revokedRefreshTokens", JSON.stringify([...set]));
}

export function issueTokenPair(userId) {
  return {
    access: encodeToken("mockaccess", userId),
    refresh: encodeToken("mockrefresh", userId),
  };
}

export function rotateAccessToken(refreshToken) {
  if (getDenylist().has(refreshToken)) return null;
  const userId = decodeUserId(refreshToken);
  if (!userId) return null;
  return { access: encodeToken("mockaccess", userId) };
}

export function userIdForAccessToken(accessToken) {
  return decodeUserId(accessToken);
}

export function revokeRefreshToken(refreshToken) {
  const denylist = getDenylist();
  denylist.add(refreshToken);
  saveDenylist(denylist);
}

export function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}
