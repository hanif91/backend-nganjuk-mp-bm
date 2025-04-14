import { validationResult } from "express-validator";
import db from "../database/db.js";
import { validateSessionToken } from "../lib/session.js";
import Midtrans from "midtrans-client";
import { QRISHandler, VAHandler } from "../lib/paymentMethod.js";

const core = new Midtrans.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true" ? true : false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

async function getTransaction(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const { order_id } = await req.query;

    const user_id = session.user.id;
    let result;

    if (order_id) {
      result = await db("payment_transaction")
        .where("order_id", order_id)
        .select("*");
    } else {
      result = await db("payment_transaction")
        .select(
          "*",
          db.raw(
            "IF(transaction_status = 'pending', IF(NOW() > expired_at, 'failed', 'pending'), transaction_status) AS status"
          )
        )
        .where("user_id", user_id)
        .orderByRaw("FIELD(status, 'pending', 'success', 'failed')");
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Not Found",
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function createPayment(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors,
      });
    }

    const {
      type,
      bank_name,
      orderId,
      amount,
      no_samb,
      admin_cost_value,
      admin_cost_type,
      costlimit_qris_value,
    } = req.body;

    const user_id = session.user.id;
    const customerName = session.user.nama;
    const customerEmail = session.customerEmail;
    const tagihanRes = await db.raw("call infotag_moba(?)", [no_samb]);
    const tagihanBlmLunas = tagihanRes[0][0].map((tagihan) => {
      return {
        nosamb: tagihan.nosamb,
        periode: tagihan.periode,
        total: tagihan.total,
        dendatunggakan: tagihan.dendatunggakan,
      };
    });

    const totalTagihan = tagihanBlmLunas.reduce(
      (sum, tagihan) => sum + Number(tagihan.total),
      0
    );
    console.log(totalTagihan);

    let admin_cost;
    if (admin_cost_type === "percentage") {
      const cost = Math.round(totalTagihan * admin_cost_value);
      if (cost < 2500) {
        admin_cost = 2500;
      } else {
        admin_cost = cost + Number(costlimit_qris_value);
      }
    } else if (admin_cost_type === "fixed") {
      admin_cost = Number(admin_cost_value);
    } else {
      return res.status(400).json({ message: "admin cost type is invalid" });
    }

    if (totalTagihan + admin_cost !== amount) {
      return res.status(403).json({
        message: "total tagihan is not valid!",
      });
    }

    if (type === "qris") {
      const qrisResult = await QRISHandler(
        core,
        orderId,
        no_samb,
        user_id,
        amount,
        customerName,
        customerEmail,
        tagihanBlmLunas
      );

      return res.status(200).json(qrisResult);
    }

    if (type === "virtual_account") {
      const validBanks = ["bca", "bni", "bri", "mandiri", "permata", "cimb"];

      if (validBanks.includes(bank_name)) {
        const vaResult = await VAHandler(
          core,
          bank_name,
          orderId,
          no_samb,
          user_id,
          amount,
          customerName,
          customerEmail,
          tagihanBlmLunas
        );
        return res.status(200).json(vaResult);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid bank type",
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Invalid payment type",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment",
    });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const token = await req.auth.token_session;
    const session = await validateSessionToken(token);
    if (session.session === null) {
      return res.status(401).json(session);
    }

    const { status, order_id } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: "some params are required",
      });
    }

    const result = await db("payment_transaction")
      .where({ order_id })
      .update({ transaction_status: status });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment",
    });
  }
}

const formatDecimal = (value) => {
  return Number(parseFloat(value).toFixed(6)).toString();
};

async function getPaymentCosts(req, res) {
  try {
    const costs = await db("payment_cost_description").select();
    const data = costs.map((cost) => ({
      ...cost,
      value: formatDecimal(cost.value),
    }));
    return res.status(200).json(data);
  } catch (error) {
    throw new Error(`Error fetching payment costs: ${error.message}`);
  }
}

async function getPaymentStatus(req, res) {
  const orderId = req.params.orderId;

  const response = await fetch(
    `${process.env.MIDTRANS_API_URL}/${orderId}/status`,
    {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(process.env.MIDTRANS_SERVER_KEY),
      },
    }
  );
  const data = await response.json();
  res.status(200).json({
    ...data,
    qr_code_url:
      data.payment_type === "qris"
        ? `${process.env.MIDTRANS_API_URL}/qris/${data.transaction_id}/qr-code`
        : null,
  });
}

export {
  getTransaction,
  createPayment,
  updatePaymentStatus,
  getPaymentCosts,
  getPaymentStatus,
};
