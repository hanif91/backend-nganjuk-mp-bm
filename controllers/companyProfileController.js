import db from "../database/db.js";
import { validateSessionToken } from "../lib/session.js";

export async function getCompanyProfile(req, res) {
  try {
    const profileRes = await db
      .select("data")
      .from("app_configuration")
      .where("name", "profile");

    return res.status(200).json({
      success: true,
      data: profileRes[0].data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateCompanyProfile(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const data = req.body;
    const updated = await db("app_configuration")
      .where("name", "profile")
      .update({ data: JSON.stringify(data) });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getWhatsappNumber(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const profileRes = await db
      .select("data")
      .from("app_configuration")
      .where("name", "profile");

    return res.status(200).json({
      success: true,
      data: {
        whatsapp: profileRes[0].data.whatsapp,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
