import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint test ping
app.post("/api/test-endpoint", async (req, res) => {
  const { baseUrl, apiKey } = req.body;
  if (!baseUrl) {
    return res.status(400).json({ error: "Base URL is required" });
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const startTime = Date.now();
  const modelsUrl = cleanBase.endsWith("/v1") 
    ? `${cleanBase}/models` 
    : `${cleanBase}/v1/models`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(modelsUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return res.json({
        ok: false,
        status: response.status,
        latency,
        message: `HTTP ${response.status}: ${response.statusText}`,
        hint: "Sunucu yanıt verdi fakat /models uç noktası başarısız oldu. /chat/completions yine de çalışabilir."
      });
    }

    const data: any = await response.json();
    let models: string[] = [];
    if (Array.isArray(data.data)) {
      models = data.data.map((m: any) => m.id || m.name || String(m));
    } else if (Array.isArray(data.models)) {
      models = data.models.map((m: any) => m.name || m.id || String(m));
    } else if (Array.isArray(data)) {
      models = data.map((m: any) => m.id || m.name || String(m));
    }

    return res.json({
      ok: true,
      latency,
      models,
      message: `Bağlantı başarılı (${latency}ms)`
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return res.json({
      ok: false,
      latency,
      error: err.name === "AbortError" ? "Zaman aşımı (8s)" : (err.message || "Bağlantı kurulamadı"),
      hint: "Kapalı ağ IP/Port adresinin doğruluğunu ve sunucunun çalıştığını kontrol edin."
    });
  }
});

// Auto-list models from Base URL
app.post("/api/list-models", async (req, res) => {
  const { baseUrl, apiKey } = req.body;
  if (!baseUrl) {
    return res.status(400).json({ error: "Base URL gereklidir." });
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const startTime = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Potential endpoints to check
  const urlsToTry = [
    cleanBase.endsWith("/v1") ? `${cleanBase}/models` : `${cleanBase}/v1/models`,
    cleanBase.endsWith("/v1") ? `${cleanBase.replace(/\/v1$/, "")}/models` : `${cleanBase}/models`,
    cleanBase.endsWith("/v1") ? `${cleanBase.replace(/\/v1$/, "")}/api/tags` : `${cleanBase}/api/tags`,
  ];

  let lastError = "";
  for (const targetUrl of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: any = await response.json();
        let extractedModels: Array<{ id: string; name: string; owned_by?: string }> = [];

        if (Array.isArray(data.data)) {
          extractedModels = data.data.map((m: any) => ({
            id: m.id || m.name || String(m),
            name: m.name || m.id || String(m),
            owned_by: m.owned_by,
          }));
        } else if (Array.isArray(data.models)) {
          // Ollama /api/tags or custom
          extractedModels = data.models.map((m: any) => ({
            id: m.name || m.id || String(m),
            name: m.name || m.id || String(m),
            owned_by: m.details?.family || "ollama",
          }));
        } else if (Array.isArray(data)) {
          extractedModels = data.map((m: any) => ({
            id: m.id || m.name || String(m),
            name: m.name || m.id || String(m),
          }));
        }

        if (extractedModels.length > 0) {
          const latency = Date.now() - startTime;
          return res.json({
            ok: true,
            latency,
            endpointUsed: targetUrl,
            models: extractedModels,
            count: extractedModels.length,
          });
        }
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      lastError = err.name === "AbortError" ? "Zaman aşımı (6s)" : (err.message || "Bağlantı hatası");
    }
  }

  const latency = Date.now() - startTime;
  return res.json({
    ok: false,
    latency,
    error: lastError || "Modeller listelenemedi",
    hint: "Sunucu erişilebilir durumda mı? /v1/models veya /models uç noktasının açık olduğundan emin olun."
  });
});

// Proxy OpenAI-compatible chat completion
app.post("/api/proxy-openai", async (req, res) => {
  const {
    baseUrl,
    apiKey,
    model,
    messages,
    temperature = 0.1,
    max_tokens = 2048,
    response_format,
    timeoutMs = 90000,
  } = req.body;

  if (!baseUrl || !model || !messages) {
    return res.status(400).json({
      error: "Eksik parametreler: baseUrl, model ve messages zorunludur."
    });
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const targetUrl = cleanBase.endsWith("/v1")
    ? `${cleanBase}/chat/completions`
    : `${cleanBase}/v1/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const payload: any = {
    model,
    messages,
    temperature,
    max_tokens,
  };

  if (response_format) {
    payload.response_format = response_format;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Model API Hatası (${response.status})`,
        details: errorText,
        latencyMs,
      });
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? Math.round(content.length / 4);
    const totalTokens = data.usage?.total_tokens ?? (promptTokens + completionTokens);
    const tokensPerSec = completionTokens > 0 && latencyMs > 0 
      ? Number(((completionTokens / latencyMs) * 1000).toFixed(1)) 
      : 0;

    return res.json({
      ok: true,
      content,
      latencyMs,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        tokens_per_second: tokensPerSec,
      },
      rawResponse: data,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    return res.status(502).json({
      ok: false,
      error: isTimeout ? `İstek zaman aşımına uğradı (${timeoutMs}ms)` : (err.message || "Bağlantı hatası"),
      latencyMs,
      code: err.code || "REQUEST_FAILED",
      hint: "Kapalı ağ sunucusuna doğrudan ulaşılamadı. IP adresi ve portu kontrol edin veya Simülasyon modunu aktif edin."
    });
  }
});

// Vite / static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenAI DocBenchmark Studio running on http://localhost:${PORT}`);
  });
}

startServer();
