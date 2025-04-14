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
import { cekTagihanPelanggan, searchPelanggan } from "./controllers/mp/pelanggan.js";

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
// app.use()

router.all("/*", authMiddleware);

// Post routes
router.get("/mp", getHome);
router.get("/mp/search-pelanggan", searchPelanggan);
router.get("/mp/cek-tagihan/:nosamb", cekTagihanPelanggan);
router.get("/app/profile", getCompanyProfile);
router.get("/app/whatsapp", getWhatsappNumber);
router.put("/app/profile", updateCompanyProfile);
router.get("/pelanggan", getAllPelanggan);
router.get("/session", getSession);
router.get("/pelanggan/:nosamb", getSinglePelanggan);
router.get("/profile", getProfile);
router.post("/profile/update-pelanggan", updatePelRule, updateNopelanggan);
router.post("/profile/update-profile", updateProfileRule, updateProfile);
router.post("/profile/reset-password", resetPasswordRule, resetPassword);
router.get("/cek-tagihan/:nosamb", cekTagihan);

router.post("/pengaduan/create", async function (req, res, next) {
  uploadSingleImage(req, res, async function (err) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    // console.log(req.body,'1')
    return req;
  });
  next();
});
router.post("/pengaduan/create", pengaduanCreateRule, createPengaduan);

router.get("/pengaduan/jenis-aduan", getJenisAduan);
router.get("/pengaduan", getAduan);

router.post("/pengaduan/vercel/create", async function (req, res, next) {
  uploadSingleImage(req, res, async function (err) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    console.log(req.body);
    console.log(req.file);
    // console.log(req.body,'1')
    return req;
  });
  next();
});
router.post(
  "/pengaduan/vercel/create",
  pengaduanCreateRule,
  createPengaduanVercel
);
const uploadSingleImagePsb = multerMid.single("foto_tempat");
router.post("/pasangbaru/create", async function (req, res, next) {
  uploadSingleImagePsb(req, res, async function (err) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    return req;
  });
  next();
});

router.post("/pasangbaru/create", createPsb);
router.get("/pasangbaru", getpsb);

router.post("/bacamandiri/create", bcmCreateRule, createbcmandiriHistori);
router.get("/bacamandiri", getHisBCM);

router.get("/home", getHome);
// router.get("/home/:nosamb", getTagihanByNosamb);

// payment
router.get("/payment", getTransaction);
router.post("/payment", createPayment);
router.put("/payment", updatePaymentStatus);
router.get("/payment/costs", getPaymentCosts);
router.get("/payment/status/:orderId", getPaymentStatus);

export default router;
