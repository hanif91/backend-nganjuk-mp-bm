import db, { dbBacameter } from "../database/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { validationResult } from "express-validator";
import {
  createSession,
  generateSessionToken,
  CekSessionUserId,
  validateSessionToken,
  invalidateSession,
} from "../lib/session.js";
import "dotenv/config";
import { sendEmail } from "../lib/mail.js";
import jwt from "jsonwebtoken";
import configDb from "../knexfile.js";

const BASE_URL = process.env.BASE_URL;
const SCREET_KEY = process.env.JWT_SECRET_KEY;
const SCREET_KEY_BCM = process.env.JWT_SECRET_KEY_BACAMETER;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
async function validateSession(req, res) {
  try {
    const sessionId = await req.auth.sessionId;
    const session = await validateSessionToken(sessionId);

    if (session.session === null) {
      return res.status(401).json(session);
    }

    res.status(202).json(session);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors,
      });
    }
    const { username, password } = await req.body;
    const user = await db
      .select("*")
      .from("user")
      .where("id", username)
      .first();
    if (typeof user === "undefined") {
      return res.status(401).json({
        success: false,
        message: "Username or password is incorrect",
      });
    }
    const passwordMd5 = crypto.createHash("md5").update(password).digest("hex");

    const isPasswordMatch = user.pass == passwordMd5 ? true : false;

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Username or password is incorrect",
      });
    }

    await db("session").where("userid", user.id).del();

    const sessionId = generateSessionToken();
    const tokenNew = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        jabatan: user.bag,
        cabang: user.cab,
      },
      SCREET_KEY,
    );
    const resCreateSession = await createSession(tokenNew, user.id);
    const session = {
      session: resCreateSession,
      user: {
        id: user.id,
        nama: user.nama,
        jabatan: user.bag,
        lv: user.lv,
        cabang: user.cabang,
      },
    };
    res.status(200).json(session);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
    // console.log(err)
    // throw err
  }
}

async function logout(req, res) {
  try {
    const { token_session } = await req.auth;

    if (!token_session) {
      return res.status(401).json({
        success: false,
        message: "Token Invalid",
      });
    }
    const session = await db
      .select("*")
      .from("session")
      .where("token", token_session)
      .first();
    if (typeof session === "undefined") {
      return res.status(401).json({
        success: false,
        message: "Token Invalid",
      });
    }
    invalidateSession(session.id);
    res.status(200).json({
      success: true,
      message: "LogOut Succesfull",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
    // console.log(err)
    // throw err
  }
}

async function forgotPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors,
      });
    }
    const { email } = req.body;

    const oldUser = await db
      .select("*")
      .from("web_public_user")
      .where("email", email)
      .first();
    console.log(oldUser);
    if (!oldUser) {
      return res.status(422).json({
        success: false,
        message: "user email not exists",
      });
    }
    const randomstring = Math.random().toString(36).slice(-8);
    const message = `Your New Password Is : ${randomstring}   please login to a Mobile app and reset password from a profile page`;
    const receipients = `<${email}>`;
    const subject = "Reset Password Tidham";

    sendEmail({ receipients, subject, message });
    const hashedPassword = bcrypt.hashSync(randomstring, 10);

    await db("web_public_user")
      .where({ id: oldUser.id })
      .update({ password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "New Password Send To email. Check Email",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
    // console.log(err)
    // throw err
  }
}

async function loginPetugas(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors,
      });
    }
    const { user, pass } = req.body;
    const userPetugas = await db
      .select("*")
      .from("user")
      .where("id", user)
      .first();

    if (typeof userPetugas === "undefined") {
      return res.status(401).json({
        success: false,
        message: "Username or password is incorrect",
      });
    }

    const passwordMd5 = crypto.createHash("md5").update(pass).digest("hex");
    const isPasswordMatch = userPetugas.pass == passwordMd5 ? true : false;

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Username or password is incorrect",
      });
    }

    const token = jwt.sign(
      {
        id: userPetugas.id,
        nama: userPetugas.nama,
        jabatan: userPetugas.bag,
        cabang: userPetugas.cab,
      },
      SCREET_KEY,
    );

    const session = {
      access_token: token,
      expiresIn: JWT_EXPIRES_IN,
      token_type: "Bearer",
      user: {
        id: userPetugas.id,
        nama: userPetugas.nama,
        jabatan: userPetugas.bag,
        lv: userPetugas.lv,
        cabang: userPetugas.cabang,
      },
    };

    res.status(200).json(session);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function loginPetugasBacameter(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors,
      });
    }
    const { user, pass } = req.body;

    const userPetugas = await dbBacameter("pm")
      .select("*")
      .whereRaw("LOWER(petugas) = ?", [user.toLowerCase()])
      .first();

    if (typeof userPetugas === "undefined") {
      return res.status(401).json({
        success: false,
        message: "User tida ditemukan",
      });
    }

    const token = jwt.sign(
      {
        nama: userPetugas.petugas,
        un: userPetugas.un,
        nm_un: userPetugas.nm_un,
      },
      SCREET_KEY_BCM,
    );

    const session = {
      access_token: token,
      expiresIn: JWT_EXPIRES_IN,
      token_type: "Bearer",
      user: {
        nama: userPetugas.petugas,
        un: userPetugas.un,
        nm_un: userPetugas.nm_un,
      },
    };

    res.status(200).json(session);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function generate_token(req, res) {
  try {
    const { user, password, kodeloket } = req.body;
    if (
      typeof user === "undefined" ||
      typeof password === "undefined" ||
      typeof kodeloket === "undefined"
    ) {
      return res.status(422).json({
        success: false,
        message: "user, password and kodeloket is required",
      });
    }
    const userMitra = await db
      .select("*")
      .from("users")
      .where({
        username: user,
        password: password,
        is_active: 1,
        is_user_ppob: 1,
      })
      .first();
    if (typeof userMitra === "undefined") {
      return res.status(404).json({
        success: false,
        message: "User or password is incorrect",
      });
    }

    const loket = await db
      .select("*")
      .from("user_loket")
      .leftJoin("loket", "user_loket.loket_id", "loket.id")
      .whereRaw(
        "user_loket.user_id = ? and user_loket.aktif = ? and loket.kodeloket = ?",
        [userMitra.id, 1, kodeloket],
      )
      .first();

    if (typeof loket === "undefined") {
      return res.status(404).json({
        success: false,
        message: "Loket User Tidak Terdaftar ",
      });
    }
    const token = jwt.sign(
      {
        id: userMitra.id,
        username: userMitra.username,
        nama: userMitra.nama,
        kodeloket: loket.kodeloket,
      },
      SCREET_KEY,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.status(200).json({
      succces: true,
      message: "berhasil login",
      data: {
        access_token: token,
        expiresIn: JWT_EXPIRES_IN,
        token_type: "Bearer",
        users: {
          id: userMitra.id,
          username: userMitra.username,
          nama: userMitra.nama,
          kodeloket: loket.kodeloket,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: dataRespons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export {
  login,
  validateSession,
  logout,
  forgotPassword,
  loginPetugas,
  generate_token,
  loginPetugasBacameter,
};
