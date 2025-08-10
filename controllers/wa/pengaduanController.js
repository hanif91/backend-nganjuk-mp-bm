import moment from "moment";
import db from "../../database/db.js";
import { validateSessionToken } from "../../lib/session.js";
import { validationResult } from "express-validator";
import {
  uploadImage,
  storageGoogle,
} from "../../middleware/googleStorageMiddleware.js";
import { put } from "@vercel/blob";
import "dotenv/config";
import { validateUserMitra } from "../../lib/utils.js";
const { BLOB_READ_WRITE_TOKEN } = process.env;

async function createPengaduanWaNoimage(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    let user_id = null;
    if (session.session != null) {
      user_id = session.user.id;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: errors,
      });
    }

    const {
      jenis_aduan_id,
      tanggal,
      no_pelanggan,
      nama,
      alamat,
      no_hp,
      ket_aduan,
      latitude,
      longitude,
    } = req.body;

    const isvalidDate = moment(tanggal).isValid();
    if (!isvalidDate) {
      return res.status(422).json({
        success: false,
        message: "Tanggal Invalid",
      });
    }

    const cekJenisaduan = await db
      .select("id")
      .from("jenis_aduan")
      .where("id", jenis_aduan_id)
      .first();

    if (!cekJenisaduan) {
      return res.status(422).json({
        success: false,
        message: "Jenis Aduan ID Tidak Terdaftar",
      });
    }

    let nosamb = null;
    if (no_pelanggan !== "") {
      const cekNosamb = await db
        .select("nosamb")
        .from("pelanggan")
        .where("nosamb", no_pelanggan)
        .first();
      if (!cekNosamb) {
        return res.status(422).json({
          success: false,
          message: "No Pelanggan Tidak Terdaftar",
        });
      }
      nosamb = no_pelanggan;
    }

    if (!cekJenisaduan) {
      return res.status(422).json({
        success: false,
        message: "Jenis Aduan ID Tidak Terdaftar",
      });
    }
    const nomorRes = await db.raw("select noautoaduan(?) as nomor", [tanggal]);
    const nomor = nomorRes[0][0].nomor;
    console.log(nomor);
    let imageUrl = null;
    const myFile = req.file;

    if (myFile != null) {
      console.log("after");
      imageUrl = await uploadImage(myFile, nomor);
      console.log("TS");
    }

    const aduan = await db("web_aduan").insert({
      jenis_aduan_id,
      nomor,
      user_web_id: user_id,
      tanggal,
      no_pelanggan: nosamb,
      nama,
      url_foto_aduan: imageUrl,
      alamat,
      no_hp,
      ket_aduan,
      sumber_laporan: "MOBILE",
      latitude,
      longitude,
    });
    const data = {
      id: aduan[0],
      jenis_aduan_id,
      nomor,
      nosamb,
      nama,
      alamat,
      no_hp,
      ket_aduan,
      latitude,
      longitude,
    };

    res.status(200).json({
      success: true,
      data: data,
    });

    // uploadSingleImage(req, res, async function (err) {
    // 	const errors = validationResult(req)
    // 	if(!errors.isEmpty()) {
    // 			return res.status(422).json({
    // 					success: false,
    // 					message : errors,
    // 			})
    // 	}
    // 	if (err) {
    // 			return res.status(400).send({ message: err.message })
    // 	}
    // 	const {jenis_aduan_id,tanggal,no_pelanggan,nama,alamat,no_hp,ket_aduan} = req.body;

    // 	const isvalidDate = moment(tanggal).isValid();
    // 	if (!isvalidDate){
    // 		return res.status(422).json({
    // 			success : false,
    // 			message: 'Tanggal Invalid'
    // 		})
    // 	}
    // 	const cekJenisaduan = await db.select('id').from('jenis_aduan').where('id',jenis_aduan_id ).first()

    // 	if(!cekJenisaduan) {
    // 			return res.status(422).json({
    // 					success : false,
    // 					message: 'Jenis Aduan ID Tidak Terdaftar'
    // 			})
    // 	}
    // 	const nomorRes = await db.raw('select noautoaduan(?) as nomor',[tanggal]);
    // 	const nomor = nomorRes[0][0].nomor;
    // 	console.log(nomor);

    // 	const myFile = req.file
    // 	const imageUrl = await uploadImage(myFile,nomor)
    // 	const aduan = await db('web_aduan').insert({
    // 		jenis_aduan_id,
    // 		nomor,
    // 		user_web_id : user_id,
    // 		tanggal,
    // 		no_pelanggan,
    // 		nama,
    // 		url_foto_aduan : imageUrl,
    // 		alamat,
    // 		no_hp,
    // 		ket_aduan
    // 	} );
    // 	const data = {
    // 		id: aduan[0],
    // 		jenis_aduan_id, nomor,no_pelanggan,nama,alamat,no_hp,ket_aduan
    // 	}

    // 	res.status(200).json({
    // 		success: true,
    // 		data: data,
    // 	})

    // })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createPengaduanWa(req, res) {
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
      return res.status(422).json({
        success: false,
        message: errors,
      });
    }

    const {
      jenis_aduan_id,
      tanggal,
      no_pelanggan,
      nama,
      alamat,
      no_hp,
      ket_aduan,
      latitude,
      longitude,
    } = req.body;

    const isvalidDate = moment(tanggal).isValid();
    if (!isvalidDate) {
      return res.status(422).json({
        success: false,
        message: "Tanggal Invalid",
      });
    }

    const cekJenisaduan = await db
      .select("id")
      .from("jenis_aduan")
      .where("id", jenis_aduan_id)
      .first();

    if (!cekJenisaduan) {
      return res.status(422).json({
        success: false,
        message: "Jenis Aduan ID Tidak Terdaftar",
      });
    }

    let nosamb = null;
    if (no_pelanggan !== "") {
      const cekNosamb = await db
        .select("no_pelanggan")
        .from("pelanggan")
        .where("no_pelanggan", no_pelanggan)
        .first();
      if (!cekNosamb) {
        return res.status(422).json({
          success: false,
          message: "No Pelanggan Tidak Terdaftar",
        });
      }
      nosamb = no_pelanggan;
    }

    if (!cekJenisaduan) {
      return res.status(422).json({
        success: false,
        message: "Jenis Aduan ID Tidak Terdaftar",
      });
    }
    const nomorRes = await db.raw("select noautoaduan() as nomor", []);
    const nomor = nomorRes[0][0].nomor;
    console.log(nomor);
    let imageUrl = null;
    const myFile = req.file;

    if (myFile != null) {
      const myfillename = nomor + "_" + myFile.originalname.replace(/ /g, "_");
      const blob = await put(myfillename, myFile.buffer, {
        access: "public",
        token: BLOB_READ_WRITE_TOKEN,
      });
      imageUrl = blob.url;
    }

    const aduan = await db("web_aduan").insert({
      jenis_aduan_id,
      nomor,
      user_web_id: id,
      tanggal,
      no_pelanggan: nosamb,
      nama,
      url_foto_aduan: imageUrl,
      alamat,
      no_hp,
      ket_aduan,
      sumber_laporan: "WHATSAPP",
      latitude,
      longitude,
    });
    const data = {
      nomor
    };

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function getJenisAduanWa(req, res) {
  try {
		const { id,username,kodeloket,nama_loket } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}

    const jenisAduan = await db
      .select("id", "nama as jenis_aduan")
      .from("jenis_aduan")
      .where("is_active", "1")
      .orderBy("nama", "asc");

    res.status(200).json({
      success: true,
      data: jenisAduan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function getAduanWa(req, res) {
  try {
		const { id,username,kodeloket,nama_loket } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}
		const {noaduan } = req.params;
    const Aduan = await db
      .select(
        "a.id",
        "a.tanggal",
        "a.nomor",
        "a.no_pelanggan",
        "c.nama as namapel",
        "c.alamat as alamatpel",
        "a.jenis_aduan_id",
        "b.nama as jenis_aduan",
        "a.nama",
        "a.no_hp",
        "a.alamat",
        "a.ket_aduan",
        "a.url_foto_aduan",
        "a.sumber_laporan",
        "a.is_processed",
        "a.processed_at",
        "a.processed_by_id",
        "f.nama as nama_memproses",
        "a.processed_number",
        "a.processed_to_divisi_id",
        "d.nama as nama_divisi",
        "a.processed_to_petugas_id",
        "e.nama as nama_petugas",
        "a.is_complete",
        "a.completed_at",
        "a.jenis_penyelesaian_id",
        "g.nama_penyelesaian",
        "a.ket_penyelesaian",
        "a.url_foto_penyelesaian",
        "a.is_canceled",
        "a.cancel_reason",
        "a.updated_at"
      )
      .from("web_aduan  as a")
      .leftJoin("jenis_aduan as b", "a.jenis_aduan_id", "b.id")
      .leftJoin("pelanggan as c", "a.no_pelanggan", "c.no_pelanggan")
      .leftJoin("divisi as d", "a.processed_to_divisi_id", "d.id")
      .leftJoin("petugas as e", "a.processed_to_petugas_id", "e.id")
      .leftJoin("web_admin_user as f", "a.processed_by_id", "f.id")
      .leftJoin("jenis_penyelesaian as g", "a.jenis_penyelesaian_id", "g.id")
      .where("a.nomor", noaduan)
      .orderBy("tanggal", "asc")
      .limit(12);

    const dataOlahAduan = Aduan.map((val) => {
      let tracking_aduan = [];

      const dataMasuk = {
        judul: `DATA MASUK NOMOR : ${val.nomor}`,
        tanggal: val.tanggal,
        deskripsi: `Data aduan masuk ke server di input oleh ${username}`,
        url_foto: val.url_foto_aduan,
      };
      tracking_aduan.push(dataMasuk);

      if (val.is_processed) {
        const dataDitugasi = {
          judul: `ADUAN DI PROSES NOMOR: ${val.processed_number}`,
          tanggal: val.processed_at,
          deskripsi: `aduan telah diteruskan kepada Divisi : ${val.nama_divisi} , Oleh ${val.nama_memproses}`,
          url_foto: null,
        };
        tracking_aduan.push(dataDitugasi);
      }

      if (val.processed_to_petugas_id != null) {
        const dataDitugasi2 = {
          judul: `ADUAN DI PROSES NOMOR: ${val.processed_number}`,
          tanggal: val.updated_at,
          deskripsi: `aduan telah diteruskan kepada Petugas : ${val.nama_petugas}`,
          url_foto: null,
        };
        tracking_aduan.push(dataDitugasi2);
      }

      if (val.is_complete) {
        const dataComplet = {
          judul: `ADUAN SELESAI`,
          tanggal: val.completed_at,
          deskripsi: `aduan telah diselesaikan oleh Petugas : ${val.nama_petugas} ket : ${val.nama_penyelesaian} , ${val.ket_penyelesaian}  `,
          url_foto: val.url_foto_penyelesaian,
        };
        tracking_aduan.push(dataComplet);
      }

      if (val.is_canceled) {
        const iscancel = {
          judul: `ADUAN CANCEL`,
          tanggal: val.updated_at,
          deskripsi: `aduan telah di cancel dengan alasan : ${val.cancel_reason} `,
          url_foto: null,
        };
        tracking_aduan.push(iscancel);
      }

      let nosambval = null;
      let alamatval = null;
      let namaval = null;
      if (val.no_pelanggan != null) {
        nosambval = val.nosamb;
        alamatval = val.alamat;
        namaval = val.nama;
      }

      const valMaster = {
        id: val.id,
        tanggal: moment(val.tanggal).format("DD MMMM YYYY"),
        tanggal_value: val.tanggal,
        nommor_aduan: val.nomor,
        pelanggan: {
          nosamb: nosambval,
          namapel: namaval,
          alamatpel: alamatval,
        },
        jenis_aduan: {
          jenis_aduan_id: val.jenis_aduan_id,
          jenis_aduan: val.jenis_aduan,
        },
        nama: val.nama.trim(),
        no_hp: val.no_hp,
        alamat: val.alamat.trim(),
        ket_aduan: val.ket_aduan,
        url_foto_aduan: val.url_foto_aduan,
        sumber_laporan: val.sumber_laporan,
        status_aduan: val.is_processed + val.is_complete,
        is_canceled: val.is_canceled,
        cancel_reason: val.cancel_reason,
        tracking_aduan: tracking_aduan,
      };

      return valMaster;
    });
    dataOlahAduan.sort((a, b) => b.tanggal_value - a.tanggal_value);
    res.status(200).json({
      success: true,
      data: dataOlahAduan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { createPengaduanWa,createPengaduanWaNoimage, getJenisAduanWa, getAduanWa };
