import type { CardTranslation } from "@/lib/content/translated";

/**
 * Telugu card text for every locality note.
 *
 * `title` is the place name and `excerpt` is the one-line epithet — the two
 * strings the locations listing shows. `cardAsOverlay` maps them onto `name`
 * and `epithet`, deliberately leaving `intro` alone, so the detail page keeps
 * its English opening paragraph until that body is translated in full.
 *
 * Place names are transliterated rather than left in Latin script: a Telugu
 * reader expects కోకాపేట, not "Kokapet", and the Telugu press sets Hyderabad's
 * localities in the local script as a matter of course. ORR stays Latin — it
 * is an initialism on every signboard.
 *
 * Distance and drive time are absent on purpose: they are structural, live on
 * the English master, and are looked up by slug at render time.
 */
export const cards: Record<string, CardTranslation> = {
  chevella: {
    title: "చేవెళ్ల",
    excerpt: "ఇంకా కట్టని రోడ్డు ఆధారంగా ధర పలుకుతున్న వ్యవసాయ భూమి",
  },
  "financial-district": {
    title: "ఫైనాన్షియల్ డిస్ట్రిక్ట్",
    excerpt: "పశ్చిమానికి డబ్బు చెల్లించే నానక్‌రాంగూడ గ్రిడ్",
  },
  gachibowli: {
    title: "గచ్చిబౌలి",
    excerpt: "ఇప్పటికే ఫలితమిచ్చేసిన చక్రం",
  },
  "hyderabad-west": {
    title: "పశ్చిమ హైదరాబాద్",
    excerpt: "ఒకే గీత — ఒకే చక్రపు వేర్వేరు దశల్లో చదవాల్సినది",
  },
  kokapet: {
    title: "కోకాపేట",
    excerpt: "పశ్చిమానికి ధర తిరగరాసిన వేలం రికార్డు",
  },
  kollur: {
    title: "కొల్లూరు",
    excerpt: "కొనాల్సిన చోటు కాదు — కొలిచే బారోమీటరు",
  },
  moinabad: {
    title: "మొయినాబాద్",
    excerpt: "వారాంతపు పల్లె, దానికి జతగా కేర్‌టేకర్ల జీతాల చిట్టా",
  },
  mokila: {
    title: "మోకిల",
    excerpt: "స్కూలు ప్రయాణమే ధరను నిర్ణయించే చోటు",
  },
  narsingi: {
    title: "నార్సింగి",
    excerpt: "ముందుగానే కొన్న స్థానం, అప్పటి నుంచీ చెల్లిస్తూనే ఉన్న ధర",
  },
  "orr-corridor": {
    title: "ORR కారిడార్",
    excerpt: "158 కిలోమీటర్లు, నాలుగు దశల్లో పనిచేస్తూ",
  },
  patancheru: {
    title: "పటాన్‌చెరు",
    excerpt: "పాత పరిశ్రమ, గట్టి మౌలిక సదుపాయాలు, ఒక డిమాండ్ అడుగు",
  },
  shankarpally: {
    title: "శంకర్‌పల్లి",
    excerpt: "కారిడార్‌లో పెద్ద ఎత్తున భూమి మిగిలిన చివరి పట్టణం",
  },
  tellapur: {
    title: "తెల్లాపూర్",
    excerpt: "ఆలస్యం నిజమేనని రుజువు చేసిన శివారు",
  },
};
