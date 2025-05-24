import crypto from "crypto";
import db from "../database/db.js";
import moment from "moment";
function trimDataPelanggan(pelangganObj) {
  return {
    nosamb: pelangganObj.nosamb.trim(),
    nama: pelangganObj.nama.trim(),
    alamat: pelangganObj.alamat.trim(),
    aktif: pelangganObj.aktif,
  };
}

function formatNumber(number) {
  return number.toLocaleString("id-ID");
}
function generatMidtransSignature(orderId, statusCode, grossAmount, serverKey) {
  const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash("sha512").update(input).digest("hex");
}


function periodeTagihPelanggan() {
  const currentYear = moment().year();
  const currentMonth = moment().month();

  if (currentMonth === 0) {
      // If it's January, set to December of the previous year
      return `${currentYear - 1}12`;
  } else {
      // Otherwise, just subtract 1 month
      return moment().format('YYYY') + (moment().add("-1", "month").format('MM'));
  }
}


async function validateUser(iduser){
  try {
    const userPetugas = await db.select('*').from('users').where(
        {
            id : iduser,
            is_user_timtagih: true,
            is_user_ppob: false,
            is_active: true
        }
    ).first();
    if (typeof userPetugas === 'undefined') {
      return false
    }
    return userPetugas;
  } catch(err) {
    console.log(err);
    return false
} 
}  


async function validateUserMitra(id){
  try {
    const userPetugas = await db.select('*').from('users').where(
        {
            id : id,
            is_active: 1,
            is_user_ppob : 1,
        }
    ).first();

    // console.log(userPetugas);
    if (typeof userPetugas === 'undefined') {
      return false
    }
    return userPetugas;
  } catch(err) {
    console.log(err);
    return false
} 
} 

function compareArrays (a, b) {
  return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
};
export { formatNumber, trimDataPelanggan, generatMidtransSignature, periodeTagihPelanggan,validateUser,validateUserMitra, compareArrays };
