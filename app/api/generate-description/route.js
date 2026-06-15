import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Algoritmo de Páscoa (Meeus/Jones/Butcher) ────────────────────────────────
function calcEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameDay(d1, d2) {
  return d1.getDate() === d2.getDate()
    && d1.getMonth() === d2.getMonth()
    && d1.getFullYear() === d2.getFullYear()
}

// Retorna lista de feriados/datas especiais para um dado Date local
function getSpecialContext(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const specials = []

  // Feriados nacionais fixos
  const fixed = [
    { m: 1,  d: 1,  label: 'Ano Novo / Confraternização Universal' },
    { m: 4,  d: 21, label: 'Feriado de Tiradentes' },
    { m: 5,  d: 1,  label: 'Dia do Trabalho' },
    { m: 9,  d: 7,  label: 'Dia da Independência do Brasil' },
    { m: 10, d: 12, label: 'Dia de Nossa Senhora Aparecida' },
    { m: 11, d: 2,  label: 'Dia de Finados' },
    { m: 11, d: 15, label: 'Feriado da Proclamação da República' },
    { m: 11, d: 20, label: 'Dia da Consciência Negra' },
    { m: 12, d: 24, label: 'Véspera de Natal' },
    { m: 12, d: 25, label: 'Natal' },
    { m: 12, d: 31, label: 'Réveillon / Virada de Ano' },
  ]

  // Datas especiais notáveis (não feriados, mas culturalmente relevantes)
  const notable = [
    { m: 2,  d: 14, label: 'Dia de São Valentim (Valentine\'s Day)' },
    { m: 6,  d: 12, label: 'Dia dos Namorados' },
    { m: 6,  d: 13, label: 'Dia de Santo Antônio (início do São João)' },
    { m: 6,  d: 24, label: 'Dia de São João' },
    { m: 6,  d: 29, label: 'Dia de São Pedro' },
    { m: 10, d: 31, label: 'Halloween' },
    { m: 5,  d: 12, label: 'Dia das Mães' }, // segundo domingo de maio — aproximado; tratado abaixo
  ]

  for (const h of [...fixed, ...notable]) {
    if (h.m === month && h.d === day) specials.push(h.label)
  }

  // Festas Juninas (período 13–30/06, exceto datas já marcadas acima)
  if (month === 6 && day >= 14 && day <= 30 && day !== 24 && day !== 29) {
    specials.push('Período de Festas Juninas')
  }

  // Feriados variáveis baseados na Páscoa
  const easter = calcEaster(year)
  const easterMap = [
    { offset: -48, label: 'Sábado de Carnaval' },
    { offset: -47, label: 'Domingo de Carnaval' },
    { offset: -46, label: 'Segunda-feira de Carnaval' },
    { offset: -45, label: 'Terça-feira de Carnaval' },
    { offset: -44, label: 'Quarta-feira de Cinzas (início da Quaresma)' },
    { offset: -2,  label: 'Sexta-feira Santa' },
    { offset: -1,  label: 'Sábado de Aleluia' },
    { offset: 0,   label: 'Páscoa' },
    { offset: 60,  label: 'Corpus Christi' },
  ]
  for (const { offset, label } of easterMap) {
    if (sameDay(date, addDays(easter, offset))) specials.push(label)
  }

  // Segundo domingo de maio → Dia das Mães
  if (month === 5) {
    let sundayCount = 0
    for (let d2 = 1; d2 <= day; d2++) {
      if (new Date(year, 4, d2).getDay() === 0) sundayCount++
    }
    if (sundayCount === 2 && new Date(year, 4, day).getDay() === 0) {
      specials.push('Dia das Mães')
    }
  }

  // Segundo domingo de agosto → Dia dos Pais
  if (month === 8) {
    let sundayCount = 0
    for (let d2 = 1; d2 <= day; d2++) {
      if (new Date(year, 7, d2).getDay() === 0) sundayCount++
    }
    if (sundayCount === 2 && new Date(year, 7, day).getDay() === 0) {
      specials.push('Dia dos Pais')
    }
  }

  return specials
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const { venue, city, date } = await req.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 500 })
    }

    // Parse seguro: trata datetime-local como horário local (evita shift de timezone no servidor)
    let formattedDate = null
    let specialContext = []
    if (date) {
      const [datePart] = date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const localDate = new Date(year, month - 1, day)
      formattedDate = localDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      specialContext = getSpecialContext(localDate)
    }

    const ctxParts = [
      venue && `Local: ${venue}`,
      city && `Cidade: ${city}`,
      formattedDate && `Data: ${formattedDate}`,
      specialContext.length > 0 && `Datas especiais / feriados nesse dia: ${specialContext.join(', ')}`,
    ].filter(Boolean)

    const ctx = ctxParts.length > 0 ? ctxParts.join('. ') : null

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Você escreve descrições curtas e animadas para shows da banda Retrovers, uma banda de rock nacional que toca sucessos dos anos 60 a 2000 (Legião Urbana, Barão Vermelho, Raul Seixas, Capital Inicial, Titãs, Cazuza, etc). O público é descontraído, gosta de beber uma cerveja e curtir um bailinho de rock. Se houver feriado ou data especial, mencione de forma criativa. Responda APENAS com o texto da descrição, sem aspas, sem introdução.',
          },
          {
            role: 'user',
            content: `Escreva UMA descrição de 1 a 3 frases, em português do Brasil, informal e animada, no estilo: "Bailinho especial e tradicional que fazemos na toca do urso! Anote na sua agenda e venha tomar uma colorado ouvindo clássicos do rock nacional!"\n\n${ctx ? `Contexto do show: ${ctx}. IMPORTANTE: use exatamente o dia da semana informado acima, não tente calcular ou alterar.` : 'Show genérico da banda.'}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Erro na IA' }, { status: 500 })
    }

    const data = await res.json()
    const description = data.choices?.[0]?.message?.content?.trim()

    if (!description) {
      return NextResponse.json({ error: 'IA não retornou texto' }, { status: 500 })
    }

    return NextResponse.json({ description })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
