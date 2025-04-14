import { check } from 'express-validator'

const registerUserRules = [
    check('email').notEmpty().isEmail(),
		check('nama').notEmpty().isString(),
		check('provider').notEmpty(),
		check('alamat').notEmpty()
]

export { registerUserRules }