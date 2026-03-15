export type BarberPresetCategory = "hairstyle" | "beard" | "combo";

export type BarberPresetGender = "male";

export type BarberPresetType = BarberPresetCategory;

export interface BarberPreset {
  id: string;
  category: BarberPresetCategory;
  type: BarberPresetType;
  gender: BarberPresetGender;
  name: string;
  nameHe: string;
  /** Customer-friendly Hebrew label; use for UI. Professional term stays in nameHe. */
  displayNameHe?: string;
  description: string;
  aiPrompt: string;
  barberInstruction: string;
  bestFor: string[];
  maintenanceLevel: "very-low" | "low" | "medium" | "high";
  vibe: string;
  /** Short, client-facing explanation shown near the result */
  resultUserText?: string;
  /** One-line summary the barber can quickly scan */
  resultBarberSummary?: string;
  /** Technical execution notes for barbers / future tooling */
  resultTechnicalNotes?: string[];
  /** Optional fun fact for loading/educational copy (Hebrew). */
  funFactHe?: string;
}

export const HAIRSTYLE_PRESETS: BarberPreset[] = [
  {
    id: "textured-crop",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Textured Crop",
    nameHe: "קרופ טקסטורה מודרני",
    displayNameHe: "קצר עם תנועה מלמעלה",
    description:
      "קרופ קצר עם טקסטורה בחלק העליון, לוק יומיומי נקי ומעוצב שמתאים לרוב צורות הפנים.",
    aiPrompt:
      "short textured crop on top with soft, natural movement, slightly messy but controlled, and clean tapered sides",
    barberInstruction:
      "צדדים בטייפר פייד עדין, לא לעבור עם מכונה גבוהה מדי כדי לשמור על רכות ומיזוג. למעלה להשאיר 2–3 ס״מ, לעבוד בגזירה בנקודות ליצירת טקסטורה, לא שורה ישרה. גימור עם פסטה מאט, להרים טיפה קדימה.",
    bestFor: ["פנים אובליות", "שיער ישר או גלי", "לוק יומיומי מודרני"],
    maintenanceLevel: "medium",
    vibe: "יומיומי נקי ומודרני",
    resultUserText: "קרופ טקסטורה נקי שמוסיף תנועה בלי להיראות מוגזם.",
    resultBarberSummary:
      "קרופ טקסטורה קצר עם טייפר פייד עדין בצדדים וגימור מאט טבעי.",
    resultTechnicalNotes: [
      "טייפר מאחורי האוזן ועל קו עורף במכונה נמוכה ומיזוג רך",
      "2–3 ס״מ בחלק העליון, גזירה בנקודות לטקסטורה",
      "קו מצח רך, לא חידוד אגרסיבי",
      "גימור פסטה מאט, ייבוש בכיוון קדימה-למעלה",
    ],
  },
  {
    id: "taper-fade",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Taper Fade",
    nameHe: "טייפר פייד קלאסי",
    displayNameHe: "פייד נקי עם מעבר רך",
    description:
      "טפר פייד נקי בצוואר ובצדדים, עם אורך נוח בחלק העליון לעיצוב יומיומי.",
    aiPrompt:
      "classic taper fade with a clean gradual fade around the ears and neckline, and a natural, not-too-short length on top that can be styled casually",
    barberInstruction:
      "טייפר נמוך סביב האוזניים וקו עורף, לא לרדת עד עור מלא. למעלה להשאיר אורך בינוני שמתלבש לבד, לשמור על קו חזית טבעי. מיזוג רך בין הצדדים לעליון.",
    bestFor: ["מראה נקי למשרד", "שיער בעובי בינוני", "לקוחות שמעדיפים עדינות ולא פייד עד עור"],
    maintenanceLevel: "low",
    vibe: "מסודר אבל לא מוגזם",
    resultUserText: "טייפר פייד רך שמנקה את הצוואר והאוזניים בלי להיראות קיצוני.",
    resultBarberSummary:
      "טייפר פייד נמוך עם מיזוג רך ואורך בינוני בחלק העליון לעיצוב חופשי.",
    resultTechnicalNotes: [
      "טייפר סביב אוזן וקו עורף במכונה 0.5–1 עם מיזוג",
      "עליון 3–5 ס״מ לפי צפיפות השיער",
      "קו חזית רך, לא קו סרגל",
      "עבודה עם מספריים במעבר בין עליון וצדדים",
    ],
  },
  {
    id: "slick-back",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Slick Back",
    nameHe: "סליק בק עסקי",
    displayNameHe: "משוך לאחור מסודר",
    description:
      "שיער משוך לאחור בסגנון קלאסי ונקי, מתאים ללוק אלגנטי ועסקי.",
    aiPrompt:
      "neat slick back with hair combed straight back, slight natural volume, no hard part, controlled shine, and clean tapered sides (not skin faded)",
    barberInstruction:
      "להשאיר 6–8 ס״מ בחלק העליון למשיכה לאחור, צדדים בטייפר/מספריים כדי לשמור על משקל. לעבוד עם פן לאחור וגימור פומדה או פסטה עם ברק בינוני, בלי שביל חד.",
    bestFor: ["אירועים", "לוק עסקי", "שיער חלק או גלי קל"],
    maintenanceLevel: "high",
    vibe: "עסקי ואלגנטי",
    resultUserText: "סליק בק נקי שנראה כמו יצאת עכשיו מהספר לפני פגישה חשובה.",
    resultBarberSummary:
      "סליק בק קלאסי עם טייפר בצדדים וגימור ברק בינוני, מתאים למנהלים.",
    resultTechnicalNotes: [
      "עליון 6–8 ס״מ, פן לאחור עם מברשת",
      "צדדים במספריים או מכונה גבוהה למיזוג רך",
      "שימוש בפומדה/קרם עם ברק בינוני",
      "גימור קווי מתאר עם גימור תער סביב קו המצח והאוזן",
    ],
  },
  {
    id: "french-crop",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "French Crop",
    nameHe: "קרופ צרפתי",
    displayNameHe: "קצר עם פרינג' קדמי",
    description:
      "קרופ קצר עם פוני ישר ועדין, מראה צעיר ונקי שמתאים לשיער דק או עבה.",
    aiPrompt:
      "French crop with a short textured top, soft straight fringe that slightly covers the forehead, and clean faded or tapered sides",
    barberInstruction:
      "חלק עליון קצר עם טקסטורה, לעבוד במספריים/מכונת טקסטורה. ליצור פוני ישר ורך שמגיע קצת מעל הגבות. בצדדים לעשות פייד בינוני או טפר, לפי מה שמתאים ללקוח.",
    bestFor: ["פנים ארוכות", "שיער דק עד בינוני", "מראה צעיר ועכשווי"],
    maintenanceLevel: "medium",
    vibe: "צעיר ואירופאי",
    resultUserText: "קרופ צרפתי שנותן מראה נקי ושיקי בלי הרבה מאמץ בבוקר.",
    resultBarberSummary:
      "קרופ קצר עם פוני רך וטקסטורה, פייד בינוני/טייפר בצדדים לפי מבנה הראש.",
    resultTechnicalNotes: [
      "עליון קצר עם גזירה בנקודות ליצירת טקסטורה",
      "פוני ישר ורך מעט מעל הגבה",
      "צדדים בפייד בינוני או טייפר, מיזוג רך",
      "מוצר גימור מאט או קל להפרדה עדינה של הטקסטורה",
    ],
  },
  {
    id: "buzz-cut",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Buzz Cut",
    nameHe: "באז קאט נקי",
    displayNameHe: "קצר מאוד ואחיד",
    description:
      "תספורת קצרה מאוד ואחידה, לוק פשוט ונקי שמדגיש את מבנה הפנים.",
    aiPrompt:
      "clean buzz cut with even, very short length all over, tidy edges, and a natural hairline",
    barberInstruction:
      "מכונה על כל הראש בגובה אחיד (למשל 1–3 לפי העדפה), מעבר רך בצוואר ובפאות. להקפיד על קווי מתאר נקיים סביב האוזניים והמצח, בלי חידוד מוגזם.",
    bestFor: ["תחזוקה נמוכה", "קיץ", "לקוחות שמעדיפים לוק מינימליסטי"],
    maintenanceLevel: "very-low",
    vibe: "מינימליסטי וספורטיבי",
    resultUserText: "באז קאט נקי שמרגיש קליל, קריר ופשוט לתחזוקה.",
    resultBarberSummary:
      "באז אחיד בכל הראש עם קווי מתאר נקיים ומעבר רך בצוואר ובפאות.",
    resultTechnicalNotes: [
      "בחירת גובה מכונה 1–3 לפי צפיפות וצורת ראש",
      "טשטוש קל בצוואר וקו עורף שלא ייראה מנותק",
      "קווי מתאר נקיים באוזן ובמצח, בלי חרטום עמוק מדי",
    ],
  },
  {
    id: "side-part",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Side Part",
    nameHe: "סייד פארט קלאסי",
    displayNameHe: "שביל צד מסודר",
    description:
      "שביל צדדי אלגנטי עם נפח עדין, לוק קלאסי שמתאים לעבודה ולאירועים.",
    aiPrompt:
      "clean side part with defined side parting, medium length on top combed neatly with a little volume, and tapered sides (not skin fade)",
    barberInstruction:
      "לקבוע שביל צד טבעי לפי כיוון הצמיחה. להשאיר אורך בינוני למעלה, לסרק עם נפח קל לצד. בצדדים לעבוד בטפר/מספריים, לשמור על קו רך ולא אגרסיבי.",
    bestFor: ["לוק רשמי", "משרדי הייטק", "אירועים משפחתיים"],
    maintenanceLevel: "medium",
    vibe: "קלאסי ונקי",
    resultUserText: "סייד פארט מסודר שנראה טוב גם בעבודה וגם באירוע.",
    resultBarberSummary:
      "שביל צד רך עם אורך בינוני למעלה וטייפר נקי בצדדים ובקו עורף.",
    resultTechnicalNotes: [
      "קביעת שביל לפי כיוון צמיחה, לא לייצר שביל מאולץ",
      "טייפר רך בצדדים ובקו עורף",
      "שימוש בכמות קטנה של פסטה מאט לנפח ורכות",
    ],
  },
  {
    id: "quiff",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Quiff",
    nameHe: "קוויף מודרני",
    displayNameHe: "נפח קדמי מורם",
    description:
      "נפח קדמי מורם עם צדדים נקיים, מתאים למי שאוהב לוק מלא ואופנתי.",
    aiPrompt:
      "modern quiff with lifted volume at the front, slightly back, and clean tapered or faded sides",
    barberInstruction:
      "להשאיר בחלק הקדמי יותר אורך (8–10 ס״מ), ליצור נפח בעזרת פן ומברשת. צדדים בפייד בינוני או טפר, תלוי בהעדפה. לסיים עם מוצר סטיילינג שנותן נפח ואחיזה בינונית.",
    bestFor: ["שיער עבה", "לוק ערב", "לקוחות שאוהבים לעבוד עם פן ומוצרי שיער"],
    maintenanceLevel: "high",
    vibe: "מודרני ודינמי",
    resultUserText: "קוויף מודרני עם נפח קדמי שנותן לוק נוכח ובולט.",
    resultBarberSummary:
      "קוויף עם נפח קדמי, פייד/טייפר בצדדים, דורש פן ומוצר סטיילינג יומיומי.",
    resultTechnicalNotes: [
      "עליון קדמי 8–10 ס״מ, יצירת נפח עם פן",
      "צדדים בפייד בינוני או טייפר עם מיזוג רך",
      "שימוש בפסטה מאט או קרם נפח לחיזוק הצורה",
    ],
  },
  {
    id: "ivy-league",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Ivy League",
    nameHe: "אייבי ליג אלגנטי",
    displayNameHe: "קצר מסודר בסגנון קולג'",
    description:
      "תספורת קולג׳ אמריקאית קלאסית, מסודרת אך לא קשוחה מדי, עם שביל רך.",
    aiPrompt:
      "Ivy League haircut with short sides and back in a soft fade or taper, and slightly longer hair on top that can be brushed to the side with a subtle part",
    barberInstruction:
      "בצדדים ובגב לעבוד בפייד עדין או טפר, לא קצר מדי. למעלה להשאיר אורך קצר-בינוני שמאפשר הברשה לצד, ליצור שביל רך ולא קו חד. לוק מסודר שמתאים לעבודה וליום-יום.",
    bestFor: ["לקוחות עסקיים", "מראה מסודר", "שיער ישר או מעט גלי"],
    maintenanceLevel: "medium",
    vibe: "קלאסי אקדמי",
    resultUserText: "אייבי ליג אלגנטי שנותן תחושה מסודרת בלי להיות נוקשה.",
    resultBarberSummary:
      "תספורת קולג׳ – צדדים בטייפר רך, עליון קצר-בינוני עם שביל רך.",
    resultTechnicalNotes: [
      "פייד עדין או טייפר בצדדים ובגב",
      "שביל רך, לא קו חד עם תער",
      "ייבוש לכיוון הצד עם מעט מוצר להחזקה קלה",
    ],
  },
  {
    id: "crew-cut",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Crew Cut",
    nameHe: "קרו קאט ספורטיבי",
    displayNameHe: "קצר ספורטיבי עם טיפה למעלה",
    description:
      "תספורת קצרה וספורטיבית עם טיפה אורך בקדמת הראש, לוק נקי וקל לתחזוקה.",
    aiPrompt:
      "crew cut with short sides and back and a slightly longer, square-shaped top that follows the head shape",
    barberInstruction:
      "צדדים קצרים (למשל 1–2) עם מעבר רך למעלה. בחלק העליון להשאיר אורך מעט יותר גבוה וליצור צורה ישרה ונקייה. מתאים ללקוחות שרוצים לוק ספורטיבי ונקי בלי הרבה סטיילינג.",
    bestFor: ["ספורטאים", "קיץ", "לקוחות שרוצים משהו קצר אבל לא באז קאט"],
    maintenanceLevel: "low",
    vibe: "ספורטיבי ופשוט",
    resultUserText: "קרו קאט קצר ונקי שנשאר במקום גם באימון.",
    resultBarberSummary:
      "קרו קאט עם עליון מעט ארוך יותר, מעבר רך מצדדים לראש.",
    resultTechnicalNotes: [
      "צדדים במכונה 1–2 עם מיזוג לעליון",
      "עליון מעוצב לצורה ישרה ואחידה",
      "קווי מתאר נקיים סביב האוזן והמצח",
    ],
  },
  {
    id: "clean-fade",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Clean Fade",
    nameHe: "קלין פייד חד",
    displayNameHe: "פייד חד עד העור",
    description:
      "פייד נקי וחד בצדדים, עם חלק עליון מסודר, לוק מאוד מוקפד ומודרני.",
    aiPrompt:
      "clean, sharp fade with skin or very short fade on the sides, smooth blend, and a tidy, slightly longer top styled forward or up",
    barberInstruction:
      "פייד גבוה או בינוני לפי הראש, לרדת כמעט לעור ולהעלות במעבר נקי וחלק. למעלה לשמור על אורך שמאפשר סטיילינג קדימה או למעלה. להקפיד על קווי מתאר חדים במצח ובזיפים.",
    bestFor: ["לוק אורבני", "לקוחות שאוהבים קווים חדים", "שיער עבה"],
    maintenanceLevel: "medium",
    vibe: "חד מודרני",
    resultUserText: "קלין פייד חד שנותן מסגרת חדה לפנים ולזקן.",
    resultBarberSummary:
      "פייד גבוה/בינוני עד עור, עליון קצר-בינוני, קווי מתאר חדים עם גימור תער.",
    resultTechnicalNotes: [
      "פייד עד עור בצדדים עם מיזוג קפדני",
      "קווי לחי וקו עורף נקיים",
      "גימור תער במצח ובפאות לפי רגישות העור",
    ],
  },
  {
    id: "gentleman-fade",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Gentleman Fade",
    nameHe: "פייד ג'נטלמן",
    displayNameHe: "פייד רך ומסודר",
    description:
      "פייד נקי ולא קיצוני עם חלק עליון מסודר, לוק גבר-ג'נטלמן שמתאים לכל מצב.",
    aiPrompt:
      "soft gentleman fade with low-to-mid fade, smooth blending, and a tidy, combed top that works for formal or casual looks",
    barberInstruction:
      "פייד נמוך-בינוני, לא עד עור, לשמור על מיזוג חלק. למעלה להשאיר אורך שמאפשר סירוק לצד או לאחור. קווים נקיים אבל לא אגרסיביים.",
    bestFor: ["אירועים", "משרדים", "לקוחות שרוצים לוק אלגנטי ולא צעקני"],
    maintenanceLevel: "medium",
    vibe: "ג'נטלמן אלגנטי",
    resultUserText: "פייד ג׳נטלמן נקי שנראה טוב גם בחליפה וגם בג׳ינס.",
    resultBarberSummary:
      "פייד רך ונמוך עם עליון מסודר, מתאים כלוק גמיש בין יומיומי ועסקי.",
    resultTechnicalNotes: [
      "פייד נמוך עם שמירה על מעט משקל בצדדים",
      "מיזוג מדויק בין מכונה למספיק אורך במספריים",
      "ייבוש לכיוון הצד/אחורה עם מוצר עדין",
    ],
  },
  {
    id: "messy-crop",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Messy Crop",
    nameHe: "קרופ מרושל",
    displayNameHe: "קצר מרושל-מבוקר",
    description:
      "קרופ קצר עם מראה מרושל-מבוקר, יושב טוב גם אחרי יום ארוך בלי הרבה סידור.",
    aiPrompt:
      "messy textured crop with choppy, uneven texture on top, relaxed slightly disheveled finish, and tapered or softly faded sides",
    barberInstruction:
      "ליצור טקסטורה אגרסיבית יותר בחלק העליון בגזירה בנקודות, לא ליישר מדי. צדדים בטייפר/פייד נמוך. לייבש עם ידיים ומוצר מאט שנותן תנועה.",
    bestFor: ["לקוחות צעירים", "שיער עבה או גלי", "לוק רחוב קליל"],
    maintenanceLevel: "low",
    vibe: "רחוב מרושל-מבוקר",
    resultUserText: "קרופ מרושל שנראה טוב גם כשאתה לא עומד מול המראה.",
    resultBarberSummary:
      "קרופ קצר עם טקסטורה מרושלת, טייפר בצדדים, גימור מאט עם תנועה.",
    resultTechnicalNotes: [
      "גזירה בנקודות עמוקה ליצירת שכבות קצרות",
      "טייפר נמוך בצדדים ובקו עורף",
      "ייבוש באצבעות, לא במברשת, עם פסטה מאט",
    ],
  },
  {
    id: "undercut",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Undercut",
    nameHe: "אנדרקאט נקי",
    displayNameHe: "צדדים קצרים, למעלה ארוך",
    description:
      "אנדרקאט עם ניתוק ברור בין חלק עליון ארוך לצדדים קצרים, לוק מודגש ובולט.",
    aiPrompt:
      "undercut with very short or faded sides and a clear disconnect from a longer top that can be slicked back or worn textured",
    barberInstruction:
      "צדדים קצרים במכונה/פייד, ליצור ניתוק ברור מהעליון. למעלה להשאיר אורך משמעותי (7–10 ס״מ) לסליק בק או טקסטורה. קווי מתאר נקיים סביב הניתוק.",
    bestFor: ["לקוחות שאוהבים ניתוק חד", "שיער עבה", "סטייל רחוב/אורבני"],
    maintenanceLevel: "high",
    vibe: "מודגש ובועט",
    resultUserText: "אנדרקאט חד שנותן לוק נוכח ומדויק גם מרחוק.",
    resultBarberSummary:
      "אנדרקאט עם ניתוק ברור בין עליון ארוך לצדדים קצרים/פייד.",
    resultTechnicalNotes: [
      "קביעת קו ניתוק ברור סביב הראש",
      "צדדים בפייד/מכונה קצרה, עליון במספריים בלבד",
      "החלקת הניתוק עם גימור תער לפי הצורך",
    ],
  },
  {
    id: "curl-top-fade",
    category: "hairstyle",
    type: "hairstyle",
    gender: "male",
    name: "Curl Top Fade",
    nameHe: "קרל טופ פייד",
    displayNameHe: "תלתלים למעלה, פייד בצדדים",
    description:
      "פייד נקי בצדדים עם תלתלים מודגשים בחלק העליון, לוק מושלם לבעלי שיער מתולתל.",
    aiPrompt:
      "curl top fade with a clean fade on the sides and defined, moisturized curls on top, preserving the natural curl pattern",
    barberInstruction:
      "פייד בינוני/גבוה בצדדים, לשמור על מספיק משקל מתחת לתלתל. למעלה לעבוד עם מספריים/סירוק אצבע להשארת תלתלים מלאים. לסיים עם קרם תלתלים ולא מוצר כבד.",
    bestFor: ["שיער מתולתל", "לקוחות שרוצים להדגיש את התלתלים", "סטייל מודרני"],
    maintenanceLevel: "medium",
    vibe: "תלתלי וטרנדי",
    resultUserText: "קרל טופ פייד שמנקה את הצוואר ומשאיר את התלתלים במרכז.",
    resultBarberSummary:
      "פייד עם דגש על תלתלים מלאים למעלה, שימור תנועת השיער הטבעית.",
    resultTechnicalNotes: [
      "פייד נקי בצדדים, בחירת גובה לפי גולגולת",
      "עליון – לא לדלל יותר מדי את התלתל",
      "שימוש בקרם/מוס תלתלים, לא ג׳ל קשיח",
    ],
  },
];

