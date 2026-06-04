exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key no configurada en servidor" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: body.mediaType, data: body.base64 } },
            { type: "text", text: 'Eres asistente contable colombiano. Analiza este recibo y devuelve SOLO JSON (sin markdown):\n{"establecimiento":"","nit":"","factura":"","subtotal":0,"iva":0,"total":0,"concepto_sugerido":"ALIMENTACIÓN","fecha":""}\nconcepto_sugerido debe ser uno de: ALIMENTACIÓN,HOSPEDAJE,COMBUSTIBLE,PEAJES / TRANSPORTE,ALQUILER DE VEHÍCULO,MATERIAL,OTROS\nCampos ilegibles: "" o 0.' }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
    }

    const text = data.content?.find(b => b.type === "text")?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: clean
    };

  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
