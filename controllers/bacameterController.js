import db from "../database/db.js";
import { validateUser } from "../lib/utils.js";

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

async function getMasterPelanggan(req, res) {
  try {
    const { petugas, un, nm_un } = req.auth;
    const isValiduser = await validateUser(id);
    if (!isValiduser) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const data = await db.select("customer").where("un", un);

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

export { getMasterPelanggan };
