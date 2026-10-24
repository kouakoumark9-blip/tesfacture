import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getDocumentByToken, getDocumentForUser } from "@/lib/documents";
import { effectivePlan } from "@/lib/plan";
import { toPreview } from "@/lib/preview";
import DocumentPdf from "@/components/pdf/document-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const token = new URL(request.url).searchParams.get("token");

  const session = await auth();
  let bundle = null;

  if (token) {
    // Lien public : lecture seule, sans connexion
    const byToken = await getDocumentByToken(token);
    if (byToken && byToken.doc.id === id) bundle = byToken;
  } else if (session?.user?.id) {
    bundle = await getDocumentForUser(id, session.user.id);
  }

  if (!bundle) {
    return new Response("Document introuvable ou accès refusé.", { status: 404 });
  }

  const plan = await effectivePlan(bundle.doc.userId);
  const doc = toPreview(bundle);

  const buffer = await renderToBuffer(
    <DocumentPdf doc={doc} watermark={plan === "free"} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${doc.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
