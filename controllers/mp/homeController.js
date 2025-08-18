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

    // const totalRekeningTagihan  = await db.raw("SELECT sum(ttltagihan) as totalrekening FROM tagihan_timtagih_temp WHERE created_temp_by = ?", [username]);
    const totalRekeningTertagih = await db.raw(
      `
      select SUM(l.ha + l.adm + l.dm + l.ppn + l.angs + l.denda + l.meterai) as totalrekening from lppa l
      where user = ? and l.tgl_byr BETWEEN ? AND ?`,
      [id, start_date.format("YYYY-MM-DD"), end_date.format("YYYY-MM-DD")],
    );

    // const sisatagihan =
    //   parseInt(totalRekeningTagihan[0][0]?.totalrekening ?? 0) -
    //   parseInt(totalRekeningTertagih[0][0]?.totalrekening ?? 0);

    const sisatagihan = 0;
    // const pelangganBelumTertagih = await db.raw(
    //   "SELECT count(*) as count FROM tagihan_timtagih_temp WHERE tglbayar = '' AND created_temp_by = ?",
    //   [username],
    // );
    const pelangganSudahTertagih = await db.raw(
      `SELECT count(*) as count  from lppa l
      where user = ? and l.tgl_byr BETWEEN ? AND ?`,
      [id, start_date.format("YYYY-MM-DD"), end_date.format("YYYY-MM-DD")],
    );

    // const total = await db.raw(
    //   "SELECT sum(totalrekening) as totalrekening FROM drd WHERE user_id = ? AND tglbayar BETWEEN ? AND ?",
    //   [id, start_date.format("YYYY-MM-DD"), end_date.format("YYYY-MM-DD")],
    // );

    const total = await db.raw(
      `
          select SUM(l.ha + l.adm + l.dm + l.ppn + l.angs + l.denda + l.meterai) as total from lppa l
          where user = ? and l.tgl_byr BETWEEN ? AND ?`,
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
        billed: {
          pelanggan_tertagih: parseInt(pelangganSudahTertagih[0][0].count ?? 0),
          // pelanggan_belum_tertagih: parseInt(
          //   pelangganBelumTertagih[0][0].count ?? 0,
          // ),
          pelanggan_belum_tertagih: 0,
          // rekening_total: parseInt(
          //   totalRekeningTagihan[0][0]?.totalrekening ?? 0,
          // ),
          rekening_total: 0,
          rekening_tertagih: parseInt(
            totalRekeningTertagih[0][0]?.totalrekening ?? 0,
          ),
          rekening_belum_tertagih: parseInt(sisatagihan ?? 0),
        },
        income: {
          title:
            "Pendapatan Bulan " + current_date.locale("id").format("MMMM YYYY"),
          date: {
            start: start_date.format("YY-MM-DD"),
            end: end_date.format("YY-MM-DD"),
          },
          total: parseInt(total[0]?.totalrekening ?? 0),
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
