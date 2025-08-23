import jwt from "jsonwebtoken";

import "dotenv/config";

const { JWT_SECRET_KEY, JWT_SECRET_KEY_BACAMETER } = process.env;

function authMiddleware(req, res, next) {
  const path = req.baseUrl + req.path;
  console.log(path);
  if (
    path !== "/auth/login/" &&
    path !== "/auth/login/petugas/" &&
    path !== "/auth/login/bacameter/" &&
    path !== "/auth/mitra/generate-token/"
  ) {
    const authHeader = req.headers["authorization"];

    if (typeof authHeader === "undefined") {
      return res.status(403).json({
        success: false,
        message: "Authorization Forbidden",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decodedUserPayload = jwt.verify(token, JWT_SECRET_KEY);

      console.log(decodedUserPayload);
      req.auth = decodedUserPayload;
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
      // console.log(err)
      // throw err
    }
  }

  next();
}

export function authMiddlewareBacameter(req, res, next) {
  const path = req.baseUrl + req.path;
  if (
    path !== "/auth/login/" &&
    path !== "/auth/login/petugas/" &&
    path !== "/auth/login/bacameter/" &&
    path !== "/auth/mitra/generate-token/"
  ) {
    const authHeader = req.headers["authorization"];

    if (typeof authHeader === "undefined") {
      return res.status(403).json({
        success: false,
        message: "Authorization Forbidden",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decodedUserPayload = jwt.verify(token, JWT_SECRET_KEY_BACAMETER);

      req.auth = decodedUserPayload;
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
      // console.log(err)
      // throw err
    }
  }

  next();
}

export default authMiddleware;
