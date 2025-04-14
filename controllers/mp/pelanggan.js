import db from '../../database/db.js';
import {validateUser} from '../../lib/utils.js';
import moment from "moment/moment.js";

async function searchPelanggan(req,res) {
	try {
		const {username,  id,  nama,jabatan,role_id,role} = req.auth;
		const isValiduser = await validateUser(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}
		
		
    const { value } = req.query;
		
		if (value.length < 3 || value == null) {

      return res.status(422).json({
				success: false,
        message: "Minimal 3 Karakter"
      });
    }

		const dtpelanggan = await db.raw(`select id,no_pelanggan,nama,alamat,tgl_pasif,tgl_aktif,status from pelanggan where
			locate(?,CONCAT_WS(' ',no_pelanggan,nama,alamat)) limit 15
			`, [value]);

			dtpelanggan[0].map(function (p) {
				p.status_pelanggan = p.status == "1" ? "Aktif" : "Tidak Aktif";
			});
	
		res.status(200).json({
			success: true,
			data: dtpelanggan[0],
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}

async function cekTagihanPelanggan(req,res) {
	try {
		const {username,id,nama,jabatan,role_id,role} = req.auth;
		const isValiduser = await validateUser(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}
		
		const { nosamb } = await req.params;
		
		const isPelanggan = await db.raw(`select id,no_pelanggan,nama,alamat,tgl_pasif,tgl_aktif,status,latitude,longitude from pelanggan where no_pelanggan = ?`, [nosamb]);

		if (isPelanggan[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Pelanggan tidak ditemukan"
			});
		}

		const rawTagihan = await db.raw(`call infotag_desk(?, ?)`, [nosamb, moment().format('YYYY-MM-DD')]);

		if (rawTagihan[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak ditemukan"
			});
		}

		const resValue = rawTagihan[0][0].map((item) => {
			return {
				pelanggan : {
					no_pelanggan : item.no_pelanggan,
					nama : item.nama,
					alamat : item.alamat,
					rayon : item.rayon,
					kodegol : item.kodegol,
					golongan : item.golongan,
					status : isPelanggan[0][0].status,
					status_str : isPelanggan[0][0].status == "1" ? "Aktif" : "Tidak Aktif",
					latitude : isPelanggan[0][0].latitude,
					longitude : isPelanggan[0][0].longitude,
				},
				id: item.id,
				periode : item.periode_rek,
				total : Number(item.totalrek),
				urut : item.urut,
				detail_rekening : {
					stanlalu : item.stanlalu,
					stanskrg : item.stanskrg,
					pakaiskrg : item.pakaiskrg,
					harga_air	: item.harga_air,
					airlimbah : item.airlimbah,
					administrasi : item.administrasi,
					pemeliharaan : item.pemeliharaan,
					retribusi : item.retribusi,
					angsuran: item.angsuran,
					denda : Number(item.denda1)+Number(item.denda2),
					materai : item.materai,
					total : Number(item.totalrek),
				}
			}
		});



		
		res.status(200).json({
			success: true,
			data: resValue,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}


export { searchPelanggan, cekTagihanPelanggan };