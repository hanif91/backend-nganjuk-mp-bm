import db, { dbBacameter } from "../database/db.js";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import moment from "moment";

async function validateUser(iduser) {
  try {
    const userPetugas = await dbBacameter("pm")
      .select("*")
      .whereRaw("LOWER(petugas) = ?", [iduser.toLowerCase()])
      .first();

    if (typeof userPetugas === "undefined") {
      return false;
    }
    return userPetugas;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function getBaseUrlBcm(req, res) {
  try {
    const data = await db
      .select("baseurl_bcm")
      .from("settings")
      .where("idx", 1)
      .first();
    return res.status(200).json({
      success: true,
      url: data.baseurl_bcm,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMasterPelanggan(req, res) {
  try {
    const { nama, un, nm_un } = req.auth;
    const isValiduser = await validateUser(nama);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    await db.raw("TRUNCATE temp_histori_byr");
    await db.raw(
      `INSERT INTO temp_histori_byr (
      select hb.* from customer c
           left join histori_byr hb on hb.no_sam = c.nosam
           WHERE c.cab = ? and DATE_FORMAT(hb.periode, "%Y%m") = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), "%Y%m")
      )`,
      [un],
    );

    const [data] = await db.raw(
      `
      select c.*,IFNULL(hb.baru, 0) AS stanlalu from customer c
      left join temp_histori_byr hb on hb.no_sam = c.nosam and DATE_FORMAT(hb.periode, "%Y%m") = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), "%Y%m")
      WHERE c.cab = ?
      `,
      [un],
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function uploadHasilBaca(req, res) {
  const { nama: petugas } = req.auth || {};
  const WATERMETER_BASE = path.resolve(process.cwd(), "..", "..", "watermeter");

  const {
    no_pelanggan,
    tgl,
    dateTime,
    stan_kini,
    stan_lalu,
    pakai,
    kondisi,
    ket = null,
    latitude,
    longitude,
  } = req.body || {};

  if (!tgl) return res.status(400).json({ message: "tgl wajib diisi" });
  if (!moment(tgl).isValid())
    return res.status(400).json({ message: "tgl tidak valid" });
  if (!dateTime)
    return res.status(400).json({ message: "dateTime wajib diisi" });
  if (!no_pelanggan)
    return res.status(400).json({ message: "no_pelanggan wajib diisi" });
  if (!stan_kini)
    return res.status(400).json({ message: "stan_kini wajib diisi" });
  if (!stan_lalu)
    return res.status(400).json({ message: "stan_lalu wajib diisi" });
  if (!pakai) return res.status(400).json({ message: "pakai wajib diisi" });
  if (!kondisi) return res.status(400).json({ message: "kondisi wajib diisi" });
  if (!req.file)
    return res.status(400).json({ message: "foto wajib diunggah" });
  if (req.file.mimetype !== "image/jpeg") {
    return res.status(415).json({ message: "Hanya terima gambar JPEG" });
  }
  if (!latitude)
    return res.status(400).json({ message: "latitude wajib diisi" });
  if (!longitude)
    return res.status(400).json({ message: "longitude wajib diisi" });

  const periodeSafe = moment(tgl).format("YYYYMM");
  const namaSafe = no_pelanggan;

  const targetDir = path.join(WATERMETER_BASE, periodeSafe, petugas);
  const targetPath = path.join(targetDir, `${namaSafe}.jpg`);
  const fileSS = `${namaSafe}.jpg`;
  const folderSS = `||192.168.1.200|watermeter|${periodeSafe}|${petugas}`;

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, req.file.buffer);

    await dbBacameter.transaction(async (trx) => {
      await trx.raw(
        `
        INSERT INTO latlong_pelanggan (no_sam, latitude, longitue)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          latitude = VALUES(latitude),
          longitue = VALUES(longitue)
        `,
        [no_pelanggan, latitude, longitude],
      );

      const [rows] = await trx.raw(
        `SELECT no FROM baca_meter WHERE no_sam = ? AND DATE_FORMAT(tgl, "%Y%m") = ?`,
        [namaSafe, periodeSafe],
      );

      if (rows.length > 0) {
        await trx.raw(
          `
          UPDATE baca_meter
          SET tgl = ?,
              stan_kini = ?,
              stan_lalu = ?,
              pakai = ?,
              petugas = ?,
              kondisi = ?,
              ket = ?,
              user = ?,
              folderSS = ?,
              fileSS = ?,
              info = ?
          WHERE no = ?
          `,
          [
            tgl,
            stan_kini,
            stan_lalu,
            pakai,
            petugas,
            kondisi,
            ket,
            petugas,
            folderSS,
            fileSS,
            dateTime,
            rows[0].no,
          ],
        );
      } else {
        await trx.raw(
          `
          INSERT INTO baca_meter
            (no_sam, tgl, stan_kini, stan_lalu, pakai, petugas, kondisi, ket, user, folderSS, fileSS, info)
          VALUES
            (?,?,?,?,?,?,?,?,?,?,?,?)
          `,
          [
            no_pelanggan,
            tgl,
            stan_kini,
            stan_lalu,
            pakai,
            petugas,
            kondisi,
            ket,
            petugas,
            folderSS,
            fileSS,
            dateTime,
          ],
        );
      }
    });

    return res.json({
      status: "success",
      message: "Upload & simpan berhasil",
      data: {
        periode: periodeSafe,
        no_pelanggan: namaSafe,
        rel_path: path.posix.join(
          "watermeter",
          periodeSafe,
          petugas,
          `${namaSafe}.jpg`,
        ),
        abs_path: targetPath,
      },
    });
  } catch (err) {
    console.error(err);
    try {
      console.log("delete" + targetPath);
      await fs.rm(targetPath, { force: true });
    } catch (e) {
      console.log(e);
    }
    return res.status(500).json({
      status: false,
      message: err?.message || "Gagal upload",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { nama: petugas, un, nm_un } = req.auth;

    const { password, oldPassword } = req.body;
    if (!password || !oldPassword) {
      return res.status(400).json({
        status: false,
        message: "password, oldPassword is required",
      });
    }
    const user = await dbBacameter("pm").where({ petugas }).first();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const olPasswordMd5 = crypto
      .createHash("md5")
      .update(oldPassword)
      .digest("hex");
    if (user.password !== olPasswordMd5) {
      return res.status(400).json({
        status: false,
        message: "Password lama tidak sesuai",
      });
    }

    const passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    await dbBacameter("pm")
      .where({ petugas })
      .update({ password: passwordMd5 });

    return res.json({
      status: "success",
      message: "Berhasil reset password",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: err?.message || "Failed to reset password",
    });
  }
}

export { getMasterPelanggan, getBaseUrlBcm, uploadHasilBaca, resetPassword };
