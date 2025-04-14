import { check } from 'express-validator'

const bcmCreateRule = [
		check('stanskrg').notEmpty().isNumeric(),
		check('periode').notEmpty().isString(),
		check('no_pelanggan').notEmpty().isString(),
		check('nama').notEmpty().isString(),
		check('alamat').notEmpty().isString(),
		check('pakaiskrg').notEmpty().isNumeric(),
]

export { bcmCreateRule }