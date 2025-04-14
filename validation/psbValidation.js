import { check } from "express-validator";

const psbCreateRule = [
  check("nama").notEmpty().isString(),
  check("alamat").notEmpty().isString(),
  check("no_hp").notEmpty().isString(),
  check("longitude").notEmpty().isString(),
  check("latitude").notEmpty().isString(),
];

export { psbCreateRule };
