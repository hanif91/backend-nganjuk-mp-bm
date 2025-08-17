import { check } from "express-validator";

const registerRules = [
  check("email").notEmpty().isEmail(),
  check("password").isStrongPassword(),
];

const forgotPasswordRules = [check("email").notEmpty().isEmail()];

const loginRules = [
  check("username")
    .notEmpty()
    .withMessage("Username wajib diisi")
    .isString()
    .withMessage("Username harus berupa string")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username harus 3–20 karakter"),

  check("password")
    .notEmpty()
    .withMessage("Password wajib diisi")
    .isString()
    .withMessage("Password harus berupa string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Password harus 1–100 karakter"),
];

export { registerRules, forgotPasswordRules, loginRules };
