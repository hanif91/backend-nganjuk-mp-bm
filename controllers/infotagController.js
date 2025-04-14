import db from "../database/db.js";
import { validateSessionToken } from "../lib/session.js";
import { validationResult } from "express-validator";
import { updatePelRule } from "../validation/profileValidation.js";
import bcrypt from "bcrypt";
import { formatNumber, trimDataPelanggan } from "../lib/utils.js";
import moment from "moment/moment.js";

function converPeriodetoStr(periode) {
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const blnNumber = Number(periode.substring(4, 6)) - 1;
  const thn = periode.substring(0, 4);

  return `${bulan[blnNumber]} ${thn}`;
}

async function cekTagihan(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const { nosamb } = await req.params;

    const pelanggan = await db
      .select("*")
      .from("pelanggan")
      .where("nosamb", nosamb)
      .first();

    if (!pelanggan) {
      return res.status(404).json({
        success: false,
        message: "Pelanggan Tidak Terdaftar",
      });
    }

    let resTagihan = [];

    const resTagihanSdhLunas = await db.raw("call infobayar_moba(?)", [nosamb]);
    const tagihanSdhLunas = resTagihanSdhLunas[0][0];

    const hostUrlBacameter = process.env.URL_FOTO_BACAMETER;
    tagihanSdhLunas.forEach((tagihan) => {
      // const strTglbayar = tagihan.tglbayar.replace("T"," ").replace(".000Z","");

      const retTagihan = {
        nosamb: tagihan.nosamb,
        nama: tagihan.nama.trim(),
        alamat: tagihan.alamat.trim(),
        periode: converPeriodetoStr(tagihan.periode),
        periode_number: Number(tagihan.periode),
        kodegol: tagihan.kodegol,
        status: pelanggan.aktif,
        total: Number(tagihan.total),
        flaglunas: true,
        detail_tagihan: {
          stanlalu: Number(tagihan.stanlalu),
          stanskrg: Number(tagihan.stanskrg),
          stanangkat: Number(tagihan.stanangkat),
          pakai: Number(tagihan.pakai),
          tanggal_bayar: moment(tagihan.tglbayar).format(
            "DD MMMM YYYY HH:mm:ss"
          ),
          loket_bayar: tagihan.loketbayar,
          biayapemakaian: Number(tagihan.biayapemakaian),
          denda: Number(tagihan.dendatunggakan),
          administrasi: Number(tagihan.administrasi),
          retribusi: Number(tagihan.retribusi),
          pemeliharaan: Number(tagihan.pemeliharaan),
          pelayanan: Number(tagihan.pelayanan),
          angsuran: Number(tagihan.angsuran),
          materai: Number(tagihan.meterai),
          ppn: Number(tagihan.ppn),
          total: Number(tagihan.total),
          url_foto_meter: `${hostUrlBacameter}/${tagihan.periode}/foto_meter/${tagihan.nosamb}.jpg`,
        },
      };
      resTagihan.push(retTagihan);
    });

    const resTagihanBlmLunas = await db.raw("call infotag_moba(?)", [nosamb]);
    const tagihanBlmLunas = resTagihanBlmLunas[0][0];

    tagihanBlmLunas.forEach((tagihan) => {
      const retTagihan = {
        nosamb: tagihan.nosamb,
        nama: tagihan.nama.trim(),
        alamat: tagihan.alamat.trim(),
        periode: converPeriodetoStr(tagihan.periode),
        periode_number: Number(tagihan.periode),
        kodegol: tagihan.kodegol,
        status: pelanggan.aktif,
        total: Number(tagihan.total),
        flaglunas: false,
        detail_tagihan: {
          stanlalu: Number(tagihan.stanlalu),
          stanskrg: Number(tagihan.stanskrg),
          stanangkat: Number(tagihan.stanangkat),
          pakai: Number(tagihan.pakai),
          tanggal_bayar: "-",
          loket_bayar: "-",
          biayapemakaian: Number(tagihan.biayapemakaian),
          denda: Number(tagihan.dendatunggakan),
          administrasi: Number(tagihan.administrasi),
          retribusi: Number(tagihan.retribusi),
          pemeliharaan: Number(tagihan.pemeliharaan),
          pelayanan: Number(tagihan.pelayanan),
          angsuran: Number(tagihan.angsuran),
          materai: Number(tagihan.meterai),
          ppn: Number(tagihan.ppn),
          total: Number(tagihan.total),
          url_foto_meter: `${hostUrlBacameter}/${tagihan.periode}/foto_meter/${tagihan.nosamb}.jpg`,
        },
      };
      resTagihan.push(retTagihan);
    });

    resTagihan.sort((a, b) => b.periode_number - a.periode_number);
    res.status(200).json({
      success: true,
      data: resTagihan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { cekTagihan };
