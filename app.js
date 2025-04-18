import express from "express";

import router from "./routes.js";
import {
  login,
  loginPetugas,
  logout,
  googleRedirect,
  googleCallback,
  validateSession,
  forgotPassword,
} from "./controllers/authController.js";
import { registerUser } from "./controllers/userController.js";
const app = express();
import cookieParser from "cookie-parser";
import authMiddleware from "./middleware/authMiddleware.js";
import { registerUserRules } from "./validation/userValidation.js";
import { forgotPasswordRules } from "./validation/authValidation.js";
import { verifyPayment } from "./controllers/afterPaymentController.js";

// const multerMid = multer({
// 	storage: multer.memoryStorage(),
// 	limits : {fileSize : 1000000},
// 	fileFilter: (req, file, cb) => {
// 		if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
// 				return cb(null, true);
// 		} else {
// 			return cb(new Error('Invalid mime type'));
// 		}
// }
// });

// app.use(multerMid.single('image_aduan'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(multer.array())

app.use(cookieParser());
app.get("/", (req, res) => {
  return res.status(200).json({
    App: "backend Mobile Penagihan",
    Version: "1.0.2",
  });
});
app.use("/auth/*", authMiddleware);
app.get("/auth/google", googleRedirect);
app.get("/auth/google/callback", googleCallback);
app.post("/auth/validate-session", validateSession);
app.post("/auth/forgot-password", forgotPasswordRules, forgotPassword);
app.post("/auth/register", registerUserRules, registerUser);
app.post("/auth/login/petugas", loginPetugas);
app.post("/auth/login", login);
app.post("/auth/logout", logout);
app.post("/verify-payment", verifyPayment);

app.use("/api", router);

app.listen(5001, () => {
  console.log("Listening on port 5001");
});
