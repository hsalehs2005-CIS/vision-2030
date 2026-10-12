import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

// Issues short-lived tokens so the photographer's browser can upload straight to Vercel Blob.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getSession())) throw new Error("unauthorized");
        return {
          allowedContentTypes: ["image/jpeg"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
