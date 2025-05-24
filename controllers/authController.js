import db from '../database/db.js';
import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'
import { createSession,generateSessionToken, CekSessionUserId, validateSessionToken,invalidateSession } from '../lib/session.js';
import 'dotenv/config';
import { sendEmail } from '../lib/mail.js';
import jwt from "jsonwebtoken";

const BASE_URL = process.env.BASE_URL;
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CALLBACK_URL = `${BASE_URL}/auth/google/callback`;
const GOOGLE_OAUTH_SCOPES = ["https%3A//www.googleapis.com/auth/userinfo.email","https%3A//www.googleapis.com/auth/userinfo.profile"];
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;
const URL_REDIRECT_MOBILE = process.env.URL_REDIRECT_MOBILE;
const SCREET_KEY = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
async function validateSession(req,res) { 
    try {
        const token = await req.auth.token_session;
        const session = await validateSessionToken(token);

        if (session.session === null) { 

            return res.status(401).json(session);
        }
     
        res.status(202).json(session);
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function googleRedirect(req,res) {
    const state = "some_state";
    const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`;
    res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);    
}

async function googleCallback(req,res) {
    // console.log(req.query);
	try {
        const { code } = await req.query;

        const data = {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: `${BASE_URL}/auth/google/callback`,
            grant_type: "authorization_code",
        };


        // exchange authorization code for access token & id_token
        const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
            method: "POST",
            body: JSON.stringify(data),
        });
        const access_token_data = await response.json();

        const { id_token } = access_token_data;

        const token_info_response = await fetch(
        `${process.env.GOOGLE_TOKEN_INFO_URL}?id_token=${id_token}`
        );
        const resultCallback = await token_info_response.json();
        const {email,name,sub,picture} = resultCallback
        const oldUser = await db.select('*').from('web_public_user').where('email', email).first()

        let userId;
        let session;
        if(!oldUser) {

            const userCreate = await db('web_public_user').insert({
                email : email,
                nama : name,
                password: '',
                provider : 'google',
                provider_id : sub,
                nomor_telepon: '',
                image : picture,
                alamat : ''
            });
            
            userId= userCreate[0];
            const tokenNew = generateSessionToken();
            const resCreateSession = await createSession(tokenNew,userId);
            session = { session : resCreateSession , user : {id : userId,nama : name,email : email,alamat : '',nomor_telepon : '' , image : picture} }

        } else {
        
            userId = oldUser.id;
            session = await CekSessionUserId(userId);
            if (session.session === null) {
                const tokenNew = generateSessionToken();
                const resCreateSession = await createSession(tokenNew,userId); 
                session = { session : resCreateSession , user : {id : userId,nama : name,email : email,alamat : '',nomor_telepon : '' , image : picture } }       
            }

        }

        const url  = `${URL_REDIRECT_MOBILE}?token=${session.session.token}&nama=${session.user.nama.replace(' ','+')}&email=${session.user.email}`
        res.redirect(url);  
        // res.status(200).json(session);
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
        // console.log(err)
        // throw err
    }
}

async function login(req, res) {
    try {
    const { email, password }  = await req.auth;
    const user = await db.select('*').from('web_public_user').where('email', email).first();
    if (typeof user === 'undefined') {
        return res.status(401).json({
            success: false,
            message: 'Email or password is incorrect',
        })
    }
    if (user.password==='' && user.provider !== 'credential' ) {
        return res.status(401).json({
            success: false,
            message: 'Email Integrated With Google Provider, Please Login with Google ',
        })     
    }
    
    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if(!isPasswordMatch) {
        return res.status(401).json({
            success: false,
            message: 'Email or password is incorrect',
        })
    }

    await db('session').where('userid', user.id).del();
    const tokenNew = generateSessionToken();
    const resCreateSession = await createSession(tokenNew,user.id);
    const session = { session : resCreateSession , user : {id : user.id,nama : user.nama,email : user.email,alamat : user.alamat,nomor_telepon : user.nomor_telepon , image : user.image} }
    res.status(200).json(session);   
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
        // console.log(err)
        // throw err
    } 
}

async function logout(req, res) {
    try {
        const { token_session }  = await req.auth;

        if (!token_session) {
            return res.status(401).json({
                success: false,
                message: 'Token Invalid',
            })        
        }
        const session = await db.select('*').from('session').where('token',token_session).first();
        if (typeof session === 'undefined') {
            return res.status(401).json({
                success: false,
                message: 'Token Invalid',
            })
        };
        invalidateSession(session.id);
        res.status(200).json({
            success: true,
            message: 'LogOut Succesfull',
        });     
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
        // console.log(err)
        // throw err
    }
}

async function forgotPassword(req, res) {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
                return res.status(422).json({
                        success: false,
                        errors,
                })
        }
        const {email} = req.body;

        const oldUser = await db.select('*').from('web_public_user').where('email', email).first()
        console.log(oldUser);
        if(!oldUser) {
                return res.status(422).json({
                        success : false,
                        message: 'user email not exists'
                })
        }
        const randomstring = Math.random().toString(36).slice(-8);
        const message = 
        `Your New Password Is : ${randomstring}   please login to a Mobile app and reset password from a profile page`;
        const receipients = `<${email}>`
        const subject = "Reset Password Tidham";

        sendEmail({receipients,subject,message});
        const hashedPassword = bcrypt.hashSync(randomstring, 10);

        await db('web_public_user').where({id : oldUser.id}).update({password : hashedPassword});

        res.status(200).json({
            success: true,
            message: 'New Password Send To email. Check Email',
        });  
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
        // console.log(err)
        // throw err
    }
}

async function loginPetugas(req, res) {
    try {
    const { user, pass } = req.body;
    const userPetugas = await db.select('*').from('users').where(
        {
            username : user,
            is_user_timtagih: true,
            is_user_ppob: false,
            is_active: true
        }
    ).first();
    if (typeof userPetugas === 'undefined') {
        return res.status(404).json({
            success: false,
            message: 'Email or password is incorrect',
        })
    }
    
    const isPasswordMatch = await bcrypt.compare(pass, userPetugas.password)

    if(!isPasswordMatch) {
        return res.status(404).json({
            success: false,
            message: 'Email or password is incorrect',
        })
    }

    const userRole = await db.select('*').from('role').where(
        {
            id : userPetugas.role_id
        }
    ).first();

    const token = jwt.sign(
        {
            id : userPetugas.id,
            username: userPetugas.username,
            nama : userPetugas.nama,
            jabatan : userPetugas.jabatan,
            role_id : userPetugas.role_id,
            role : userRole.role
        },
        SCREET_KEY,
        { expiresIn: JWT_EXPIRES_IN }
    );

  
    res.status(200).json({
        succces: true,
        message: "berhasil login",
        data: {
            access_token: token,
            expiresIn : JWT_EXPIRES_IN,
            token_type: "Bearer",
            users: {          
                id: userPetugas.id,   
                username: userPetugas.username,
                nama : userPetugas.nama,
                jabatan : userPetugas.jabatan,
                role_id : userPetugas.role_id,
                role : userRole.role },
        },
    });   
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
        // console.log(err)
        // throw err
    } 
}


async function generate_token(req,res) {
    try {
	
    const { user,password,kodeloket } = req.body;
    if (typeof user === 'undefined' || typeof password === 'undefined' || typeof kodeloket === 'undefined') {
        return res.status(422).json({
            success: false,
            message: 'user, password and kodeloket is required',
        })
    }
    const userMitra = await db.select('*').from('users').where(
        {
            username : user,
			password : password,
            is_active: 1,
            is_user_ppob : 1
        }
    ).first();
    if (typeof userMitra === 'undefined') {
        return res.status(404).json({
            success: false,
            message: 'User or password is incorrect',
        })
    }

    const loket = await db.select('*').from('user_loket').leftJoin('loket',"user_loket.loket_id", "loket.id").whereRaw('user_loket.user_id = ? and user_loket.aktif = ? and loket.kodeloket = ?',[userMitra.id,1,kodeloket]).first();
    

    if (typeof loket === 'undefined') {
        return res.status(404).json({
            success: false,
            message: 'Loket User Tidak Terdaftar ',
        })
    }
    const token = jwt.sign(
        {
            id : userMitra.id,
            username: userMitra.username,
            nama : userMitra.nama,
            kodeloket : loket.kodeloket,
        },
        SCREET_KEY,
        { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
        succces: true,
        message: "berhasil login",
        data: {
            access_token: token,
            expiresIn : JWT_EXPIRES_IN,
            token_type: "Bearer",
            users: {          
							id : userMitra.id,
							username: userMitra.username,
							nama : userMitra.nama,
							kodeloket : loket.kodeloket
					},
        },
    });  

		
		
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


export { login, googleRedirect,googleCallback,validateSession,logout,forgotPassword,loginPetugas,generate_token }