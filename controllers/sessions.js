import db from '../database/db.js';

async function getSession (req, res) {
	try {

		const result = await db.select('session.id','session.expires_at'
			,'web_public_user.nama'
			,'web_public_user.email'
			,'web_public_user.alamat'
			,'web_public_user.nomor_telepon'
		).from('session').innerJoin('web_public_user','session.userid','web_public_user.id').where('session.id', '12311').first()

		res.status(200).json({
				success: true,
				data: result,
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

export  {
	getSession
}