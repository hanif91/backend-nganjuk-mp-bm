// const express= require('express')
import express from "express";
// Controllers

import {
  getAllPelanggan,
  getSinglePelanggan,
} from "./controllers/pelController.js";
import {
  getProfile,
  updateNopelanggan,
  updateProfile,
  resetPassword,
} from "./controllers/profileController.js";
import { getSession } from "./controllers/sessions.js";
// Validation rules

import {
  updatePelRule,
  updateProfileRule,
  resetPasswordRule,
} from "./validation/profileValidation.js";

// Middlewares
import authMiddleware from "./middleware/authMiddleware.js";
import { getHome } from "./controllers/mp/homeController.js";
import { cekTagihan } from "./controllers/infotagController.js";
import { pengaduanCreateRule } from "./validation/pengaduanValidation.js";
import {
  createPengaduan,
  createPengaduanVercel,
  getAduan,
  getJenisAduan,
} from "./controllers/pengaduanController.js";
import multer from "multer";
import { psbCreateRule } from "./validation/psbValidation.js";
import { createPsb, getpsb } from "./controllers/psbController.js";
import { bcmCreateRule } from "./validation/bcmValidation.js";
import {
  createbcmandiriHistori,
  getHisBCM,
} from "./controllers/bacamandiriController.js";
import {
  createPayment,
  getPaymentCosts,
  getPaymentStatus,
  getTransaction,
  updatePaymentStatus,
} from "./controllers/paymentController.js";
import {
  getCompanyProfile,
  getWhatsappNumber,
  updateCompanyProfile,
} from "./controllers/companyProfileController.js";
import {
  ajukanPemutusan,
  cekTagihanPelanggan,
  daftarPemutusan,
  searchPelanggan,
} from "./controllers/mp/pelanggan.js";
import {
  bayarRekening,
  daftarDrdPetugas,
  lppPetugas,
} from "./controllers/mp/drd.js";
import {
  bayarTagihanPpob,
  cekTagihanPpob,
  infoBayarPpob,
  uploadRekonPpob,
} from "./controllers/ppob/tagihan.js";
import {
  bayarTagihanWa,
  cekTagihanWa,
  infoBayarWa,
  infoPelanggan,
} from "./controllers/wa/tagihan.js";
import {
  createPengaduanWa,
  getAduanWa,
  getJenisAduanWa,
} from "./controllers/wa/pengaduanController.js";
import { createPsbWa, getpsbWa } from "./controllers/wa/psbController.js";

const router = express.Router();

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      console.log(file);
      return cb(null, true);
    } else {
      return cb(new Error("Invalid mime type"));
    }
  },
});

const uploadSingleImage = multerMid.single("image_aduan");
const uploadSingleImagePsb = multerMid.single("foto_tempat");
// app.use()

router.all("/*", authMiddleware);

// Post routes
router.post("/mp/bayar-rekening", bayarRekening);
router.get("/mp/search-pelanggan", searchPelanggan);
router.get("/mp/cek-tagihan/:nosamb", cekTagihanPelanggan);
router.get("/mp", getHome);
router.get("/mp/pembayaran/lpp-petugas", lppPetugas);

router.get("/mp/daftar-pemutusan/:periode", daftarPemutusan);
router.get("/mp/daftar-drd-petugas", daftarDrdPetugas);
router.delete("/mp/pemutusan/:nosamb", ajukanPemutusan);
// sur

export default router;
