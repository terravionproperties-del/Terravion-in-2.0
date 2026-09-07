import type { CardTranslation } from "@/lib/content/translated";

/**
 * Hindi card text for every locality note.
 *
 * `title` is the place name and `excerpt` is the one-line epithet — the two
 * strings the locations listing shows. `cardAsOverlay` maps them onto `name`
 * and `epithet`, deliberately leaving `intro` alone, so the detail page keeps
 * its English opening paragraph until that body is translated in full.
 *
 * Place names are transliterated rather than left in Latin script: a Hindi
 * reader expects कोकापेट, not "Kokapet", and the Devanagari press sets
 * Hyderabad's localities in Devanagari as a matter of course. ORR stays Latin
 * — it is an initialism on every signboard.
 *
 * Distance and drive time are absent on purpose: they are structural, live on
 * the English master, and are looked up by slug at render time.
 */
export const cards: Record<string, CardTranslation> = {
  chevella: {
    title: "चेवेल्ला",
    excerpt: "उस सड़क के भरोसे क़ीमत पाती खेती की ज़मीन जो अभी बनी ही नहीं",
  },
  "financial-district": {
    title: "फ़ाइनेंशियल डिस्ट्रिक्ट",
    excerpt: "नानकरामगुडा का वह ग्रिड जो पश्चिम का ख़र्च उठाता है",
  },
  gachibowli: {
    title: "गचिबौली",
    excerpt: "वह चक्र जो अपना प्रतिफल दे चुका",
  },
  "hyderabad-west": {
    title: "पश्चिमी हैदराबाद",
    excerpt: "एक ही रेखा, उसी एक चक्र के अलग-अलग चरणों में पढ़ी गई",
  },
  kokapet: {
    title: "कोकापेट",
    excerpt: "वह नीलामी रिकॉर्ड जिसने पश्चिम के दाम फिर से लिखे",
  },
  kollur: {
    title: "कोल्लूर",
    excerpt: "बैरोमीटर, खरीद नहीं",
  },
  moinabad: {
    title: "मोइनाबाद",
    excerpt: "सप्ताहांत का देहात, साथ में केयरटेकरों की तनख़्वाह",
  },
  mokila: {
    title: "मोकिला",
    excerpt: "जहाँ स्कूल की दौड़ ही क़ीमत तय करती है",
  },
  narsingi: {
    title: "नार्सिंगी",
    excerpt: "जगह जल्दी ख़रीदी गई, और तब से उसकी क़ीमत चुकाई जा रही है",
  },
  "orr-corridor": {
    title: "ORR कॉरिडोर",
    excerpt: "158 किलोमीटर, चार चरणों में काम करते हुए",
  },
  patancheru: {
    title: "पटनचेरु",
    excerpt: "पुराना उद्योग, ठोस बुनियादी ढाँचा, और माँग का एक फ़र्श",
  },
  shankarpally: {
    title: "शंकरपल्ली",
    excerpt: "कॉरिडोर का आख़िरी क़स्बा जहाँ ज़मीन बड़े पैमाने पर बची है",
  },
  tellapur: {
    title: "तेल्लापुर",
    excerpt: "वह उपनगर जिसने साबित किया कि देरी सचमुच होती है",
  },
};
