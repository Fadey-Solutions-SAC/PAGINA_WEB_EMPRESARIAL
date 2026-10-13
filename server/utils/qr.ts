import QRCode from "qrcode";

const QR_OPTS = {
  errorCorrectionLevel: "H" as const,
  margin: 4,
  color: { dark: "#0a0a0a", light: "#ffffff" },
};

export async function qrSvg(text: string) {
  return QRCode.toString(text, {
    ...QR_OPTS,
    type: "svg",
    width: 512,
  });
}

export async function qrPng(text: string) {
  return QRCode.toBuffer(text, {
    ...QR_OPTS,
    type: "png",
    width: 512,
  });
}
