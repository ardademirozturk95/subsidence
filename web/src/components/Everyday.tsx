import { useI18n } from "@/lib/i18n"

/** Santimetreleri gözde canlandıran tek cümle: bu hızla 10 yılda kaç metre, bir kapıyla kıyas. */
export function Everyday({ rate }: { rate: number }) {
  const { t, lang } = useI18n()
  const m = ((Math.abs(rate) * 10) / 100).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: 1 })
  const text = Math.abs(rate) < 2 ? t("eqStable") : Math.abs(rate) * 10 >= 200 ? t("eqDoorOver", { m }) : t("eqDoorPart", { m })
  return <p className="mt-4 border-t border-border pt-3 text-[15px] leading-relaxed">{text}</p>
}
