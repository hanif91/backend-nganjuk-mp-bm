import moment from 'moment/moment.js';
import db from '../../database/db.js';
import {periodeTagihPelanggan, validateUser}  from '../../lib/utils.js';

async function bayarRekening(req,res) {
	try {
		const {username,id,nama,jabatan,role_id,role} = req.auth;
		const isValiduser = await validateUser(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}
		
		const { drd_ids, no_pelanggan } = req.body;

		BigInt.prototype.toJSON = function () {
			return this.toString();
		};
		

		const periodeTagih = periodeTagihPelanggan();
		

    if (!Array.isArray(drd_ids) || !no_pelanggan)  {
			return res.status(422).json({
        
          success: false,
          message: 'Data Body Invalid' 
			})       
    }

		const loket = await db.raw(`select id,kodeloket,loket from loket where kodeloket = ?`, ['aplikasi_penagihan']);
		if (loket[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Loket tidak ditemukan",
				data: {	
					loket: null
				}
			})
		}

		const isPelanggan = await db.raw(`select id,no_pelanggan,nama,alamat,tgl_pasif,tgl_aktif,status,latitude,longitude from pelanggan where no_pelanggan = ?`, [no_pelanggan]);
		if (isPelanggan[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Pelanggan tidak ditemukan",
				data: {
					pelanggan: null,
					tagihan: []
				}
			})
		}


		const rawTagihan = await db.raw(`call infotag_desk(?, ?)`, [no_pelanggan, moment().format('YYYY-MM-DD')]);

		if (rawTagihan[0][0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak ditemukan"
			});
		}



		if (rawTagihan[0][0].length < drd_ids.length ) {
			return res.status(422).json({
				success: false,
				message: "Drd Ids tidak valid / data Sudah Lunas",
			});
		}

		const tagihanSelect = rawTagihan[0][0].filter(({id}) => drd_ids.includes(id));
		
		if (tagihanSelect.length == 0) {
		return res.status(422).json({
			success: false,
			message: "Tidak Ada Data yang bisa di bayar."
		});
		}

		try {
			await db.transaction(async (trx) => { 
				for (const tagihan of tagihanSelect) {
					await trx.raw(`UPDATE drd SET flaglunas=1,tglbayar=now(),user_id=?,nama_user=?,loket_id=?,nama_loket=?,denda=?,meterai=?,admin_ppob=?,totalrekening=? WHERE id=?`, [
						id,
						nama,
						loket[0][0].id,
						loket[0][0].loket,
						Number(tagihan.denda1)+Number(tagihan.denda2),
						tagihan.materai,
						0,
						tagihan.totalrek,
						tagihan.id
					]);
				}

			})
		} catch (err) {
			return res.status(500).json({
				success: false,
				message: err.message
			})
		}

		const tagihanSuccesBayar = await db.raw(`Select *,convertperiode(periode_rek) as periodestr from drd where id in (?)  and user_id=? and flaglunas="1"
`, [drd_ids, id]);
		res.status(200).json({
			success: true,
			data: {
				tagihan : tagihanSuccesBayar[0],
				user : {
					id: id,
					name: username,
					role: role,
					no_hp : isValiduser.no_hp
				},			
			},
	
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}

async function daftarDrdPetugas(req,res) {
	try {
		const {username,id,nama,jabatan,role_id,role} = req.auth;
		const isValiduser = await validateUser(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}
		const periodeRek = periodeTagihPelanggan();
		
    const tgldenda  = moment().format('YYYY-MM-01');

		BigInt.prototype.toJSON = function () {
			return this.toString();
		};

		await db.raw(`call tagihanTimTagih(?, ?, ?, ?)`, [id, periodeRek, tgldenda, username]);

		
		
		res.status(200).json({
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

export {bayarRekening}