import moment from "moment";
import db from "../../database/db.js";
import { validationResult } from "express-validator";
import { put } from "@vercel/blob";
import { validateUserMitra } from "../../lib/utils.js";
const { BLOB_READ_WRITE_TOKEN } = process.env;

async function createPsbWa(req, res) {
  try {
		const { id,username,kodeloket,nama_loket } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({
        success: false,
        errors,
      });
    }

    const { nama, alamat, no_hp, latitude, longitude } = req.body;

    // if (id != null) {
    //   const oldDaftar = await db
    //     .select("id")
    //     .from("web_user_daftarpsb")
    //     .where({ user_id: user_id, flagproses: 0, is_canceled: 0 });

    //   if (oldDaftar.length > 0) {
    //     console.log("here");
    //     return res.status(422).json({
    //       success: false,
    //       message: "Masih Ada Data Pendaftaran yang belum diproses",
    //     });
    //   }
    // }

    let imageUrl = null;
    const myFile = req.file;

    if (myFile != null) {
      const myfillename = myFile.originalname;
      console.log("UPLOADING" + myfillename);
      const blob = await put(myfillename, myFile.buffer, {
        access: "public",
        token: BLOB_READ_WRITE_TOKEN,
      });
      console.log("success uploading");
      console.log(blob);
      imageUrl = blob.url;
    }

    console.log("Image url: " + imageUrl);
    const psbExecute = await db("web_user_daftarpsb").insert({
      user_id: id,
      nama,
      alamat,
      no_hp,
      foto_tempat_url: imageUrl,
      latitude,
      longitude,
    });

    const dataRespons = {
      nomor: psbExecute[0],
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

async function getpsbWa(req, res) {
  try {
		const { id,username,kodeloket,nama_loket } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}

    const psb = await db
      .select(
        "a.id",
        "a.created_at as tanggal",
        "a.nama",
        "a.no_hp",
        "a.alamat",
        "a.flaghub",
        "a.hub_at",
        "a.hub_by",
        "a.flagproses",
        "a.proses_at",
        "a.proses_by",
        "a.updated_at",
        "a.is_canceled",
        "a.cancel_reason"
      )
      .from("web_user_daftarpsb as a")
      .where("a.id", req.params.id)
      .orderBy("created_at", "desc")
      .limit(12);

    const dataOlahpsb = psb.map((val) => {
      let tracking_psb = [];

      const dataMasuk = {
        judul: `DATA MASUK`,
        tanggal: val.tanggal,
        deskripsi: `Data aduan masuk ke server di input oleh ${username}`,
      };
      tracking_psb.push(dataMasuk);

      if (val.flaghub) {
        const dataDihub = {
          judul: `TELAH DIHUBUNGI`,
          tanggal: val.hub_at,
          deskripsi: `calon pelanggan telah di hub oleh perusahaan a.n : ${val.hub_by}`,
        };
        tracking_psb.push(dataDihub);
      }

      if (val.flagproses) {
        const dataComplet = {
          judul: `TELAH DI PROSES`,
          tanggal: val.proses_at,
          deskripsi: `pendaftaran calon pelanggan telah di proses oleh : ${val.proses_by} `,
        };
        tracking_psb.push(dataComplet);
      }

      if (val.is_canceled) {
        const iscancel = {
          judul: `CANCEL`,
          tanggal: val.updated_at,
          deskripsi: `pendaftaran calon pelanggan telah di cancel dengan alasan : ${val.cancel_reason} `,
        };
        tracking_psb.push(iscancel);
      }

      const valMaster = {
        id: val.id,
        tanggal: moment(val.tanggal).format("DD MMMM YYYY"),
        nama: val.nama,
        no_hp: val.no_hp,
        alamat: val.alamat.trim(),
        status_psb: val.flaghub + val.flagproses,
        is_canceled: val.is_canceled,
        cancel_reason: val.cancel_reason,
        tracking_psb: tracking_psb,
      };

      return valMaster;
    });

    res.status(200).json({
      success: true,
      data: dataOlahpsb,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { createPsbWa, getpsbWa };
