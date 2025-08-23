import express from "express";

import router from "./routes.js";
import {
  login,
  loginPetugas,
  logout,
  validateSession,
  forgotPassword,
  generate_token,
  loginPetugasBacameter,
} from "./controllers/authController.js";
import { registerUser } from "./controllers/userController.js";
const app = express();
import cookieParser from "cookie-parser";
import authMiddleware from "./middleware/authMiddleware.js";
import { registerUserRules } from "./validation/userValidation.js";
import {
  forgotPasswordRules,
  loginRules,
} from "./validation/authValidation.js";
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
// app.use(multer.array())

app.use(cookieParser());
app.get("/", (req, res) => {
  return res.status(200).json({
    App: "backend Pdam Nganjuk",
    Version: "1.0.2",
  });
});
// app.use("/auth/*", authMiddleware);
app.post("/auth/login/petugas", loginPetugas);
app.post("/auth/login/bcm", loginPetugasBacameter);

app.use("/api", router);

app.listen(5001, () => {
  console.log("Listening on port 5001");
});
