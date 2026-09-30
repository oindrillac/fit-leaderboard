import { MONTHLY_CHAMPION_BONUS, STEP_CHAMPION_BONUS, TIERS } from '../lib/challenge'

export default function PointsRules() {
  return (
    <div>
      <ul className="space-y-2">
        {[...TIERS].reverse().map((t) => (
          <li key={t.key} className="flex items-center gap-2.5 text-[13.5px]">
            <span className="text-base" aria-hidden="true">
              {t.emoji}
            </span>
            <span className="flex-1 text-ink-2">
              <b className="text-ink">{t.label}</b> · {t.blurb}
            </span>
            <span className="font-bold tnum">{t.points}</span>
          </li>
        ))}
        <li className="flex items-center gap-2.5 text-[13.5px]">
          <span className="text-base" aria-hidden="true">
            📅
          </span>
          <span className="flex-1 text-ink-2">
            <b className="text-ink">Monthly champion</b> · most steps that calendar month
          </span>
          <span className="font-bold tnum">+{MONTHLY_CHAMPION_BONUS}</span>
        </li>
        <li className="flex items-center gap-2.5 text-[13.5px]">
          <span className="text-base" aria-hidden="true">
            👣
          </span>
          <span className="flex-1 text-ink-2">
            <b className="text-ink">Step champion</b> · most total steps, Oct 1–Dec 29
          </span>
          <span className="font-bold tnum">+{STEP_CHAMPION_BONUS}</span>
        </li>
      </ul>
      <p className="mt-3 border-t pt-3 text-[12px] text-muted hairline">
        Everyday count — nothing below 8,000. The monthly bonus pays out for Oct, Nov, and Dec
        separately, decided once each month ends; the step champion bonus is decided once the
        whole challenge ends. Ties get the bonus too, every time. Days reset at midnight IST.
      </p>
    </div>
  )
}
