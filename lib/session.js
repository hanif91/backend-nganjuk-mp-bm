import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import db from "../database/db.js";

function generateSessionToken() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

async function validateSession(token) {
  const session = await validateSessionToken(token);
  if (session.session === null) {
    return false;
  }
  return true;
}

function deleteSessionTokenCookie() {
  cookies().set("session", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

async function createSession(token, userid) {
  const id = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session = {
    id: id,
    token: token,
    userid,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  const resSession = {
    id: id,
    token: token,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  const sessionCreate = await db("session").insert(session);

  return resSession;
}

async function CekSessionUserId(userid) {
  const result = await db
    .select(
      "session.id",
      "session.token",
      "session.expires_at",
      "session.userid",
      "user.nama",
      "user.bag",
      "user.cab",
      "user.lv",
    )
    .from("session")
    .innerJoin("user", "session.userid", "user.id")
    .where("session.userid", userid)
    .orderBy("session.expires_at", "desc", "last")
    .first();

  if (!result) {
    return { session: null, user: null };
  }

  const user = {
    id: result.userid,
    nama: result.nama,
    bagian: result.bagian,
    cabang: result.cabang,
    lv: result.lv,
  };

  const session = {
    id: result.id,
    token: result.token,
    expires_at: result.expires_at,
  };

  if (Date.now() >= session.expires_at.getTime()) {
    await db("session").where("id", session.id).del();
    return { session: null, user: null };
  }
  if (Date.now() >= result.expires_at.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db("session").where("id", session.id).update({
      expires_at: session.expires_at,
    });
  }
  return { session: session, user: user };
}

async function validateSessionToken(token) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const result = await db
    .select(
      "session.id",
      "session.token",
      "session.expires_at",
      "session.userid",
      "user.nama",
      "user.bag",
      "user.lv",
      "user.cab",
    )
    .from("session")
    .innerJoin("user", "session.userid", "user.id")
    .where("session.id", sessionId)
    .first();

  // console.log(result)
  if (!result) {
    return { session: null, user: null };
  }

  const user = {
    id: result.userid,
    nama: result.nama,
    bagian: result.bag,
    lv: result.lv,
    cabang: result.cab,
  };

  const session = {
    id: result.id,
    token: token,
    expires_at: result.expires_at,
  };

  if (Date.now() >= session.expires_at.getTime()) {
    await db("session").where("id", session.id).del();
    return { session: null, user: null };
  }
  if (Date.now() >= result.expires_at.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db("session").where("id", session.id).update({
      expires_at: session.expires_at,
    });
  }
  return { session, user };
}

async function invalidateSession(sessionId) {
  await db("session").where("id", sessionId).del();
}

export {
  generateSessionToken,
  validateSessionToken,
  createSession,
  invalidateSession,
  CekSessionUserId,
  validateSession,
};
