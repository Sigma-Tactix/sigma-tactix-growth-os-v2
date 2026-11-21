/** Validate image framing and read dimensions; this is not a malware scanner. */
export function inspectGeneratedImage(bytes: Buffer): { mimeType: string; aspectRatio: string } {
  let width = 0, height = 0, mimeType = '';
  if (bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && bytes.subarray(12, 16).toString() === 'IHDR' && bytes.subarray(-8, -4).toString() === 'IEND') {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20); mimeType = 'image/png';
  } else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 216)) continue;
      if (offset + 2 > bytes.length) break;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 7) {
        height = bytes.readUInt16BE(offset + 3); width = bytes.readUInt16BE(offset + 5); mimeType = 'image/jpeg'; break;
      }
      offset += length;
    }
  }
  if (!mimeType || !width || !height || width > 16384 || height > 16384) throw new Error('The provider returned no supported complete image.');
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return { mimeType, aspectRatio: `${width / divisor}:${height / divisor}` };
}
