const consentLabel = "Jasmin AI Updates Consent";
const consentText = "获取 AI 总舵手，同时接收澳洲茉莉的 AI 实战、新 Skill 与相关更新，可随时退订。";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function kitRequest(path, apiKey, body) {
  return fetch(`https://api.kit.com/v4${path}`, {
    method: "POST",
    headers: { "X-Kit-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
}

export async function handleLeadCapture(request, env = {}) {
  if (request.method !== "POST") return json({ ok: false, error: "不支持的请求方式。" }, 405);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "请填写有效的 Email。" }, 400);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "请填写有效的 Email。" }, 400);
  }
  if (input.consent !== true) return json({ ok: false, error: "请先确认订阅说明。" }, 400);

  if (env.KIT_MOCK_MODE === "true") return json({ ok: true, mode: "mock" });

  const apiKey = env.KIT_API_KEY;
  const formId = String(env.KIT_FORM_ID ?? "");
  if (!apiKey || !/^\d+$/.test(formId)) {
    return json({ ok: false, error: "Email 领取暂未完成配置，请稍后再试。" }, 503);
  }

  try {
    const fieldResponse = await kitRequest("/custom_fields", apiKey, { label: consentLabel });
    if (!fieldResponse.ok) throw new Error("consent_field_failed");
    const fieldPayload = await fieldResponse.json();
    const consentFieldKey = fieldPayload.custom_field?.key;
    if (!consentFieldKey) throw new Error("consent_field_missing");

    const consentRecord = `${consentText} | ${new Date().toISOString()}`;
    const subscriberResponse = await kitRequest("/subscribers", apiKey, {
      email_address: email,
      fields: { [consentFieldKey]: consentRecord },
    });
    if (!subscriberResponse.ok) throw new Error("subscriber_failed");
    const subscriberPayload = await subscriberResponse.json();
    const subscriberId = subscriberPayload.subscriber?.id;
    if (!subscriberId) throw new Error("subscriber_missing");

    const referrer = new URL(request.url).origin + "/skills/chief-agent/";
    const formResponse = await kitRequest(`/forms/${formId}/subscribers/${subscriberId}`, apiKey, { referrer });
    if (!formResponse.ok) throw new Error("form_enrollment_failed");

    return json({ ok: true, mode: "kit" });
  } catch {
    return json({ ok: false, error: "暂时无法提交，请稍后再试。" }, 502);
  }
}
