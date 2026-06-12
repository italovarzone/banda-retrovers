import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Google Places API (New) ──────────────────────────────────────────────────
async function googleAutocomplete(q) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    },
    body: JSON.stringify({
      input: q,
      languageCode: 'pt-BR',
      includedRegionCodes: ['br'],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Google Places error:', data.error?.message)
    return null
  }

  const results = (data.suggestions || []).filter(s => s.placePrediction)
  if (results.length === 0 && data.suggestions?.length === 0) return [] // resposta válida, sem resultados

  return results.map(s => {
    const p = s.placePrediction
    return {
      id: `google:${p.placeId}`,
      name: p.structuredFormat?.mainText?.text || p.text?.text || '',
      address: p.structuredFormat?.secondaryText?.text || '',
      needsDetails: true,
      source: 'google',
    }
  })
}

// ─── Foursquare Places API (v3) ───────────────────────────────────────────────
async function foursquareAutocomplete(q) {
  const key = process.env.FOURSQUARE_API_KEY
  if (!key) return null

  // centro do Brasil como hint de localização
  const url = new URL('https://api.foursquare.com/v3/autocomplete')
  url.searchParams.set('query', q)
  url.searchParams.set('types', 'place')
  url.searchParams.set('limit', '6')
  url.searchParams.set('ll', '-15.7801,-47.9292')   // Brasília como âncora geográfica
  url.searchParams.set('radius', '4000000')         // ~raio do Brasil

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: key,
      Accept: 'application/json',
    },
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Foursquare Places error:', data.message || JSON.stringify(data))
    return null
  }

  return (data.results || [])
    .filter(r => r.type === 'place' && r.place)
    .map(r => {
      const p = r.place
      const addr = p.location?.formatted_address || ''
      return {
        id: `fsq:${p.fsq_id}`,
        name: p.name || '',
        address: addr,
        needsDetails: true,
        source: 'foursquare',
      }
    })
}

// ─── Nominatim (OpenStreetMap) – sempre gratuito ──────────────────────────────
async function nominatimSearch(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=br`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BandaRetrovers-Admin/1.0',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  })
  const data = await res.json()
  return (Array.isArray(data) ? data : []).map(place => {
    const addr = place.address || {}
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || ''
    const state = addr.state || ''
    return {
      id: `osm:${place.place_id}`,
      name: place.name || place.display_name.split(',')[0].trim(),
      address: place.display_name.split(',').slice(1, 4).join(',').trim(),
      needsDetails: false,
      source: 'osm',
      city: [city, state].filter(Boolean).join('/'),
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      link: `https://www.google.com/maps?q=${place.lat},${place.lon}`,
    }
  })
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  if (q.length < 2) return NextResponse.json([])

  try {
    // 1ª tentativa: Google
    const google = await googleAutocomplete(q)
    if (google !== null && google.length > 0) return NextResponse.json(google)

    // 2ª tentativa: Foursquare
    const fsq = await foursquareAutocomplete(q)
    if (fsq !== null && fsq.length > 0) return NextResponse.json(fsq)

    // fallback: Nominatim
    const osm = await nominatimSearch(q)
    return NextResponse.json(osm)
  } catch (err) {
    console.error('GET /api/places error', err)
    return NextResponse.json([])
  }
}
