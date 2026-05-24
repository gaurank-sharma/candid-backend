const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse/lib/pdf-parse");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function normalizeTitle(title) {
  if (!title) return title;
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (!letters) return title;
  const upperRatio = title.replace(/[^A-Z]/g, "").length / letters.length;
  if (upperRatio > 0.5 || /^[a-z]/.test(title)) {
    return title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return title;
}

function fixManualBullets(html) {
  let result = html.replace(
    /<p>[\s\t]*[•‣◦⁃∙•·]\t?\s*([\s\S]*?)<\/p>/g,
    "<li>$1</li>"
  );
  result = result.replace(
    /(<li>[\s\S]*?<\/li>[\s\n]*)+/g,
    (match) => `<ul>${match}</ul>`
  );
  return result;
}

// <p><strong>Short heading</strong></p>  →  <h2>Short heading</h2>
function convertBoldHeadings(html) {
  return html.replace(
    /<p>\s*<strong>([\s\S]{3,120}?)<\/strong>\s*<\/p>/g,
    "<h2>$1</h2>"
  );
}

// ALL CAPS short paragraphs (likely section titles without Word heading styles)
function convertAllCapsParas(html) {
  return html.replace(/<p>([A-Z][A-Z\s\(\)\-\/:&,\.]{8,100})<\/p>/g, (_, text) => {
    const titleCased = text.replace(
      /\b\w+/g,
      (w) => w.charAt(0) + w.slice(1).toLowerCase()
    );
    return `<h2>${titleCased}</h2>`;
  });
}

// Split at any heading boundary (h1/h2/h3), keeping images inside each chunk
function splitAtHeadings(html) {
  return html
    .split(/(?=<h[123][^>]*>)/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/<[^>]+>/g, "").trim().length > 5);
}

// Pull first <img> out of a chunk; return { text, image }
function extractSectionImage(html) {
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/);
  const image = imgMatch ? imgMatch[1] : null;
  const text = html.replace(/<img[^>]+>/g, "").trim();
  return { text, image };
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ msg: "No file uploaded" });

    const isDocx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname?.toLowerCase().endsWith(".docx");

    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");

    if (!isDocx && !isPdf) {
      return res.status(400).json({ msg: "Only DOCX and PDF files are supported" });
    }

    let title = "Untitled";
    let heroImage = null;
    let sections = [];

    if (isDocx) {
      const result = await mammoth.convertToHtml(
        { buffer: file.buffer },
        {
          convertImage: mammoth.images.inline((image) => {
            // Skip vector/metafile formats — always decorative in Word
            const skip = ["image/x-emf", "image/x-wmf", "image/svg+xml"];
            if (skip.includes(image.contentType)) return { src: "data:skip" };

            return image.read("base64").then((buf) => {
              // Skip tiny images — decorative elements, icons, header logos
              // Real photos are typically 50KB+; threshold ~8KB (base64 chars ≈ 1.33× bytes)
              if (buf.length < 10000) return { src: "data:skip" };
              return { src: "data:" + image.contentType + ";base64," + buf };
            });
          }),
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h2:fresh",
            "p[style-name='Heading 2'] => h3:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Subtitle'] => p:fresh",
          ],
        }
      );

      let html = result.value;

      // Remove skipped images (decorative/small/vector) before any further processing
      html = html.replace(/<img[^>]+src="data:skip"[^>]*>/g, "");

      // Post-process: fix bullets, promote bold-only and ALL CAPS paras to headings
      html = convertBoldHeadings(html);
      html = convertAllCapsParas(html);
      html = fixManualBullets(html);

      // Always use the FIRST image in the document as hero (cover image),
      // regardless of which chunk it falls in — then strip it so sections don't inherit it
      const heroImgMatch = html.match(/<img[^>]+src="(data:[^"]+)"[^>]*>/);
      heroImage = heroImgMatch ? heroImgMatch[1] : null;
      if (heroImgMatch) {
        html = html.replace(heroImgMatch[0], ""); // remove only first occurrence
      }

      const chunks = splitAtHeadings(html);

      if (chunks.length === 0) {
        return res.status(400).json({ msg: "No readable content found in document" });
      }

      // First chunk → extract title
      const firstChunkText = chunks[0].replace(/<img[^>]+>/g, "").trim();
      const headingMatch = firstChunkText.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/);
      if (headingMatch) {
        title = normalizeTitle(headingMatch[1].replace(/<[^>]+>/g, "").trim());
      } else {
        title = normalizeTitle(
          firstChunkText.replace(/<[^>]+>/g, "").trim().slice(0, 120)
        );
      }

      // All chunks after the first → content sections, each with their own inline image
      sections = chunks.slice(1).map((chunk) => extractSectionImage(chunk));

    } else if (isPdf) {
      const data = await pdfParse(file.buffer);
      const rawText = data.text;

      if (!rawText?.trim()) {
        return res.status(400).json({ msg: "No readable text found in PDF" });
      }

      const parts = rawText
        .split(/\n{2,}/)
        .map((p) => p.replace(/\n+/g, " ").trim())
        .filter((p) => p.length > 10);

      title = normalizeTitle(parts[0]?.slice(0, 120) || "Untitled");
      sections = parts.slice(1).map((p) => ({ text: `<p>${p}</p>`, image: null }));
    }

    if (sections.length === 0) {
      return res.status(400).json({ msg: "Document appears to be empty or unreadable" });
    }

    res.json({ title, heroImage, sections });
  } catch (err) {
    console.error("Parse Error:", err);
    res.status(500).json({ msg: "Parsing failed", error: err.toString() });
  }
});

module.exports = router;
