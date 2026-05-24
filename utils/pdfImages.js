const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

exports.extractImagesFromPDF = async (buffer) => {
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const extracted = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) {
        const name = ops.argsArray[i][0];
        const img = await page.objs.get(name);

        if (img && img.data) {
          const base64 = `data:image/png;base64,${Buffer.from(img.data).toString("base64")}`;
          extracted.push(base64);
        }
      }
    }
  }

  return extracted;
};
