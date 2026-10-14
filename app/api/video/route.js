import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function authorized(request) {
  const expected = process.env.APP_PASSWORD;
  const supplied = request.headers.get("x-app-password");

  return Boolean(
    expected &&
    supplied &&
    supplied.length === expected.length &&
    supplied === expected
  );
}

function getModel() {
  const model =
    process.env.REPLICATE_VIDEO_MODEL || "minimax/video-01";

  if (!/^[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(model)) {
    throw new Error("Invalid REPLICATE_VIDEO_MODEL setting.");
  }

  return model;
}

function getInput(prompt) {
  let extra = {};

  if (process.env.VIDEO_MODEL_INPUT_JSON) {
    try {
      extra = JSON.parse(process.env.VIDEO_MODEL_INPUT_JSON);
    } catch {
      throw new Error(
        "VIDEO_MODEL_INPUT_JSON must contain valid JSON."
      );
    }

    if (
      !extra ||
      typeof extra !== "object" ||
      Array.isArray(extra)
    ) {
      throw new Error(
        "VIDEO_MODEL_INPUT_JSON must be a JSON object."
      );
    }
  }

  // The user's prompt must not be overwritten by environment input.
  return { ...extra, prompt };
}

async function replicateRequest(path, options = {}) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  const response = await fetch(
    `https://api.replicate.com/v1${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(50000),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      data.detail || data.title || data.error ||
      `Replicate returned HTTP ${response.status}`;

    throw new Error(String(detail).slice(0, 500));
  }

  return data;
}

export async function POST(request) {
  if (!authorized(request)) {
    return json(
      { error: "Unauthorized. Check the app password in Settings." },
      401
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return json({ error: "A video prompt is required." }, 400);
    }

    if (prompt.length > 12000) {
      return json(
        { error: "Prompt is too long. Maximum is 12,000 characters." },
        400
      );
    }

    const model = getModel();

    const job = await replicateRequest(
      `/models/${model}/predictions`,
      {
        method: "POST",
        headers: { Prefer: "wait=1" },
        body: JSON.stringify({
          input: getInput(prompt),
        }),
      }
    );

    return json({
      id: job.id,
      status: job.status,
      output: job.output ?? null,
      error: job.error ?? null,
      urls: job.urls ?? null,
      model,
      created_at: job.created_at ?? null,
    }, 202);
  } catch (error) {
    const message = error?.message || "Video generation failed.";

    const status =
      /not configured|Invalid REPLICATE|VIDEO_MODEL_INPUT_JSON/.test(message)
        ? 503
        : 502;

    return json({
      error: message,
      stage: "video_submission",
    }, status);
  }
}

export async function GET(request) {
  if (!authorized(request)) {
    return json(
      { error: "Unauthorized. Check the app password in Settings." },
      401
    );
  }

  const id = new URL(request.url).searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return json({ error: "A valid video job ID is required." }, 400);
  }

  try {
    const job = await replicateRequest(
      `/predictions/${encodeURIComponent(id)}`
    );

    return json({
      id: job.id,
      status: job.status,
      output: job.output ?? null,
      error: job.error ?? null,
      urls: job.urls ?? null,
      started_at: job.started_at ?? null,
      completed_at: job.completed_at ?? null,
    });
  } catch (error) {
    return json({
      error: error?.message || "Could not retrieve video status.",
      stage: "video_status",
    }, 502);
  }
}
