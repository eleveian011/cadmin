/**
 * Minimal, dependency-free XLSX writer.
 *
 * Produces a valid single-sheet .xlsx (OOXML SpreadsheetML) workbook from an
 * array-of-rows table and triggers a browser download. The file is a ZIP archive
 * written with STORE (no compression) entries plus CRC32 checksums — enough for
 * Excel / Numbers / Sheets to open it. Kept tiny on purpose: the project ships no
 * spreadsheet dependency.
 */

/* ─── CRC32 ──────────────────────────────────────────────────── */

const CRC_TABLE: number[] = (() => {
  const table: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/* ─── XML helpers ────────────────────────────────────────────── */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Excel column letter for a 0-based index (0 → A, 26 → AA).
function colLetter(index: number): string {
  let s = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

const enc = new TextEncoder()

function bytes(s: string): Uint8Array {
  return enc.encode(s)
}

function buildSheetXml(rows: (string | number)[][]): string {
  const rowXml = rows.map((row, r) => {
    const cells = row.map((cell, c) => {
      const ref = `${colLetter(c)}${r + 1}`
      if (typeof cell === 'number' && Number.isFinite(cell)) {
        return `<c r="${ref}"><v>${cell}</v></c>`
      }
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell ?? ''))}</t></is></c>`
    }).join('')
    return `<row r="${r + 1}">${cells}</row>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`
}

/* ─── ZIP (STORE) ────────────────────────────────────────────── */

interface ZipEntry { name: string; data: Uint8Array }

function buildZip(entries: ZipEntry[]): Uint8Array {
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  const u16 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff])
  const u32 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff])

  for (const entry of entries) {
    const nameBytes = bytes(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    // Local file header
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0),
      nameBytes, entry.data,
    ])
    chunks.push(local)

    // Central directory header
    central.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(offset),
      nameBytes,
    ]))

    offset += local.length
  }

  const centralStart = offset
  const centralBlob = concat(central)
  const end = concat([
    u32(0x06054b50), u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(centralBlob.length), u32(centralStart), u16(0),
  ])

  return concat([...chunks, centralBlob, end])
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { out.set(p, pos); pos += p.length }
  return out
}

/* ─── Public API ─────────────────────────────────────────────── */

/**
 * Build an .xlsx Blob from a table (rows of strings/numbers; first row is usually
 * the header).
 */
export function buildXlsxBlob(rows: (string | number)[][]): Blob {
  const sheetXml = buildSheetXml(rows)

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tasks" sheetId="1" r:id="rId1"/></sheets></workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`

  const zip = buildZip([
    { name: '[Content_Types].xml',           data: bytes(contentTypes) },
    { name: '_rels/.rels',                   data: bytes(rootRels) },
    { name: 'xl/workbook.xml',               data: bytes(workbook) },
    { name: 'xl/_rels/workbook.xml.rels',    data: bytes(workbookRels) },
    { name: 'xl/worksheets/sheet1.xml',      data: bytes(sheetXml) },
  ])

  return new Blob([zip as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Build an .xlsx from a table and trigger a browser download. */
export function downloadXlsx(filename: string, rows: (string | number)[][]): void {
  const blob = buildXlsxBlob(rows)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
