import db from "../database/db.js";
import { generatMidtransSignature } from "../lib/utils.js";
import moment from "moment-timezone";

export async function verifyPayment(req, res) {
  try {
    const {
      transaction_status,
      transaction_id,
      status_code,
      signature_key,
      settlement_time,
      order_id,
      gross_amount,
    } = req.body;
    const signature = generatMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      process.env.MIDTRANS_SERVER_KEY
    );
    // keamanan api
    console.log("checking signature");
    console.log(signature);
    if (signature !== signature_key) {
      return res.status(403).json({
        message: "signature key is not valid",
      });
    }

    console.log("signature verified");
    const transaction = await db("payment_transaction")
      .where("order_id", order_id)
      .first();

    const tagihan_array = transaction.detail_tagihan_array;

    // cek dan updte status pembayaran
    console.log("checking transaction status");
    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      console.log("status success");
      await db("payment_transaction")
        .where({ order_id })
        .update({ transaction_status: "success", settlement_time });

      try {
        const userAkses = await db("userakses")
          .where("namauser", "tidham")
          .first();
        if (!userAkses) {
          throw new Error(`User akses not found for tidham`);
        }

        const loketData = await db("loket")
          .where("kodeloket", userAkses.kodeloket)
          .first();
        await Promise.all(
          tagihan_array.map(async (tagihan) => {
            const periode = tagihan.periode;
            const nopel = transaction.no_samb;
            const total = Number(tagihan.total);
            const denda = Number(tagihan.dendatunggakan);
            const kode = `${periode}.${nopel}`;

            console.log(`Processing tagihan for kode: ${kode}`);

            const tglSkrg = moment()
              .tz("Asia/Jakarta")
              .format("YYYY-MM-DD HH:mm:ss");

            if (!userAkses) {
              throw new Error(`User akses not found for tidham`);
            }

            const updateData = {
              loketbayar: userAkses.kodeloket || "",
              tglbayar: tglSkrg,
              nolpp: transaction_id,
              kasir: userAkses.nama || "",
              ppn: 0,
              persenppn: 0,
              flaglunas: 1,
              flagbatal: 0,
              sudahupload: true,
              dendatunggakan: denda,
              total: total,
              totalloket: total,
              jasaloket: 0,
              waktuupdate: tglSkrg,
              loketupdate: userAkses.kodeloket || "",
              namaloket: loketData?.loket || "",
            };

            const drd = await db("drd").where("kode", kode).first();

            if (drd && drd.flaglunas === "1") {
              console.log(`Double payment detected for kode: ${kode}`);
              await Promise.all([
                db("drd").where("kode", kode).update({
                  nolpp: transaction_id,
                }),
                db("payment_transaction").where("order_id", order_id).update({
                  is_double: 1,
                }),
              ]);
            } else {
              console.log(`Processing normal payment for kode: ${kode}`);
              await Promise.all([
                db("drd").where("kode", kode).update(updateData),
                db("udownload").insert({
                  kode,
                  periode,
                  nosamb: nopel,
                  kodeloket: userAkses.kodeloket,
                  dendatunggakan: denda,
                  tglbayar: tglSkrg,
                  flagdownload: 0,
                }),
              ]);
            }
          })
        );

        console.log(
          `Successfully processed all tagihan for order: ${order_id}`
        );
        return res.status(200).json({ status: "success" });
      } catch (error) {
        console.error(
          `Error processing tagihan array for order ${order_id}:`,
          error
        );
        throw error;
      }
    } else if (transaction_status === "pending") {
      return res.status(200).json({
        status: "pending",
      });
    } else {
      // handle transaksi yg gagal
      await db("payment_transaction")
        .where({ order_id })
        .update({ transaction_status: "failed" });
      return res.status(200).json({
        status: "failed",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment",
    });
  }
}
