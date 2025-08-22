import moment from "moment/moment.js";
import db from "../../database/db.js";
import { periodeTagihPelanggan, validateUser } from "../../lib/utils.js";
import { queryRawSelectDRDTimTagih } from "../../lib/listQuery.js";

async function bayarRekening(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { drd_ids, no_pelanggan } = req.body;

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    const periodeTagih = periodeTagihPelanggan();

    if (!Array.isArray(drd_ids) || !no_pelanggan) {
      return res.status(422).json({
        success: false,
        message: "Data Body Invalid",
      });
    }

    const loket = await db.raw(
      `select id,kodeloket,namaloket from loket where kodeloket = ?`,
      ["aplikasi_penagihan"],
    );
    if (loket[0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Loket tidak ditemukan",
        data: {
          loket: null,
        },
      });
    }

    const isPelanggan = await db.raw(
      `select * from customer c where c.nosam = ?`,
      [no_pelanggan],
    );
    if (isPelanggan[0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Pelanggan tidak ditemukan",
        data: {
          pelanggan: null,
          tagihan: [],
        },
      });
    }

    const rawTagihan = await db.raw(`call infotag_mp(?)`, [no_pelanggan]);

    console.log(rawTagihan[0][0]);

    if (rawTagihan[0][0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Tagihan tidak ditemukan",
      });
    }

    if (rawTagihan[0][0].length != drd_ids.length) {
      return res.status(422).json({
        success: false,
        message: "Drd Ids tidak valid / data Sudah Lunas",
      });
    }

    const tagihanSelect = rawTagihan[0][0].filter(({ id }) =>
      drd_ids.includes(id),
    );

    if (tagihanSelect.length == 0) {
      return res.status(422).json({
        success: false,
        message: "Tidak Ada Data yang bisa di bayar.",
      });
    }

    try {
      await db.transaction(async (trx) => {
        for (const tagihan of tagihanSelect) {
          await trx
            .raw(
              `call bayartagihan_mp(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?)`,
              [
                tagihan.no_sam, // 0
                tagihan.periode, // 1
                id, // 2
                tagihan.denda, // 3
                0, // 4 - ppn
                tagihan.nama, // 5
                tagihan.kodegol, // 6
                tagihan.golongan, // 7
                tagihan.norek, // 8
                tagihan.m3, // 9
                tagihan.hrgair, // 10
                tagihan.adm, // 11
                tagihan.dm, // 12
                loket[0][0].kodeloket,
                tagihan.layanan,
              ],
            )
            .transacting(trx);
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    //     const tagihanSuccesBayar = await db.raw(
    //       `Select *,convertperiode(periode_rek) as periodestr from drd where id in (?)  and user_id=? and flaglunas="1"
    // `,
    //       [drd_ids, id],
    //     );

    const tuples = drd_ids.map((item) => {
      const [periode_tgl, no_sam] = item.split("|");
      return [no_sam, periode_tgl];
    });

    const tagihanSuccesBayar = await db
      .select([
        "c.no_sam",
        "a.nama",
        "a.al as alamat",
        db.raw("concat(a.cab, a.wil, a.jlnb) as rayon"),
        "a.nmgol as golongan",
        "a.tarif as kodegol",
        "c.tgl_byr as tglbayar",
        "a.status",
        db.raw('DATE_FORMAT(c.periode,"%Y%m") AS periode'),
        "c.periode AS periode_tgl",
        "c.norek",
        "c.lama",
        "c.baru",
        "c.m3",
        "c.hrgair",
        "c.dm",
        "c.adm",
        "c.tot",
        "c.meterai",
        "c.denda AS denda",
        db.raw("0 AS ppndenda"),
        db.raw("c.tot+c.meterai+c.denda AS total_tagihan"),
        db.raw("s.`by-layanan` as layanan"),
        db.raw("c.tot+c.meterai+c.denda+s.`by-layanan` as total_keseluruhan"),
        "c.user",
        "c.kas as loket",
      ])
      .from("histori_byr as c")
      .leftJoin("customer as a", "a.nosam", "c.no_sam")
      .leftJoin("settings as s", "s.idx", 1)
      .whereIn(["c.no_sam", "c.periode"], tuples);
    res.status(200).json({
      success: true,
      data: {
        tagihan: tagihanSuccesBayar,
        user: {
          id: id,
          name: nama,
          jabatan,
          cabang,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function daftarDrdPetugas(req, res) {
  try {
    const { username, id, nama, jabatan, role_id, role } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }
    const periodeRek = periodeTagihPelanggan();

    const tgldenda = moment().format("YYYY-MM-01");

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    const tagihanRaw = await db.raw(
      `${queryRawSelectDRDTimTagih(periodeRek, id, tgldenda)}`,
      [],
    );

    const tagihanRes = tagihanRaw[0].map((item) => {
      return {
        no_pelanggan: item.no_pelanggan,
        nama: item.nama,
        alamat: item.alamat,
        jmlrek: item.jmlrek,
        sisarek: Number(item.sisarek),
        lbrlunas: Number(item.lbrlunas),
        ttltagihan: Number(item.ttltagihan),
        ttltagihanlunas: Number(item.ttltagihanlunas),
        sisatagihan: Number(item.sisatagihan),
        user_id: item.user_id,
        nama_petugas: item.timtagih,
      };
    });

    res.status(200).json({
      success: true,
      data: tagihanRes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function lppPetugas(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { start_date, end_date, no_pelanggan } = req.query;

    if (!moment(start_date).isValid || !moment(end_date).isValid) {
      return res.status(422).json({
        success: false,
        message: "Invalid Date",
      });
    }

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    // const tagihanraw = await db.raw(`
    // 	select group_concat(a.id) as ids,a.no_pelanggan,a.nama,a.alamat,a.rayon,
    // 	sum(a.totalrekening) as total,date(a.tglbayar) as tglbayar from drd a where flaglunas="1" and periode != date_format(now(), '%y%m')
    // 	and a.user_id=? and date(tglbayar) between ? and ?
    // 	group by no_pelanggan,date(tglbayar)
    // 	order by tglbayar desc
    // 	`, [id,start_date,end_date]);

    let baseQuery = `
      select GROUP_CONCAT(CONCAT(a.periode, "|", a.no_sam)) as ids, a.no_sam as no_pelanggan, b.nama, b.al as alamat, concat(b.cab, b.wil, b.jlnb) as rayon,
           SUM(a.ha + a.adm + a.dm + a.ppn + a.angs + a.denda + a.meterai) as total, SUM(a.layanan) as layanan, SUM(a.ha + a.adm + a.dm + a.ppn + a.angs + a.denda + a.meterai + a.layanan) as total_keseluruhan,
           DATE(a.tgl_byr) as tglbayar from penerimaan_air a
           left join customer b on a.no_sam = b.nosam
           where a.tgl_byr is not null
           and a.user = ? and DATE(a.tgl_byr) BETWEEN ? AND ?
      `;
    const params = [id, start_date, end_date];

    if (no_pelanggan) {
      baseQuery += ` and a.no_sam LIKE ?`;
      params.push(`%${no_pelanggan}%`);
    }
    baseQuery += ` group by a.no_sam, DATE(a.tgl_byr)
    ORDER BY a.tgl_byr DESC;`;
    const tagihanRaw = await db.raw(baseQuery, params);

    let tagihanRes = tagihanRaw[0].map((item) => {
      return {
        no_pelanggan: item.no_pelanggan,
        nama: item.nama,
        tglbayar: item.tglbayar,
        totalrekening: item.total,
        layanan: parseInt(item.layanan),
        total_keseluruhan: item.total_keseluruhan,
      };
    });

    res.status(200).json({
      success: true,
      filter: {
        start_date,
        end_date,
        // periode_rek: periode
      },
      pelanggan: {
        data: tagihanRes,
      },
      user: {
        id: id,
        username: nama,
        jabatan: jabatan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function lppCetakPelanggan(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const { start_date, end_date, no_pelanggan } = req.query;

    if (!moment(start_date).isValid || !moment(end_date).isValid) {
      return res.status(422).json({
        success: false,
        message: "Invalid Date",
      });
    }

    if (!no_pelanggan) {
      return res.status(422).json({
        success: false,
        message: "no pelanggan is required",
      });
    }

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    // const tagihanraw = await db.raw(`
    // 	select group_concat(a.id) as ids,a.no_pelanggan,a.nama,a.alamat,a.rayon,
    // 	sum(a.totalrekening) as total,date(a.tglbayar) as tglbayar from drd a where flaglunas="1" and periode != date_format(now(), '%y%m')
    // 	and a.user_id=? and date(tglbayar) between ? and ?
    // 	group by no_pelanggan,date(tglbayar)
    // 	order by tglbayar desc
    // 	`, [id,start_date,end_date]);

    const [tagihanRaw] = await db.raw(
      `
      SELECT GROUP_CONCAT(CONCAT(periode, '|', no_sam) ORDER BY periode SEPARATOR ',') AS drd_ids
       FROM penerimaan_air
       WHERE user = ?
         AND DATE(tgl_byr) BETWEEN ? AND ?
         AND no_sam = ?;
		`,
      [id, start_date, end_date, no_pelanggan],
    );
    const tuples = (tagihanRaw[0]?.drd_ids ?? "")
      .split(",")
      .filter(Boolean)
      .map((pair) => {
        const [periode_tgl, no_sam] = pair.split("|");
        return [no_sam, periode_tgl];
      });

    const tagihanSuccesBayar = await db
      .select([
        "c.no_sam",
        "a.nama",
        "a.al as alamat",
        db.raw("concat(a.cab, a.wil, a.jlnb) as rayon"),
        "a.nmgol as golongan",
        "a.tarif as kodegol",
        "c.tgl_byr as tglbayar",
        "a.status",
        db.raw('DATE_FORMAT(c.periode,"%Y%m") AS periode'),
        "c.periode AS periode_tgl",
        "c.norek",
        "c.lama",
        "c.baru",
        "c.m3",
        "c.hrgair",
        "c.dm",
        "c.adm",
        "c.tot",
        "c.meterai",
        "c.denda AS denda",
        db.raw("0 AS ppndenda"),
        db.raw("c.tot+c.meterai+c.denda AS total_tagihan"),
        db.raw("s.`by-layanan` as layanan"),
        db.raw("c.tot+c.meterai+c.denda+s.`by-layanan` as total_keseluruhan"),
        "c.user",
        "c.kas as loket",
      ])
      .from("histori_byr as c")
      .leftJoin("customer as a", "a.nosam", "c.no_sam")
      .leftJoin("settings as s", "s.idx", 1)
      .whereIn(["c.no_sam", "c.periode"], tuples);

    res.status(200).json({
      success: true,
      filter: {
        start_date,
        end_date,
        // periode_rek: periode
      },
      data: tagihanSuccesBayar,
      user: {
        id: id,
        username: nama,
        jabatan: jabatan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function rekapLppPetugas(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }
    const { start_date, end_date } = req.query;

    if (!moment(start_date).isValid || !moment(end_date).isValid) {
      return res.status(422).json({
        success: false,
        message: "Invalid Date",
      });
    }

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    // const tagihanraw = await db.raw(`
    // 	select group_concat(a.id) as ids,a.no_pelanggan,a.nama,a.alamat,a.rayon,
    // 	sum(a.totalrekening) as total,date(a.tglbayar) as tglbayar from drd a where flaglunas="1" and periode != date_format(now(), '%y%m')
    // 	and a.user_id=? and date(tglbayar) between ? and ?
    // 	group by no_pelanggan,date(tglbayar)
    // 	order by tglbayar desc
    // 	`, [id,start_date,end_date]);

    const [tagihanRaw] = await db.raw(
      `
       select
       SUM(a.ha + a.adm + a.dm + a.ppn + a.angs + a.denda + a.meterai) as total_tagihan, SUM(a.layanan) as total_layanan,
       SUM(a.ha + a.adm + a.dm + a.ppn + a.angs + a.denda + a.meterai + a.layanan) as total_keseluruhan, COUNT(*) as total_lembar
       from penerimaan_air a where a.user = ? and DATE(a.tgl_byr) BETWEEN ? AND ?;
		`,
      [id, start_date, end_date],
    );

    res.status(200).json({
      success: true,
      message: "recap lpp pelanggan",
      data: {
        filter: {
          start_date,
          until: end_date,
        },
        petugas: {
          id,
          nama,
          jabatan,
          cabang,
        },
        pendapatan: [
          {
            name: "total_lembar",
            label: "Total Lembar",
            value: parseInt(tagihanRaw[0].total_lembar),
            route: "laporan-lpp",
          },
          {
            name: "total_pendapatan",
            label: "Total Pendapatan",
            value: parseInt(tagihanRaw[0].total_tagihan),
            route: "currency_idr",
          },
          {
            name: "total_layanan",
            label: "Total Layanan",
            value: parseInt(tagihanRaw[0].total_layanan),
            route: "currency_idr",
          },
          {
            name: "total_keseluruhan",
            label: "Total Keseluruhan",
            value: parseInt(tagihanRaw[0].total_keseluruhan),
            route: "currency_idr",
          },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export {
  bayarRekening,
  daftarDrdPetugas,
  lppPetugas,
  rekapLppPetugas,
  lppCetakPelanggan,
};
