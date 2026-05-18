import { useMemo, useState } from 'react'
import { Calculator, Percent, DollarSign } from 'lucide-react'
import Card from './ui/Card'
import Input from './ui/Input'
import { formatCurrency } from '../lib/format'

/**
 * Standalone commission calculator for The Realtor OS.
 *
 * Props:
 *  - defaultRate       (number)  Agent's default commission % (falls back to 3.0)
 *  - defaultSplit      (number)  Agent's brokerage split — % the agent keeps (falls back to 70)
 *  - defaultSalePrice  (number)  Optional pre-filled sale price
 *  - embedded          (boolean) When true, render without the outer Card wrapper
 */
export default function CommissionCalculator({
  defaultRate,
  defaultSplit,
  defaultSalePrice,
  embedded = false
}) {
  const [salePrice, setSalePrice]   = useState(defaultSalePrice ?? '')
  const [rate, setRate]             = useState(defaultRate ?? 3.0)
  const [split, setSplit]           = useState(defaultSplit ?? 70)
  const [coopOn, setCoopOn]         = useState(false)
  const [coopPct, setCoopPct]       = useState(50)

  const numbers = useMemo(() => {
    const price = Number(salePrice) || 0
    const r     = Number(rate)      || 0
    const s     = Number(split)     || 0
    const c     = Number(coopPct)   || 0

    const gross = price * (r / 100)
    const afterCoop = coopOn ? gross * (1 - c / 100) : gross
    const yourSide = afterCoop * (s / 100)
    const coopAmount = coopOn ? gross - afterCoop : 0

    return {
      gross,
      afterCoop,
      yourSide,
      coopAmount
    }
  }, [salePrice, rate, split, coopOn, coopPct])

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-btn bg-accent/10 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-accent" />
        </div>
        <div>
          <div className="text-base font-semibold leading-tight">Commission Calculator</div>
          <div className="text-xs text-ink-muted">Live preview — no submit needed.</div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Sale price ($)"
          type="number"
          min="0"
          step="1000"
          inputMode="decimal"
          placeholder="500000"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />
        <Input
          label="Commission rate (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          inputMode="decimal"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <Input
          label="Brokerage split — % you keep"
          type="number"
          min="0"
          max="100"
          step="1"
          inputMode="decimal"
          value={split}
          onChange={(e) => setSplit(e.target.value)}
        />
      </div>

      {/* Co-op toggle */}
      <div className="border-hairline border-line rounded-card p-3">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <div className="text-sm font-medium">Split with a co-op agent?</div>
            <div className="text-xs text-ink-muted">Toggle on if the other side has its own agent.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={coopOn}
            onClick={() => setCoopOn(v => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors
              ${coopOn ? 'bg-accent' : 'bg-line'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                ${coopOn ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
        {coopOn && (
          <div className="mt-3">
            <Input
              label="Co-op share (% of gross commission)"
              type="number"
              min="0"
              max="100"
              step="1"
              inputMode="decimal"
              value={coopPct}
              onChange={(e) => setCoopPct(e.target.value)}
              hint="Typically 50% — half the gross goes to the other agent's brokerage."
            />
          </div>
        )}
      </div>

      {/* Outputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row
          icon={DollarSign}
          label="Gross commission"
          value={formatCurrency(numbers.gross)}
        />
        {coopOn ? (
          <Row
            icon={Percent}
            label="After co-op split"
            value={formatCurrency(numbers.afterCoop)}
            hint={`Co-op pays ${formatCurrency(numbers.coopAmount)}`}
          />
        ) : (
          <Row
            icon={Percent}
            label="Brokerage cut"
            value={formatCurrency(numbers.afterCoop - numbers.yourSide)}
            hint={`Brokerage keeps ${(100 - (Number(split) || 0)).toFixed(0)}%`}
          />
        )}
      </div>

      {/* Net headline */}
      <div className="rounded-card bg-accent/10 border-hairline border-accent/30 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-muted">Net to you</div>
          <div className="text-[11px] text-ink-muted mt-0.5">
            After {coopOn ? 'co-op share & ' : ''}brokerage split
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-accent tabular-nums">
          {formatCurrency(numbers.yourSide)}
        </div>
      </div>
    </div>
  )

  if (embedded) return content
  return <Card>{content}</Card>
}

function Row({ icon: Icon, label, value, hint }) {
  return (
    <div className="border-hairline border-line rounded-card p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-btn bg-canvas flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-ink-muted" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="text-base font-semibold tabular-nums">{value}</div>
        {hint && <div className="text-[11px] text-ink-muted mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
