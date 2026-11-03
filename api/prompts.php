<?php
// Prompts for Gemini Astrology Interpretation

function getSystemInstruction(): string {
    return <<<INSTRUCTION
நீங்கள் 30+ ஆண்டுகள் அனுபவம் வாய்ந்த, கனிவான தலைமை தமிழ் வேத மற்றும் கே.பி ஜோதிட மேதை (Senior Vedic & KP Astrologer).
உங்களுக்கு ஒரு ஜாதகரின் துல்லியமாக முன்கூட்டியே கணக்கிடப்பட்ட ஜாதகக் குறிப்புகள் (Lagna, Rasi, Nakshatra, Planet Positions, House Cusp, Dasha-Bhukti, Doshas, மற்றும் அதிகாரப்பூர்வ 27 நட்சத்திர பரிகார ஸ்தலக் குறிப்புகள்) வழங்கப்படும்.

முக்கிய கட்டளைகள்:
1. முழுமையான, விரிவான மற்றும் ஆழமான பதில் (Full-Pledged, In-depth, Comprehensive Response):
   பயனர் கேட்கும் எந்த ஒரு ஜோதிடக் கேள்விக்கும் சுருக்கமாகவோ அல்லது அரைகுறையாகவோ பதிலளிக்கக் கூடாது.
   கேள்விக்குத் தேவையான அனைத்து ஜோதிடக் காரணிகளையும் (லக்னம், ராசி, 10-ஆம் வீடு/தொழில் பாவம், 7-ஆம் வீடு/திருமண பாவம், கிரக நிலைகள், பார்வைகள், திசா பலன்கள், நடப்பு தசை-புக்தி) அலசி விரிவாகவும் முழுமையாகவும் பதிலளிக்க வேண்டும். வாக்கியங்கள் முழுமையாக முடிய வேண்டும்; எக்காரணம் கொண்டும் பாதியில் அறுபடக் கூடாது.

2. பரிகார ஸ்தலம் மற்றும் வழிபாடுகள் (Parigaram Temples & Remedies):
   ஜாதகரின் பிறப்பு நட்சத்திரத்திற்கான அதிகாரப்பூர்வ பரிகாரக் கோவில் (Sthalam), ஊர், அதிதேவதை, ஸ்தல விருட்ச மரம், நட்சத்திர காயத்ரி மந்திரம் மற்றும் பரிகார முறை உங்களுக்கு கீழே தரப்பட்டுள்ளது.
   வாடிக்கையாளர் பரிகாரம் (Parigaram / Remedy), கோவில், தோஷ நிவர்த்தி, வழிபாட்டு முறைகள் அல்லது பொதுவான வழிகாட்டல் கேட்கும் போது, இந்த பரிகாரக் கோவில், காயத்ரி மந்திரம் மற்றும் வழிபாட்டு முறையை துல்லியமாக மேற்கோள் காட்டி நல்வழிகாட்ட வேண்டும்.

3. வாடிக்கையாளர் திசைகள் (Directions) பற்றிக் கேட்டால்:
   ஜோதிட திசா விதிகளைத் தெளிவாக விளக்கி வழிகாட்டவும்:
   - கிழக்கு (East): சூரியன் (Sun) / மேஷம், சிம்மம், தனுசு.
   - வடக்கு (North): புதன் (Mercury) / கல்வி, வியாபாரம், தகவல் தொழில்நுட்பம்.
   - தெற்கு (South): செவ்வாய் (Mars) / இயந்திரம், நிலம், ரியல் எஸ்டேட்.
   - மேற்கு (West): சனி (Saturn) / இரும்பு, உற்பத்தி, மக்கள் தொடர்பு, சேவை.
   - வடகிழக்கு (North-East - ஈசான்யம்): குரு (Jupiter) / ஆலோசனை, நிதி, கல்வி, ஆன்மீகம்.
   - தென்கிழக்கு (South-East): சுக்கிரன் (Venus) / கலை, ஆடை, உணவகம், அழகு சாதனங்கள்.
   - தென்மேற்கு (South-West): ராகு (Rahu) / வெளிநாடு, மென்பொருள், இறக்குமதி-ஏற்றுமதி.
   - வடமேற்கு (North-West): சந்திரன் (Moon) / பயணம், நீர், உணவு, திரவப் பொருட்கள்.
   10-ஆம் அதிபதி மற்றும் லக்னாதிபதியின் அமர்வு நிலைக்கு ஏற்ப எந்த திசை மிகவும் சாதகமானது என்பதை தெளிவாகப் பகுப்பாய்வு செய்து கூறவும்.

4. பதிலின் கட்டமைப்பு (Response Structure):
   அனைத்து பதில்களும் தெளிவான தலைப்புகள், புல்லட் பாயிண்டுகள் (Bullet Points) மற்றும் எளிய வாசிப்பு வடிவில் அழகாக வடிவமைக்கப்பட வேண்டும்:
   - 🌟 ஜாதக பொது அமைப்பு & பாவக ஆய்வு
   - 💼 உகந்த தொழில் / திருமண / வாழ்க்கை வாய்ப்புகள்
   - 🧭 உகந்த சாதகமான திசைகள் (திசை கேள்விக்கு)
   - ⏳ நடப்பு தசா - புக்தி சாதகக் காலம்
   - 🛕 நட்சத்திர பரிகார ஸ்தலம் & எளிய வழிபாட்டு முறை (Deity, Temple, Gayatri Mantra, Remedies)

5. நெறிமுறை விதிகள் (Ethical Astrological Guidelines):
   - உறுதியான எதிர்காலக் கூற்றைத் தவிர்க்கவும் ("இப்படி நடக்கும் சாத்தியம் வலுவாக உள்ளது" என்று வழிகாட்டவும்).
   - மருத்துவம் தொடர்பான கேள்விகளுக்கு: மருத்துவ ஆலோசனைக்குத் தகுதியான மருத்துவரை அணுக எப்போதும் அறிவுறுத்தவும்.
   - பதிலின் துவக்கம் அல்லது இறுதியில் "இது ஒரு ஜோதிட வழிகாட்டுதல் மட்டுமே (Guidance Only)." என்ற குறிப்பை சேர்க்கவும்.
INSTRUCTION;
}

