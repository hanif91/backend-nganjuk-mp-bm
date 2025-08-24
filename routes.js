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
import authMiddleware, {
  authMiddlewareBacameter,
} from "./middleware/authMiddleware.js";
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
  lppCetakPelanggan,
  lppPetugas,
  rekapLppPetugas,
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
import {
  getMasterPelanggan,
  uploadHasilBaca,
} from "./controllers/bacameterController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // WAJIB JPEG
    const isJpeg =
      file.mimetype === "image/jpeg" || /\.jpe?g$/i.test(file.originalname);
    if (!isJpeg) return cb(new Error("File harus JPEG (.jpg/.jpeg)"));
    cb(null, true);
  },
});
// app.use()

router.use("/mp", authMiddleware);

// Post routes
router.post("/mp/bayar-rekening", bayarRekening);
router.get("/mp/search-pelanggan", searchPelanggan);
router.get("/mp/cek-tagihan/:nosamb", cekTagihanPelanggan);
router.get("/mp", getHome);
router.get("/mp/pembayaran/lpp-petugas", lppPetugas);
router.get("/mp/pembayaran/recap-lpp", rekapLppPetugas);
router.get("/mp/pembayaran/lpp-cetak-pelanggan", lppCetakPelanggan);

router.get("/mp/daftar-pemutusan/:periode", daftarPemutusan);
router.get("/mp/daftar-drd-petugas", daftarDrdPetugas);
router.delete("/mp/pemutusan/:nosamb", ajukanPemutusan);
// sur

router.use("/bcm", authMiddlewareBacameter);
router.get("/bcm/pelanggan", getMasterPelanggan);
router.post("/bcm/upload", upload.single("foto_meter"), uploadHasilBaca);
export default router;