export const BEARD_PRESETS: BarberPreset[] = [
  {
    id: "stubble",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Stubble",
    nameHe: "זיפים קצרים",
    displayNameHe: "זיפים עדינים",
    description:
      "זיפים עדינים שמדגישים את קו הלסת בלי להיראות כמו זקן מלא.",
    aiPrompt:
      "light stubble with short, even facial hair that follows the natural beard lines without heavy bulk",
    barberInstruction:
      "להשאיר זיפים קצרים במכונה 0.5–1 על כל הפנים, לנקות קו לחיים וצוואר לפי הצורה הטבעית. מתאים למי שרוצה לוק מטופח אבל לא זקן מלא.",
    bestFor: ["לקוחות עם זקן שצומח מהר", "מראה יומיומי נקי", "משרדים"],
    maintenanceLevel: "low",
    vibe: "נקי ולא מחייב",
    resultUserText: "זיפים קצרים שמדגישים את קו הלסת בלי להיראות כמו זקן מלא.",
    resultBarberSummary:
      "זיפים קצרים בגובה 0.5–1 עם ניקוי קו לחי וקו צוואר רך.",
    resultTechnicalNotes: [
      "מכונה 0.5–1 עם כיוון הצמיחה",
      "ניקוי קו לחי בהתאם לצמיחה הטבעית",
      "קו צוואר רך מעל תפוח גרון",
    ],
  },
  {
    id: "heavy-stubble",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Heavy Stubble",
    nameHe: "זיפים מלאים",
    displayNameHe: "זקן שלושה ימים",
    description:
      "זיפים מלאים ועבים שממלאים את הפנים בלי להגיע לזקן מלא, לוק גברי ורך.",
    aiPrompt:
      "heavy stubble with thicker, fuller coverage on cheeks, jawline and mustache, and clean cheek and neck lines",
    barberInstruction:
      "מכונה בגובה 1.5–2 על כל הזקן, לעצב קו לחיים ברור אבל לא מרובע מדי, לנקות את הצוואר מתחת לקו הלסת. מתאים למי שרוצה זקן 'שלושה ימים' מודגש.",
    bestFor: ["פנים דקות", "הדגשת קו לסת", "לוק גברי לא מחייב"],
    maintenanceLevel: "medium",
    vibe: "גברי ורך",
    resultUserText: "זיפים מלאים שממלאים את הפנים ויוצרים קו לסת חד יותר.",
    resultBarberSummary:
      "זיפים מלאים בגובה 1.5–2, קו לחי נקי וקו צוואר מוגדר.",
    resultTechnicalNotes: [
      "אחידות אורך עם מסרק דרגה 1.5–2",
      "קו לחי מעט אלכסוני, לא מרובע מדי",
      "ניקוי צוואר עד קו הלסת בגימור תער לפי הצורך",
    ],
  },
  {
    id: "short-boxed-beard",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Short Boxed Beard",
    nameHe: "זקן קצר ומדויק",
    displayNameHe: "זקן קצר עם קווים נקיים",
    description:
      "זקן קצר ומוגדר היטב, עם קווי מתאר נקיים סביב הלחיים והצוואר.",
    aiPrompt:
      "short boxed beard with evenly trimmed short length, sharp clean cheek lines, and a defined neckline following the jaw",
    barberInstruction:
      "להשאיר את הזקן קצר ואחיד (2–3), לצייר קו לחיים נקי שמתאים לפנים, לנקות צוואר גבוה עד קו הלסת. חיבור חלק עם השפם ולסיים עם מספריים על שיער סורר.",
    bestFor: ["לקוחות עסקיים", "פנים עגולות", "לוק מסודר ומוקפד"],
    maintenanceLevel: "medium",
    vibe: "מסודר וחד",
    resultUserText: "זקן קצר ומדויק שמרגיש מטופח בלי להיות כבד מדי.",
    resultBarberSummary:
      "זקן קצר אחיד בגובה 2–3, קווי לחי וצוואר חדים עם גימור תער נקי.",
    resultTechnicalNotes: [
      "אחידות אורך עם מסרק 2–3",
      "קו לחי חד אך מתאים לצורת הפנים",
      "קו צוואר גבוה על קו הלסת",
      "שימוש במספריים על נקודות בולטות",
    ],
  },
  {
    id: "full-beard",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Full Beard",
    nameHe: "זקן מלא מטופח",
    displayNameHe: "זקן מלא ועבה",
    description:
      "זקן מלא ועבה, מעוצב ונקי בקצוות, מראה חזק אך מקצועי שמתאים לעבודה.",
    aiPrompt:
      "full, dense beard with well-groomed even length, rounded corners, clean cheeks, and a shaped neckline",
    barberInstruction:
      "לא לקצר מדי את האורך – רק לאזן ולסדר צורה. ליישר את הזקן בקו כללי שמתאים לצורת הפנים, לעגל פינות ולא להשאיר זוויות חדות מדי. לנקות לחיים וצוואר ולבדוק סימטריה מכל הכיוונים.",
    bestFor: ["פנים ארוכות", "לקוחות עם צמיחה מלאה", "לוק בולט ומאוזן"],
    maintenanceLevel: "medium",
    vibe: "זקן מלא ומאוזן",
    resultUserText: "זקן מלא ומטופח שנראה חזק אבל עדיין נשאר מקצועי.",
    resultBarberSummary:
      "זקן מלא מעוגל, איזון אורך וגזרה לפי צורת הפנים, ניקוי קווי מתאר.",
    resultTechnicalNotes: [
      "עבודה במסרק ומכונה לשמירה על נפח מאוזן",
      "קווי לחי רכים, לא מרובעים",
      "קו צוואר ברור אך לא גבוה מדי",
      "המלצה לשמן זקן לריכוך וסיום",
    ],
  },
  {
    id: "corporate-beard",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Corporate Beard",
    nameHe: "זקן עסקי קצר",
    displayNameHe: "זקן מסודר למשרד",
    description:
      "זקן בינוני ומסודר שמתאים למשרד – לא קצר מדי ולא פראי מדי.",
    aiPrompt:
      "neat corporate beard with medium-short length, tidy shape, and clean cheek and neck lines without wild volume",
    barberInstruction:
      "להשאיר אורך בינוני (3–4), לעבוד במסרק ומכונה כדי לשמור על נפח מאוזן. קווי מתאר נקיים בלחיים ובצוואר, לשמור על מראה מקצועי בלי להיראות אגרסיבי מדי.",
    bestFor: ["עבודה במשרד", "לקוחות שפוגשים קהל", "מראה בוגר ומסודר"],
    maintenanceLevel: "medium",
    vibe: "עסקי ומטופח",
    resultUserText: "זקן עסקי קצר שנראה מטופח ואלגנטי מול לקוחות ובמשרד.",
    resultBarberSummary:
      "זקן בגובה 3–4, קווי לחי וצוואר נקיים, נפח מאוזן למראה מקצועי.",
    resultTechnicalNotes: [
      "אורך אחיד סביב 3–4 עם מסרק ומסרק זקן",
      "קו לחי ישר אך לא אגרסיבי",
      "ניקוי קו צוואר עד קו הלסת",
      "המלצה על שמן זקן/באלם להברקה קלה וסידור",
    ],
  },
  {
    id: "clean-shaven",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Clean-Shaven",
    nameHe: "מגולח נקי",
    displayNameHe: "מגולח לגמרי",
    description:
      "פנים מגולחות לגמרי, מראה צעיר ורענן שמדגיש את תווי הפנים הטבעיים.",
    aiPrompt:
      "smooth, clean-shaven face with all facial hair removed while preserving natural skin texture",
    barberInstruction:
      "להוריד את הזקן עם מכונה קרובה ולאחר מכן סכין/פוליש לפי רגישות העור. לעבוד עם כיוון הצמיחה ולאחר מכן נגדו, להשתמש בקרם/ג׳ל הרגעה לסיום.",
    bestFor: ["מראה צעיר", "אירועים רשמיים", "לקוחות שמעדיפים מינימום תחזוקה בזקן"],
    maintenanceLevel: "low",
    vibe: "נקי וחד",
    resultUserText: "מראה מגולח נקי שמדגיש את תווי הפנים הטבעיים.",
    resultBarberSummary:
      "גילוח מלא במכונה ותער לפי הצורך, סיום עם מוצר הרגעה לעור.",
    resultTechnicalNotes: [
      "קיצור במכונה ללא מסרק לפני תער",
      "עבודה עם כיוון הצמיחה ואז נגדו באזורים חזקים",
      "שימוש בג׳ל/קרם גילוח איכותי וג׳ל הרגעה לסיום",
    ],
  },
  {
    id: "designer-stubble",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Designer Stubble",
    nameHe: "סטאבל דיזיינר",
    displayNameHe: "זיפים קצרים ומסודרים",
    description:
      "זיפים מעוצבים עם קווי מתאר חדים, לוק אינסטגרמי שמרגיש עדיין טבעי.",
    aiPrompt:
      "designer stubble with sharp cheek and neck lines and slightly longer stubble on the jaw and mustache for a clean, photogenic look",
    barberInstruction:
      "זיפים בגובה 1–2 באזור הזקן, ניקוי קו לחי מדויק וקו צוואר חד. להשתמש בגימור תער באזורי הקצה לקבלת קווים נקיים.",
    bestFor: ["פיד אינסטגרם", "לקוחות שמצלמים הרבה סטוריז", "לוק גברי חד"],
    maintenanceLevel: "high",
    vibe: "חד וצילומי",
    resultUserText: "סטאבל דיזיינר חד שמרגיש כמו פילטר טוב במציאות.",
    resultBarberSummary:
      "זיפים מעוצבים עם קווי לחי וצוואר חדים, גימור תער לניקיון מקסימלי.",
    resultTechnicalNotes: [
      "אורך זיפים 1–2, לשמור על אחידות באזור הזקן",
      "שרטוט קו לחי חד בהתאם למבנה הפנים",
      "גימור תער בקווי המתאר והאף-שפם",
    ],
  },
  {
    id: "square-short-beard",
    category: "beard",
    type: "beard",
    gender: "male",
    name: "Square Short Beard",
    nameHe: "זקן קצר מרובע",
    displayNameHe: "זקן קצר שמוסיף קו לסת",
    description:
      "זקן קצר עם צורה מרובעת מודגשת, מחזק את קו הלסת ונותן נוכחות.",
    aiPrompt:
      "short, square-shaped beard with strong jawline emphasis and straight, angular outline, kept neat and realistic",
    barberInstruction:
      "אורך קצר-בינוני בקליפר 2–3, לעצב צורה מרובעת סביב קו הלסת. להקפיד על קו לחי וקו צוואר ישרים יותר, אבל לא מוגזמים מדי. גימור תער בפינות.",
    bestFor: ["פנים עגולות", "מי שרוצה לחזק קו לסת", "לוק חזק ומסודר"],
    maintenanceLevel: "medium",
    vibe: "חד ומובנה",
    resultUserText: "זקן קצר מרובע שמחדד את קו הלסת ונותן נוכחות ברורה.",
    resultBarberSummary:
      "זקן קצר עם צורה מרובעת מודגשת, קווי מתאר ישרים יותר וגימור תער.",
    resultTechnicalNotes: [
      "אורך אחיד 2–3 עם מסרק זקן",
      "קווי לחי וצוואר ישרים יותר, לוודא סימטריה",
      "תשומת לב מיוחדת לפינות הזקן עם תער",
    ],
  },
];

