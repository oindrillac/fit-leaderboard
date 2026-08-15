import { TIERS } from '../lib/challenge'

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
      </ul>
      <p className="mt-3 border-t pt-3 text-[12px] text-muted hairline">
        The 12k and 20k bonuses stack on the 8k tier, so a 20,000-step day is worth 20.
        Days reset at midnight IST.
      </p>
    </div>
  )
}
