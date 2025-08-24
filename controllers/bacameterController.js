import db, { dbBacameter } from "../database/db.js";
import path from "path";
import fs from "fs/promises";

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

    const [data] = await db.raw(
      `
      select c.*,IFNULL(hb.baru, 0) AS stanlalu from customer c
      left join histori_byr hb on hb.no_sam = c.nosam and DATE_FORMAT(hb.periode, "%Y%m") = DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), "%Y%m")
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
  try {
    const WATERMETER_BASE = path.resolve(process.cwd(), "..", "watermeter");
    const { periode, no_pelanggan } = req.body || {};
    if (!periode)
      return res.status(400).json({ message: "periode wajib diisi" });
    if (!no_pelanggan)
      return res.status(400).json({ message: "no_pelanggan wajib diisi" });
    if (!req.file)
      return res.status(400).json({ message: "foto wajib diunggah" });

    if (req.file.mimetype !== "image/jpeg") {
      return res.status(415).json({ message: "Hanya terima gambar JPEG" });
    }

    const periodeSafe = periode;
    const namaSafe = no_pelanggan;
    const targetDir = path.join(WATERMETER_BASE, periodeSafe);
    await fs.mkdir(targetDir, { recursive: true });

    const targetPath = path.join(targetDir, `${namaSafe}.jpg`);

    await fs.writeFile(targetPath, req.file.buffer);

    return res.json({
      status: "success",
      message: "Upload & simpan berhasil",
      data: {
        periode: periodeSafe,
        no_pelanggan: namaSafe,
        rel_path: path.posix.join("watermeter", periodeSafe, `${namaSafe}.jpg`),
        abs_path: targetPath, // opsional, bisa disembunyikan
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err?.message || "Gagal upload",
    });
  }
}

export { getMasterPelanggan, getBaseUrlBcm, uploadHasilBaca };
