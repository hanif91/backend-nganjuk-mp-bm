import multer from 'multer';
import path from 'path';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
		console.log(req.body);
    cb(null, './public/');
  },
  filename: (req, file, cb) => {
		console.log(req.body,'teas');
    cb(null, file.fieldname + '-' +Date.now() + path.extname(file.originalname));
  }
});

// Create the multer instance
const upload = multer({ 
	storage: storage, 
	limits : {fileSize : 1000000},
	fileFilter: (req, file, cb) => {
		if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
				return cb(null, true);
		} else {
			return cb(new Error('Invalid mime type'));
		}
}
});

export default upload;