import { check } from 'express-validator';

const registerRules = [
    check('email').notEmpty().isEmail(),
    check('password').isStrongPassword()
]


const forgotPasswordRules = [
    check('email').notEmpty().isEmail()
]

export { registerRules,forgotPasswordRules }