import type {
  HistoricalPerson,
  ModeId,
  QuizQuestion,
  Region,
  RegionId,
} from "@/src/types";

export const regions: Region[] = [
  {
    id: "africa",
    name: "Africa",
    eyebrow: "Origins & kingdoms",
    center: [20, 4],
    zoom: 2.15,
    availability: { leaders: 42, empires: 18, wars: 31, timeline: 12 },
    progress: 72,
    description: "Ancient states, liberation movements, and enduring civilizations.",
  },
  {
    id: "europe",
    name: "Europe",
    eyebrow: "Republics & revolutions",
    center: [15, 50],
    zoom: 2.55,
    availability: { leaders: 56, empires: 27, wars: 44, timeline: 19 },
    progress: 41,
    description: "From classical polities to the revolutions that reshaped the world.",
  },
  {
    id: "asia",
    name: "Asia",
    eyebrow: "Dynasties & ideas",
    center: [92, 34],
    zoom: 1.75,
    availability: { leaders: 61, empires: 35, wars: 38, timeline: 22 },
    progress: 28,
    description: "Vast dynasties, trade routes, and transformative schools of thought.",
  },
  {
    id: "middle-east",
    name: "Middle East",
    eyebrow: "Crossroads of history",
    center: [44, 29],
    zoom: 2.7,
    availability: { leaders: 38, empires: 29, wars: 34, timeline: 17 },
    progress: 34,
    description: "Cities, faiths, and empires at the meeting point of three continents.",
  },
  {
    id: "americas",
    name: "Americas",
    eyebrow: "Nations & encounters",
    center: [-78, 18],
    zoom: 1.35,
    availability: { leaders: 49, empires: 16, wars: 32, timeline: 15 },
    progress: 19,
    description: "Indigenous civilizations, independence, and modern nation building.",
  },
  {
    id: "oceania",
    name: "Oceania",
    eyebrow: "Voyages & memory",
    center: [151, -18],
    zoom: 1.9,
    availability: { leaders: 23, empires: 9, wars: 18, timeline: 10 },
    progress: 8,
    description: "Oceanic navigation, living traditions, and histories of contact.",
  },
];

export const modeDetails: Record<
  ModeId,
  { name: string; description: string; progress: number; completed: number }
> = {
  leaders: {
    name: "Leaders",
    description: "Major rulers, monarchs, presidents, and political figures.",
    progress: 64,
    completed: 18,
  },
  empires: {
    name: "Empires",
    description: "Kingdoms, dynasties, states, and the worlds they shaped.",
    progress: 38,
    completed: 9,
  },
  wars: {
    name: "Wars",
    description: "Major conflicts, alliances, turning points, and consequences.",
    progress: 47,
    completed: 12,
  },
  timeline: {
    name: "Timeline",
    description: "Place people and events in their correct chronological order.",
    progress: 29,
    completed: 6,
  },
};

