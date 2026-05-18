import { useEffect, useState, useRef } from 'react'
import { Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { parseCSV, toCSV, downloadCSV } from '../../lib/csv'
import { toast } from '../../lib/toast'

/**
 * Generic CSV import dialog.
 *
 * Props:
 *  - open / onClose
 *  - entityName: e.g. "clients"
 *  - templateHeaders: array of column names for the downloadable template
 *  - templateSample: example row(s) for the template
 *  - mapRow: (rawRow) => parsedRow | null   (return null to skip)
 *  - validateRow: (mappedRow) => string | null   (optional, return error message)
 *  - onImport: async (mappedRows) => void   (called when the user confirms)
 *  - requiredHeaders: array of header names required in the uploaded file
 */
export default function CSVImport({
  open, onClose, entityName,
  templateHeaders, templateSample = [],
  mapRow, validateRow,
  onImport,
  requiredHeaders = []
}) {
  const [parsed, setParsed] = useState(null) // { headers, rows, mapped, errors }
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setParsed(null)
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open])

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result || '')
      const { headers, rows } = parseCSV(text)

      const missing = requiredHeaders.filter(h => !headers.includes(h))
      if (missing.length) {
        toast.error(`Missing required columns: ${missing.join(', ')}`)
        return
      }

      const mapped = []
      const errors = []
      rows.forEach((raw, i) => {
        try {
          const m = mapRow(raw)
          if (!m) return // skipped row
          if (validateRow) {
            const err = validateRow(m)
            if (err) { errors.push(`Row ${i + 2}: ${err}`); return }
          }
          mapped.push(m)
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err.message}`)
        }
      })

      setParsed({ headers, rows, mapped, errors })
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const sampleRows = templateSample.length ? templateSample : [Object.fromEntries(templateHeaders.map(h => [h, '']))]
    const csv = toCSV(sampleRows, templateHeaders)
    const slug = entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    downloadCSV(`va-${slug}-template.csv`, csv)
  }

  async function handleImport() {
    if (!parsed?.mapped?.length) return
    try {
      setBusy(true)
      await onImport(parsed.mapped)
      toast.success(`Imported ${parsed.mapped.length} ${entityName}`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={`Import ${entityName} from CSV`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            onClick={handleImport}
            loading={busy}
            disabled={!parsed?.mapped?.length}
          >
            {parsed?.mapped?.length
              ? `Import ${parsed.mapped.length} ${entityName}`
              : 'Import'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Step 1 — template */}
        <div className="bg-canvas/60 border-hairline border-line rounded-card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Need a template?</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Download a CSV with the exact columns we expect, then fill it in.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4" /> Template
          </Button>
        </div>

        {/* Step 2 — upload */}
        <div
          className="border-hairline border-dashed border-line rounded-card p-6 text-center cursor-pointer hover:bg-canvas/40 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
        >
          <Upload className="w-6 h-6 text-ink-muted mx-auto mb-2" />
          <div className="text-sm font-medium">Drop a CSV here, or click to choose</div>
          <div className="text-xs text-ink-muted mt-1">
            Required columns: <span className="font-mono">{requiredHeaders.join(', ') || 'none'}</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* Step 3 — preview */}
        {parsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-ink-muted" />
              <span className="font-medium">{parsed.rows.length} rows read,</span>
              <span className="text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {parsed.mapped.length} ready to import
              </span>
              {parsed.errors.length > 0 && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {parsed.errors.length} skipped
                </span>
              )}
            </div>

            {parsed.mapped.length > 0 && (
              <div className="border-hairline border-line rounded-card overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-canvas/60 sticky top-0">
                      <tr>
                        {Object.keys(parsed.mapped[0]).slice(0, 5).map(k => (
                          <th key={k} className="text-left px-3 py-2 font-medium text-ink-muted">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-hairline divide-line">
                      {parsed.mapped.slice(0, 8).map((r, i) => (
                        <tr key={i}>
                          {Object.keys(parsed.mapped[0]).slice(0, 5).map(k => (
                            <td key={k} className="px-3 py-1.5 truncate max-w-[160px]">
                              {String(r[k] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.mapped.length > 8 && (
                  <div className="px-3 py-1.5 text-xs text-ink-muted bg-canvas/40">
                    …and {parsed.mapped.length - 8} more
                  </div>
                )}
              </div>
            )}

            {parsed.errors.length > 0 && (
              <details className="border-hairline border-red-200 rounded-card p-3 bg-red-50/60">
                <summary className="text-xs font-medium text-red-900 cursor-pointer">
                  {parsed.errors.length} row{parsed.errors.length > 1 ? 's' : ''} skipped — click to see why
                </summary>
                <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto text-xs text-red-800">
                  {parsed.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
