import { check } from 'express-validator';

const homeRule = [
		check('no_pelanggan').notEmpty().isArray()
]


export {homeRule }