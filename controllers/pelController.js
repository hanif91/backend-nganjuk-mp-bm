import db from '../database/db.js';
import { validateSession } from '../lib/session.js';

async function getAllPelanggan (req, res) {
	try {
		const tokenReq = req.auth.token_session;
		const isValidsession = await validateSession(tokenReq);
		if (!isValidsession) {
			return res.status(401).json(
				{
					success : false,
					message : "InvalidSessionToken"
				});
		}
		const pelanggan = await db.select('*').from('pelanggan');
    const { email, password }  = await req.auth;
		const pelRes = pelanggan.map((val) => {
			return {
				nosamb : val.nosamb.trim(),
				nama : val.nama.trim(),                       
				alamat : val.alamat.trim(),       
				aktif : val.aktif			
			}
		})
		res.status(200).json({
				success: true,
				data: pelRes,
		})
			
	} catch (error) {
		console.log(error)
		res.status(500).json({
				success: false,
				message : error,
				data: null,
		})           
	}		

}

async function getSinglePelanggan(req, res) {
	try {

		const tokenReq = await req.auth.token_session;
		const isValidsession = await validateSession(tokenReq);
		if (!isValidsession) {
			return res.status(401).json(
				{
					success : false,
					message : "InvalidSessionToken"
				});
		}
		const pelanggan = await db.select('*').from('pelanggan').where('nosamb', nosamb).first()

		if (!pelanggan) {
				return res.status(404).json({
						success: false,
						message: 'Pelanggan Tidak Terdaftar',
				})
		}


		const pelres = {
			nosamb : pelanggan.nosamb.trim(),
			nama : pelanggan.nama.trim(),                       
			alamat : pelanggan.alamat.trim(),       
			aktif : pelanggan.aktif			
		}

		res.status(200).json({
				success: true,
				data: pelres,
		})
	
	} catch (error) {
		console.log('ERROR KONEKSI')
		res.status(500).json({
				success: false,
				message : error,
				data: null,
		})           
}		
}



export {
	getAllPelanggan,
	getSinglePelanggan
}