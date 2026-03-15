export type WomenPresetMaintenanceLevel = "low" | "medium" | "high";

export type WomenPresetVibe =
  | "sleek"
  | "soft"
  | "bold"
  | "natural"
  | "romantic"
  | "business"
  | "casual"
  | "low-maintenance";

export interface WomenPreset {
  id: string;
  /** Rollout phase for this preset. Used to gate which presets appear in the live flow. */
  phase: "v1" | "later";
  name: string;
  nameHe: string;
  displayNameHe: string;
  description: string;
  aiPrompt: string;
  maintenanceLevel: WomenPresetMaintenanceLevel;
  vibe: WomenPresetVibe[];
  resultUserText: string;
  resultStylistSummary: string;
  resultTechnicalNotes: string;
  /** Optional fun fact for loading/educational copy (Hebrew). */
  funFactHe?: string;
}

export const WOMEN_PRESETS: WomenPreset[] = [
  // --- V1 presets ---
  {
    id: "italian-bob",
    phase: "v1",
    name: "Italian Bob",
    nameHe: "בוב איטלקי",
    displayNameHe: "בוב איטלקי",
    description:
      "בוב עד קו הלסת–צוואר עם תחושה מעט אוורירית ורכה, לא חד מדי, מראה אירופאי מודרני שמתאים גם ליום יום וגם לערב.",
    aiPrompt:
      "italian bob, just below chin to neck length, airy fullness, soft texture, slightly tucked under ends, subtle movement, healthy shine, modern european salon finish",
    maintenanceLevel: "medium",
    vibe: ["soft", "business", "romantic"],
    resultUserText:
      "בוב רך ומלא עם תנועה עדינה, שיושב יפה על קו הלסת ונותן מראה מסודר אבל לא נוקשה.",
    resultStylistSummary:
      "בוב באורך לסת/קצת מתחת, קו מלא בקצה עם ריכוך קל בשכבות פנימיות כדי לתת נפח רך ולא קיר זכוכית.",
    resultTechnicalNotes:
      "עבודה בקו בסיס ישר עם דרגות פנימיות עדינות, להימנע מדילול יתר בקצוות. מתאים במיוחד לשיער חלק–גלי בעובי בינוני. דורש חידוש קו כל 6–8 שבועות.",
    funFactHe:
      "הידעת? בישראל נהוג לרוב לקרוא לסגנון הזה 'קארה', אבל בעולם העיצוב המקצועי 'בוב' מתייחס לגזירה בזווית ספציפית שמעניקה תנועה, נפח, ורכות מודרנית.",
  },
  {
    id: "classic-blunt-bob",
    phase: "v1",
    name: "Classic Blunt Bob",
    nameHe: "בוב קלאסי ישר",
    displayNameHe: "בוב קלאסי ישר",
    description:
      "בוב קצר עם קו חד וישר, מראה נקי ובטוח בעצמו שמתאים לשיער חלק או מעט גלי שרוצה מסגרת ברורה לפנים.",
    aiPrompt:
      "classic blunt bob, strong clean line, one length, slightly below chin, polished finish, minimal layers, high-density ends",
    maintenanceLevel: "medium",
    vibe: ["sleek", "bold", "business"],
    resultUserText:
      "בוב חד וקלאסי שמייצר מסגרת ברורה ומדויקת לפנים, עם תחושה מאוד מסודרת ומקצועית.",
    resultStylistSummary:
      "בוב חד בקו אחד, ללא שכבות משמעותיות, נשען על צפיפות בקצוות ועל חיתוך נקי וחוזר.",
    resultTechnicalNotes:
      "קו חיתוך ישר, אפשרות להטיה קלה קדימה, להימנע מדילול בקצוות כדי לא לאבד מאסה. מומלץ ללוות בפן חלק/מחליק והגנה מחום.",
    funFactHe:
      "הידעת? בישראל נהוג לרוב לקרוא לסגנון הזה 'קארה', אבל בעולם העיצוב המקצועי 'בוב' מתייחס לגזירה בזווית ספציפית שמעניקה תנועה, נפח, ורכות מודרנית.",
  },
  {
    id: "soft-layered-lob",
    phase: "v1",
    name: "Soft Layered Lob",
    nameHe: "לוב מדורג רך",
    displayNameHe: "לוב מדורג רך",
    description:
      "לוב עד הכתפיים–קצת מתחת עם שכבות רכות שנותנות תנועה, מראה נעים ורב־שימושי שמתאים במיוחד לשיער גלי/ישר ישראלי.",
    aiPrompt:
      "soft layered lob, shoulder to collarbone length, gentle layers, light face framing, natural movement, healthy ends",
    maintenanceLevel: "medium",
    vibe: ["soft", "natural", "casual"],
    resultUserText:
      "אורך ביניים נוח עד מתחת לכתף, עם שכבות רכות שנותנות תנועה בלי להרגיש מתאמץ.",
    resultStylistSummary:
      "לוב באורך כתף–עצם בריח עם שכבות ארוכות לתנועה וריכוך בקוו החיצוני, מתאים למעבר מאורך ארוך או מקצר.",
    resultTechnicalNotes:
      "שכבות ארוכות בלבד, חיבור נקי בין קדמי לאחורי, לשמור על צפיפות בקצוות. לעבוד עם קרם/ספריי טקסטורה קל לשמירה על התנועה.",
  },
  {
    id: "long-butterfly-layers",
    phase: "v1",
    name: "Long Butterfly Layers",
    nameHe: "שכבות באטרפליי ארוכות",
    displayNameHe: "שכבות באטרפליי ארוכות",
    description:
      "שיער ארוך עם שכבות באטרפליי שנותנות מסגרת ורכות מסביב לפנים בלי לוותר על האורך הארוך בגב.",
    aiPrompt:
      "long hair, butterfly layers, strong face-framing around the front, long layers through the length, airy volume, modern blowout look",
    maintenanceLevel: "high",
    vibe: ["romantic", "soft", "bold"],
    resultUserText:
      "שיער ארוך עם שכבות שממש ממסגרות את הפנים ונותנות לוק באטרפליי מודרני ועשיר.",
    resultStylistSummary:
      "שכבות קדמיות מודגשות בגובה עצמות הלחי/סנטר, שמתחברות לדרגות ארוכות לאורך הגב, נותנות נפח ותנועה בעיקר בחלק הקדמי.",
    resultTechnicalNotes:
      "דורש זמן עיצוב עם פן/בייביליס להדגשת השכבות, חשוב לשמור על צפיפות בקו התחתון כדי שהשיער לא ירגיש דק מדי. מומלץ שימוש קבוע במסכה ולחות.",
  },
  {
    id: "butterfly-bob",
    phase: "v1",
    name: "Butterfly Bob",
    nameHe: "בוב בארטפליי",
    displayNameHe: "בוב באטרפליי",
    description:
      "בוב באורך ביניים עם שכבות באטרפליי קדמיות, שילוב בין קו בוב מסודר לבין תנועה רכה סביב הפנים.",
    aiPrompt:
      "butterfly bob, collarbone length bob with butterfly layers, face framing volume, soft texture, salon blowout",
    maintenanceLevel: "medium",
    vibe: ["soft", "romantic", "business"],
    resultUserText:
      "בוב באורך נוח עם שכבות שמוסיפות נפח מסביב לפנים ותחושה של לוק באטרפליי גם בלי אורך מאוד ארוך.",
    resultStylistSummary:
      "בוב עצם בריח עם קו תחתון נקי ושכבות קדמיות מודגשות, מתאים ללקוחה שרוצה באטרפליי אבל לא מחויבת לאורך ארוך.",
    resultTechnicalNotes:
      "לשלב חיתוך קו מלא בקצה עם דרגות קדמיות גבוהות יותר, עבודה במברשת/פן להבלטת הכיוונים. חשוב לא לדלל יתר על המידה באזור הקצוות.",
    funFactHe:
      "הידעת? בישראל נהוג לרוב לקרוא לסגנון הזה 'קארה', אבל בעולם העיצוב המקצועי 'בוב' מתייחס לגזירה בזווית ספציפית שמעניקה תנועה, נפח, ורכות מודרנית.",
  },
  {
    id: "face-framing-layers",
    phase: "v1",
    name: "Face-Framing Layers",
    nameHe: "שכבות ממסגרות פנים",
    displayNameHe: "שכבות ממסגרות פנים",
    description:
      "שכבות רכות מסביב לפנים בלבד, כיוון שמתאים למי שרוצה רענון בלי להתחייב לשינוי גדול באורך הכללי.",
    aiPrompt:
      "soft face-framing layers only, subtle movement around the face, blend into existing length, natural everyday texture",
    maintenanceLevel: "low",
    vibe: ["soft", "natural", "romantic"],
    resultUserText:
      "שכבות עדינות סביב הפנים שנותנות יותר עניין ותנועה גם כששומרים כמעט לגמרי על אותו אורך שיער.",
    resultStylistSummary:
      "עבודה ממוקדת בקו הקדמי, דרגות רכות סביב הפנים והחזרה הדרגתית לאורך הקיים מאחור.",
    resultTechnicalNotes:
      "לשמור על חיבור חלק בין השכבות הקדמיות לאחורי, לא לקצר מדי אם יש נטייה לפריז. מתאים כמעט לכל אורך וצורה קיימת.",
  },
  {
    id: "rounded-soft-layers",
    phase: "v1",
    name: "Rounded Soft Layers",
    nameHe: "שכבות מעוגלות רכות",
    displayNameHe: "שכבות מעוגלות רכות",
    description:
      "שכבות שנותנות קו חיצוני מעט מעוגל ורך, מתאימות למי שרוצה שיער שמונח בצורה מעגלית סביב הפנים בלי זוויות חדות.",
    aiPrompt:
      "rounded soft layers, curved outer shape, balanced volume, soft ends, medium length, salon finish",
    maintenanceLevel: "medium",
    vibe: ["soft", "natural", "casual"],
    resultUserText:
      "שיער שנופל בצורה רכה ומעוגלת מסביב לפנים, בלי קווים חדים ועם תחושת תנועה נעימה.",
    resultStylistSummary:
      "בניית צורה מעוגלת דרך שכבות מדורגות רכות, חלוקה נכונה של משקל כדי שלא ייפול כבד בקצוות.",
    resultTechnicalNotes:
      "עבודה בקווים עגולים, להימנע מקווי חיתוך חדים מדי בקצוות. טוב לשיער בינוני–עבה שרוצה ריכוך קו.",
  },
  {
    id: "soft-long-layers",
    phase: "v1",
    name: "Soft Long Layers",
    nameHe: "שכבות ארוכות רכות",
    displayNameHe: "שכבות ארוכות רכות",
    description:
      "שיער ארוך עם שכבות ארוכות ורכות שנותנות תנועה בעיקר בקצוות ומקלילות מעט את המסה בלי להרגיש דק.",
    aiPrompt:
      "long hair with soft long layers, movement at the ends, preserve fullness, natural texture, healthy shine",
    maintenanceLevel: "medium",
    vibe: ["natural", "soft", "casual"],
    resultUserText:
      "שיער ארוך שנשאר מלא אבל זז יותר יפה, עם שכבות ארוכות שנותנות תנועה בקצוות.",
    resultStylistSummary:
      "שכבות ארוכות לאורך הגב, הורדת משקל באזורים כבדים תוך שמירה על קו תחתון מלא.",
    resultTechnicalNotes:
      "לא לדלל יתר על המידה, במיוחד בשיער דק. מומלץ לחזק את הקצוות במסכה/שמן כדי לשמור על מראה בריא.",
  },
  {
    id: "curly-shape-cut",
    phase: "v1",
    name: "Curly Shape Cut",
    nameHe: "תספורת עיצוב לתלתלים",
    displayNameHe: "תספורת עיצוב לתלתלים",
    description:
      "תספורת שמעצבת את צורת התלתלים והנפח, כדי שהתלתלים יישבו נכון גם ביום־יום וגם אחרי ייבוש טבעי.",
    aiPrompt:
      "curly hair shaping cut, defined overall silhouette, balanced volume, curl-friendly layers, no harsh thinning",
    maintenanceLevel: "medium",
    vibe: ["natural", "bold"],
    resultUserText:
      "תלתלים שעומדים טוב יותר גם בייבוש טבעי, עם צורה ברורה ונפח מחולק נכון.",
    resultStylistSummary:
      "עבודה בפאנלים לפי תבנית התלתל, בניית סילואטת נפח מאוזנת לפי מבנה הראש והפנים.",
    resultTechnicalNotes:
      "להימנע מסכין/דילול אגרסיבי. מומלץ לחתוך על שיער יבש/לחות קלה בהתאם לשיטה, לשמור על קצוות נקיים ומעט 'נושמים'.",
  },
  {
    id: "curly-volume-bob",
    phase: "v1",
    name: "Curly Volume Bob",
    nameHe: "בוב מתולתל מלא נפח",
    displayNameHe: "בוב מתולתל מלא נפח",
    description:
      "בוב לתלתלים באמצע–קצר עם דגש על נפח יפה ושליטה בפריז, נותן מראה מודרני ובולט לתלתלים.",
    aiPrompt:
      "curly bob, strong rounded shape, full volume, defined curls, controlled frizz, above shoulders",
    maintenanceLevel: "high",
    vibe: ["bold", "natural"],
    resultUserText:
      "בוב מתולתל שמדגיש את התלתלים ויוצר מראה מלא נוכחות, עם צורה עגולה וברורה.",
    resultStylistSummary:
      "בוב עיצוב לתלתלים עם קו מעוגל, עבודה על שכבות פנימיות לשליטת נפח ואיזון אזורים כבדים.",
    resultTechnicalNotes:
      "דורש שגרת מוצרים מסודרת לתלתלים (קרם, ג'ל/פלאקס), תחזוקת תספורת תכופה יחסית כדי לשמור על הצורה.",
    funFactHe:
      "הידעת? בישראל נהוג לרוב לקרוא לסגנון הזה 'קארה', אבל בעולם העיצוב המקצועי 'בוב' מתייחס לגזירה בזווית ספציפית שמעניקה תנועה, נפח, ורכות מודרנית.",
  },

  // --- V1.1 / later presets ---
  {
    id: "modern-shag-curtain",
    phase: "later",
    name: "Modern Shag with Curtain Bangs",
    nameHe: "שאג מודרני עם וילון",
    displayNameHe: "שאג מודרני עם וילון",
    description:
      "שכבות שאג עם תנועה ובד יריעה קדמית בסגנון 'וילון', לוק יותר אופנתי שמתאים למי שאוהבת מעט דרמה ותנועה.",
    aiPrompt:
      "modern shag haircut, soft choppy layers, curtain bangs, textured length, effortless volume, slightly messy salon look",
    maintenanceLevel: "medium",
    vibe: ["bold", "casual", "soft"],
    resultUserText:
      "שיער עם הרבה תנועה ושכבות, ומסגרת קדמית בסגנון וילון שמרגישה עדכנית ולא מתאמצת.",
    resultStylistSummary:
      "שכבות שאג רכות בעיקר בקדמי ובחלק העליון, וילון שמתמזג לאחור, שמירה על ריכוך בקצוות כדי לא לייצר מראה מחוספס מדי.",
    resultTechnicalNotes:
      "דורש טכניקת דרגות/שאג רכה, להיזהר בדילול בשיער דק. טוב בשילוב ספריי טקסטורה/ספריי מי מלח לעיצוב יומיומי.",
  },
  {
    id: "short-textured-bob-bixie",
    phase: "later",
    name: "Short Textured Bob / Bixie",
    nameHe: "בוב קצר מדורג / ביקסי",
    displayNameHe: "בוב קצר מדורג / ביקסי",
    description:
      "בורדרליין בין בוב קצר לפיקס–ביקסי, הרבה טקסטורה ורכות, מתאים למי שרוצה קצר נשי אבל לא 'קארה קלאסי'.",
    aiPrompt:
      "short textured bob bixie, cropped nape, soft layers, light fringe or face framing, airy texture, modern salon cut",
    maintenanceLevel: "medium",
    vibe: ["bold", "casual", "soft"],
    resultUserText:
      "תספורת קצרה ומעודנת עם הרבה טקסטורה ורכות, מרגישה קלילה ומודרנית ולא 'ריבועית'.",
    resultStylistSummary:
      "שילוב של קו בוב קצר עם דרגות בקודקוד ובקדמי, ליצירת טקסטורה ותנועה גם בשיער ישר.",
    resultTechnicalNotes:
      "עבודה בטכניקות טקסטורה עדינות, חשוב לשמור על קו נקי בעורף. דורש ביקור תדיר יותר בסלון לשמירה על הצורה.",
    funFactHe:
      "הידעת? בישראל נהוג לרוב לקרוא לסגנון הזה 'קארה', אבל בעולם העיצוב המקצועי 'בוב' מתייחס לגזירה בזווית ספציפית שמעניקה תנועה, נפח, ורכות מודרנית.",
  },
  {
    id: "soft-wolf-cut",
    phase: "later",
    name: "Soft Wolf Cut",
    nameHe: "וולף קאט רך",
    displayNameHe: "וולף קאט רך",
    description:
      "גרסה רכה ומלבישה של וולף קאט – שכבות קודקוד וקו מעוגל מאחור, בלי להיכנס למולט אגרסיבי.",
    aiPrompt:
      "soft wolf cut, layered crown, tapered length, soft texture, no extreme mullet, wearable modern shape",
    maintenanceLevel: "medium",
    vibe: ["bold", "casual", "natural"],
    resultUserText:
      "שכבות שמייצרות צורה של וולף קאט אבל במראה רך ומלביש שמתאים ליום־יום.",
    resultStylistSummary:
      "שכבות מדורגות בקודקוד והקדמי, הקלה במשקל בעורף בלי לייצר נתק קיצוני בין קדמי לאחורי.",
    resultTechnicalNotes:
      "טכניקות שאג/וולף רכות בלבד, להימנע מחיתוך חד מדי באזור העורף. דורש קמצוץ טקסטורה במוצר לעיצוב נכון.",
  },
  {
    id: "polished-long-soft-frame",
    phase: "later",
    name: "Polished Long Hair with Soft Frame",
    nameHe: "שיער ארוך חלק עם מסגרת רכה",
    displayNameHe: "שיער ארוך חלק עם מסגרת רכה",
    description:
      "שיער ארוך יחסית, חלק ומסודר, עם שכבות קדמיות רכות שממסגרות את הפנים ונותנות רכות בלי לוותר על קו חלק.",
    aiPrompt:
      "long polished straight hair, soft face-framing layers, smooth finish, healthy shine, minimal layers through the back",
    maintenanceLevel: "high",
    vibe: ["sleek", "business", "romantic"],
    resultUserText:
      "שיער ארוך וחלק במראה נקי, עם מסגרת רכה מסביב לפנים שמוסיפה רכות ונשיות.",
    resultStylistSummary:
      "אורך ארוך יחסית עם קו חלק ומבריק, שכבות קדמיות בלבד להקלה סביב הפנים, גב כמעט מלא ללא דרגות עמוקות.",
    resultTechnicalNotes:
      "דורש תחזוקת קצוות ושגרת לחות טובה, עבודה עם פן/מחליק עדין והגנה מחום. מתאים במיוחד לשיער שעבר החלקה או טבעי חלק/גלי עדין.",
  },
];

