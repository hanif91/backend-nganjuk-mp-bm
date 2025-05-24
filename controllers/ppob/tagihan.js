import db from '../../database/db.js';

// import { validateSessionToken } from '../lib/session.js';
// import { validationResult } from 'express-validator';
// import jwt from "jsonwebtoken";
import { compareArrays, validateUserMitra } from '../../lib/utils.js';
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

async function cekTagihanPpob(req,res) {
	try {
		const { id,username,loket,nama } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}

		const tglSkrg = moment()
			.tz("Asia/Jakarta")
			.format("YYYY-MM-DD");

		
		const datemin = moment().add(-4, 'months').format('YYYYMM');
		

		const { nosamb } = req.params;
			const pelanggan = await db
			.select("*")
			.from("masterpelanggan")
			.where("no_pelanggan", nosamb)
			.first();

			if (!pelanggan) {
				return res.status(404).json({
					success: false,
					message: "Pelanggan Tidak Terdaftar",
				});
			}

    const resTagihanBlmLunas = await db.raw("call infotag_desk(?,?)", [nosamb,tglSkrg]);
    const tagihanBlmLunas = resTagihanBlmLunas[0][0];
		
		if (tagihanBlmLunas.length == 0) {
			return res.status(422).json({	
				success: false,
				message: "Tidak Ada Data Tagihan",
			});
		}
		const periodeLast=tagihanBlmLunas[0];
		const periodefirst=tagihanBlmLunas[tagihanBlmLunas.length-1];
		console.log(periodeLast.periode_rek,periodefirst.periode_rek)
		console.log(Number(datemin), Number(periodeLast.periode_rek));
		if ( Number(periodeLast.periode_rek) < Number(datemin)) {
			return res.status(404).json({
				success: false,
				message: 'Pelanggan Harus Bayar Dikantor PDAM'
			});		
		}
	
		const detailTagihan =  tagihanBlmLunas.map((tagihan) => {
					const retTagihan = {
						periode: converPeriodetoStr(tagihan.periode_rek),
						periode_number: Number(tagihan.periode_rek),
						kodegol: tagihan.kodegol,
						stanlalu: Number(tagihan.stanlalu),
						stanskrg: Number(tagihan.stanskrg),
						pakai: Number(tagihan.pakaiskrg),
						biayapemakaian: Number(tagihan.harga_air),
						denda: Number(tagihan.denda1)+Number(tagihan.denda2),
						administrasi: Number(tagihan.administrasi),
						retribusi: Number(tagihan.retribusi),
						pemeliharaan: Number(tagihan.pemeliharaan),
						pelayanan: Number(tagihan.pelayanan),
						angsuran: Number(tagihan.angsuran),
						materai: Number(tagihan.materai),
						ppn: 0,
						total: Number(tagihan.totalrek)
						};
					return retTagihan;	
    });


  
    return res.status(200).json({
			  success: true,
        message: "Data Tagihan Tersedia",
        data: {
						no_pelanggan: pelanggan.no_pelanggan,
						nama: pelanggan.nama.trim(),
						alamat: pelanggan.alamat.trim(),
						kodegol: pelanggan.kode_golongan,
						status: pelanggan.status,
						detail_tagihan: detailTagihan,
				},
    });  

		
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}


