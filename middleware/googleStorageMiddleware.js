import { Storage } from "@google-cloud/storage";

import util from 'util';

const storageGoogle = new Storage({
  keyFilename : "./key.json",
	projectId : "backend-kediri"
})

const uploadImage = (file,nomor) => new Promise((resolve, reject) => {
  const { originalname, buffer } = file

	const bucket = storageGoogle.bucket('backend-kediri');
  const blob = bucket.file(nomor+'_'+originalname.replace(/ /g, "_"))
  const blobStream = blob.createWriteStream({
    resumable: false
  })
  blobStream.on('finish', () => {
    const publicUrl = 
      `https://storage.cloud.google.com/${bucket.name}/${blob.name}`;
    resolve(publicUrl)
  })
  .on('error', () => {
    
    reject(`Unable to upload image, something went wrong`)
  })
  .end(buffer)
})





export {storageGoogle,uploadImage}