export const people: HistoricalPerson[] = [
  {
    id: "haile-selassie",
    name: "Haile Selassie",
    initials: "HS",
    country: "Ethiopia",
    region: "africa",
    birthYear: 1892,
    deathYear: 1975,
    role: "Emperor and advocate of African unity",
    summary: "A defining Ethiopian monarch and prominent voice in pan-African diplomacy.",
  },
  {
    id: "kwame-nkrumah",
    name: "Kwame Nkrumah",
    initials: "KN",
    country: "Ghana",
    region: "africa",
    birthYear: 1909,
    deathYear: 1972,
    role: "Independence leader and first prime minister of Ghana",
    summary: "A central figure in Ghanaian independence and twentieth-century pan-Africanism.",
  },
  {
    id: "elizabeth-i",
    name: "Elizabeth I",
    initials: "EI",
    country: "England",
    region: "europe",
    birthYear: 1533,
    deathYear: 1603,
    role: "Queen of England and Ireland",
    summary: "Her reign saw religious settlement, maritime expansion, and a flourishing court culture.",
  },
  {
    id: "charlemagne",
    name: "Charlemagne",
    initials: "CH",
    country: "Frankish Kingdom",
    region: "europe",
    birthYear: 742,
    deathYear: 814,
    role: "King of the Franks and emperor",
    summary: "He united much of western and central Europe and encouraged educational reform.",
  },
  {
    id: "qin-shi-huang",
    name: "Qin Shi Huang",
    initials: "QH",
    country: "China",
    region: "asia",
    birthYear: -259,
    deathYear: -210,
    role: "First emperor of a unified China",
    summary: "He standardized systems across the Qin realm and began major defensive works.",
  },
  {
    id: "ashoka",
    name: "Ashoka",
    initials: "AS",
    country: "India",
    region: "asia",
    deathYear: -232,
    role: "Mauryan emperor",
    summary: "After the Kalinga War, he promoted Buddhist ethics through inscriptions across his empire.",
  },
  {
    id: "saladin",
    name: "Saladin",
    initials: "SA",
    country: "Ayyubid Sultanate",
    region: "middle-east",
    birthYear: 1137,
    deathYear: 1193,
    role: "Founder of the Ayyubid dynasty",
    summary: "He united territories in Egypt and Syria and recaptured Jerusalem in 1187.",
  },
  {
    id: "cyrus",
    name: "Cyrus the Great",
    initials: "CG",
    country: "Persia",
    region: "middle-east",
    deathYear: -530,
    role: "Founder of the Achaemenid Empire",
    summary: "He built a vast empire through conquest, diplomacy, and accommodation of local customs.",
  },
  {
    id: "simon-bolivar",
    name: "Simón Bolívar",
    initials: "SB",
    country: "Venezuela",
    region: "americas",
    birthYear: 1783,
    deathYear: 1830,
    role: "South American independence leader",
    summary: "He helped secure independence for several northern South American states.",
  },
  {
    id: "benito-juarez",
    name: "Benito Juárez",
    initials: "BJ",
    country: "Mexico",
    region: "americas",
    birthYear: 1806,
    deathYear: 1872,
    role: "President and liberal reformer",
    summary: "He defended Mexico's republic and led a period of sweeping liberal reform.",
  },
  {
    id: "queen-salote",
    name: "Queen Sālote Tupou III",
    initials: "ST",
    country: "Tonga",
    region: "oceania",
    birthYear: 1900,
    deathYear: 1965,
    role: "Queen of Tonga",
    summary: "Her long reign strengthened Tonga's institutions and international profile.",
  },
  {
    id: "te-puea",
    name: "Te Puea Hērangi",
    initials: "TP",
    country: "New Zealand",
    region: "oceania",
    birthYear: 1883,
    deathYear: 1952,
    role: "Māori leader and community builder",
    summary: "She strengthened the Kīngitanga movement and led major community renewal efforts.",
  },
];

type RegionProfile = {
  leader: HistoricalPerson;
  secondLeader: HistoricalPerson;
  empire: { name: string; capital: string; period: string; founder: string; fact: string };
  war: { name: string; date: string; participant: string; result: string; fact: string };
  timeline: string[];
  timelineFact: string;
};

