const fs = require("fs"); // vẫn dùng cho textract (buffer)
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { encryptChapterContent } = require("../services/chapterEncryption.service");

const extractChapters = async (req, res, next) => {
  try {
    const fileArray = req.files?.file_url;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ message: "Không có file sách (file_url)" });
    }

    const file = fileArray[0];
    const originalName = file.originalname || "";
    const ext = path.extname(originalName).toLowerCase();
    const buffer = file.buffer;

    if (!buffer) {
      return res
        .status(400)
        .json({ message: "File sách không hợp lệ (thiếu buffer)." });
    }

    let fullText = "";

    // Đọc file trực tiếp từ buffer (KHÔNG dùng file.path)
    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      fullText = data.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      fullText = result.value;
    } else if (ext === ".doc") {
      fullText = await new Promise((resolve, reject) => {
        textract.fromBufferWithName(originalName, buffer, (error, text) => {
          if (error) reject(error);
          else resolve(text);
        });
      });
    } else {
      return res.status(400).json({ message: "Định dạng không hỗ trợ!" });
    }

    // Regex bắt chương: lấy tên và vị trí
    const chapterRegex = /(chương|CHƯƠNG|Chương)\s+(\d+)[\.: \-–]*(.*)?/g;
    const matches = [];
    let match;

    while ((match = chapterRegex.exec(fullText)) !== null) {
      matches.push({
        index: match.index,
        number: parseInt(match[2]),
        rawTitle: match[0].trim(),
      });
    }

    const chapters = [];
    let chapterIndex = 1; // Đảm bảo chapter_number liên tục dù skip một số chương

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = matches[i + 1] ? matches[i + 1].index : fullText.length;

      const full = fullText.substring(start, end).trim();
      const lines = full
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const title = lines[0]; // Dòng tiêu đề đầu tiên
      const content = lines.slice(1).join("\n").trim(); // Phần sau

      // Bỏ qua chương không có nội dung
      if (!content) {
        continue;
      }

      // Mã hóa nội dung chương trước khi lưu
      let encrypted;
      try {
        encrypted = encryptChapterContent(content);
      } catch (e) {
        console.error("Lỗi mã hóa chương:", e);
        return res
          .status(500)
          .json({ message: "Lỗi mã hóa nội dung chương sách." });
      }

      // Validate output encryption
      if (
        !encrypted ||
        typeof encrypted.ciphertext !== "string" ||
        typeof encrypted.iv !== "string" ||
        typeof encrypted.authTag !== "string" ||
        !encrypted.ciphertext ||
        !encrypted.iv ||
        !encrypted.authTag
      ) {
        console.error("Encrypted payload không hợp lệ:", encrypted);
        return res.status(500).json({
          message: "Mã hóa chương trả về dữ liệu không hợp lệ.",
        });
      }

      chapters.push({
        chapter_number: chapterIndex++,
        title,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });
    }

    req.chapters = chapters;
    next();
  } catch (error) {
    console.error("Lỗi tách chương:", error);
    res.status(500).json({ message: "Lỗi khi tách chương từ tài liệu" });
  }
};

module.exports = extractChapters;
