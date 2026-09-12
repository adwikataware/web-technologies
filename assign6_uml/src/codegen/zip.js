// A minimal ZIP writer so "download all" hands back one archive of .java files
// without pulling in a dependency. Entries are stored uncompressed, which the
// format allows and every unzip tool accepts — source files are small and the
// whole point here is the generated text, not the packing ratio.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

// MS-DOS packed date and time, which is what the ZIP header carries.
function dosStamp(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, day }
}

class ByteWriter {
  constructor() { this.parts = []; this.length = 0 }
  u16(v) { this.parts.push(new Uint8Array([v & 0xff, (v >>> 8) & 0xff])); this.length += 2 }
  u32(v) {
    this.parts.push(new Uint8Array([
      v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff
    ]))
    this.length += 4
  }
  bytes(b) { this.parts.push(b); this.length += b.length }
  blob(type) { return new Blob(this.parts, { type }) }
}

/**
 * @param {{name: string, content: string}[]} files
 * @returns {Blob} an archive ready to hand to a download link
 */
export function createZip(files) {
  const encoder = new TextEncoder()
  const { time, day } = dosStamp(new Date())
  const out = new ByteWriter()
  const directory = []

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const offset = out.length

    out.u32(0x04034b50)          // local file header
    out.u16(20)                  // version needed
    out.u16(0x0800)              // UTF-8 names
    out.u16(0)                   // stored, no compression
    out.u16(time)
    out.u16(day)
    out.u32(crc)
    out.u32(data.length)
    out.u32(data.length)
    out.u16(nameBytes.length)
    out.u16(0)
    out.bytes(nameBytes)
    out.bytes(data)

    directory.push({ nameBytes, crc, size: data.length, offset })
  })

  const centralStart = out.length
  directory.forEach((entry) => {
    out.u32(0x02014b50)          // central directory header
    out.u16(20)                  // version made by
    out.u16(20)                  // version needed
    out.u16(0x0800)
    out.u16(0)
    out.u16(time)
    out.u16(day)
    out.u32(entry.crc)
    out.u32(entry.size)
    out.u32(entry.size)
    out.u16(entry.nameBytes.length)
    out.u16(0)                   // extra
    out.u16(0)                   // comment
    out.u16(0)                   // disk number
    out.u16(0)                   // internal attributes
    out.u32(0)                   // external attributes
    out.u32(entry.offset)
    out.bytes(entry.nameBytes)
  })
  const centralSize = out.length - centralStart

  out.u32(0x06054b50)            // end of central directory
  out.u16(0)
  out.u16(0)
  out.u16(directory.length)
  out.u16(directory.length)
  out.u32(centralSize)
  out.u32(centralStart)
  out.u16(0)

  return out.blob('application/zip')
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const downloadText = (text, filename, type = 'text/plain') =>
  downloadBlob(new Blob([text], { type }), filename)