async function infoBayarPpob(req,res) {
	try {
		const { id,username,kodeloke,nama } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}

		
		const { nosamb,periode } = req.params;
			const pelanggan = await db
			.select("*")
			.from("masterpelanggan")
			.where("no_pelanggan", nosamb)
			.first();

			if (!pelanggan) {
				return res.status(404).json({
					success: false,
					message: "Pelanggan Tidak Terdaftar",
				});
			}
    const resTagihan = await db.raw("call infobayar_mitra(?,?)", [nosamb,periode]);
		if (resTagihan[0][0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Tidak Ada Data"
			});	
		}
		
		const detailTagihan =  resTagihan[0][0].map((tagihan) => {
					const retTagihan = {
						periode: converPeriodetoStr(tagihan.periode_rek),
						periode_number: Number(tagihan.periode_rek),
						kodegol: tagihan.kodegol,
						stanlalu: Number(tagihan.stanlalu),
						stanskrg: Number(tagihan.stanskrg),
						pakai: Number(tagihan.pakaiskrg),
						biayapemakaian: Number(tagihan.harga_air),
						denda: Number(tagihan.denda),
						administrasi: Number(tagihan.administrasi),
						retribusi: Number(tagihan.retribusi),
						pemeliharaan: Number(tagihan.pemeliharaan),
						pelayanan: Number(tagihan.pelayanan),
						angsuran: Number(tagihan.angsuran),
						materai: Number(tagihan.meterai),
						ppn: 0,
						total: Number(tagihan.total),
						tglbayar : moment(tagihan.tglbayar).tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
						user_bayar : tagihan.kasir,
						loket_bayar : tagihan.loket,
						};
					return retTagihan;	
    });


  
    res.status(200).json({
        succces: true,
        message: "Data Tagihan Tersedia",
        data: {
						nosamb: pelanggan.no_pelanggan,
						nama: pelanggan.nama.trim(),
						alamat: pelanggan.alamat.trim(),
						kodegol: pelanggan.kode_golongan,
						status: pelanggan.aktif,
						detail_tagihan: detailTagihan,
				},
    });  

		
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}

