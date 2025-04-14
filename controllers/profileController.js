import db from "../database/db.js";
import { validateSessionToken } from "../lib/session.js";
import { validationResult } from "express-validator";
import { updatePelRule } from "../validation/profileValidation.js";
import bcrypt from "bcrypt";

const compareArrays = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

async function getProfile(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const pelangganRes = await db
      .select(
        "webnomor.id as idnomoruser",
        "webnomor.nosamb",
        "webnomor.id_user",
        "pelanggan.nama",
        "pelanggan.alamat",
        "pelanggan.aktif"
      )
      .from("web_nomor_pelanggan as webnomor")
      .innerJoin("pelanggan", "pelanggan.nosamb", "webnomor.nosamb")
      .where("webnomor.id_user", session.user.id);

    const pelangganResTrim = pelangganRes.map((val) => {
      const result = {
        idnomoruser: val.idnomoruser,
        nosamb: val.nosamb.trim(),
        nama: val.nama.trim(),
        alamat: val.alamat.trim(),
        aktif: val.aktif,
      };
      return result;
    });

    const dataRespons = {
      ...session.user,
      pelanggan: pelangganResTrim,
    };

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

async function updateNopelanggan(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: errors,
      });
    }
    const bodyNopel = await req.body.no_pelanggan;
    const jmlCountbodyNopel = bodyNopel.length;

    const pelangganRes = await db
      .select("*")
      .from("pelanggan")
      .whereIn("nosamb", bodyNopel);

    const jmlCountpelangganRes = pelangganRes.length;

    if (jmlCountbodyNopel !== jmlCountpelangganRes) {
      return res.status(422).json({
        success: false,
        message: "Pelanggan Invalid",
      });
    }

    const pelangganProfile = await db
      .select("nosamb")
      .from("web_nomor_pelanggan")
      .where("id_user", session.user.id)
      .orderBy("nosamb", "asc");
    const pelangganCompare = pelangganProfile.map((val) => {
      return val.nosamb;
    });
    const isArrayValid = compareArrays(bodyNopel.sort(), pelangganCompare);

    if (!isArrayValid) {
      await db.transaction(async (trx) => {
        await trx("web_nomor_pelanggan")
          .where("id_user", session.user.id)
          .del();
        const valInsert = bodyNopel.map((val) => {
          const res = {
            nosamb: val,
            id_user: session.user.id,
          };
          return res;
        });
        if (valInsert.length !== 0) {
          await trx("web_nomor_pelanggan").insert(valInsert);
        } else {
          await trx("web_nomor_pelanggan")
            .where("id_user", session.user.id)
            .del();
        }
      });
    }

    const pelres = pelangganRes.map((val) => {
      const res = {
        nosamb: val.nosamb.trim(),
        nama: val.nama.trim(),
        alamat: val.alamat.trim(),
        aktif: val.aktif,
      };
      return res;
    });
    res.status(200).json({
      success: true,
      data: pelres,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateProfile(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: errors,
      });
    }
    const bodyData = await req.body;
    const updateRes = await db("web_public_user")
      .where({ id: session.user.id })
      .update(bodyData);

    res.status(200).json({
      success: true,
      message: "Update Data Succesfull",
      data: bodyData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: errors,
      });
    }

    const { password_lama, password_baru } = await req.body;

    const user = await db
      .select("*")
      .from("web_public_user")
      .where("id", session.user.id)
      .first();

    if (user.password !== "") {
      const isPasswordMatch = await bcrypt.compare(
        password_lama,
        user.password
      );

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Old Password is incorrect",
        });
      }
    }

    const hashedPasswordBaru = bcrypt.hashSync(password_baru, 10);

    await db("web_public_user")
      .where({ id: session.user.id })
      .update({ password: hashedPasswordBaru });

    res.status(200).json({
      success: true,
      message: "Reset Password Succesfull",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { getProfile, updateNopelanggan, updateProfile, resetPassword };