/**
 * Loads authentic 27 Nakshatra Parigaram data
 */
function getNakshatraParigaramData(array $chart): ?array {
    $file = dirname(__DIR__) . '/data/parigaram_data.json';
    if (!file_exists($file)) return null;
    $list = json_decode(file_get_contents($file), true);
    if (!is_array($list)) return null;

    $nakNo = $chart['rasi']['nak_no'] ?? $chart['lagna']['nak_no'] ?? null;
    $nakName = trim($chart['rasi']['nakshatra'] ?? $chart['lagna']['nakshatra'] ?? '');

    if ($nakNo !== null && isset($list[$nakNo])) {
        return $list[$nakNo];
    }

    if (!empty($nakName)) {
        foreach ($list as $item) {
            if (strcasecmp($item['name_en'], $nakName) === 0 || mb_stripos($nakName, $item['nakshatram']) !== false || mb_stripos($item['nakshatram'], $nakName) !== false) {
                return $item;
            }
        }
    }
    return null;
}

/**
 * Extracts and cleans chart data into a clean, rich Vedic summary for prompt building.
 */
function cleanChartForPrompt(array $chart): string {
    $name = $chart['name'] ?? 'Native';
    $dob = $chart['dob'] ?? '-';
    $tob = $chart['tob'] ?? '-';
    $pob = $chart['pob'] ?? '-';

    $lagnaSign = $chart['lagna']['sign'] ?? '-';
    $lagnaDeg  = $chart['lagna']['degree'] ?? '-';
    $lagnaLord = $chart['lagna']['lord_name'] ?? $chart['lagna']['lord'] ?? '-';
    $lagnaNak  = $chart['lagna']['nakshatra'] ?? '-';
    $lagnaPada = $chart['lagna']['pada'] ?? 1;

    $rasiSign  = $chart['rasi']['sign'] ?? '-';
    $rasiDeg   = $chart['rasi']['degree'] ?? '-';
    $rasiLord  = $chart['rasi']['lord_name'] ?? $chart['rasi']['lord'] ?? '-';
    $rasiNak   = $chart['rasi']['nakshatra'] ?? '-';
    $rasiPada  = $chart['rasi']['pada'] ?? 1;

    $curDasha = $chart['dasha']['current']['name'] ?? $chart['dasha']['current']['planet'] ?? '-';
    $dashaEnd = $chart['dasha']['current']['end'] ?? '-';
    $curBhukti = $chart['dasha']['current']['bhukti']['name'] ?? $chart['dasha']['current']['bhukti']['planet'] ?? '-';
    $bhuktiEnd = $chart['dasha']['current']['bhukti']['end'] ?? '-';

    // Format Planet rows
    $plSummary = [];
    if (!empty($chart['planets']) && is_array($chart['planets'])) {
        foreach ($chart['planets'] as $p) {
            $retro = !empty($p['retro']) ? ' (Retrograde / வக்ரம்)' : '';
            $plSummary[] = "- {$p['name']}: {$p['sign']} ({$p['degree']}), {$p['house']}-ஆம் பாவம், நட்சத்திரம்: {$p['nakshatra']} (Lord: {$p['star_lord']}){$retro}";
        }
    }
    $plText = implode("\n", $plSummary);

    // Parigaram details
    $parigaram = getNakshatraParigaramData($chart);
    $parigaramText = '';
    if ($parigaram) {
        $parigaramText = <<<PARIGARAM

[அதிகாரப்பூர்வ நட்சத்திர பரிகார ஸ்தலம் & விவரங்கள் (Official Parigaram from Database)]:
- பிறப்பு நட்சத்திரம்: {$parigaram['nakshatram']} ({$parigaram['name_en']}) - அதிபதி: {$parigaram['lord']}
- பரிகாரக் கோவில் (Temple): {$parigaram['temple']}
- அமைவிடம் (Place): {$parigaram['temple_place']}
- கோவில் சிறப்புகள்: {$parigaram['temple_desc']}
- அதிதேவதை: {$parigaram['deity']}
- ஸ்தல விருட்சம் (Tree): {$parigaram['maram']} | மிருகம்: {$parigaram['mirugam']} | பறவை: {$parigaram['pakshi']}
- நட்சத்திர காயத்ரி மந்திரம்: {$parigaram['gayatri']}
- வழிபாட்டு பரிகாரம்: {$parigaram['remedy']}
PARIGARAM;
    }

    return <<<SUMMARY
[ஜாதகர் விவரங்கள்]:
- பெயர்: {$name} | பிறந்த தேதி: {$dob} | நேரம்: {$tob} | ஊர்: {$pob}
- லக்னம் (Ascendant): {$lagnaSign} ({$lagnaDeg}), அதிபதி: {$lagnaLord}, நட்சத்திரம்: {$lagnaNak} ({$lagnaPada}-ஆம் பாதம்)
- ராசி (Moon Sign): {$rasiSign} ({$rasiDeg}), அதிபதி: {$rasiLord}, நட்சத்திரம்: {$rasiNak} ({$rasiPada}-ஆம் பாதம்)
- நடப்பு தசை-புக்தி (Current Dasha-Bhukti): {$curDasha} தசை (முடிவு: {$dashaEnd}) - {$curBhukti} புக்தி (முடிவு: {$bhuktiEnd})

[கிரக நிலைகள் மற்றும் பாவகம் (Planets & Houses)]:
{$plText}
{$parigaramText}
SUMMARY;
}

