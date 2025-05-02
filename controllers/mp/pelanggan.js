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

		console.log(isValiduser)
		
		const { nosamb } = await req.params;
		
		const isPelanggan = await db.raw(`select id,no_pelanggan,nama,alamat,tgl_pasif,tgl_aktif,status,latitude,longitude from pelanggan where no_pelanggan = ?`, [nosamb]);

		if (isPelanggan[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Pelanggan tidak ditemukan"
			});
		}

		const rawTagihan = await db.raw(`call infotag_desk(?, ?)`, [nosamb, moment().format('YYYY-MM-DD')]);

		if (rawTagihan[0][0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak ditemukan"
			});
		}

		const resValue = rawTagihan[0][0].map((item) => {
			return {

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
				},
				pelanggan : {
					id : isPelanggan[0][0].id,
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

async function ajukanPemutusan(req,res) {
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

		const ifExistData = await db.raw(`select id from pendaftaran_lain where no_pelanggan = ? and jenis = 'PTST' and date_format(tanggal,'%Y%m')=?`, [nosamb, moment().format('YYYYMM')]);
		if (ifExistData[0].length > 0) {
			return res.status(422).json({
				success: false,
				message: "Permohonan Putus Langganan sudah ada"
			});
		}



		const putus_tagihan = await db.raw(`select * from jenis_nonair where jenis = 'PTST'`);
		if (putus_tagihan[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Jenis Pemutusan tidak ditemukan"
			});
		}

		const generateRegLain = await db.raw(`select noautoreglain() as noreg;`);
		if (!generateRegLain[0][0]) {
			return res.status(422).json({
				success: false,
				message: "Tidak dapat generate no autoreg lain"
			});
		}
		
		const pendaftaran_lain = await db('pendaftaran_lain').insert({
			tanggal: moment((new Date())).format('YYYY-MM-DD'),
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
			biaya : putus_tagihan[0][0].by_pelayanan,
			tglproses: moment((new Date())).format('YYYY-MM-DD'),
		});
		pendaftaran_lain
		res.status(200).json({
			success: true,
			data: pendaftaran_lain,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}



async function daftarPemutusan(req,res) {
	try {
		const {username,id,nama,jabatan,role_id,role} = req.auth;
		const isValiduser = await validateUser(id);

		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}

		const { periode } = await req.params;

		const ifExistData = await db.raw(`select id,no_pelanggan,nama,alamat,tanggal,flagrealisasi,tglrealisasi from pendaftaran_lain where user_input = ? and jenis = 'PTST' and date_format(tanggal,'%Y%m')=? order by tanggal desc`, [id, periode]);

		// console.log(ifExistData[0])

		const dataRespons = ifExistData[0].map((item) => {
			return {
				id: item.id,
				no_pelanggan : item.no_pelanggan,
				nama : item.nama,
				alamat : item.alamat,
				tanggal : moment(item.tanggal).format('YYYY-MM-DD'),
				tracking : {
					sudah_realisasi : item.flagrealisasi == 1 ? true : false,
					tanggal_realisasi : item.tglrealisasi == null ? null : moment(item.tglrealisasi).format('YYYY-MM-DD'),
				}

			}
		});

		
		return res.status(200).json({
			success: true,
			data: dataRespons,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}


export { searchPelanggan, cekTagihanPelanggan,ajukanPemutusan,daftarPemutusan };