export const COMBO_PRESETS: BarberPreset[] = [
  {
    id: "executive-look",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Executive",
    nameHe: "הלוק העסקי",
    displayNameHe: "מנהלים – מסודר לחדר ישיבות",
    description:
      "לוק מנהלים נקי: תספורת מסודרת עם זקן קצר ומדויק שמתאים לחדר ישיבות.",
    aiPrompt:
      "tidy side-part or Ivy League style haircut with clean tapered sides, paired with a short boxed, well-defined corporate beard for a premium boardroom-ready look",
    barberInstruction:
      "תספורת בסגנון סייד פארט/אייבי ליג מסודר, צדדים בטפר נקי, למעלה אורך שמאפשר הברשה לצד. זקן קצר ומדויק, קווי מתאר ברורים בלחיים ובצוואר. לשמור על מראה אלגנטי ומקצועי שמתאים ללקוח מנהלים.",
    bestFor: ["מנהלים", "לקוחות עסקיים", "פגישות חשובות"],
    maintenanceLevel: "medium",
    vibe: "עסקי ואלגנטי",
    resultUserText: "לוק עסקי נקי שמשלב תספורת מסודרת עם זקן קצר ומדויק.",
    resultBarberSummary:
      "סייד פארט/אייבי ליג עם זקן קצר קלאסי למשרד, קווי מתאר נקיים.",
    resultTechnicalNotes: [
      "תספורת סייד פארט/אייבי ליג עם טייפר בצדדים",
      "זקן קצר בגובה 2–3 עם קווי לחי וצוואר חדים",
      "גימור תער עדין בקווי המתאר לפי הצורך",
    ],
  },
  {
    id: "barbers-choice",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Barber's Choice",
    nameHe: "בחירת הספר",
    displayNameHe: "המלצת הספר – מאוזן ומושלם",
    description:
      "סט לוק מאוזן שהרבה ספרים אוהבים להמליץ עליו – תספורת נקייה עם זקן מטופח.",
    aiPrompt:
      "clean textured crop or short quiff with a soft fade, combined with a short boxed beard with clean lines for a balanced modern barbershop look",
    barberInstruction:
      "להתאים לראש תספורת טקסטורד קרופ/קוויף קצר עם פייד נקי בצדדים. זקן קצר ומדויק, לא כבד מדי. לכוון את כל הלוק כך שיהיה גם פוטוגני וגם פרקטי ליום-יום.",
    bestFor: ["לקוחות שמתלבטים", "לוק ברירת מחדל מוצלח", "שיער בזיפים בינוניים"],
    maintenanceLevel: "medium",
    vibe: "מאוזן וברברי",
    resultUserText:
      "סט לוק מאוזן שהרבה ספרים אוהבים להמליץ עליו – תספורת נקייה עם זקן קצר.",
    resultBarberSummary:
      "קרופ/קוויף קצר עם פייד רך וזקן קצר, לוק ברירת מחדל חכם ללקוח מתלבט.",
    resultTechnicalNotes: [
      "בחירת קרופ טקסטורה או קוויף לפי שיער וראש",
      "פייד נקי בצדדים, לא חייב עד עור",
      "זקן קצר קופסה רכה בגובה 2–3",
    ],
  },
  {
    id: "street-king",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Street King",
    nameHe: "סטייל רחוב",
    displayNameHe: "סטייל רחוב – פייד וזקן בולט",
    description:
      "לוק רחוב מודרני: פייד חד, חלק עליון מלא וזקן מודגש שמייצר נוכחות.",
    aiPrompt:
      "street-style look with a clean high fade or sharp clean fade and strong shape on top, paired with a full or heavy stubble beard with crisp lines for a bold, modern urban vibe",
    barberInstruction:
      "פייד גבוה וחד בצדדים, למעלה לשמור על צורה ברורה – קו מוגדר עם נפח. זקן מלא/זיפים מלאים עם קווי מתאר חדים בלחיים ובצוואר. לוק שממש בולט ברחוב ובפיד באינסטגרם.",
    bestFor: ["סטייל רחוב", "פיד חברתי", "לקוחות שאוהבים לוק בולט"],
    maintenanceLevel: "high",
    vibe: "רחוב חד ובולט",
    resultUserText: "פייד חד עם זקן מודגש – לוק רחוב שמצטלם פצצה.",
    resultBarberSummary:
      "פייד גבוה עד עור, עליון מוגדר וזקן מלא/זיפים מלאים עם קווי מתאר חדים.",
    resultTechnicalNotes: [
      "פייד גבוה עד עור עם מיזוג מדויק",
      "עיצוב עליון עם צורה מוגדרת ונפח",
      "זקן מלא או זיפים כבדים עם קו לחי חד",
    ],
  },
  {
    id: "clean-professional",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Clean Professional",
    nameHe: "המקצועי הנקי",
    displayNameHe: "נקי למשרד – בלי דרמה",
    description:
      "לוק נקי למשרד: תספורת מסודרת עם זיפים או מגולח, ללא דרמה מיותרת.",
    aiPrompt:
      "clean professional look with a neat taper fade or crew cut with soft edges, and either short stubble or fully clean-shaven beard with very tidy lines for an understated, highly professional appearance",
    barberInstruction:
      "תספורת קלאסית – טפר פייד/קרו קאט מסודר, בלי קצוות אגרסיביות. לבחור בין זיפים קצרים מאוד לבין מגולח לגמרי, עם קווי מתאר נקיים. מתאים במיוחד לעובדי משרד ולקוחות שפוגשים קהל.",
    bestFor: ["משרדים", "ראיונות עבודה", "לקוחות שמעדיפים מראה שקט"],
    maintenanceLevel: "low",
    vibe: "שקט ומקצועי",
    resultUserText: "לוק נקי למשרד – תספורת מסודרת עם זיפים עדינים או מגולח.",
    resultBarberSummary:
      "טייפר פייד/קרו קאט מסודר וזיפים קצרים או גילוח מלא, מראה מקצועי.",
    resultTechnicalNotes: [
      "טייפר רך או קרו קאט קצר",
      "בחירה בין זיפים קצרים לגילוח מלא",
      "קווי מתאר נקיים בלי דרמה",
    ],
  },
  {
    id: "everyday-fresh",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Everyday Fresh",
    nameHe: "הלוק היומיומי",
    displayNameHe: "יומיומי רענן – קל לסדר",
    description:
      "לוק נוח ליומיום: תספורת שקל לסדר בבוקר עם זקן נעים לעין ולא כבד מדי.",
    aiPrompt:
      "everyday fresh look with a textured crop, taper fade or short quiff that falls naturally into place, and light or heavy stubble with soft, natural lines for a fresh, low-maintenance feel",
    barberInstruction:
      "לבחור תספורת שקל לסדר – קרופ טקסטורד או קוויף קצר עם טפר עדין. בזקן לעבוד עם זיפים קצרים/מלאים, לשמור על קו רך שלא דורש תחזוקה יומיומית. לוק שמתאים גם לשישי וגם למשרד.",
    bestFor: ["לקוחות עסוקים", "תחזוקה נמוכה", "יומיום ישראלי"],
    maintenanceLevel: "low",
    vibe: "יומיומי רענן",
    resultUserText: "לוק יומיומי פרש שמתאים גם למשרד וגם לבירה עם החבר׳ה.",
    resultBarberSummary:
      "קרופ טקסטורה/קוויף קצר עם טייפר רך וזיפים מעוצבים ברכות.",
    resultTechnicalNotes: [
      "בחירת תספורת שקל לסידור עצמי",
      "טייפר רך שאינו דורש ביקור תכוף",
      "זיפים קצרים/מלאים עם קו לחי רך",
    ],
  },
  {
    id: "sports-edition",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Sports Edition",
    nameHe: "לוק ספורטיבי",
    displayNameHe: "ספורטיבי – נשאר חד באימון",
    description:
      "לוק ספורטיבי: תספורת קצרה וזקן קל שמחזיק טוב באימון וביום עמוס.",
    aiPrompt:
      "athletic look with a short crew cut or buzz-style fade that stays sharp during workouts, and short stubble or clean-shaven beard for a sporty, dynamic feel",
    barberInstruction:
      "תספורת קצרה – קרו קאט/באז משודרג עם מעבר נקי בצדדים. בזקן לבחור זיפים קצרים או גילוח מלא כדי שלא ירגיש כבד באימונים. לוק פרקטי שמתאים לחדר כושר, ריצה ויום עמוס.",
    bestFor: ["ספורטאים", "מתאמנים קבועים", "קיץ וחום ישראלי"],
    maintenanceLevel: "very-low",
    vibe: "ספורטיבי וקליל",
    resultUserText: "לוק ספורטיבי שנשאר חד גם אחרי אימון וזיעה.",
    resultBarberSummary:
      "קרו קאט/באז עם מעבר נקי וזיפים קצרים או גילוח מלא לנוחות באימונים.",
    resultTechnicalNotes: [
      "תספורת קצרה מאוד לנוחות בזיעה וכובע",
      "זיפים קצרים או גילוח מלא לפי העדפה",
      "קווי מתאר פשוטים שקל לשמור לבד בבית",
    ],
  },
  {
    id: "israeli-modern",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "The Israeli Modern",
    nameHe: "הישראלי המודרני",
    displayNameHe: "ישראלי מודרני – טבעי ומטופח",
    description:
      "לוק ישראלי מודרני: תספורת קצרה עם טייפר נקי וזקן קליל שמרגיש טבעי.",
    aiPrompt:
      "modern Israeli everyday look with a short textured crop or taper fade that feels effortless, and light or heavy stubble with soft, natural lines",
    barberInstruction:
      "טייפר פייד נקי בצדדים, חלק עליון קצר עם טקסטורה קלה. בזקן לעבוד עם זיפים קצרים/מלאים רכים, בלי קווי מתאר אגרסיביים מדי. לוק שמתאים לקפה בשכונה ולעבודה במשרד.",
    bestFor: ["לקוחות צעירים", "הייטקיסטים", "יומיום בעיר"],
    maintenanceLevel: "medium",
    vibe: "ישראלי מודרני",
    resultUserText: "הישראלי המודרני – תספורת קצרה וזקן רך שנראים טבעי ומטופח.",
    resultBarberSummary:
      "טייפר קצר עם טקסטורה מעל, זיפים רכים עם קווי מתאר עדינים.",
    resultTechnicalNotes: [
      "טייפר בצדדים ובקו עורף בגובה נמוך-בינוני",
      "טקסטורה קלה מעל לגמישות סטיילינג",
      "זיפים בגובה 1–2 עם קווי לחי טבעיים",
    ],
  },
  {
    id: "razor-sharp",
    category: "combo",
    type: "combo",
    gender: "male",
    name: "Razor Sharp",
    nameHe: "החד כתער",
    displayNameHe: "חד ומדויק – קווים מושלמים",
    description:
      "לוק חד ומדויק: פייד עד עור עם קווי מתאר חדים וזקן מעוצב בקפידה.",
    aiPrompt:
      "razor-sharp look with a sharp skin fade, precise lines and defined shape on top, and a short, very clean boxed beard with razor-sharp cheek and neck lines",
    barberInstruction:
      "פייד עד עור בצדדים עם מיזוג מדויק, עליון קצר-בינוני עם צורה ברורה. זקן קצר ומרובע, קווי לחי וצוואר עם גימור תער. לוק שמתאים למי שאוהב קווים חדים.",
    bestFor: ["לקוחות שמחפשים חדות", "צילום מקצועי", "אירועים מיוחדים"],
    maintenanceLevel: "high",
    vibe: "חד ואגרסיבי",
    resultUserText: "החד כתער – תספורת וזקן שמצוירים בדיוק על מילימטר.",
    resultBarberSummary:
      "פייד עד עור וזקן קצר מרובע עם גימור תער מלא בקווי המתאר.",
    resultTechnicalNotes: [
      "פייד עד עור בצדדים ובאחורי הראש עם מיזוג גבוה",
      "עליון קצר ומוגדר, קווי מצח חדים",
      "זקן קצר מרובע עם קו לחי וקעור צוואר בגימור תער",
    ],
  },
];