const profileSeed: Record<RegionId, Omit<RegionProfile, "leader" | "secondLeader">> = {
  africa: {
    empire: { name: "Mali Empire", capital: "Niani", period: "c. 1235–1670", founder: "Sundiata Keita", fact: "Mali grew wealthy through trans-Saharan trade and became renowned for centers of learning such as Timbuktu." },
    war: { name: "Battle of Adwa", date: "1896", participant: "Ethiopia", result: "Ethiopian victory", fact: "The Ethiopian victory at Adwa became a powerful symbol of African resistance to colonial expansion." },
    timeline: ["Kingdom of Aksum flourishes", "Mali Empire is founded", "Battle of Adwa", "Ghana gains independence"],
    timelineFact: "These events span nearly two millennia of African statecraft, trade, resistance, and independence.",
  },
  europe: {
    empire: { name: "Carolingian Empire", capital: "Aachen", period: "800–888", founder: "Charlemagne", fact: "The Carolingian court supported a revival of learning often called the Carolingian Renaissance." },
    war: { name: "Battle of Waterloo", date: "1815", participant: "Seventh Coalition", result: "Coalition victory", fact: "Waterloo ended Napoleon's Hundred Days and marked his final defeat." },
    timeline: ["Roman Republic is founded", "Charlemagne is crowned emperor", "Magna Carta is sealed", "French Revolution begins"],
    timelineFact: "The sequence traces major shifts in European political authority from republic to empire and constitutional change.",
  },
  asia: {
    empire: { name: "Mauryan Empire", capital: "Pataliputra", period: "c. 322–185 BCE", founder: "Chandragupta Maurya", fact: "At its height, the Mauryan Empire governed most of the Indian subcontinent." },
    war: { name: "Kalinga War", date: "c. 261 BCE", participant: "Mauryan Empire", result: "Mauryan victory", fact: "The war's human cost profoundly influenced Ashoka's later embrace of Buddhist principles." },
    timeline: ["Qin unifies China", "Silk Roads expand", "Heian period begins", "Meiji Restoration"],
    timelineFact: "The events move from ancient imperial consolidation to nineteenth-century modernization.",
  },
  "middle-east": {
    empire: { name: "Achaemenid Empire", capital: "Persepolis", period: "c. 550–330 BCE", founder: "Cyrus the Great", fact: "Royal roads and provincial administration helped connect the empire's far-reaching territories." },
    war: { name: "Battle of Hattin", date: "1187", participant: "Ayyubid army", result: "Ayyubid victory", fact: "Hattin opened the way for Saladin's recovery of Jerusalem later in 1187." },
    timeline: ["Ur develops into a major city", "Achaemenid Empire is founded", "Baghdad is founded", "Battle of Hattin"],
    timelineFact: "The sequence reflects the region's long history of urbanism, empire, scholarship, and conflict.",
  },
  americas: {
    empire: { name: "Inca Empire", capital: "Cusco", period: "c. 1438–1533", founder: "Pachacuti", fact: "An extensive road network connected the Inca state across the Andes." },
    war: { name: "Battle of Ayacucho", date: "1824", participant: "Patriot forces", result: "Patriot victory", fact: "Ayacucho effectively secured independence for much of Spanish South America." },
    timeline: ["Teotihuacan flourishes", "Inca Empire expands", "United States declares independence", "Battle of Ayacucho"],
    timelineFact: "The events connect pre-Columbian urban worlds with the age of Atlantic revolutions.",
  },
  oceania: {
    empire: { name: "Tuʻi Tonga Empire", capital: "Muʻa", period: "c. 950–1865", founder: "Ahoʻeitu", fact: "Tongan influence extended through wide networks of exchange, kinship, and tribute across the Pacific." },
    war: { name: "New Zealand Wars", date: "1845–1872", participant: "Māori iwi", result: "Contested colonial expansion", fact: "The wars arose from disputes over sovereignty and land following the Treaty of Waitangi." },
    timeline: ["Lapita settlement expands", "Tuʻi Tonga influence grows", "Treaty of Waitangi is signed", "Tonga becomes fully independent"],
    timelineFact: "This sequence follows Pacific settlement, regional power, colonial encounter, and modern sovereignty.",
  },
};

const profiles = Object.fromEntries(
  regions.map((region) => {
    const regionalPeople = people.filter((person) => person.region === region.id);
    return [region.id, { ...profileSeed[region.id], leader: regionalPeople[0], secondLeader: regionalPeople[1] }];
  }),
) as Record<RegionId, RegionProfile>;

