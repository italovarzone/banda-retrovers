import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Google Places (New) ──────────────────────────────────────────────────────
async function googleDetails(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'displayName,location,formattedAddress,addressComponents',
      'Accept-Language': 'pt-BR',
    },
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Google Details error:', data.error?.message)
    return null
  }

  const lat = data.location?.latitude
  const lng = data.location?.longitude
  const comps = data.addressComponents || []
  const cityComp = comps.find(c => c.types?.includes('locality') || c.types?.includes('administrative_area_level_2'))
  const stateComp = comps.find(c => c.types?.includes('administrative_area_level_1'))
  const city = [cityComp?.longText, stateComp?.shortText].filter(Boolean).join('/')

  return {
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
    city,
    lat,
    lng,
    link: lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : '',
  }
}

// ─── Foursquare Places (v3) ───────────────────────────────────────────────────
async function foursquareDetails(fsqId) {
  const key = process.env.FOURSQUARE_API_KEY
  if (!key) return null

  const url = new URL(`https://api.foursquare.com/v3/places/${fsqId}`)
  url.searchParams.set('fields', 'name,geocodes,location')

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: key,
      Accept: 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Foursquare Details error:', data.message)
    return null
  }

  const lat = data.geocodes?.main?.latitude
  const lng = data.geocodes?.main?.longitude
  const loc = data.location || {}
  const city = [loc.locality || loc.city, loc.region].filter(Boolean).join('/')

  return {
    name: data.name || '',
    address: loc.formatted_address || [loc.address, loc.locality, loc.region].filter(Boolean).join(', '),
    city,
    lat,
    lng,
    link: lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : '',
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawId = searchParams.get('id') || ''

  if (!rawId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const [source, ...rest] = rawId.split(':')
  const id = rest.join(':')   // join de volta caso o ID tenha ':' (ex: IDs do HERE)

  try {
    let result = null

    if (source === 'google') {
      result = await googleDetails(id)
    } else if (source === 'fsq') {
      result = await foursquareDetails(id)
    }

    if (!result) {
      return NextResponse.json({ error: `Não foi possível buscar detalhes (source: ${source})` }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/places/details error', err)
    return NextResponse.json({ error: 'Falha ao buscar detalhes' }, { status: 500 })
  }
}
