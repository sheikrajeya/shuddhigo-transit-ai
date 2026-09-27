import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Stop {
  name: string;
  time: string;
  sequence: number;
}

interface VerifyBody {
  bus_number: string;
  route_number: string;
  category: string;
  severity: string;
  description: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cleanliness: 'Cleanliness / sanitation',
  seats: 'Seat condition / damage',
  ac: 'Air conditioning / ventilation',
  doors: 'Doors / entry exit',
  windows: 'Windows / panes',
  other: 'General maintenance',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VerifyBody = await req.json();
    const { bus_number, route_number, category, severity, description } = body;

    if (!bus_number || !route_number || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bus_number, route_number, description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch route stops from Supabase for timetable data
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: route, error: routeErr } = await supabase
      .from('routes')
      .select('route_number, route_name, origin, destination, stops')
      .eq('route_number', route_number)
      .maybeSingle();

    if (routeErr) throw routeErr;

    const stops: Stop[] = route?.stops ?? [];
    const timetableText = stops.length > 0
      ? stops.map((s) => `${s.time} — ${s.name}`).join('\n')
      : 'No timetable data available for this route.';

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      // Fallback: local heuristic cross-check without Gemini
      const descLower = description.toLowerCase();
      const routeKnown = !!route;
      const categoryLabel = CATEGORY_LABELS[category] ?? category;

      const checks: string[] = [];
      let matchScore = 0;

      if (routeKnown) {
        checks.push(`Route ${route_number} confirmed in APSRTC timetable database with ${stops.length} stops.`);
        matchScore += 30;
      } else {
        checks.push(`Route ${route_number} not found in timetable database — report flagged for manual route verification.`);
      }

      // Check if description mentions real stops
      const stopNames = stops.map((s) => s.name.toLowerCase());
      const mentionedStops = stopNames.filter((name) => descLower.includes(name));
      if (mentionedStops.length > 0) {
        checks.push(`Report references verified stops: ${mentionedStops.map((s) => stops.find((st) => st.name.toLowerCase() === s)?.name).join(', ')}.`);
        matchScore += 25;
      }

      // Cross-check category relevance
      const catKeywords: Record<string, string[]> = {
        cleanliness: ['dirty', 'clean', 'trash', 'waste', 'smell', 'odor', 'filthy', 'hygiene'],
        seats: ['seat', 'broken', 'torn', 'cushion', 'damaged'],
        ac: ['ac', 'air', 'conditioning', 'hot', 'fan', 'ventilation', 'sweating'],
        doors: ['door', 'stuck', 'broken', 'entry', 'exit'],
        windows: ['window', 'glass', 'pane', 'broken', 'crack'],
      };
      const keywords = catKeywords[category] ?? [];
      const matchedKeywords = keywords.filter((k) => descLower.includes(k));
      if (matchedKeywords.length > 0) {
        checks.push(`Category "${categoryLabel}" corroborated by keywords in description: ${matchedKeywords.join(', ')}.`);
        matchScore += 25;
      }

      // Bus number format check
      const busPattern = /^AP-\d{2}-[A-Z]-\d{4}$/;
      if (busPattern.test(bus_number)) {
        checks.push(`Bus number ${bus_number} matches APSRTC registration format.`);
        matchScore += 10;
      }

      // Severity plausibility
      const severityKeywords: Record<string, string[]> = {
        critical: ['emergency', 'danger', 'unsafe', 'severe', 'critical', 'broken'],
        high: ['serious', 'major', 'urgent', 'bad'],
        medium: ['moderate', 'some', 'minor issue'],
        low: ['minor', 'small', 'slight'],
      };
      const sevKeys = severityKeywords[severity] ?? [];
      const sevMatched = sevKeys.filter((k) => descLower.includes(k));
      if (sevMatched.length > 0) {
        checks.push(`Severity "${severity}" supported by language in report.`);
        matchScore += 10;
      }

      const match = matchScore >= 60 ? 'matched' : matchScore >= 30 ? 'mismatch' : 'unverified';
      const summary = `Local verification (Gemini API not configured): ${checks.join(' ')} Overall confidence: ${matchScore}%.`;

      return new Response(
        JSON.stringify({ verified: true, match, summary, source: 'local-heuristic' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gemini API path
    const prompt = `You are a transit hygiene verification assistant for APSRTC Visakhapatnam.

A public hygiene report was filed for:
- Bus: ${bus_number}
- Route: ${route_number}
- Category: ${CATEGORY_LABELS[category] ?? category}
- Severity: ${severity}
- Report description: "${description}"

Official timetable for Route ${route_number} (${route?.route_name ?? 'Unknown'}):
${timetableText}

Cross-check this report against the timetable and route data:
1. Does the bus number follow APSRTC format (AP-XX-X-XXXX)?
2. Does the route number match a known APSRTC route?
3. Are any mentioned stops real stops on this route?
4. Is the category consistent with the description?
5. Is the severity plausible given the description?

Respond in this exact JSON format:
{
  "match": "matched" | "mismatch" | "unverified",
  "summary": "2-3 sentence assessment"
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error (${geminiResponse.status}): ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON from response
    let match = 'unverified';
    let summary = text;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        match = parsed.match ?? 'unverified';
        summary = parsed.summary ?? text;
      }
    } catch {
      // Keep raw text as summary
    }

    return new Response(
      JSON.stringify({ verified: true, match, summary, source: 'gemini' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
