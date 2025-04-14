import { check } from 'express-validator';

const updatePelRule = [
		check('no_pelanggan').notEmpty().isArray()
]

const updateProfileRule = [
	check('nama').notEmpty(),
	check('alamat').notEmpty(),
	check('nomor_telepon').notEmpty(),
	check('email').notEmpty().isEmail()
]

const resetPasswordRule = [
	check('password_lama').notEmpty(),
	check('password_baru').notEmpty()
]


export { updatePelRule,updateProfileRule,resetPasswordRule }