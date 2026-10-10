import Link from "next/link";
import { requireOwner } from "@/lib/dal";
import { monthReport } from "@/lib/usage";
import { renewalDate } from "@/lib/usage-costs";
import { PageHeader, Panel, Stat, fieldClass } from "../ui";
import { listPayments } from "@/lib/billing";
import { deletePayment, recordPayment, saveOwnerSettings } from "./actions";

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
  const [{ range, usage, settings: s, costs: c, daysToRenewal }, payments] = await Promise.all([monthReport(mes), listPayments()]);
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
        <Stat
          label="Ingreso del mes (con IVA)"
          value={c.revenueMxn > 0 ? mxn(c.revenueMxn * (1 + s.plan.ivaPct / 100)) : "—"}
          note={c.feeMxn > 0 ? `Neto ${mxn(c.revenueMxn)} + IVA ${mxn(c.revenueMxn * (s.plan.ivaPct / 100))}${c.annualMonthlyMxn ? " · incluye 1/12 de la renovación anual" : ""}` : "Captura la cuota abajo"}
        />
        <Stat label="Costo del mes" value={mxn(c.totalMxn)} note={`${mxn(c.fixedMxn)} fijo · ${mxn(c.variableMxn)} variable`} />
        <Stat label="Margen estimado" value={c.revenueMxn > 0 ? mxn(c.marginMxn) : "—"} tone={c.revenueMxn > 0 ? (c.marginMxn >= 0 ? "good" : "bad") : undefined} note={c.marginPct !== null ? `${c.marginPct}% del ingreso neto (sin IVA)` : "Sin cuota registrada"} />
        <Stat label="Plan de Shen.AI del cliente" value={`${usage.scans} / ${s.shen.included}`} tone={c.shenQuotaUsedPct >= 100 ? "bad" : c.shenQuotaUsedPct >= 80 ? undefined : "good"} note={c.shenQuotaUsedPct >= 100 ? "Sobre su cupo: ellos pagan el extra" : `${c.shenQuotaUsedPct}% de su cupo`} />
      </div>

      {c.marginMxn < 0 && (
        <div role="alert" className="mt-4 rounded-2xl border border-[#f0b8b2] bg-[#fdeceb] p-4 text-[13px] leading-[1.55] text-[#7a1d17]">
          <strong>Con este plan pierdes {mxn(Math.abs(c.marginMxn))} al mes.</strong> El plan cuesta {mxn(s.plan.priceWithIva)} con IVA ({mxn(c.feeMxn)} netos) y solo los costos fijos de operar son {mxn(c.fixedMxn)}. Para no perder dinero con todo el cupo usado (hasta {s.plan.scans.toLocaleString("es-MX")} escaneos) necesitarías cobrar al menos <strong>{mxn(c.breakEvenWithIva)} al mes con IVA</strong>, sin contar tu margen. Revisa que el precio capturado sea el correcto.
        </div>
      )}

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Plan del cliente · {mxn(s.plan.priceWithIva)} al mes con IVA</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {c.planUsage.map((x) => (
            <li key={x.label}>
              <div className="flex justify-between text-[12.5px]"><span className="font-semibold text-[#4a4547]">{x.label}</span><span className="text-[var(--muted)]">{x.used.toLocaleString("es-MX")} / {x.limit.toLocaleString("es-MX")}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f2efef]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, x.pct)}%`, background: x.pct >= 100 ? "var(--red)" : x.pct >= 80 ? "#e0a100" : "var(--blue)" }} /></div>
              {x.reference && x.pct >= 100 && <p className="mt-1 text-[11px] font-semibold text-[var(--red)]">Superó la referencia: sirve para justificar una revisión del plan.</p>}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--navy)]">Cobro anual · {s.annual.name}</h2>
          <p className="mt-1 text-[12.5px] text-[#4a4547]">
            {s.annual.freeYears > 0 ? `Gratis los primeros ${s.annual.freeYears} año${s.annual.freeYears > 1 ? "s" : ""} (desde ${s.annual.startDate}). ` : ""}Renovación de <strong>{mxn(s.annual.amountMxn)}</strong> al año. {s.annual.passThrough ? "Lo paga el cliente: no cuenta como ingreso ni como costo tuyo, solo es un recordatorio de cobro." : `Cuenta como ingreso de ${mxn(s.annual.amountMxn / 12)} al mes después del periodo gratis.`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11.5px] text-[var(--muted)]">Próxima renovación</div>
          <div className="text-[15px] font-extrabold text-[var(--navy)]">{renewal.toLocaleString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</div>
          <div className={`text-[11.5px] font-semibold ${daysToRenewal <= 30 ? "text-[var(--red)]" : "text-[var(--muted)]"}`}>{daysToRenewal > 0 ? `En ${daysToRenewal} días` : "Ya corresponde cobrarla"}</div>
        </div>
      </Panel>

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Winnie · costo de IA y presupuesto</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">Presupuesto: {s.aiBudgetPct}% de la cuota neta = {mxn(c.ai.budgetMxn)} al mes. Mientras no lo superes, Winnie atiende sin recortes.</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Respuestas este mes", c.ai.responses.toLocaleString("es-MX")],
            ["Costo por respuesta", c.ai.responses > 0 ? `$${c.ai.costPerResponseMxn.toFixed(3)}` : "—"],
            ["Gasto de IA / presupuesto", `${mxn(c.ai.costMxn)} / ${mxn(c.ai.budgetMxn)}`],
            ["Respuestas que cabe en el presupuesto", c.ai.capacityResponses !== null ? c.ai.capacityResponses.toLocaleString("es-MX") : "Sin datos aún"],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-[11.5px] text-[var(--muted)]">{k}</dt><dd className="text-[17px] font-extrabold text-[var(--navy)]">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2efef]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, c.ai.usedPct)}%`, background: c.ai.usedPct >= 100 ? "var(--red)" : c.ai.usedPct >= 70 ? "#e0a100" : "var(--blue)" }} /></div>
        <p className="mt-2 text-[11.5px] text-[var(--muted)]">Proyección al cierre del mes: {c.ai.projectedResponses.toLocaleString("es-MX")} respuestas · {mxn(c.ai.projectedMxn)}. {c.ai.usedPct >= 100 ? "Superaste el presupuesto: conviene activar el modo económico de Winnie." : c.ai.usedPct >= 70 ? "Cerca del presupuesto." : "Dentro del presupuesto."}</p>
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
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Pagos del cliente</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">Regístralos cuando los recibas; el administrador del cliente los ve en su sección «Pagos». Montos con IVA.</p>
        <form action={recordPayment} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="col-span-2"><span className={label}>Concepto</span><input name="concept" required maxLength={120} defaultValue={`Plan mensual ${range.key}`} className={fieldClass} /></label>
          <label><span className={label}>Periodo (2026-11 o 2027-anual)</span><input name="periodKey" required defaultValue={range.key} className={fieldClass} /></label>
          <label><span className={label}>Monto con IVA (MXN)</span><input name="amount" type="number" step="any" min="0" required defaultValue={s.plan.priceWithIva} className={fieldClass} /></label>
          <label><span className={label}>Estado</span><select name="status" defaultValue="pagado" className={fieldClass}><option value="pagado">Pagado</option><option value="pendiente">Pendiente</option><option value="vencido">Vencido</option></select></label>
          <label><span className={label}>Fecha de pago</span><input name="paidAt" type="date" className={fieldClass} /></label>
          <label><span className={label}>Método</span><input name="method" maxLength={40} placeholder="Tarjeta, transferencia…" className={fieldClass} /></label>
          <label><span className={label}>Referencia</span><input name="reference" maxLength={80} className={fieldClass} /></label>
          <label className="col-span-2 md:col-span-3"><span className={label}>Enlace de la factura (https, opcional)</span><input name="invoiceUrl" type="url" placeholder="https://…" className={fieldClass} /></label>
          <div className="flex items-end"><button className="press rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-white">Registrar pago</button></div>
        </form>
        {payments.length > 0 && (
          <ul className="mt-4">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f2efef] py-2.5 text-[12.5px]">
                <span><span className="font-semibold text-[#4a4547]">{p.concept}</span><span className="block text-[11px] text-[var(--muted)]">{p.periodKey} · {p.status}{p.method ? ` · ${p.method}` : ""}{p.reference ? ` · ${p.reference}` : ""}</span></span>
                <span className="flex items-center gap-3"><strong className="text-[var(--navy)]">{mxn(p.amountMxn)}</strong>
                  <form action={deletePayment.bind(null, p.id)}><button className="press text-[11.5px] font-semibold text-[var(--red)]">Quitar</button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="mt-4 p-5">
        <h2 className="text-[14px] font-bold text-[var(--navy)]">Cuota, tipo de cambio y tarifas</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">Las tarifas son estimadas: verifícalas en las páginas de precios de cada proveedor y ajústalas aquí. Cambian el cálculo de todos los meses.</p>
        <form action={saveOwnerSettings} className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label><span className={label}>Precio mensual del plan con IVA (MXN)</span><input name="planPrice" type="number" step="any" min="0" defaultValue={s.plan.priceWithIva} className={fieldClass} /></label>
            <label><span className={label}>IVA (%)</span><input name="planIva" type="number" step="any" min="0" defaultValue={s.plan.ivaPct} className={fieldClass} /></label>
            <label><span className={label}>Cupo: escaneos faciales al mes</span><input name="planScans" type="number" min="0" defaultValue={s.plan.scans} className={fieldClass} /></label>
            <label><span className={label}>Cupo: correos automáticos al mes</span><input name="planEmails" type="number" min="0" defaultValue={s.plan.emails} className={fieldClass} /></label>
            <label><span className={label}>Referencia: respuestas de Winnie al mes (no es tope)</span><input name="planWinnie" type="number" min="0" defaultValue={s.plan.winnieReference} className={fieldClass} /></label>
            <label><span className={label}>USD → MXN</span><input name="usdMxn" type="number" step="any" min="0" defaultValue={s.usdMxn} className={fieldClass} /></label>
            <label><span className={label}>EUR → MXN</span><input name="eurMxn" type="number" step="any" min="0" defaultValue={s.eurMxn} className={fieldClass} /></label>
            <label><span className={label}>Escaneos incluidos en su plan de Shen.AI</span><input name="shenIncluded" type="number" min="0" defaultValue={s.shen.included} className={fieldClass} /></label>
            <label><span className={label}>Escaneo extra de Shen.AI (EUR)</span><input name="shenExtraEur" type="number" step="any" min="0" defaultValue={s.shen.extraEur} className={fieldClass} /></label>
            <label className="flex items-end gap-2 pb-2.5"><input name="shenPaidByClient" type="checkbox" defaultChecked={s.shen.paidByClient} className="size-4" /><span className="text-[12px] font-semibold text-[#4a4547]">Shen.AI lo paga el cliente (no es mi costo)</span></label>
            <label><span className={label}>Primer mes con cobro</span><input name="billingStart" type="month" defaultValue={s.billing.startMonth} className={fieldClass} /></label>
            <label><span className={label}>Día límite de pago (1-28)</span><input name="dueDay" type="number" min="1" max="28" defaultValue={s.billing.dueDay} className={fieldClass} /></label>
            <label className="md:col-span-2"><span className={label}>Enlace de pago (https) de Mercado Pago o Conekta</span><input name="paymentLink" type="url" defaultValue={s.billing.paymentLink} placeholder="https://…" className={fieldClass} /></label>
            <label><span className={label}>Presupuesto de IA (% de la cuota neta)</span><input name="aiBudgetPct" type="number" step="any" min="0" max="100" defaultValue={s.aiBudgetPct} className={fieldClass} /></label>
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
            <label className="flex items-end gap-2 pb-2.5"><input name="annualPassThrough" type="checkbox" defaultChecked={s.annual.passThrough} className="size-4" /><span className="text-[12px] font-semibold text-[#4a4547]">Lo paga el cliente (no es mi ingreso ni mi costo)</span></label>
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
