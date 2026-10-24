import type { Client, Company, Document, Settings } from "@/lib/types";
import { docTotals, formatDateLong, lineTotal, num, num2 } from "@/lib/format";

export default function InvoicePaper({
  doc,
  client,
  settings,
}: {
  doc: Document;
  client?: Client;
  settings: Settings;
}) {
  const company: Company = settings.company;
  const totals = docTotals(doc);
  const isDevis = doc.type === "devis";
  const title = isDevis ? "DEVIS" : "FACTURE";

  return (
    <article className="mx-auto w-full max-w-[820px] bg-white p-8 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 sm:p-12 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      {/* En-tête */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-[15px] font-black text-white">
            {company.logoText || "TF"}
          </span>
          <div>
            <p className="text-[17px] font-extrabold uppercase tracking-tight text-slate-900">
              {company.name} {company.legalForm && <span className="font-semibold text-slate-500">{company.legalForm}</span>}
            </p>
            <p className="mt-1 max-w-[260px] text-[11.5px] leading-relaxed text-slate-500">
              {company.address}
              <br />
              {company.city}, {company.country}
              <br />
              {company.phone} · {company.email}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[26px] font-black tracking-tight text-slate-900">{title}</p>
          <p className="mt-1 text-[13px] font-semibold text-brand-700">{doc.number}</p>
          <dl className="mt-3 space-y-0.5 text-[11.5px] text-slate-500">
            <div className="flex justify-end gap-2">
              <dt>Émise le</dt>
              <dd className="font-medium text-slate-700">{formatDateLong(doc.issueDate)}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt>{isDevis ? "Valable jusqu'au" : "Échéance"}</dt>
              <dd className="font-medium text-slate-700">
                {formatDateLong(isDevis ? doc.validUntil : doc.dueDate)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Parties */}
      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Facturé à
          </p>
          <p className="mt-2 text-[13.5px] font-bold text-slate-900">
            {client?.company || client?.name || "Client"}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
            {client?.name && client?.company ? `${client.name}` : null}
            {client?.address ? (
              <>
                <br />
                {client.address}
              </>
            ) : null}
            {client?.city ? (
              <>
                <br />
                {client.city}
                {client.country ? `, ${client.country}` : ""}
              </>
            ) : null}
            {client?.email ? (
              <>
                <br />
                {client.email}
              </>
            ) : null}
            {client?.phone ? (
              <>
                <br />
                {client.phone}
              </>
            ) : null}
            {client?.taxId ? (
              <>
                <br />
                NCC : {client.taxId}
              </>
            ) : null}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Émetteur
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
            NCC : <span className="font-medium text-slate-700">{company.taxId}</span>
            <br />
            RCCM : <span className="font-medium text-slate-700">{company.rccm}</span>
            {company.iban ? (
              <>
                <br />
                Compte : <span className="font-medium text-slate-700">{company.iban}</span>
              </>
            ) : null}
            {company.bank ? (
              <>
                <br />
                {company.bank}
              </>
            ) : null}
          </p>
        </div>
      </section>

      {/* Lignes */}
      <table className="mt-8 w-full text-left">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-2.5 pl-3 pr-2 font-bold">Description</th>
            <th className="px-2 py-2.5 text-right font-bold">Qté</th>
            <th className="px-2 py-2.5 text-right font-bold">P.U. HT</th>
            <th className="px-2 py-2.5 text-right font-bold">TVA</th>
            <th className="py-2.5 pl-2 pr-3 text-right font-bold">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {doc.lines.map((line) => (
            <tr key={line.id} className="align-top text-[12px]">
              <td className="py-3 pl-3 pr-2 font-medium text-slate-800">{line.description}</td>
              <td className="px-2 py-3 text-right text-slate-600">{num(line.quantity)}</td>
              <td className="px-2 py-3 text-right text-slate-600">{num(line.unitPrice)}</td>
              <td className="px-2 py-3 text-right text-slate-500">{line.vatRate} %</td>
              <td className="py-3 pl-2 pr-3 text-right font-semibold text-slate-800">
                {num(lineTotal(line))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <section className="mt-5 flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
        <div className="max-w-[340px] text-[11px] leading-relaxed text-slate-500">
          {doc.notes && (
            <>
              <p className="mb-1 font-bold uppercase tracking-wider text-slate-400">Notes</p>
              <p>{doc.notes}</p>
            </>
          )}
          <p className="mt-3 font-bold uppercase tracking-wider text-slate-400">Conditions de règlement</p>
          <p>{settings.paymentInstructions}</p>
        </div>

        <div className="w-full max-w-[280px] shrink-0">
          <dl className="space-y-1.5 text-[12px]">
            <div className="flex justify-between text-slate-600">
              <dt>Total HT</dt>
              <dd className="font-semibold text-slate-800">{num2(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>TVA</dt>
              <dd className="font-semibold text-slate-800">{num2(totals.vat)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between rounded-lg bg-slate-900 px-3.5 py-2.5 text-white">
              <dt className="text-[12px] font-semibold uppercase tracking-wide">Total TTC</dt>
              <dd className="text-[17px] font-bold">
                {num(totals.total)}{" "}
                <span className="text-[10.5px] font-semibold text-slate-300">{settings.currency}</span>
              </dd>
            </div>
          </dl>
          {doc.status === "payee" && (
            <p className="mt-2 rounded-md bg-emerald-50 px-3 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
              Payée {doc.paidAt ? `le ${formatDateLong(doc.paidAt)}` : ""}
            </p>
          )}
        </div>
      </section>

      <footer className="mt-9 border-t border-slate-200 pt-4 text-center text-[10px] leading-relaxed text-slate-400">
        {settings.footerNote}
        <br />
        {company.name} {company.legalForm} · {company.address}, {company.city} · {company.phone} ·{" "}
        {company.website}
      </footer>
    </article>
  );
}
