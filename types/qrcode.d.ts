declare module "qrcode" {
  function toDataURL(
    text: string,
    options?: { width?: number; margin?: number; errorCorrectionLevel?: "L" | "M" | "Q" | "H" }
  ): Promise<string>;
  const qrcode: { toDataURL: typeof toDataURL };
  export default qrcode;
}
