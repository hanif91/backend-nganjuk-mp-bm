import jwt from "jsonwebtoken";

const { JWT_SECRET_KEY } = process.env;

function authMiddleware(req, res, next) {
  const path = req.baseUrl + req.path;
  console.log(path)
  if (
    path !== "/auth/login/petugas/" && path !== "/auth/mitra/generate-token/"
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
