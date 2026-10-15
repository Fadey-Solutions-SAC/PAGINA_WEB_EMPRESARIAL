import { jsPDF } from "jspdf";

const CARD_W_MM = 54;
const CARD_H_MM = 85.6;
const DPI = 400;
const W = Math.round((CARD_W_MM / 25.4) * DPI);
const H = Math.round((CARD_H_MM / 25.4) * DPI);
const FONT = '"Space Grotesk", sans-serif';

function px(mm: number) {
  return (mm / CARD_H_MM) * H;
}

function loadImage(src: string, cors = false) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

async function svgToImage(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function coverCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const ir = img.naturalWidth / img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ir > 1) {
    sw = sh;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
  ctx.restore();
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight = "700",
) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > 8 && ctx.measureText(text).width > maxWidth) {
    s -= 0.5;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  size: number,
  color: string,
  letterSpacing = 0,
) {
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const font = fitFont(ctx, text, W * 0.82, size);
  ctx.font = `700 ${font}px ${FONT}`;
  if (!letterSpacing) {
    ctx.fillText(text, W / 2, y);
    return;
  }
  const chars = [...text];
  const gaps = Math.max(chars.length - 1, 0) * letterSpacing;
  const width = ctx.measureText(text).width + gaps;
  let x = W / 2 - width / 2;
  ctx.textAlign = "left";
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + letterSpacing;
  }
}

function drawInverted(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const t = document.createElement("canvas");
  t.width = Math.max(1, Math.round(w));
  t.height = Math.max(1, Math.round(h));
  const c = t.getContext("2d");
  if (!c) return;
  c.filter = "invert(1)";
  c.drawImage(img, 0, 0, t.width, t.height);
  ctx.drawImage(t, x, y, w, h);
}

export async function downloadFotocheckPdf(input: {
  code: string;
  fullName: string;
  position: string;
  dni: string;
  phone: string;
  area: string;
  photoUrl: string;
  qrSvg: string;
}) {
  await document.fonts.ready;
  const [frontTpl, backTpl, photo, qrImg] = await Promise.all([
    loadImage("/fotocheck-front.jpg"),
    loadImage("/fotocheck-back.jpg"),
    loadImage(input.photoUrl, true),
    svgToImage(input.qrSvg),
  ]);

  const front = document.createElement("canvas");
  front.width = W;
  front.height = H;
  const fctx = front.getContext("2d");
  if (!fctx) throw new Error("No se pudo crear el lienzo");
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(frontTpl, 0, 0, W, H);

  const photoSize = W * 0.488;
  coverCircle(fctx, photo, W * 0.256, H * 0.305, photoSize);

  drawCentered(fctx, input.fullName, H * 0.626, px(1.72), "#ffffff");
  drawCentered(
    fctx,
    input.position.toUpperCase(),
    H * 0.656,
    px(1.28),
    "#d4af37",
    W * 0.0035,
  );

  const facts = [
    ["DNI", input.dni || "—"],
    ["TEL", input.phone],
    ["ÁREA", input.area || "—"],
    ["ID", input.code],
  ];
  const factLeft = W * 0.27;
  const factWidth = W * 0.54;
  const col = factWidth * 0.426;
  const rows = [0.7035, 0.757, 0.8005, 0.8405];
  fctx.textBaseline = "middle";
  facts.forEach(([label, value], i) => {
    const y = H * rows[i];
    fctx.font = `700 ${px(1.38)}px ${FONT}`;
    fctx.textAlign = "left";
    fctx.fillStyle = "#d4af37";
    fctx.fillText(label, factLeft, y);
    fctx.font = `600 ${px(1.38)}px ${FONT}`;
    fctx.fillStyle = "#ffffff";
    fctx.fillText(value, factLeft + col + factWidth * 0.043, y);
  });

  const back = document.createElement("canvas");
  back.width = W;
  back.height = H;
  const bctx = back.getContext("2d");
  if (!bctx) throw new Error("No se pudo crear el lienzo");
  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(backTpl, 0, 0, W, H);

  const qrX = W * 0.269;
  const qrY = H * 0.337;
  const qrW = W * 0.462;
  const qrH = H * 0.264;
  const pad = px(0.7);
  drawInverted(bctx, qrImg, qrX + pad, qrY + pad, qrW - pad * 2, qrH - pad * 2);

  bctx.fillStyle = "#ffffff";
  bctx.font = `700 ${px(1.08)}px ${FONT}`;
  bctx.textAlign = "left";
  bctx.textBaseline = "middle";
  bctx.fillText("ESCANEA PARA VER EL PERFIL DEL COLABORADOR", W * 0.315, H * 0.662);

  bctx.fillStyle = "#f0ead8";
  bctx.font = `600 ${px(1.55)}px ${FONT}`;
  bctx.fillText("www.fadeysolutions.pe", W * 0.315, H * 0.73);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARD_W_MM, CARD_H_MM],
    compress: true,
  });
  pdf.addImage(front.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, CARD_W_MM, CARD_H_MM);
  pdf.addPage([CARD_W_MM, CARD_H_MM], "portrait");
  pdf.addImage(back.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, CARD_W_MM, CARD_H_MM);
  pdf.save(`${input.code}-fotocheck.pdf`);
}
