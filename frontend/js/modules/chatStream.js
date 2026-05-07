export async function streamChat({ url, payload, headers, onToken, onDone }) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) {
    const error = new Error(`Stream request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");
      const dataLines = lines.filter((line) => line.startsWith("data:"));
      if (dataLines.length === 0) {
        continue;
      }

      const payloadText = dataLines
        .map((line) => line.replace(/^data:\s*/, ""))
        .join("\n")
        .trim();

      if (!payloadText) {
        continue;
      }

      if (payloadText === "[DONE]") {
        return { fullReply };
      }

      try {
        const parsed = JSON.parse(payloadText);
        if (parsed.token) {
          fullReply += parsed.token;
          if (typeof onToken === "function") {
            onToken(parsed.token);
          }
        }
        if (parsed.done) {
          if (typeof onDone === "function") {
            onDone(parsed);
          }
          return { fullReply, done: parsed };
        }
      } catch (error) {
        // Ignore malformed chunks.
      }
    }
  }

  return { fullReply };
}