const leaderNames = people.map((person) => person.name);

function fourOptions(correct: string, pool: string[], offset = 0) {
  const other = pool.filter((item) => item !== correct);
  const picked = [correct, ...Array.from({ length: 3 }, (_, index) => other[(index + offset) % other.length])];
  return [picked[2], picked[0], picked[3], picked[1]];
}

function buildLeaderQuestions(region: RegionId, profile: RegionProfile): QuizQuestion[] {
  const { leader, secondLeader } = profile;
  return [
    {
      id: `${region}-leader-image`, type: "image", region, mode: "leaders",
      prompt: "Who is this historical leader?", imageLabel: "Stylized archive portrait", portraitInitials: leader.initials,
      answers: fourOptions(leader.name, leaderNames), correctAnswer: leader.name,
      fact: leader.summary,
    },
    {
      id: `${region}-leader-country`, type: "country", region, mode: "leaders",
      prompt: `${leader.name} is most closely associated with which country or state?`,
      answers: fourOptions(leader.country, people.map((person) => person.country), 2), correctAnswer: leader.country,
      fact: `${leader.name} served as ${leader.role.toLowerCase()}.`,
    },
    {
      id: `${region}-leader-role`, type: "fact", region, mode: "leaders",
      prompt: `Which description best fits ${secondLeader.name}?`,
      answers: fourOptions(secondLeader.role, people.map((person) => person.role), 3), correctAnswer: secondLeader.role,
      fact: secondLeader.summary,
    },
    {
      id: `${region}-leader-image-two`, type: "image", region, mode: "leaders",
      prompt: "Identify this figure from the regional archive.", imageLabel: "Stylized archive portrait", portraitInitials: secondLeader.initials,
      answers: fourOptions(secondLeader.name, leaderNames, 4), correctAnswer: secondLeader.name,
      fact: secondLeader.summary,
    },
    {
      id: `${region}-leader-era`, type: "fact", region, mode: "leaders",
      prompt: `${leader.name} lived primarily in which historical era?`,
      answers: ["Ancient world", "Medieval period", "Early modern era", "Modern era"],
      correctAnswer: (leader.birthYear ?? leader.deathYear ?? 1900) < 0 ? "Ancient world" : (leader.birthYear ?? 1900) < 1400 ? "Medieval period" : (leader.birthYear ?? 1900) < 1750 ? "Early modern era" : "Modern era",
      fact: leader.birthYear && leader.deathYear ? `${leader.name} lived from ${leader.birthYear} to ${leader.deathYear}.` : leader.summary,
    },
  ];
}

function buildEmpireQuestions(region: RegionId, profile: RegionProfile): QuizQuestion[] {
  const { empire } = profile;
  const empires = Object.values(profileSeed).map((item) => item.empire);
  return [
    { id: `${region}-empire-name`, type: "fact", region, mode: "empires", prompt: `Which empire was founded by ${empire.founder}?`, answers: fourOptions(empire.name, empires.map((item) => item.name)), correctAnswer: empire.name, fact: empire.fact },
    { id: `${region}-empire-capital`, type: "country", region, mode: "empires", prompt: `What was a principal capital of the ${empire.name}?`, answers: fourOptions(empire.capital, empires.map((item) => item.capital), 2), correctAnswer: empire.capital, fact: `${empire.capital} was a major political center of the ${empire.name}.` },
    { id: `${region}-empire-period`, type: "fact", region, mode: "empires", prompt: `Which period best matches the ${empire.name}?`, answers: fourOptions(empire.period, empires.map((item) => item.period), 1), correctAnswer: empire.period, fact: empire.fact },
    { id: `${region}-empire-founder`, type: "fact", region, mode: "empires", prompt: `Who is traditionally associated with founding the ${empire.name}?`, answers: fourOptions(empire.founder, empires.map((item) => item.founder), 3), correctAnswer: empire.founder, fact: empire.fact },
    { id: `${region}-empire-review`, type: "fact", region, mode: "empires", prompt: `Which statement belongs to the ${empire.name}?`, answers: fourOptions(empire.fact, empires.map((item) => item.fact), 4), correctAnswer: empire.fact, fact: empire.fact },
  ];
}

