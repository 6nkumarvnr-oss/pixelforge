import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../lib/auth";
import { consumeGenerationCredit, saveGenerationToDatabase } from "../../lib/pixelforge-db";
import { generateImageWithProvider } from "../../lib/image-providers";
import { addHistoryItem, type GenerateInput } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<GenerateInput>(event);
  const prompt = String(body?.prompt ?? "").trim();

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  const authUser = await getAuthenticatedUser(event);
  const creditResult = await consumeGenerationCredit(authUser);

  if (!creditResult.allowed) {
    throw createError({ statusCode: 402, statusMessage: "No generation credits remaining" });
  }

  const generation = await generateImageWithProvider(
    { ...body, prompt, userId: authUser?.id },
    { persistFallback: Boolean(authUser) },
  );
  const databaseGeneration = authUser ? await saveGenerationToDatabase(authUser, generation) : null;
  const finalGeneration = authUser ? databaseGeneration ?? addHistoryItem(generation) : generation;

  return {
    ok: true,
    provider: finalGeneration.metadata.provider,
    creditsRemaining: creditResult.unlimited ? null : creditResult.user?.credits ?? null,
    generation: finalGeneration,
  };
});
