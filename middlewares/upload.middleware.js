// middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Disk storage helper: dùng cho các file cần lưu trên ổ đĩa (cover, avatar, tài liệu khác)
const getStorage = (folderName) => {
  const uploadDir = path.join(__dirname, `../uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    },
  });
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Chỉ cho phép ảnh JPG, PNG"), false);
};

const documentFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Chỉ cho phép tài liệu PDF, DOC, DOCX"), false);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "cover_url") {
    // Chỉ cho phép ảnh JPG, JPEG, PNG
    if ([".jpg", ".jpeg", ".png"].includes(ext)) cb(null, true);
    else cb(new Error("Chỉ cho phép ảnh JPG, JPEG, PNG"), false);
  } else if (file.fieldname === "file_url") {
    // Chỉ cho phép tài liệu PDF, DOC, DOCX
    if ([".pdf", ".doc", ".docx"].includes(ext)) cb(null, true);
    else cb(new Error("Chỉ cho phép tài liệu PDF, DOC, DOCX"), false);
  } else {
    // Không chấp nhận bất kỳ field nào khác
    cb(new Error("Field không hợp lệ"), false);
  }
};

// Dùng memoryStorage cho cả cover_url và file_url trong flow tạo sách.
// - cover_url sẽ được ghi ra đĩa thủ công sau đó
// - file_url (pdf/doc/docx) chỉ được xử lý trong memory, KHÔNG ghi ra đĩa
const memoryStorage = multer.memoryStorage();

const uploadFields = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
});

// Các upload khác vẫn dùng diskStorage như cũ
const uploadAvatar = multer({ storage: getStorage("avatars"), imageFilter });
const uploadBookCover = multer({ storage: getStorage("books"), imageFilter });
const uploadDocument = multer({
  storage: getStorage("documents"),
  fileFilter: documentFilter,
});

/**
 * Middleware: ghi cover image từ memory (buffer) ra đĩa.
 * - Chỉ xử lý field cover_url trong req.files
 * - Book file (file_url) vẫn giữ nguyên trong memory, không ghi ra đĩa
 */
const persistCoverFromMemory = (req, res, next) => {
  try {
    const coverArray = req.files?.cover_url;
    if (coverArray && coverArray.length > 0) {
      const coverFile = coverArray[0];
      if (!coverFile.buffer) {
        return next(new Error("Cover file buffer is missing"));
      }

      const uploadDir = path.join(__dirname, "../uploads/books");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(coverFile.originalname).toLowerCase();
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, filename);

      // Ghi file ảnh ra đĩa
      fs.writeFileSync(filePath, coverFile.buffer);

      // Chuẩn hóa lại object để các service phía sau dùng như với diskStorage
      coverFile.filename = filename;
      coverFile.path = filePath;
    }

    return next();
  } catch (err) {
    console.error("Lỗi khi lưu cover từ memory:", err);
    return res
      .status(500)
      .json({ message: "Lỗi khi lưu ảnh bìa sách. Vui lòng thử lại." });
  }
};

module.exports = {
  uploadAvatar,
  uploadBookCover,
  uploadDocument,
  uploadFields,
  persistCoverFromMemory,
};
