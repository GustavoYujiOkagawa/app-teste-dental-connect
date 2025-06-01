import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida." },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API não configurada." },
        { status: 500 }
      );
    }

    const payload = {
      model: "deepseek-vl-chat",
      messages: [
        {
          role: "user",
          content: `
Você é um especialista em odontologia estética. Analise cuidadosamente a imagem fornecida e me retorne apenas um JSON no seguinte formato, sem explicações:

{
  "toothColorCode": "VITA code (ex: A1, A2, B1)",
  "toothColorHex": "#hexadecimal",
  "gumColorCode": "Descrição da cor da gengiva (ex: Pink, Light Red)",
  "gumColorHex": "#hexadecimal"
}

Responda apenas no formato JSON.
          `.trim(),
          images: [`data:image/jpeg;base64,${imageBase64}`],
        },
      ],
      max_tokens: 500,
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Resposta não é JSON:", text);
      return NextResponse.json(
        { error: "Resposta inválida da API DeepSeek", resposta: text },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("Erro da API DeepSeek:", data);
      return NextResponse.json({ error: data }, { status: response.status });
    }

    const messageContent = data.choices?.[0]?.message?.content;
    if (!messageContent) {
      return NextResponse.json(
        { error: "Resposta inválida da DeepSeek." },
        { status: 500 }
      );
    }

    const cleanedContent = messageContent.replace(/```json|```/g, "").trim();

    let jsonResult;
    try {
      jsonResult = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", e, cleanedContent);
      return NextResponse.json(
        {
          error: "Não foi possível interpretar a resposta da DeepSeek.",
          respostaBruta: messageContent,
        },
        { status: 500 }
      );
    }

    const { toothColorCode, toothColorHex, gumColorCode, gumColorHex } =
      jsonResult;
    if (!toothColorCode || !toothColorHex || !gumColorCode || !gumColorHex) {
      return NextResponse.json(
        { error: "Resposta incompleta ou inválida.", jsonResult },
        { status: 500 }
      );
    }

    return NextResponse.json({
      toothColorCode,
      toothColorHex,
      gumColorCode,
      gumColorHex,
    });
  } catch (error: any) {
    console.error("Erro geral na API:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
