import nodemailer from 'nodemailer';
import 'dotenv/config';
import db from '../database/db.js';

const transport = nodemailer.createTransport(
	{
		host : process.env.MAIL_HOST,
		port : process.env.MAIL_PORT,
		secure : false,
		auth : {
			user : process.env.MAIL_USER,
			pass : process.env.MAIL_PASSWORD
		}
	}
)

const sendEmail = async ({receipients,subject , message}) => {
	try{
	const result = await transport.sendMail({
		from : "admin@pudam-bayuangga.id",
		to : receipients,
		subject : subject,
		text :message
	})

	const valInsert = {
		email : receipients,
		log_res : result
	}
	await db('log_email').insert(valInsert);
} catch(err) {
	console.log(err)

}
}

export { sendEmail};