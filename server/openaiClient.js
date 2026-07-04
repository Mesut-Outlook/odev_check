import OpenAI from 'openai';
import sharp from 'sharp';

const DEFAULT_TIMEOUT_MS = 120_000;

const RESPONSE_JSON_SCHEMA = {
  name: 'homework_evaluation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            questionNumber: { type: 'integer' },
            questionText: { type: 'string' },
            studentSolutionText: { type: 'string' },
            correctSolutionSteps: { type: 'array', items: { type: 'string' } },
            correctAnswer: { type: 'string' },
            studentAnswer: { type: 'string' },
            status: { type: 'string', enum: ['correct', 'incorrect', 'partial'] },
            aiExplanation: { type: 'string' },
          },
          required: [
            'questionNumber', 'questionText', 'studentSolutionText',
            'correctSolutionSteps', 'correctAnswer', 'studentAnswer',
            'status', 'aiExplanation',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['questions'],
    additionalProperties: false,
  },
};

const PROMPT = `Sen bir matematik öğretmeni asistanısın. Sana bir öğrencinin el yazısıyla çözdüğü matematik ödevi fotoğrafı verilecek.
Ödev birden fazla sayfanın fotoğraflanmasıyla oluşmuş olabilir; sorular ve cevaplar bir sayfadan diğerine devam edebilir, bu yüzden sağlanan tüm görselleri tek bir bütün ödev gönderisi olarak birlikte değerlendir.
Görevin:
1. Görseldeki her soruyu tespit et ve soru metnini çıkar.
2. Öğrencinin o soru için yazdığı çözüm adımlarını ve verdiği nihai cevabı olduğu gibi (el yazısından okuyarak) çıkar.
3. Soruyu kendin adım adım çöz ve doğru cevabı bul.
4. Öğrencinin çözümünü kendi doğru çözümünle karşılaştır ve durumu belirle: "correct" (tamamen doğru), "incorrect" (yanlış), "partial" (doğru yöntem ama küçük hata/eksik adım).
5. Kısa, öğretici bir açıklama yaz (aiExplanation) — öğrenci yanlışsa nerede hata yaptığını belirt.
Yalnızca istenen JSON şemasına uygun yanıt ver, başka metin ekleme.`;

function pickApiKey(overrideKey) {
  const key = overrideKey || process.env.OPENAI_API_KEY;
  if (!key) {
    const err = new Error('OPENAI_API_KEY tanımlı değil. Ortam değişkeni olarak veya istek üzerinden bir API anahtarı sağlayın.');
    err.statusCode = 400;
    throw err;
  }
  return key;
}

async function compressImage(imageBuffer) {
  return sharp(imageBuffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function generateEvaluation({ imageBuffers, model, apiKey }) {
  const resolvedKey = pickApiKey(apiKey);
  const resolvedModel = model || process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o-mini';

  const compressedImages = await Promise.all(imageBuffers.map(compressImage));
  const imageParts = compressedImages.map((buf) => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${buf.toString('base64')}` },
  }));

  const client = new OpenAI({ apiKey: resolvedKey });

  let response;
  try {
    response = await withTimeout(
      client.chat.completions.create({
        model: resolvedModel,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: PROMPT }, ...imageParts],
          },
        ],
        response_format: { type: 'json_schema', json_schema: RESPONSE_JSON_SCHEMA },
      }),
      DEFAULT_TIMEOUT_MS,
      'OpenAI API isteği zaman aşımına uğradı.'
    );
  } catch (cause) {
    const err = new Error(`OpenAI API çağrısı başarısız oldu: ${cause.message}`);
    err.statusCode = 502;
    err.cause = cause;
    throw err;
  }

  const text = response.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    const err = new Error('OpenAI yanıtı geçerli JSON değil.');
    err.statusCode = 502;
    err.cause = cause;
    throw err;
  }

  if (!parsed || !Array.isArray(parsed.questions)) {
    const err = new Error('OpenAI yanıtı beklenen şemaya uymuyor (questions dizisi eksik).');
    err.statusCode = 502;
    throw err;
  }

  return { questions: parsed.questions, model: resolvedModel };
}

export { generateEvaluation, RESPONSE_JSON_SCHEMA };
