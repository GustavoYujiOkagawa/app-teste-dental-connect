import { NextRequest, NextResponse } from "next/server";

// Lê a chave da API da OpenAI das variáveis de ambiente
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Valor padrão para campos não encontrados
const NOT_FOUND_VALUE_CODE = "Não identificado";
const NOT_FOUND_VALUE_HEX = "#N/A";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida." },
        { status: 400 }
      );
    }

    // Verifica se a chave da API da OpenAI está configurada
    if (!OPENAI_API_KEY) {
      console.error("Chave da API da OpenAI não configurada.");
      return NextResponse.json(
        { error: "Chave da API da OpenAI não configurada no ambiente." },
        { status: 500 }
      );
    }

    // Monta o payload para a API da OpenAI com modelo de visão (gpt-4o)
    // Habilita o Modo JSON para garantir uma resposta JSON válida.
    const payload = {
      model: "gpt-4o", // Modelo com capacidade de visão
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              // Instrução clara para retornar JSON, necessária para o Modo JSON
              // Reforça que todos os campos são desejados, mas o código tratará ausências.
              text: `
Você é um assistente de análise de imagem especializado em identificar cores da escala vita e tonalidades. Analise a imagem fornecida e retorne APENAS um objeto JSON válido no seguinte formato, sem nenhuma explicação ou texto adicional antes ou depois do JSON. Identifique as cores predominantes nas áreas indicadas. Se alguma cor não for claramente visível ou identificável, use um valor padrão como "Não identificado" para códigos ou "#N/A" para hexadecimais.

{
  "elementoPrincipalCorCodigo":  "Código de cor/tonalidade baseado na escala VITA (ex: A1 para branco-amarelado claro, B1 para branco-azulado claro)",
  "elementoPrincipalCorHex": "#hexadecimal",
  "areaCircundanteCorCodigo": "Descrição da cor da área ao redor (ex: Rosa Claro, Vermelho Suave)",
  "areaCircundanteCorHex": "#hexadecimal"
}

Responda APENAS com o objeto JSON.
              `.trim(),
            },
            {
              type: "image_url",
              image_url: {
                // Assumindo que a imagem é JPEG. Ajuste o mime type se necessário.
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500, // Ajuste conforme necessário
      // Habilita o Modo JSON
      response_format: { type: "json_object" },
    };

    // Faz a requisição para a API da OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(
        "Resposta da OpenAI não é JSON (mesmo com Modo JSON?):",
        text
      );
      return NextResponse.json(
        { error: "Resposta inválida da API OpenAI (não JSON)", resposta: text },
        { status: 500 }
      );
    }

    // Verifica se a resposta da API foi bem-sucedida
    if (!response.ok) {
      console.error("Erro da API OpenAI:", data);
      // Retorna o erro específico da OpenAI, se disponível
      const errorMessage =
        data?.error?.message || "Erro desconhecido da API OpenAI";
      return NextResponse.json(
        { error: errorMessage, details: data },
        { status: response.status }
      );
    }

    // **Ajuste Final: Acesso robusto ao message.content**
    // Extrai o conteúdo da mensagem da resposta de forma segura
    let messageContent: string | null = null;
    if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
    ) {
      messageContent = data.choices[0].message.content;
    } else {
      console.error(
        "Estrutura inesperada ou conteúdo ausente na resposta da OpenAI:",
        JSON.stringify(data, null, 2)
      );
    }

    if (!messageContent) {
      console.error(
        "Não foi possível extrair message.content da resposta da OpenAI:",
        data
      );
      return NextResponse.json(
        { error: "Resposta inválida da OpenAI (sem message.content)." },
        { status: 500 }
      );
    }

    const cleanedContent = messageContent.trim();

    let jsonResult;
    try {
      // O conteúdo já deve ser um JSON válido devido ao response_format
      jsonResult = JSON.parse(cleanedContent);
    } catch (e) {
      console.error(
        "Erro ao fazer parse do JSON da OpenAI (Modo JSON falhou?):",
        e,
        cleanedContent
      );
      return NextResponse.json(
        {
          error:
            "Não foi possível interpretar a resposta JSON da OpenAI (inesperado com Modo JSON).",
          respostaBruta: messageContent,
        },
        { status: 500 }
      );
    }

    // Tratamento Resiliente de Campos Ausentes
    const toothColorCode = jsonResult?.toothColorCode || NOT_FOUND_VALUE_CODE;
    const toothColorHex = jsonResult?.toothColorHex || NOT_FOUND_VALUE_HEX;
    const gumColorCode = jsonResult?.gumColorCode || NOT_FOUND_VALUE_CODE;
    const gumColorHex = jsonResult?.gumColorHex || NOT_FOUND_VALUE_HEX;

    console.log("Resultado JSON processado (com padrões para ausentes):", {
      toothColorCode,
      toothColorHex,
      gumColorCode,
      gumColorHex,
    });

    // Retorna o resultado JSON processado
    return NextResponse.json({
      toothColorCode,
      toothColorHex,
      gumColorCode,
      gumColorHex,
    });
  } catch (error: any) {
    console.error("Erro geral na rota da API:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
