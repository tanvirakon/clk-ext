// Minimal GIF89a frame decoder — no DOM, works in service workers

export function decodeGif(arrayBuffer) {
  const buf = new Uint8Array(arrayBuffer);
  let p = 0;
  const u8 = () => buf[p++];
  const u16 = () => { const v = buf[p] | (buf[p + 1] << 8); p += 2; return v; };

  // Header
  const sig = String.fromCharCode(u8(), u8(), u8(), u8(), u8(), u8());
  if (!sig.startsWith("GIF")) throw new Error("Not a GIF");

  // Logical Screen Descriptor
  const width = u16(), height = u16();
  const packed = u8(), bgIndex = u8(); u8();
  const gctSize = (packed >> 7) & 1 ? 1 << ((packed & 7) + 1) : 0;
  const gct = gctSize ? readCT(gctSize) : null;

  const frames = [];
  let gce = null;

  while (p < buf.length) {
    const s = u8();
    if (s === 0x3B) break;
    if (s === 0x21) {
      const label = u8();
      if (label === 0xF9) {
        u8();
        const gp = u8(), delay = u16(), ti = u8(); u8();
        gce = { disposal: (gp >> 2) & 7, transIdx: gp & 1 ? ti : -1, delay };
      } else { skipSub(); }
    } else if (s === 0x2C) {
      const x = u16(), y = u16(), w = u16(), h = u16();
      const ip = u8();
      const lctSize = (ip >> 7) & 1 ? 1 << ((ip & 7) + 1) : 0;
      const lct = lctSize ? readCT(lctSize) : null;
      const interlaced = !!((ip >> 6) & 1);
      const minCode = u8();
      const lzw = readSub();
      const indices = decompressLZW(minCode, lzw, w * h);
      frames.push({
        x, y, w, h, indices, interlaced,
        ct: lct || gct,
        disposal: gce ? gce.disposal : 0,
        transIdx: gce ? gce.transIdx : -1,
        delay: gce ? gce.delay : 0,
      });
      gce = null;
    } else { skipSub(); }
  }
  return { width, height, bgIndex, frames };

  function readCT(n) { const t = new Uint8Array(n * 3); for (let i = 0; i < t.length; i++) t[i] = u8(); return t; }
  function skipSub() { let sz; while ((sz = u8()) !== 0) p += sz; }
  function readSub() {
    const chunks = []; let total = 0, sz;
    while ((sz = u8()) !== 0) { chunks.push(buf.subarray(p, p + sz)); total += sz; p += sz; }
    const out = new Uint8Array(total); let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }
}

function decompressLZW(minCodeSize, data, count) {
  const clear = 1 << minCodeSize, eoi = clear + 1, MAX = 4096;
  let codeSize = minCodeSize + 1, mask = (1 << codeSize) - 1, next = eoi + 1;
  const pfx = new Int16Array(MAX), sfx = new Uint8Array(MAX), len = new Uint16Array(MAX);
  for (let i = 0; i < clear; i++) { pfx[i] = -1; sfx[i] = i; len[i] = 1; }

  const out = new Uint8Array(count);
  let op = 0, bits = 0, bitN = 0, dp = 0, prev = -1;
  const tmp = new Uint8Array(MAX);

  function read() {
    while (bitN < codeSize) { if (dp >= data.length) return -1; bits |= data[dp++] << bitN; bitN += 8; }
    const c = bits & mask; bits >>>= codeSize; bitN -= codeSize; return c;
  }
  function emit(c) {
    let i = len[c] - 1, k = c;
    while (k >= 0) { tmp[i--] = sfx[k]; k = pfx[k]; }
    for (let j = 0; j < len[c] && op < count; j++) out[op++] = tmp[j];
    return tmp[0];
  }

  while (op < count) {
    const code = read();
    if (code === -1 || code === eoi) break;
    if (code === clear) { codeSize = minCodeSize + 1; mask = (1 << codeSize) - 1; next = eoi + 1; prev = -1; continue; }
    if (prev === -1) { emit(code); prev = code; continue; }
    let fb;
    if (code < next) { fb = emit(code); }
    else { fb = emit(prev); if (op < count) out[op++] = fb; }
    if (next < MAX) {
      pfx[next] = prev; sfx[next] = fb; len[next] = len[prev] + 1; next++;
      if (next > mask && codeSize < 12) { codeSize++; mask = (1 << codeSize) - 1; }
    }
    prev = code;
  }
  return out;
}