async function bayarTagihanPpob(req,res) {
	try {
		const { id,username,kodeloket,nama } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User Mitra'
			});
		}
		console.log(req.auth)
		const { periode, no_pelanggan } = req.body;


		BigInt.prototype.toJSON = function () {
			return this.toString();
		};
	
    if (!Array.isArray(periode) || !no_pelanggan)  {
			return res.status(404).json({
        
          success: false,
          message: 'Data Body Invalid' 
			})       
    }

		const dataLoket = await db.raw(`select id,kodeloket,loket from loket where kodeloket = ?`, [kodeloket]);
		if (dataLoket[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Loket tidak ditemukan"
			})
		}

		console.log(dataLoket[0][0])

		const pelanggan = await db
		.select("*")
		.from("masterpelanggan")
		.where("no_pelanggan", no_pelanggan)
		.first();

		if (!pelanggan) {
			return res.status(404).json({
				success: false,
				message: "Pelanggan Tidak Terdaftar",
			});
		}
		
		const tglSkrg = moment()
			.tz("Asia/Jakarta")
			.format("YYYY-MM-DD");

			const tglSkrgbyr = moment()
			.tz("Asia/Jakarta")
			.format("YYYY-MM-DD HH:mm:ss");


		const rawTagihan = await db.raw(`call infotag_desk(?,?)`, [no_pelanggan,tglSkrg]);

		if (rawTagihan[0][0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak ditemukan"
			});
		}


		if (rawTagihan[0][0].length !== periode.length ) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak valid / data Sudah Lunas",
			});
		}

		if (!compareArrays(rawTagihan[0][0].map((tagihan) => tagihan.periode_rek), periode)) {
			return res.status(422).json({
				success: false,
				message: "Tagihan tidak valid / data Sudah Lunas",
			});
		}


		try {
			await db.transaction(async (trx) => { 
				for (const tagihan of rawTagihan[0][0]) {
					const updateData = {
						flaglunas: 1,
						tglbayar: tglSkrgbyr,
						user_id: id,
						nama_user: username || "",
						loket_id: dataLoket[0][0].id || "",
						nama_loket: dataLoket[0][0].kodeloket || "",
						denda: Number(tagihan.denda1)+Number(tagihan.denda2),
						meterai: Number(tagihan.materai),
						totalrekening: Number(tagihan.totalrek),
		
					};

					await db("drd").where({id : tagihan.id, flaglunas : 0}).update(updateData);

				}

			})
		} catch (err) {
			return res.status(500).json({
				success: false,
				message: err.message
			})
		}

		const detailTagihan =  rawTagihan[0][0].map((tagihan) => {
			const retTagihan = {
				periode: converPeriodetoStr(tagihan.periode_rek),
				periode_number: Number(tagihan.periode_rek),
				kodegol: tagihan.kodegol,
				stanlalu: Number(tagihan.stanlalu),
				stanskrg: Number(tagihan.stanskrg),
				pakai: Number(tagihan.pakaiskrg),
				biayapemakaian: Number(tagihan.harga_air),
				denda: Number(tagihan.denda1)+Number(tagihan.denda2),
				administrasi: Number(tagihan.administrasi),
				retribusi: Number(tagihan.retribusi),
				pemeliharaan: Number(tagihan.pemeliharaan),
				pelayanan: Number(tagihan.pelayanan),
				angsuran: Number(tagihan.angsuran),
				materai: Number(tagihan.materai),
				ppn: 0,
				total: Number(tagihan.totalrek),
				tglbayar : tglSkrgbyr
				};
			return retTagihan;	
		});
		
		return res.status(200).json({
			success: true,
			message : 'tagihan berhasil dibayar',
			data: {
				nosamb: pelanggan.no_pelanggan,
				nama: pelanggan.nama.trim(),
				alamat: pelanggan.alamat.trim(),
				kodegol: pelanggan.kode_golongan,
				status: pelanggan.status,
				detail_tagihan: detailTagihan,
			},
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}

async function uploadRekonPpob(req,res) {
	try {
		const { id,username,kodeloket,nama } = req.auth;
		const isValiduser = await validateUserMitra(id);
		if (!isValiduser) {
			return res.status(401).json({
				success: false,
				message: 'Invalid User'
			});
		}
		


		const { startdate, enddate, data } = req.body;


		BigInt.prototype.toJSON = function () {
			return this.toString();
		};
	
    if (!Array.isArray(data) || !startdate || !enddate)  {
			return res.status(404).json({
        
          success: false,
          message: 'Data Body Invalid' 
			})       
    }

		if (!moment(startdate,"YYYY-MM-DD",true).isValid() || !moment(enddate,"YYYY-MM-DD",true).isValid()) {
			return res.status(404).json({
					success: false,
					message: 'Tanggal Invalid'
			})
		};
		const dataLoket = await db.raw(`select id,kodeloket,loket from loket where kodeloket = ?`, [kodeloket]);
		if (dataLoket[0].length == 0) {
			return res.status(422).json({
				success: false,
				message: "Loket tidak ditemukan"
			})
		}

		const rawCekData = await db
		.select("*")
		.from("rekon_mitra")
		.where({
			startdate: startdate,
			enddate: enddate,
			loket_id : dataLoket[0][0].id,
			user_id: id,

		})
		.first();


		if (rawCekData) {
			if (rawCekData.flagverifikasi) {
				return res.status(422).json({
					success: false,
					message: "Data Sudah Diverifikasi",
				});
			} else {	
				await db("rekon_mitra").where("id",rawCekData.id).update(
				{
					data : JSON.stringify(data),
				});
			}
		} else {
			await db("rekon_mitra").insert({
				startdate: startdate,
				enddate: enddate,
				data : JSON.stringify(data),
				user_id: id,
				loket_id: dataLoket[0][0].id,
				namauser : nama
			});
		}

		
		
		res.status(200).json({
			success: true,
			message : 'upload Rekon berhasil',
			data: {
				startdate: startdate,
				enddate: enddate,
			},
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}



// async function cancelBayar(req,res) {
// 	try {
// 		const { id,username,loket,nama } = req.auth;
// 		const isValiduser = await validateUserMitra(id);
// 		if (!isValiduser) {
// 			return res.status(401).json({
// 				success: false,
// 				message: 'Invalid User'
// 			});
// 		}
		
// 		const { periode, no_pelanggan,tglbayar } = req.body;



		
// 		BigInt.prototype.toJSON = function () {
// 			return this.toString();
// 		};
	
//     if (!Array.isArray(periode) || !no_pelanggan)  {
// 			return res.status(404).json({
        
//           success: false,
//           message: 'Data Body Invalid' 
// 			})       
//     }


// 		if (!moment(tglbayar,"YYYY-MM-DD",true).isValid()) {
// 			return res.status(404).json({
// 					success: false,
// 					message: 'Tanggal Invalid' 
// 			})       
// 		}

// 		const dataLoket = await db.raw(`select kodeloket,loket from loket where kodeloket = ?`, [loket]);
// 		if (dataLoket[0].length == 0) {
// 			return res.status(422).json({
// 				success: false,
// 				message: "Loket tidak ditemukan",
// 				data: {	
// 					loket: null
// 				}
// 			})
// 		}



// 		const pelanggan = await db
// 		.select("*")
// 		.from("pelanggan")
// 		.where("nosamb", no_pelanggan)
// 		.first();

// 		if (!pelanggan) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Pelanggan Tidak Terdaftar",
// 			});
// 		}


// 		const rawTagihan = await db.raw(`infobayar_mitra_cancelpayment(?,?,?)`, [no_pelanggan,tglbayar,username]);

// 		if (rawTagihan[0][0].length == 0) {
// 			return res.status(422).json({
// 				success: false,
// 				message: "Pembayaran tidak ditemukan"
// 			});
// 		}


// 		if (rawTagihan[0][0].length !== periode.length ) {
// 			return res.status(422).json({
// 				success: false,
// 				message: "Tagihan tidak valid / dibayar user lain",
// 			});
// 		}

// 		if (!compareArrays(rawTagihan[0][0].map((tagihan) => tagihan.periode), periode)) {
// 			return res.status(422).json({
// 				success: false,
// 				message: "Tagihan tidak valid / dibayar user lain",
// 			});
// 		}

// 		try {
// 			await db.transaction(async (trx) => { 
		
// 					const updateData = {
// 						loketbayar: null,
// 						tglbayar: null,
// 						nolpp: null,
// 						kasir: null,
// 						flaglunas: 0,
// 						flagbatal: 1,
// 						sudahupload: true,
// 						dendatunggakan: 0,
// 						total: 0,
// 						totalloket: 0,
// 						jasaloket: 0,
// 						loketupdate: null,
// 						namaloket: null,
// 					};

// 					await db("drd").where({

// 					}).update(updateData),
// 					await db("udownload").insert({
// 						kode : `${tagihan.periode}.${tagihan.nosamb}`,
// 						periode : tagihan.periode,
// 						nosamb : tagihan.nosamb,
// 						kodeloket: dataLoket[0].loket,
// 						dendatunggakan: tagihan.dendatunggakan,
// 						tglbayar: tglSkrg,
// 						flagdownload: 0,
// 					});


// 			})
// 		} catch (err) {
// 			return res.status(500).json({
// 				success: false,
// 				message: err.message
// 			})
// 		}

// 		const detailTagihan =  rawTagihan[0][0].map((tagihan) => {
// 			const retTagihan = {
// 				periode: converPeriodetoStr(tagihan.periode),
// 				periode_number: Number(tagihan.periode),
// 				kodegol: tagihan.kodegol,
// 				stanlalu: Number(tagihan.stanlalu),
// 				stanskrg: Number(tagihan.stanskrg),
// 				stanangkat: Number(tagihan.stanangkat),
// 				pakai: Number(tagihan.pakai),
// 				biayapemakaian: Number(tagihan.biayapemakaian),
// 				denda: Number(tagihan.dendatunggakan),
// 				administrasi: Number(tagihan.administrasi),
// 				retribusi: Number(tagihan.retribusi),
// 				pemeliharaan: Number(tagihan.pemeliharaan),
// 				pelayanan: Number(tagihan.pelayanan),
// 				angsuran: Number(tagihan.angsuran),
// 				materai: Number(tagihan.meterai),
// 				ppn: Number(tagihan.ppn),
// 				total: Number(tagihan.total),
// 				tglbayar : tglSkrg
// 				};
// 			return retTagihan;	
// 		});
		
// 		res.status(200).json({
// 			success: true,
// 			message : 'tagihan berhasil dibayar',
// 			data: {
// 				nosamb: pelanggan.nosamb,
// 				nama: pelanggan.nama.trim(),
// 				alamat: pelanggan.alamat.trim(),
// 				kodegol: pelanggan.kodegol,
// 				status: pelanggan.aktif,
// 				detail_tagihan: detailTagihan,
// 			},
// 		})
// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message
// 		})
// 	}
// }

export {
	bayarTagihanPpob,
	cekTagihanPpob,
	infoBayarPpob,
	uploadRekonPpob
}