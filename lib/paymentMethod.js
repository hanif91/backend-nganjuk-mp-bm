import db from "../database/db.js";

export const VAHandler = async (
  core,
  bank_name,
  order_id,
  no_samb,
  user_id,
  amount,
  customerName,
  customerEmail,
  tagihan
) => {
  const transaction_details = {
    gross_amount: amount,
    order_id,
    customerName,
    customerEmail,
  };

  let parameter;

  if (["bca", "bri", "bni", "cimb"].includes(bank_name)) {
    parameter = {
      payment_type: "bank_transfer",
      transaction_details,
      bank_transfer: {
        bank: bank_name,
      },
    };
  } else if (bank_name === "mandiri") {
    parameter = {
      payment_type: "echannel",
      transaction_details,
      bank_transfer: {
        bank: bank_name,
      },
      echannel: {
        bill_info1: "Tidham:",
        bill_info2: "Pembayaran Tagihan PDAM",
      },
    };
  } else if (bank_name === "permata") {
    parameter = {
      payment_type: "permata",
      transaction_details,
    };
  }

  return core.charge(parameter).then(async (chargeResponse) => {
    await db("payment_transaction").insert({
      no_samb,
      total_biaya: amount,
      payment_type: "virtual_account",
      bank_name,
      order_id: chargeResponse.order_id,
      detail_tagihan_array: JSON.stringify(tagihan),
      transaction_id: chargeResponse.transaction_id,
      transaction_status: chargeResponse.transaction_status,
      transaction_time: chargeResponse.transaction_time,
      expired_at: chargeResponse.expiry_time,
      user_id,
    });

    return chargeResponse;
  });
};

export const QRISHandler = async (
  core,
  order_id,
  no_samb,
  user_id,
  amount,
  customerName,
  customerEmail,
  tagihan
) => {
  const parameter = {
    payment_type: "qris",
    transaction_details: {
      gross_amount: amount,
      order_id,
      customerName,
      customerEmail,
    },
    gopay: {
      enable_callback: true,
      callback_url: `${process.env.APP_URL}://payment/success?type=qris&amount=${amount}&no_samb=${no_samb}&name=${customerName}`,
    },
  };

  return core.charge(parameter).then(async (chargeResponse) => {
    await db("payment_transaction").insert({
      no_samb,
      total_biaya: amount,
      payment_type: "qris",
      detail_tagihan_array: JSON.stringify(tagihan),
      order_id: chargeResponse.order_id,
      transaction_id: chargeResponse.transaction_id,
      transaction_status: chargeResponse.transaction_status,
      transaction_time: chargeResponse.transaction_time,
      expired_at: chargeResponse.expiry_time,
      user_id,
    });

    return chargeResponse;
  });
};
