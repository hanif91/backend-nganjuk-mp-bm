import db, { dbBacameter } from "../database/db.js";

async function validateUser(iduser) {
  try {
    const userPetugas = await dbBacameter("pm")
      .select("*")
      .whereRaw("LOWER(petugas) = ?", [iduser.toLowerCase()])
      .first();

    if (typeof userPetugas === "undefined") {
      return false;
    }
    return userPetugas;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function getBaseUrlBcm(req, res) {
  try {
    const data = await db
      .select("baseurl_bcm")
      .from("settings")
      .where("idx", 1)
      .first();
    return res.status(200).json({
      success: true,
      url: data.baseurl_bcm,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMasterPelanggan(req, res) {
  try {
    const { nama, un, nm_un } = req.auth;
    const isValiduser = await validateUser(nama);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const data = await db.select("*").from("customer").where("cab", un);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export { getMasterPelanggan, getBaseUrlBcm };
