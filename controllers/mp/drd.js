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
      `select id,kodeloket,loket from loket where kodeloket = ?`,
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
      [nosamb],
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

    if (rawTagihan[0][0].length == 0) {
      return res.status(422).json({
        success: false,
        message: "Tagihan tidak ditemukan",
      });
    }

    if (rawTagihan[0][0].length < drd_ids.length) {
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
              `call bayartagihan(?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?, CURRENT_DATE, CURRENT_TIME)`,
              [
                tagihan.no_sam,
                tagihan.periode,
                id, //user_id
                tagihan.denda,
                0, //ppn
                tagihan.nama,
                tagihan.kodegol,
                tagihan.golongan,
                tagihan.norek,
                tagihan.m3,
                tagihan.hrgair,
                tagihan.adm,
                tagihan.dm,
                loket[0].kodeloket,
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

    const tagihanSuccesBayar = await db.raw(
      `Select *,convertperiode(periode_rek) as periodestr from drd where id in (?)  and user_id=? and flaglunas="1"
`,
      [drd_ids, id],
    );
    res.status(200).json({
      success: true,
      data: {
        tagihan: tagihanSuccesBayar[0],
        user: {
          id: id,
          name: username,
          role: role,
          no_hp: isValiduser.no_hp,
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
    const { username, id, nama, jabatan, role_id, role } = req.auth;
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

    const tagihanRaw = await db.raw(
      `
		select GROUP_CONCAT(a.periode) as ids, a.no_sam as no_pelanggan, b.nama, b.al as alamat, "a" as rayon,
SUM(a.tot) as total, DATE(a.tgl_byr) as tglbayar from histori_byr a
left join customer b on a.no_sam = b.nosam
where a.tgl_byr is not null and DATE_FORMAT(periode, "%Y%m") != DATE_FORMAT(now(),"%Y%m")
and a.user = ?, DATE(a.a.tgl_byr) BETWEEN ? AND ?
group by a.no_sam, DATE(a.tgl_byr)
ORDER BY a.tgl_byr DESC
limit 10;
		`,
      [id, start_date, end_date],
    );

    let tagihanRes = [];

    if (tagihanRaw[0].length != 0) {
      for (const tagihan of tagihanRaw[0]) {
        const detailTagihan = await db.raw(
          `Select *,convertperiode(periode_rek) as periodestr from drd where id in (?) and flaglunas="1"`,
          [tagihan.ids],
        );
        const resPush = {
          ...tagihan,
          detail_tagihan: detailTagihan[0],
        };
        tagihanRes.push(resPush);
      }
    }

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

export { bayarRekening, daftarDrdPetugas, lppPetugas };
