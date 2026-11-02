// Minimal ZIP writer (stored, no compression) for real downloadable exports.
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let curOffset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const lh = new ArrayBuffer(30 + nameBytes.length);
    const dv = new DataView(lh);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    new Uint8Array(lh).set(nameBytes, 30);

    offsets.push(curOffset);
    curOffset += lh.byteLength + size;
    localChunks.push(new Uint8Array(lh), entry.data);
  }

  let cdSize = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const ch = new ArrayBuffer(46 + nameBytes.length);
    const dv = new DataView(ch);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint16(14, 0, true);
    dv.setUint32(16, crc, true);
    dv.setUint32(20, size, true);
    dv.setUint32(24, size, true);
    dv.setUint16(28, nameBytes.length, true);
    dv.setUint16(30, 0, true);
    dv.setUint16(32, 0, true);
    dv.setUint16(34, 0, true);
    dv.setUint16(36, 0, true);
    dv.setUint32(38, 0, true);
    dv.setUint32(42, offsets[i], true);
    new Uint8Array(ch).set(nameBytes, 46);

    centralChunks.push(new Uint8Array(ch));
    cdSize += ch.byteLength;
  }

  const eocd = new ArrayBuffer(22);
  const dv = new DataView(eocd);
  dv.setUint32(0, 0x06054b50, true);
  dv.setUint16(4, 0, true);
  dv.setUint16(6, 0, true);
  dv.setUint16(8, entries.length, true);
  dv.setUint16(10, entries.length, true);
  dv.setUint32(12, cdSize, true);
  dv.setUint32(16, curOffset, true);
  dv.setUint16(20, 0, true);

  const parts = [...localChunks, ...centralChunks, new Uint8Array(eocd)];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return new Blob([out], { type: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ReadZipOptions {
  maxEntries?: number;
  maxTotalBytes?: number;
}

export async function readZip(file: File, options: ReadZipOptions = {}): Promise<ZipEntry[]> {
  const maxEntries = options.maxEntries ?? 1000;
  const maxTotalBytes = options.maxTotalBytes ?? 50 * 1024 * 1024;
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Find End of Central Directory record
  const eocdSig = 0x06054b50;
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('Invalid ZIP: missing end-of-central-directory record');

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entryCount = dv.getUint16(eocdOffset + 10, true);
  const cdSize = dv.getUint32(eocdOffset + 12, true);
  const cdOffset = dv.getUint32(eocdOffset + 16, true);

  if (entryCount > maxEntries) throw new Error('Invalid ZIP: too many entries');
  if (cdOffset + cdSize > bytes.length) throw new Error('Invalid ZIP: central directory out of range');

  const entries: ZipEntry[] = [];
  let totalBytes = 0;
  let off = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (off + 46 > bytes.length) throw new Error('Invalid ZIP: truncated central directory');
    if (dv.getUint32(off, true) !== 0x02014b50) throw new Error('Invalid ZIP: bad central directory signature');
    const method = dv.getUint16(off + 10, true);
    const crc = dv.getUint32(off + 16, true);
    const compressedSize = dv.getUint32(off + 20, true);
    const uncompressedSize = dv.getUint32(off + 24, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commentLen = dv.getUint16(off + 32, true);
    const localHeaderOffset = dv.getUint32(off + 42, true);
    const nameBytes = bytes.slice(off + 46, off + 46 + nameLen);
    const name = new TextDecoder().decode(nameBytes);

    // Security checks
    if (name.includes('..') || name.startsWith('/') || name.startsWith('\\') || name.includes('\\')) {
      throw new Error(`Invalid ZIP: unsafe entry path "${name}"`);
    }
    if (name.length === 0) throw new Error('Invalid ZIP: empty entry name');
    if (method !== 0) throw new Error(`Unsupported compression method ${method} for "${name}"`);
    if (compressedSize !== uncompressedSize) throw new Error(`Invalid ZIP: size mismatch for "${name}"`);

    // Read local header
    if (localHeaderOffset + 30 > bytes.length) throw new Error('Invalid ZIP: bad local header offset');
    if (dv.getUint32(localHeaderOffset, true) !== 0x04034b50) throw new Error('Invalid ZIP: bad local header signature');
    const localNameLen = dv.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = dv.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
    if (dataOffset + uncompressedSize > bytes.length) throw new Error('Invalid ZIP: entry data out of range');

    const data = bytes.slice(dataOffset, dataOffset + uncompressedSize);
    // CRC check
    if (crc32(data) !== crc) throw new Error(`Invalid ZIP: checksum mismatch for "${name}"`);

    totalBytes += data.length;
    if (totalBytes > maxTotalBytes) throw new Error('Invalid ZIP: total size too large');

    // Skip directories (names ending with /)
    if (!name.endsWith('/')) {
      entries.push({ name, data });
    }

    off += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}