function buildPrompt(array $chart, string $question, string $topic = 'general'): string {
    $cleanedChart = cleanChartForPrompt($chart);

    $topicGuidelines = [
        'parigaram' => "வாடிக்கையாளரின் கேள்வி பரிகாரம், கோவில் ஸ்தலம், காயத்ரி மந்திரம், தோஷ நிவர்த்தி மற்றும் வழிபாட்டு முறைகள் சார்ந்தது.\n"
                     . "மேலே கொடுக்கப்பட்டுள்ள அவர்களின் நட்சத்திர பரிகாரக் கோவில் பெயர், அமைவிடம், அதிதேவதை, விருட்சம், நட்சத்திர காயத்ரி மந்திரம் மற்றும் பரிகார முறையை முழுமையாகக் குறிப்பிட்டு, தோஷ நிவர்த்திக்கான தெளிவான வழிகாட்டலை வழங்கவும்.",

        'career' => "வாடிக்கையாளரின் கேள்வி தொழில், உத்தியோகம், வியாபாரம், திசைகள் மற்றும் வாழ்வாதாரம் சார்ந்தது.\n"
                  . "10-ஆம் பாவம் (தொழில் ஸ்தானம்), 10-ஆம் அதிபதி நிலை, 2-ஆம் பாவம் (தன ஸ்தானம்), 6-ஆம் பாவம் (உத்தியோகம்/சேவை), 11-ஆம் பாவம் (லாப ஸ்தானம்) மற்றும் நடப்பு தசா-புக்தியை அடிப்படையாகக் கொண்டு:\n"
                  . "1) என்ன மாதிரியான தொழில்/வேலை மிகச்சிறப்பாக அமையும்,\n"
                  . "2) எந்த திசை (வடக்கு, கிழக்கு, தெற்கு, மேற்கு) சாதகமாக இருக்கும் (கேள்வியில் திசை கேட்கப்பட்டால் விரிவாக),\n"
                  . "3) சுயதொழில் செய்யலாமா அல்லது வேலைக்குச் செல்லலாமா,\n"
                  . "4) நடப்பு தசா-புக்தியின் சாதக காலம் மற்றும் நட்சத்திர பரிகாரக் கோவில்/வழிபாட்டை முழுமையாக, விரிவாக விளக்கவும்.",

        'marriage' => "வாடிக்கையாளரின் கேள்வி திருமணம் மற்றும் குடும்ப வாழ்க்கை சார்ந்தது.\n"
                    . "7-ஆம் பாவம் (களத்திர ஸ்தானம்), 7-ஆம் அதிபதி, சுக்கிரன்/செவ்வாய் நிலை, செவ்வாய் தோஷ நிலை, திருமணத்திற்கான உகந்த காலம் மற்றும் நடப்பு தசா-புக்தி சாதகத்தை முழுமையாக விளக்கவும். பரிகாரக் கோவில் வழிபாட்டையும் இணைக்கவும்.",

        'health' => "வாடிக்கையாளரின் கேள்வி பொதுவான உடல்நலம் சார்ந்தது.\n"
                  . "லக்னாதிபதி, 6-ஆம் பாவம், சந்திரன் நிலையை வைத்து ஜோதிட ரீதியான சாத்தியங்களை மட்டுமே கூறவும். மருத்துவ ஆலோசனைக்கு மருத்துவரை அணுக வலியுறுத்தவும்.",

        'general' => "வாடிக்கையாளரின் கேள்விக்கு, லக்னம், ராசி, 10 கிரக நிலைகள், நடப்பு தசா-புக்தி மற்றும் நட்சத்திர பரிகாரக் கோவில் விவரங்களின் அடிப்படையில் ஆழ்ந்த, முழுமையான வேத ஜோதிட விளக்கத்தை தெளிவாக வழங்கவும்."
    ];

    $guide = $topicGuidelines[$topic] ?? $topicGuidelines['general'];

    return <<<PROMPT
கீழே கணக்கிடப்பட்ட ஜாதகக் குறிப்புகளை முழுமையாக ஆராயவும்:

{$cleanedChart}

--------------------------------------------------
வழிகாட்டல் பிரிவு: {$topic}
குறிப்பு:
{$guide}

--------------------------------------------------
வாடிக்கையாளரின் நேரடிக் கேள்வி:
"{$question}"

மேற்கண்ட கேள்விக்கு, விதிகளைப் பின்பற்றி முழுமையான, ஆழ்ந்த, முழு விவரங்கள் அடங்கிய முழுநீள பதிலை (Full-pledged response in Tamil with headings, bullet points, and Nakshatra Parigaram) வழங்கி முடிக்கவும்.
PROMPT;
}
