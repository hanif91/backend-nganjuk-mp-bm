import db from '../database/db.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';


async function registerUser(req, res) {
	const errors = validationResult(req)
	if(!errors.isEmpty()) {
			return res.status(422).json({
					success: false,
					errors,
			})
	}
	const { email, password, nama, provider,provider_id,nomor_telepon,image,alamat } = await req.body

	const oldUser = await db.select('*').from('web_public_user').where('email', email).first()

	if(oldUser) {
			return res.status(422).json({
					success : false,
					message: 'User with this email already exists'
			})
	}

	
	const hashedPassword = bcrypt.hashSync(password, 10)

	const user = await db('web_public_user').insert({
			email,
			nama,
			password: hashedPassword,
			provider,
			provider_id,
			nomor_telepon,
			image,
			alamat
	} );

	const data = {
			id: user[0],
			nama, provider,provider_id,nomor_telepon,image,alamat
	}

	return res.status(201).json({
			success: true,
			data
	})
}


export { registerUser }