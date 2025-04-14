import { check } from "express-validator";

const pengaduanCreateRule = [
  check("image_aduan"),
  check("jenis_aduan_id").notEmpty().isString(),
  check("tanggal").notEmpty(),
  check("no_pelanggan"),
  check("nama").notEmpty().isString(),
  check("alamat").notEmpty().isString(),
  check("no_hp").notEmpty().isString(),
  check("ket_aduan").notEmpty().isString(),
  check("longitude").notEmpty().isString(),
  check("latitude").notEmpty().isString(),
];

export { pengaduanCreateRule };
