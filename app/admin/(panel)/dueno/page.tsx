import Link from "next/link";
import { requireOwner } from "@/lib/dal";
import { monthReport } from "@/lib/usage";
import { renewalDate } from "@/lib/usage-costs";
import { PageHeader, Panel, Stat, fieldClass } from "../ui";
import { saveOwnerSettings } from "./actions";

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function shift(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const label = "block text-[11px] font-semibold text-[var(--muted)]";

export default async function Dueno({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireOwner();
  const { mes } = await searchParams;
  const { range, usage, settings: s, costs: c, daysToRenewal } = await monthReport(mes);
  const [y, m] = range.key.split("-").map(Number);
  const nowKey = new Date().toISOString().slice(0, 7);
  const renewal = renewalDate(s.annual);

  return (
    <>
      <PageHeader
        title="Dueño · Consumo y margen"
        subtitle="Vista privada de Órbita Digital: costo de operar WeNow 360, consumo por servicio y margen frente a la cuota mensual. El equipo de WeNow no ve esta pantalla."
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/admin/dueno?mes=${shift(range.key, -1)}`} className="press rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] font-bold text-[#4a4547]">←</Link>
            <span className="min-w-[130px] text-center text-[13.5px] font-bold text-[var(--navy)] capitalize">{MONTHS[m - 1]} {y}</span>
            <Link href={`/admin/dueno?mes=${shift(range.key, 1)}`} aria-disabled={range.key >= nowKey} className={`press rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] font-bold text-[#4a4547] ${range.key >= nowKey ? "pointer-events-none opacity-40" : ""}`}>→</Link>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Ingreso del mes" value={c.revenueMxn > 0 ? mxn(c.revenueMxn) : "—"} note={s.feeMxn > 0 ? `Cuota ${mxn(s.feeMxn)}${c.annualMonthlyMxn ? ` + ${mxn(c.annualMonthlyMxn)} de renovación anual (1/12)` : ""} · sin IVA` : "Captura la cuota abajo"} />
        <Stat label="Costo del mes" value={mxn(c.totalMxn)} note={`${mxn(c.fixedMxn)} fijo · ${mxn(c.variableMxn)} variable`} />
        <Stat label="Margen estimado" value={c.revenueMxn > 0 ? mxn(c.marginMxn) : "—"} tone={c.revenueMxn > 0 ? (c.marginMxn >= 0 ? "good" : "bad") : undefined} note={c.marginPct !== null ? `${c.marginPct}% del ingreso` : "Sin cuota registrada"} />
        <Stat label="Cupo de escaneos" value={`${usage.scans} / ${s.shen.included}`} tone={c.shenQuotaUsedPct >= 100 ? "bad" : c.shenQuotaUsedPct >= 80 ? undefined : "good"} note={c.shenQuotaUsedPct >= 100 ? "Cupo agotado: cada extra tiene costo" : `${c.shenQuotaUsedPct}% usado`} />
      </div>

      <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Cobro anual · {s.annual.name}</h2>
          <p className="mt-1 text-[12.5px] text-[#4a4547]">
            {s.annual.freeYears > 0 ? `Gratis los primeros ${s.annual.freeYears} año${s.annual.freeYears > 1 ? "s" : ""} (desde ${s.annual.startDate}). ` : ""}Renovación de <strong>{mxn(s.annual.amountMxn)}</strong> al año, equivalente a {mxn(s.annual.amountMxn / 12)} al mes.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11.5px] text-[var(--muted)]">Próxima renovación</div>
          <div className="text-[15px] font-extrabold text-[var(--navy)]">{renewal.toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</div>
          <div className={`text-[11.5px] font-semibold ${daysToRenewal <= 30 ? "text-[var(--red)]" : "text-[var(--muted)]"}`}>{daysToRenewal > 0 ? `En ${daysToRenewal} días` : "Ya corresponde cobrarla"}</div>
        </div>
      </Panel>

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Actividad del mes</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
          {[["Evaluaciones completadas", usage.assessments], ["Preguntas a Winnie", usage.winnieQuestions], ["Escaneos faciales", usage.scans], ["Correos enviados", usage.emails]].map(([k, v]) => (
            <div key={k as string}><dt className="text-[11.5px] text-[var(--muted)]">{k}</dt><dd className="text-[20px] font-extrabold text-[var(--navy)]">{(v as number).toLocaleString("es-MX")}</dd></div>
          ))}
        </dl>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Costos fijos</h2>
          <ul className="mt-3">
            {c.fixedLines.map((l) => (
              <li key={l.service} className="flex items-baseline justify-between gap-3 border-t border-[#f2efef] py-2.5 text-[12.5px]">
                <span><span className="font-semibold text-[#4a4547]">{l.service}</span><span className="block text-[11px] text-[var(--muted)]">{l.usage}</span></span>
                <span className="font-bold text-[var(--navy)]">{mxn(l.costMxn)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Consumo variable</h2>
          <ul className="mt-3">
            {c.variableLines.map((l) => (
              <li key={l.service} className="flex items-baseline justify-between gap-3 border-t border-[#f2efef] py-2.5 text-[12.5px]">
                <span><span className="font-semibold text-[#4a4547]">{l.service}</span><span className="block text-[11px] text-[var(--muted)]">{l.usage}{l.note ? ` · ${l.note}` : ""}</span></span>
                <span className="font-bold text-[var(--navy)]">{l.costMxn > 0 ? mxn(l.costMxn) : "$0"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Cuota, tipo de cambio y tarifas</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">Las tarifas son estimadas: verifícalas en las páginas de precios de cada proveedor y ajústalas aquí. Cambian el cálculo de todos los meses.</p>
        <form action={saveOwnerSettings} className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label><span className={label}>Cuota mensual del cliente (MXN)</span><input name="feeMxn" type="number" step="any" min="0" defaultValue={s.feeMxn} className={fieldClass} /></label>
            <label><span className={label}>USD → MXN</span><input name="usdMxn" type="number" step="any" min="0" defaultValue={s.usdMxn} className={fieldClass} /></label>
            <label><span className={label}>EUR → MXN</span><input name="eurMxn" type="number" step="any" min="0" defaultValue={s.eurMxn} className={fieldClass} /></label>
            <label><span className={label}>Escaneos incluidos en el plan</span><input name="shenIncluded" type="number" min="0" defaultValue={s.shen.included} className={fieldClass} /></label>
            <label><span className={label}>Escaneo extra (EUR)</span><input name="shenExtraEur" type="number" step="any" min="0" defaultValue={s.shen.extraEur} className={fieldClass} /></label>
            <label><span className={label}>Gemini entrada (USD / 1M tokens)</span><input name="geminiIn" type="number" step="any" min="0" defaultValue={s.gemini.inputUsdPerM} className={fieldClass} /></label>
            <label><span className={label}>Gemini salida (USD / 1M tokens)</span><input name="geminiOut" type="number" step="any" min="0" defaultValue={s.gemini.outputUsdPerM} className={fieldClass} /></label>
            <label><span className={label}>Voz (USD / 1M caracteres)</span><input name="ttsRate" type="number" step="any" min="0" defaultValue={s.tts.usdPerMChars} className={fieldClass} /></label>
            <label><span className={label}>Voz: caracteres gratis al mes</span><input name="ttsFree" type="number" min="0" defaultValue={s.tts.freeChars} className={fieldClass} /></label>
            <label><span className={label}>Correos gratis al mes</span><input name="emailFree" type="number" min="0" defaultValue={s.email.freePerMonth} className={fieldClass} /></label>
            <label><span className={label}>Correo extra (USD c/u)</span><input name="emailRate" type="number" step="any" min="0" defaultValue={s.email.usdPerEmail} className={fieldClass} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label><span className={label}>Renovación anual dominio + hosting (MXN)</span><input name="annualAmount" type="number" step="any" min="0" defaultValue={s.annual.amountMxn} className={fieldClass} /></label>
            <label><span className={label}>Inicio del servicio</span><input name="annualStart" type="date" defaultValue={s.annual.startDate} className={fieldClass} /></label>
            <label><span className={label}>Años gratis</span><input name="annualFree" type="number" min="0" step="1" defaultValue={s.annual.freeYears} className={fieldClass} /></label>
          </div>
          <div>
            <div className={label}>Costos fijos mensuales (deja el nombre vacío para quitar una fila)</div>
            <div className="mt-2 grid gap-2">
              {Array.from({ length: 8 }, (_, i) => {
                const f = s.fixed[i];
                return (
                  <div key={i} className="grid grid-cols-[1fr_110px_90px] gap-2">
                    <input name={`fixed_name_${i}`} defaultValue={f?.name ?? ""} placeholder="Nombre del costo" className={fieldClass} aria-label={`Costo fijo ${i + 1}`} />
                    <input name={`fixed_amount_${i}`} type="number" step="any" min="0" defaultValue={f?.amount ?? ""} placeholder="Monto" className={fieldClass} aria-label="Monto" />
                    <select name={`fixed_cur_${i}`} defaultValue={f?.currency ?? "USD"} className={fieldClass} aria-label="Moneda"><option>USD</option><option>EUR</option><option>MXN</option></select>
                  </div>
                );
              })}
            </div>
          </div>
          <div><button className="press rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white">Guardar</button></div>
        </form>
      </Panel>
    </>
  );
}
