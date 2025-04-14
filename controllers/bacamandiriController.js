import 'dotenv/config';
import db from '../database/db.js';
import { validateSessionToken } from '../lib/session.js';
import { validationResult } from 'express-validator';

const {URL_FOTO_BACAMETER} = process.env;

async function createbcmandiriHistori(req,res) {
	try {
		const token = await req.auth.token_session;
		const session = await validateSessionToken(token);
		if (session.session === null) { 
			return res.status(401).json(session);
		}
		const errors = validationResult(req)
		if(!errors.isEmpty()) {
			return res.status(422).json({
				success: false,
				errors,
			})
		}

		const {stanskrg,periode,no_pelanggan,nama,alamat,pakaiskrg} = req.body;

		const oldpelanggan = await db.select('nosamb').from('pelanggan').where({nosamb : no_pelanggan});
		if (oldpelanggan.length === 0){
			return res.status(422).json({
				success : false,
				message: 'pelanggan tidak terdaftar'
		})			
		}

		const bcmExecute = await db('web_user_bcmandiri').insert({
			user_id:session.user.id,
			stanskrg,
			periode,
			no_pelanggan,
			nama,
			alamat,
			pakaiskrg
		});

		const dataRespons = {
			id: bcmExecute[0],
			stanskrg,periode,no_pelanggan,nama,alamat,pakaiskrg
		}
		
		
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

async function getHisBCM(req,res) {
	try {
		const token = await req.auth.token_session;
		const session = await validateSessionToken(token);
		if (session.session === null) { 
			return res.status(401).json(session);
		}

		const bcm = await db.select(
			'a.id',
			'a.stanskrg',
			'a.periode',
			'a.no_pelanggan',
			'a.alamat',
			'a.nama',
			'a.pakaiskrg'
		).from('web_user_bcmandiri as a').
		where('a.user_id',session.user.id).orderBy('periode','desc').limit(12);		
		
		
		const dataOlahbcm = bcm.map((val)=> {
			const valMaster = {
				id : val.id,
				periode : val.periode,
				no_pelanggan : val.no_pelanggan,
				nama : val.nama,
				alamat : val.alamat.trim(),
				stan : val.stanskrg,
				pakaim3 : val.pakaiskrg,
				url_foto : `${URL_FOTO_BACAMETER}/${val.periode}/foto_meter/${val.no_pelanggan}.jpg`
			}

			return valMaster;

		})
		
		res.status(200).json({
			success: true,
			data: dataOlahbcm,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message
		})
	}
}

export {createbcmandiriHistori,getHisBCM}