function buildWarQuestions(region: RegionId, profile: RegionProfile): QuizQuestion[] {
  const { war } = profile;
  const wars = Object.values(profileSeed).map((item) => item.war);
  return [
    { id: `${region}-war-date`, type: "war", region, mode: "wars", prompt: `When did the ${war.name} take place?`, answers: fourOptions(war.date, wars.map((item) => item.date)), correctAnswer: war.date, fact: war.fact },
    { id: `${region}-war-participant`, type: "war", region, mode: "wars", prompt: `Which force participated in the ${war.name}?`, answers: fourOptions(war.participant, wars.map((item) => item.participant), 2), correctAnswer: war.participant, fact: war.fact },
    { id: `${region}-war-result`, type: "war", region, mode: "wars", prompt: `What was the outcome of the ${war.name}?`, answers: fourOptions(war.result, wars.map((item) => item.result), 3), correctAnswer: war.result, fact: war.fact },
    { id: `${region}-war-name`, type: "war", region, mode: "wars", prompt: `Which conflict is described here: ${war.fact}`, answers: fourOptions(war.name, wars.map((item) => item.name), 4), correctAnswer: war.name, fact: war.fact },
    { id: `${region}-war-context`, type: "fact", region, mode: "wars", prompt: `Select the accurate historical note about the ${war.name}.`, answers: fourOptions(war.fact, wars.map((item) => item.fact), 1), correctAnswer: war.fact, fact: war.fact },
  ];
}

function buildTimelineQuestions(region: RegionId, profile: RegionProfile): QuizQuestion[] {
  const orders = [profile.timeline, [...profile.timeline].reverse(), [profile.timeline[1], profile.timeline[3], profile.timeline[0], profile.timeline[2]]];
  const timelineQuestions: QuizQuestion[] = orders.map((items, index) => ({
    id: `${region}-timeline-${index}`,
    type: "timeline" as const,
    region,
    mode: "timeline" as const,
    prompt: index === 0 ? "Arrange these events from earliest to latest." : "Restore the archive timeline to chronological order.",
    timelineItems: items,
    correctOrder: profile.timeline,
    fact: profile.timelineFact,
  }));
  return [...timelineQuestions,
    { id: `${region}-timeline-first`, type: "fact", region, mode: "timeline", prompt: "Which event occurred first?", answers: fourOptions(profile.timeline[0], profile.timeline), correctAnswer: profile.timeline[0], fact: profile.timelineFact },
    { id: `${region}-timeline-last`, type: "fact", region, mode: "timeline", prompt: "Which event occurred most recently?", answers: fourOptions(profile.timeline[3], profile.timeline, 1), correctAnswer: profile.timeline[3], fact: profile.timelineFact },
  ];
}

export function getQuizQuestions(region: RegionId, mode: ModeId, count: number) {
  const profile = profiles[region];
  const source = mode === "leaders" ? buildLeaderQuestions(region, profile)
    : mode === "empires" ? buildEmpireQuestions(region, profile)
      : mode === "wars" ? buildWarQuestions(region, profile)
        : buildTimelineQuestions(region, profile);

  return Array.from({ length: count }, (_, index) => ({
    ...source[index % source.length],
    id: `${source[index % source.length].id}-${index}`,
  }));
}

export const mockProgress = {
  quizzesCompleted: 45,
  questionsAnswered: 372,
  averageAccuracy: 68,
  bestStreak: 12,
  regionsExplored: 5,
  xp: 2480,
};

export function getRegion(id: RegionId | null | undefined) {
  return regions.find((region) => region.id === id);
}
