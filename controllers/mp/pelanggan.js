import db from "../../database/db.js";
import { validateUser } from "../../lib/utils.js";
import moment from "moment/moment.js";

async function searchPelanggan(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { value } = req.query;

    if (value.length < 3 || value == null) {
      return res.status(422).json({
        success: false,
        message: "Minimal 3 Karakter",
      });
    }

    const dtpelanggan = await db.raw(
      `select id, nosam as no_pelanggan, nama, al as alamat, tgl_tutup as tgl_pasif, tgl_pasang  as tgl_aktif, status from customer
      where status = 2 and locate(?,CONCAT_WS(' ',nosam,nama,al)) limit 15
			`,
      [value],
    );

    dtpelanggan[0].map(function (p) {
      p.status_pelanggan = p.status == "2" ? "Aktif" : "Tidak Aktif";
    });

    res.status(200).json({
      success: true,
      data: dtpelanggan[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function cekTagihanPelanggan(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }
    const { nosamb } = await req.params;
    const isPelanggan = await db.raw(
      `select
      a.nama,
      a.nosam,
				a.al as alamat,
				concat(a.cab, a.wil, a.jlnb) as rayon,
				a.nmgol as golongan,
				a.tarif as kodegol,
				a.status
      from customer a where a.nosam = ?`,
      [nosamb],
    );

    if (isPelanggan[0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Pelanggan tidak ditemukan",
      });
    }

    const rawTagihan = await db.raw(`call infotag_mp(?)`, [nosamb]);

    if (rawTagihan[0][0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Tagihan sudah lunas",
        pelanggan: {
          id: isPelanggan[0][0].id,
          no_pelanggan: isPelanggan[0][0].no_sam,
          nama: isPelanggan[0][0].nama.trim(),
          alamat: isPelanggan[0][0].alamat.trim(),
          rayon: isPelanggan[0][0].rayon,
          kodegol: isPelanggan[0][0].kodegol,
          golongan: isPelanggan[0][0].golongan,
          status: isPelanggan[0][0].status,
          status_str: isPelanggan[0][0].status == "2" ? "Aktif" : "Tidak Aktif",
          latitude: "0",
          longitude: "0",
        },
      });
    }

    const resValue = rawTagihan[0][0].map((item) => {
      return {
        id: item.id,
        periode: item.periode,
        total: Number(item.total_tagihan),
        layanan: Number(item.layanan),
        total_keseluruhan: Number(item.total_keseluruhan),
        urut: 0,
        detail_rekening: {
          stanlalu: item.lama,
          stanskrg: item.baru,
          pakaiskrg: item.m3,
          harga_air: item.hrgair,
          airlimbah: 0,
          administrasi: item.adm,
          pemeliharaan: item.dm,
          retribusi: 0,
          angsuran: 0,
          denda: Number(item.denda),
          materai: Number(item.meterai),
          total: Number(item.total_tagihan),
          layanan: Number(item.layanan),
          total_keseluruhan: Number(item.total_keseluruhan),
        },
        pelanggan: {
          id: isPelanggan[0][0].id,
          no_pelanggan: item.no_sam,
          nama: item.nama.trim(),
          alamat: item.alamat.trim(),
          rayon: item.rayon,
          kodegol: item.kodegol,
          golongan: item.golongan,
          status: isPelanggan[0][0].status,
          status_str: isPelanggan[0][0].status == "2" ? "Aktif" : "Tidak Aktif",
          latitude: "0",
          longitude: "0",
        },
      };
    });

    res.status(200).json({
      success: true,
      data: resValue,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function ajukanPemutusan(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { nosamb } = await req.params;

    const isPelanggan = await db.raw(
      `select * from customer c where c.nosam = ?`,
      [nosamb],
    );

    if (isPelanggan[0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Pelanggan tidak ditemukan",
      });
    }

    const ifExistData = await db.raw(
      `select id from pendaftaran_lain where no_pelanggan = ? and jenis = 'PTST' and date_format(tanggal,'%Y%m')=?`,
      [nosamb, moment().format("YYYYMM")],
    );
    if (ifExistData[0].length > 0) {
      return res.status(422).json({
        success: false,
        message: "Permohonan Putus Langganan sudah ada",
      });
    }

    const putus_tagihan = await db.raw(
      `select * from jenis_nonair where jenis = 'PTST'`,
    );
    if (putus_tagihan[0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Jenis Pemutusan tidak ditemukan",
      });
    }

    const generateRegLain = await db.raw(`select noautoreglain() as noreg;`);
    if (!generateRegLain[0][0]) {
      return res.status(422).json({
        success: false,
        message: "Tidak dapat generate no autoreg lain",
      });
    }

    const pendaftaran_lain = await db("pendaftaran_lain").insert({
      tanggal: moment(new Date()).format("YYYY-MM-DD"),
      no_regis: generateRegLain[0][0].noreg,
      flaglunas: true,
      no_pelanggan: isPelanggan[0][0].no_pelanggan,
      pelanggan_id: isPelanggan[0][0].id,
      user_input: id,
      nama: isPelanggan[0][0].nama,
      alamat: isPelanggan[0][0].alamat,
      jenis_nonair_id: putus_tagihan[0][0].id,
      jenis: putus_tagihan[0][0].jenis,
      keterangan: putus_tagihan[0][0].namajenis,
      flagpajak: putus_tagihan[0][0].flagpajak,
      flagproses: putus_tagihan[0][0].flagproses,
      flagditugasi: true,
      biaya: putus_tagihan[0][0].by_pelayanan,
      tglproses: moment(new Date()).format("YYYY-MM-DD"),
    });
    pendaftaran_lain;
    res.status(200).json({
      success: true,
      data: pendaftaran_lain,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function daftarPemutusan(req, res) {
  try {
    const { username, id, nama, jabatan, role_id, role } = req.auth;
    const isValiduser = await validateUser(id);

    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { periode } = await req.params;

    const ifExistData = await db.raw(
      `select id,no_pelanggan,nama,alamat,tanggal,flagrealisasi,tglrealisasi from pendaftaran_lain where user_input = ? and jenis = 'PTST' and date_format(tanggal,'%Y%m')=? order by tanggal desc`,
      [id, periode],
    );

    // console.log(ifExistData[0])

    const dataRespons = ifExistData[0].map((item) => {
      return {
        id: item.id,
        no_pelanggan: item.no_pelanggan,
        nama: item.nama,
        alamat: item.alamat,
        tanggal: moment(item.tanggal).format("YYYY-MM-DD"),
        tracking: {
          sudah_realisasi: item.flagrealisasi == 1 ? true : false,
          tanggal_realisasi:
            item.tglrealisasi == null
              ? null
              : moment(item.tglrealisasi).format("YYYY-MM-DD"),
        },
      };
    });

    return res.status(200).json({
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
  searchPelanggan,
  cekTagihanPelanggan,
  ajukanPemutusan,
  daftarPemutusan,
};
