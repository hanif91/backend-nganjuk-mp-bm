import db from "../../database/db.js";
import { periodeTagihPelanggan, validateUser } from "../../lib/utils.js";
import moment from "moment";

async function getHome(req, res) {
  try {
    const { id, nama, jabatan, cabang } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const periodeTagih = periodeTagihPelanggan();
    let current_date = moment();
    let start_date = current_date.clone().startOf("month");
    let end_date = current_date.clone().endOf("month");
    const tgldenda = moment().format("YYYY-MM-01");

    const data = await db.raw(
      `
      select SUM(l.ha + l.adm + l.dm + l.ppn + l.angs + l.denda + l.meterai) as total, SUM(l.layanan) as layanan,
      SUM(l.ha + l.adm + l.dm + l.ppn + l.angs + l.denda + l.meterai + l.layanan) as totalkeseluruhan, COUNT(*) as lbr, COUNT(DISTINCT l.no_sam ) as totalpelanggan
      from penerimaan_air l where user = ? and l.tgl_byr BETWEEN ? AND ?`,
      [id, start_date.format("YYYY-MM-DD"), end_date.format("YYYY-MM-DD")],
    );

    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    return res.status(200).json({
      success: true,
      message: "home",
      data: {
        periode: periodeTagih,
        data: {
          total_tertagih_pdam: parseInt(data[0][0].total || 0),
          total_tertagih: parseInt(data[0][0].totalkeseluruhan || 0) ?? 0,
          total_layanan: parseInt(data[0][0].layanan || 0) ?? 0,
          total_lbr: parseInt(data[0][0].lbr || 0) ?? 0,
          total_pelanggan: parseInt(data[0][0].totalpelanggan || 0) ?? 0,
        },
        description: {
          title:
            "Pendapatan Bulan " + current_date.locale("id").format("MMMM YYYY"),
          date: {
            start: start_date.format("YY-MM-DD"),
            end: end_date.format("YY-MM-DD"),
          },
        },
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

export { getHome };
