export type MetroLineType = "blue" | "green" | "purple" | "yellow";

export type MetroStation = {
  id: string;
  name: string;
  shortName: string;
  line: MetroLineType;
  isInterchange?: boolean;
  latitude: number;
  longitude: number;
  locality: string;
  description: string;
  nearbyAreas: string[];
};

export const BLUE_LINE_STATIONS: MetroStation[] = [
  {
    id: "metro-blue-1",
    name: "Dakshineswar Metro Station",
    shortName: "Dakshineswar",
    line: "blue",
    latitude: 22.6548,
    longitude: 88.3582,
    locality: "Dakshineswar",
    description: "North terminus of Blue Line. Gate to Dakshineswar Kali Temple & nearby pujos.",
    nearbyAreas: ["Dakshineswar", "Ariadaha", "Dunlop"],
  },
  {
    id: "metro-blue-2",
    name: "Baranagar Metro Station",
    shortName: "Baranagar",
    line: "blue",
    latitude: 22.6450,
    longitude: 88.3688,
    locality: "Baranagar",
    description: "Connects Dunlop, BT Road, and Baranagar residential pujos.",
    nearbyAreas: ["Baranagar", "Dunlop", "BT Road"],
  },
  {
    id: "metro-blue-3",
    name: "Noapara Metro Station",
    shortName: "Noapara",
    line: "blue",
    latitude: 22.6375,
    longitude: 88.3842,
    locality: "Noapara",
    description: "Large junction and train shed connecting North Kolkata suburbs.",
    nearbyAreas: ["Noapara", "Cantonment", "Airport Connector"],
  },
  {
    id: "metro-blue-4",
    name: "Dum Dum Metro Station",
    shortName: "Dum Dum",
    line: "blue",
    latitude: 22.6214,
    longitude: 88.3934,
    locality: "Dum Dum",
    description: "Massive suburban rail & metro junction. Walking distance to Dum Dum Park pujos.",
    nearbyAreas: ["Dum Dum", "Dum Dum Park", "Nagerbazar"],
  },
  {
    id: "metro-blue-5",
    name: "Belgachia Metro Station",
    shortName: "Belgachia",
    line: "blue",
    latitude: 22.6062,
    longitude: 88.3846,
    locality: "Belgachia",
    description: "Quick access to Tala, Belgachia, and RG Kar vicinity pujos.",
    nearbyAreas: ["Belgachia", "Tala Park", "Tala Prattoy"],
  },
  {
    id: "metro-blue-6",
    name: "Shyambazar Metro Station",
    shortName: "Shyambazar",
    line: "blue",
    latitude: 22.6027,
    longitude: 88.3712,
    locality: "Shyambazar",
    description: "North Kolkata mega hub. Ideal for Bagbazar, Kumartuli, and Hatibagan.",
    nearbyAreas: ["Shyambazar", "Hatibagan", "Bagbazar", "Kumartuli"],
  },
  {
    id: "metro-blue-7",
    name: "Shovabazar Sutanuti Metro Station",
    shortName: "Shovabazar",
    line: "blue",
    latitude: 22.5978,
    longitude: 88.3689,
    locality: "Shovabazar",
    description: "Heart of heritage North Kolkata: Shovabazar Rajbari, Ahiritola, Beniatola.",
    nearbyAreas: ["Shovabazar", "Ahiritola", "Beniatola", "Kumartuli Park"],
  },
  {
    id: "metro-blue-8",
    name: "Girish Park Metro Station",
    shortName: "Girish Park",
    line: "blue",
    latitude: 22.5855,
    longitude: 88.3615,
    locality: "Girish Park",
    description: "Gateway to Kashi Bose Lane, Simla Byayam Samiti, and Vivekananda Ancestral Home.",
    nearbyAreas: ["Girish Park", "Kashi Bose Lane", "Simla", "Manicktala"],
  },
  {
    id: "metro-blue-9",
    name: "Mahatma Gandhi Road Metro Station",
    shortName: "MG Road",
    line: "blue",
    latitude: 22.5804,
    longitude: 88.3610,
    locality: "Burrabazar / MG Road",
    description: "Central commercial corridor, College Street & Chittaranjan Avenue.",
    nearbyAreas: ["Burrabazar", "College Street", "Chittaranjan Avenue"],
  },
  {
    id: "metro-blue-10",
    name: "Central Metro Station",
    shortName: "Central",
    line: "blue",
    latitude: 22.5701,
    longitude: 88.3578,
    locality: "Bowbazar / Central",
    description: "Convenient access to College Square, Bowbazar, and Medical College.",
    nearbyAreas: ["College Square", "Bowbazar", "BB Ganguly St"],
  },
  {
    id: "metro-blue-11",
    name: "Chandni Chowk Metro Station",
    shortName: "Chandni Chowk",
    line: "blue",
    latitude: 22.5658,
    longitude: 88.3546,
    locality: "Chandni Chowk",
    description: "Downtown electronics hub, connecting to Ganesh Chandra Avenue.",
    nearbyAreas: ["Chandni Chowk", "Ganesh Chandra Ave", "Dharamtala"],
  },
  {
    id: "metro-blue-12",
    name: "Esplanade Metro Station",
    shortName: "Esplanade",
    line: "blue",
    isInterchange: true,
    latitude: 22.5639,
    longitude: 88.3518,
    locality: "Esplanade",
    description: "Main Interchange: Connects Line 1 (Blue) with Line 2 (Green East-West).",
    nearbyAreas: ["Esplanade", "New Market", "Curzon Park", "Eden Gardens"],
  },
  {
    id: "metro-blue-13",
    name: "Park Street Metro Station",
    shortName: "Park Street",
    line: "blue",
    latitude: 22.5538,
    longitude: 88.3512,
    locality: "Park Street",
    description: "Kolkata's dining & nightlife district. Walkable to Maidan & Camac St.",
    nearbyAreas: ["Park Street", "Camac Street", "Museum", "Free School St"],
  },
  {
    id: "metro-blue-14",
    name: "Maidan Metro Station",
    shortName: "Maidan",
    line: "blue",
    latitude: 22.5457,
    longitude: 88.3499,
    locality: "Maidan",
    description: "Surrounded by lush greens, Victoria Memorial, and Birla Planetarium.",
    nearbyAreas: ["Victoria Memorial", "Birla Planetarium", "St Paul's Cathedral"],
  },
  {
    id: "metro-blue-15",
    name: "Rabindra Sadan Metro Station",
    shortName: "Rabindra Sadan",
    line: "blue",
    latitude: 22.5398,
    longitude: 88.3491,
    locality: "Rabindra Sadan",
    description: "Cultural hub: Nandan, Academy of Fine Arts, Exide Crossing.",
    nearbyAreas: ["Exide Crossing", "Nandan", "AJC Bose Road", "Bhowanipore"],
  },
  {
    id: "metro-blue-16",
    name: "Netaji Bhavan Metro Station",
    shortName: "Netaji Bhavan",
    line: "blue",
    latitude: 22.5323,
    longitude: 88.3475,
    locality: "Bhowanipore",
    description: "Key stop for Bhowanipore pujos: 75 Palli, Padmapukur, Northern Park.",
    nearbyAreas: ["Bhowanipore", "Netaji Bhavan", "Ashutosh Mukherjee Rd"],
  },
  {
    id: "metro-blue-17",
    name: "Jatin Das Park Metro Station",
    shortName: "Jatin Das Park",
    line: "blue",
    latitude: 22.5230,
    longitude: 88.3468,
    locality: "Hazra",
    description: "Hazra Crossing: Access to Maddox Square, 22 Pally, and Harish Park.",
    nearbyAreas: ["Hazra", "Maddox Square", "Harish Park", "Lansdowne"],
  },
  {
    id: "metro-blue-18",
    name: "Kalighat Metro Station",
    shortName: "Kalighat",
    line: "blue",
    latitude: 22.5181,
    longitude: 88.3462,
    locality: "Kalighat",
    description: "Crucial South hub for Kalighat Temple, Chetla Agrani, and Badamtala Ashar Sangha.",
    nearbyAreas: ["Kalighat", "Chetla Agrani", "Badamtala Ashar Sangha", "Deshapriya Park"],
  },
  {
    id: "metro-blue-19",
    name: "Rabindra Sarobar Metro Station",
    shortName: "Rabindra Sarobar",
    line: "blue",
    latitude: 22.5098,
    longitude: 88.3458,
    locality: "Tollygunge / Southern Ave",
    description: "Access to Lake clubs, Mudiali Club, Shiv Mandir, and Southern Avenue pujos.",
    nearbyAreas: ["Mudiali Club", "Shiv Mandir", "Southern Avenue", "Lake Kali Bari"],
  },
  {
    id: "metro-blue-20",
    name: "Mahanayak Uttam Kumar Metro Station",
    shortName: "Tollygunge",
    line: "blue",
    latitude: 22.4984,
    longitude: 88.3452,
    locality: "Tollygunge",
    description: "Major transit hub for South Kolkata auto & bus routes, Studio Para, Tollygunge.",
    nearbyAreas: ["Tollygunge Tram Depot", "Studio Para", "Golf Green", "Ranikuthi"],
  },
  {
    id: "metro-blue-21",
    name: "Netaji Metro Station",
    shortName: "Kudghat",
    line: "blue",
    latitude: 22.4891,
    longitude: 88.3444,
    locality: "Kudghat",
    description: "Serves Kudghat and Tollygunge southern localities.",
    nearbyAreas: ["Kudghat", "Chandi Ghosh Rd", "Moore Avenue"],
  },
  {
    id: "metro-blue-22",
    name: "Masterda Surya Sen Metro Station",
    shortName: "Bansdroni",
    line: "blue",
    latitude: 22.4795,
    longitude: 88.3451,
    locality: "Bansdroni",
    description: "Serving Bansdroni, Netaji Nagar, and southern residential pujos.",
    nearbyAreas: ["Bansdroni", "Netaji Nagar", "Usha Gate"],
  },
  {
    id: "metro-blue-23",
    name: "Gitanjali Metro Station",
    shortName: "Naktala",
    line: "blue",
    latitude: 22.4712,
    longitude: 88.3567,
    locality: "Naktala",
    description: "Home to Naktala Udayan Sangha, one of Kolkata's biggest crowd-puller pujos.",
    nearbyAreas: ["Naktala", "Naktala Udayan Sangha", "Gitanjali Park"],
  },
  {
    id: "metro-blue-24",
    name: "Kavi Nazrul Metro Station",
    shortName: "Garia Bazar",
    line: "blue",
    latitude: 22.4638,
    longitude: 88.3735,
    locality: "Garia",
    description: "Access to Garia Bazar, Mahamayatala, and EM Bypass southern terminus.",
    nearbyAreas: ["Garia Bazar", "Mahamayatala", "Kanungo Park"],
  },
  {
    id: "metro-blue-25",
    name: "Shahid Khudiram Metro Station",
    shortName: "Birji",
    line: "blue",
    latitude: 22.4578,
    longitude: 88.3854,
    locality: "Birji / Garia",
    description: "Connects southern Garia neighborhoods and Eastern Metropolitan Bypass.",
    nearbyAreas: ["Birji", "Garia Station Road", "Patuli"],
  },
  {
    id: "metro-blue-26",
    name: "Kavi Subhash Metro Station",
    shortName: "New Garia",
    line: "blue",
    isInterchange: true,
    latitude: 22.4526,
    longitude: 88.3989,
    locality: "New Garia",
    description: "South terminus of Blue Line. Interchange with Orange Line (Ruby/Airport).",
    nearbyAreas: ["New Garia", "Peerless Hospital", "Patuli Floating Market"],
  },
];

export const GREEN_LINE_STATIONS: MetroStation[] = [
  {
    id: "metro-green-1",
    name: "Howrah Maidan Metro Station",
    shortName: "Howrah Maidan",
    line: "green",
    latitude: 22.5851,
    longitude: 88.3242,
    locality: "Howrah Maidan",
    description: "Western terminus of Green Line. Connects Howrah city center and major markets.",
    nearbyAreas: ["Howrah Maidan", "GT Road", "Mallick Phatak"],
  },
  {
    id: "metro-green-2",
    name: "Howrah Metro Station",
    shortName: "Howrah Station",
    line: "green",
    latitude: 22.5835,
    longitude: 88.3426,
    locality: "Howrah Railway Station",
    description: "Deepest underwater metro in India under Hooghly River. Direct link to Howrah Junction.",
    nearbyAreas: ["Howrah Station", "Hooghly Riverfront", "Howrah Bridge"],
  },
  {
    id: "metro-green-3",
    name: "Mahakaran Metro Station",
    shortName: "Mahakaran",
    line: "green",
    latitude: 22.5719,
    longitude: 88.3495,
    locality: "BBD Bagh / Writers Building",
    description: "Heritage district: Writers' Building, Dalhousie Square, Strand Road.",
    nearbyAreas: ["BBD Bagh", "Writers Building", "Brabourne Road", "Strand Rd"],
  },
  {
    id: "metro-green-4",
    name: "Esplanade Metro Station",
    shortName: "Esplanade (Green)",
    line: "green",
    isInterchange: true,
    latitude: 22.5639,
    longitude: 88.3518,
    locality: "Esplanade",
    description: "Major Interchange: Seamlessly transfers between Green Line and Blue Line.",
    nearbyAreas: ["Esplanade", "New Market", "Dharamtala"],
  },
  {
    id: "metro-green-5",
    name: "Sealdah Metro Station",
    shortName: "Sealdah",
    line: "green",
    latitude: 22.5684,
    longitude: 88.3721,
    locality: "Sealdah",
    description: "Major railway hub. Walking distance to Santosh Mitra Square (Lebutala) Durga Puja.",
    nearbyAreas: ["Sealdah Railway Station", "Santosh Mitra Square", "Baithakkhana"],
  },
  {
    id: "metro-green-6",
    name: "Phoolbagan Metro Station",
    shortName: "Phoolbagan",
    line: "green",
    latitude: 22.5718,
    longitude: 88.3905,
    locality: "Phoolbagan",
    description: "Near Beleghata, Kankurgachi, and Ram Mandir pujo areas.",
    nearbyAreas: ["Phoolbagan", "Kankurgachi", "Beleghata"],
  },
  {
    id: "metro-green-7",
    name: "Salt Lake Stadium Metro Station",
    shortName: "Stadium",
    line: "green",
    latitude: 22.5714,
    longitude: 88.4022,
    locality: "Salt Lake Stadium",
    description: "Direct access to Vivekananda Yuba Bharati Krirangan and EM Bypass.",
    nearbyAreas: ["Salt Lake Stadium", "EM Bypass", "Kadapara"],
  },
  {
    id: "metro-green-8",
    name: "Bengal Chemical Metro Station",
    shortName: "Bengal Chemical",
    line: "green",
    latitude: 22.5746,
    longitude: 88.4082,
    locality: "Mani Square / Salt Lake",
    description: "Opposite Mani Square Mall. Easy transit to Salt Lake Block pandals.",
    nearbyAreas: ["Mani Square", "EM Bypass", "Kakurgachi Connector"],
  },
  {
    id: "metro-green-9",
    name: "City Centre Metro Station",
    shortName: "City Centre 1",
    line: "green",
    latitude: 22.5862,
    longitude: 88.4098,
    locality: "Salt Lake Sector 1",
    description: "Connects City Centre 1 mall and famous Salt Lake block pujos (FD, BJ, BF Block).",
    nearbyAreas: ["City Centre Salt Lake", "FD Block", "BJ Block", "BF Block"],
  },
  {
    id: "metro-green-10",
    name: "Central Park Metro Station",
    shortName: "Central Park",
    line: "green",
    latitude: 22.5878,
    longitude: 88.4168,
    locality: "Salt Lake Central Park",
    description: "Adjacent to Central Park fairgrounds and Karunamoyee central bus terminal.",
    nearbyAreas: ["Central Park", "Bikash Bhavan", "Swasthya Bhavan"],
  },
  {
    id: "metro-green-11",
    name: "Karunamoyee Metro Station",
    shortName: "Karunamoyee",
    line: "green",
    latitude: 22.5832,
    longitude: 88.4208,
    locality: "Karunamoyee",
    description: "Salt Lake central transport depot. Minutes from AJ Block & EE Block pandals.",
    nearbyAreas: ["Karunamoyee Bus Terminal", "AJ Block", "EE Block"],
  },
  {
    id: "metro-green-12",
    name: "Salt Lake Sector V Metro Station",
    shortName: "Sector V",
    line: "green",
    latitude: 22.5786,
    longitude: 88.4326,
    locality: "Salt Lake Sector V",
    description: "Eastern terminus of Green Line. IT hub connecting to New Town & Rajarhat.",
    nearbyAreas: ["Sector V IT Hub", "College More", "New Town Connector"],
  },
];

export const PURPLE_LINE_STATIONS: MetroStation[] = [
  {
    id: "metro-purple-1",
    name: "Joka Metro Station",
    shortName: "Joka",
    line: "purple",
    latitude: 22.4497,
    longitude: 88.3056,
    locality: "Joka",
    description: "South terminus of Purple Line on Diamond Harbour Road near IIM Calcutta.",
    nearbyAreas: ["Joka", "IIM Calcutta", "Pailan", "DH Road"],
  },
  {
    id: "metro-purple-2",
    name: "Thakurpukur Metro Station",
    shortName: "Thakurpukur",
    line: "purple",
    latitude: 22.4645,
    longitude: 88.3072,
    locality: "Thakurpukur",
    description: "Connects Thakurpukur 3A bus stand and Diamond Harbour Road pujo zones.",
    nearbyAreas: ["Thakurpukur", "Diamond Harbour Road", "3A Stand"],
  },
  {
    id: "metro-purple-3",
    name: "Sakherbazar Metro Station",
    shortName: "Sakherbazar",
    line: "purple",
    latitude: 22.4789,
    longitude: 88.3115,
    locality: "Sakherbazar",
    description: "Fast access to Sakherbazar, Silpara, and heritage Barisha community pandals.",
    nearbyAreas: ["Sakherbazar", "Barisha", "Silpara"],
  },
  {
    id: "metro-purple-4",
    name: "Behala Chowrasta Metro Station",
    shortName: "Behala Chowrasta",
    line: "purple",
    latitude: 22.4925,
    longitude: 88.3150,
    locality: "Behala Chowrasta",
    description: "Durga Puja hotspot: walking distance to Behala Club, Barisha Club, and Behala Natun Dal.",
    nearbyAreas: ["Behala Chowrasta", "Barisha Club", "Behala Club", "Natun Dal"],
  },
  {
    id: "metro-purple-5",
    name: "Behala Bazar Metro Station",
    shortName: "Behala Bazar",
    line: "purple",
    latitude: 22.5020,
    longitude: 88.3185,
    locality: "Behala Bazar",
    description: "Behala central marketplace and Tram Depot corridor.",
    nearbyAreas: ["Behala Bazar", "Pathakpara", "Tram Depot"],
  },
  {
    id: "metro-purple-6",
    name: "Taratala Metro Station",
    shortName: "Taratala",
    line: "purple",
    latitude: 22.5126,
    longitude: 88.3218,
    locality: "Taratala",
    description: "Taratala junction: gateway to Suruchi Sangha (New Alipore) and Hyde Road.",
    nearbyAreas: ["Taratala", "New Alipore", "Suruchi Sangha", "Hyde Road"],
  },
  {
    id: "metro-purple-7",
    name: "Majerhat Metro Station",
    shortName: "Majerhat",
    line: "purple",
    isInterchange: true,
    latitude: 22.5205,
    longitude: 88.3248,
    locality: "Majerhat",
    description: "Interchange connecting Purple Line with Eastern Railway suburban and circular lines.",
    nearbyAreas: ["Majerhat Station", "Alipore", "New Alipore", "Chetla"],
  },
];

export const YELLOW_LINE_STATIONS: MetroStation[] = [
  {
    id: "metro-yellow-1",
    name: "Noapara Metro Station",
    shortName: "Noapara (Yellow)",
    line: "yellow",
    isInterchange: true,
    latitude: 22.6375,
    longitude: 88.3842,
    locality: "Noapara",
    description: "Major interchange hub connecting Line 1 (Blue Line) and Line 4 (Yellow Line).",
    nearbyAreas: ["Noapara", "Cantonment", "North Suburbs"],
  },
  {
    id: "metro-yellow-2",
    name: "Dum Dum Cantonment Metro Station",
    shortName: "Cantonment",
    line: "yellow",
    isInterchange: true,
    latitude: 22.6415,
    longitude: 88.4068,
    locality: "Dum Dum Cantonment",
    description: "Interchange with Indian Railways suburban Sealdah North line and Cantonment pujos.",
    nearbyAreas: ["Dum Dum Cantonment", "Gorabazar", "Suburban Rail"],
  },
  {
    id: "metro-yellow-3",
    name: "Jessore Road Metro Station",
    shortName: "Jessore Road",
    line: "yellow",
    latitude: 22.6475,
    longitude: 88.4285,
    locality: "Jessore Road",
    description: "Station on Jessore Road connecting Dum Dum Park and Baguiati pujo areas.",
    nearbyAreas: ["Jessore Road", "Dum Dum Park", "Baguiati Connector"],
  },
  {
    id: "metro-yellow-4",
    name: "Jai Hind Metro Station (Airport)",
    shortName: "Jai Hind Airport",
    line: "yellow",
    isInterchange: true,
    latitude: 22.6512,
    longitude: 88.4468,
    locality: "NSCBIA Airport",
    description: "Large underground airport terminal station serving Netaji Subhash Chandra Bose International Airport.",
    nearbyAreas: ["Kolkata Airport", "Terminal 2", "VIP Road"],
  },
  {
    id: "metro-yellow-5",
    name: "Birati Metro Station",
    shortName: "Birati",
    line: "yellow",
    latitude: 22.6685,
    longitude: 88.4352,
    locality: "Birati",
    description: "Suburban transport node connecting Birati railway station and local residential pujos.",
    nearbyAreas: ["Birati", "Nimta", "MB Road"],
  },
  {
    id: "metro-yellow-6",
    name: "Michael Nagar Metro Station",
    shortName: "Michael Nagar",
    line: "yellow",
    latitude: 22.6820,
    longitude: 88.4410,
    locality: "Michael Nagar",
    description: "Industrial & residential corridor connecting Jessore Road to Badu Road.",
    nearbyAreas: ["Michael Nagar", "Jessore Road Industrial Area"],
  },
  {
    id: "metro-yellow-7",
    name: "New Barrackpore Metro Station",
    shortName: "New Barrackpore",
    line: "yellow",
    latitude: 22.6950,
    longitude: 88.4460,
    locality: "New Barrackpore",
    description: "Serving New Barrackpore municipality and celebrated community Durga Pujas.",
    nearbyAreas: ["New Barrackpore", "APJ Abdul Kalam College", "Sodepur Road"],
  },
  {
    id: "metro-yellow-8",
    name: "Madhyamgram Metro Station",
    shortName: "Madhyamgram",
    line: "yellow",
    latitude: 22.7055,
    longitude: 88.4520,
    locality: "Madhyamgram",
    description: "Commercial center on Jessore Road connecting Sodepur and Barasat.",
    nearbyAreas: ["Madhyamgram Chowmatha", "Jessore Road", "Sodepur Road"],
  },
  {
    id: "metro-yellow-9",
    name: "Barasat Metro Station",
    shortName: "Barasat",
    line: "yellow",
    isInterchange: true,
    latitude: 22.7210,
    longitude: 88.4795,
    locality: "Barasat",
    description: "Northern terminus of Line 4 connecting Barasat district headquarters and celebrated pujos.",
    nearbyAreas: ["Barasat", "Champadali More", "National Highway 12"],
  },
];

export const ALL_METRO_STATIONS: MetroStation[] = [
  ...BLUE_LINE_STATIONS,
  ...GREEN_LINE_STATIONS,
  ...PURPLE_LINE_STATIONS,
  ...YELLOW_LINE_STATIONS,
];

export function getMetroLineDetails(line: MetroLineType) {
  switch (line) {
    case "blue":
      return {
        name: "Blue Line (Line 1)",
        color: "#0D47A1",
        emoji: "🔵",
        corridor: "Dakshineswar ⇄ Kavi Subhash (North-South)",
        description: "26 active stations connecting major North & South Kolkata pujos.",
      };
    case "green":
      return {
        name: "Green Line (Line 2)",
        color: "#1B5E20",
        emoji: "🟢",
        corridor: "Howrah Maidan ⇄ Sector V (Underwater River Corridor)",
        description: "Direct underwater link connecting Howrah, Sealdah & Salt Lake pujos.",
      };
    case "purple":
      return {
        name: "Purple Line (Line 3)",
        color: "#7B1FA2",
        emoji: "🟣",
        corridor: "Joka ⇄ Majerhat (Diamond Harbour Road Corridor)",
        description: "Connects Behala Chowrasta, Taratala, and southern mega pujos.",
      };
    case "yellow":
      return {
        name: "Yellow Line (Line 4)",
        color: "#D97706",
        emoji: "🟡",
        corridor: "Noapara ⇄ Airport ⇄ Barasat (Jessore Road Corridor)",
        description: "Connects Dum Dum Cantonment, Kolkata Airport & North 24 Parganas.",
      };
  }
}

/**
 * Returns line metadata and coordinates for rendering polylines on Google Maps.
 */
export const METRO_LINES = [
  {
    id: "line-1-blue",
    name: "Blue Line (Line 1)",
    corridor: "North - South Corridor (Dakshineswar ⇄ Kavi Subhash)",
    color: "#0D47A1",
    emoji: "🔵",
    description: "26 active stations connecting major North & South Kolkata pujos.",
    path: BLUE_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
  {
    id: "line-2-green",
    name: "Green Line (Line 2)",
    corridor: "East - West Corridor (Howrah Maidan ⇄ Sector V)",
    color: "#1B5E20",
    emoji: "🟢",
    description: "Direct underwater tunnel connecting Howrah, Sealdah & Salt Lake pujos.",
    path: GREEN_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
  {
    id: "line-3-purple",
    name: "Purple Line (Line 3)",
    corridor: "Diamond Harbour Road Corridor (Joka ⇄ Majerhat)",
    color: "#7B1FA2",
    emoji: "🟣",
    description: "Connects Joka, Behala Chowrasta, Taratala, and southern mega pujos.",
    path: PURPLE_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
  {
    id: "line-4-yellow",
    name: "Yellow Line (Line 4)",
    corridor: "Jessore Road Corridor (Noapara ⇄ Airport ⇄ Barasat)",
    color: "#D97706",
    emoji: "🟡",
    description: "Connects Noapara, Dum Dum Cantonment, Kolkata Airport & Barasat.",
    path: YELLOW_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
];

/**
 * Generates an SVG data URL for a Metro station marker with the letter 'M' inside a circle.
 * - Blue Line: Circular badge with Blue 'M' and border
 * - Green Line: Circular badge with Green 'M' and border
 * - Purple Line: Circular badge with Purple 'M' and border
 * - Yellow Line: Circular badge with Amber/Yellow 'M' and border
 */
export function getMetroMarkerSvg(line: MetroLineType, isSelected = false, isInterchange = false): string {
  const details = getMetroLineDetails(line);
  const color = details.color;
  const size = isSelected ? 36 : 28;
  const radius = isSelected ? 15 : 11.5;
  const strokeWidth = isSelected ? 3.5 : 2.5;
  const fontSize = isSelected ? 15 : 12;
  const textY = isSelected ? 22.5 : 18;

  const interchangeAccent = line === "blue" ? "#D97706" : line === "green" ? "#0D47A1" : line === "purple" ? "#0D47A1" : "#0D47A1";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <filter id="m-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.38"/>
      </filter>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="#FFFFFF" stroke="${color}" stroke-width="${strokeWidth}" filter="url(#m-shadow)"/>
    ${
      isInterchange
        ? `<circle cx="${size / 2}" cy="${size / 2}" r="${radius - 3.5}" fill="none" stroke="${interchangeAccent}" stroke-width="1.8" stroke-dasharray="3,2"/>`
        : ""
    }
    ${
      isSelected
        ? `<circle cx="${size / 2}" cy="${size / 2}" r="${radius + 2.5}" fill="none" stroke="#F5BD32" stroke-width="2.5"/>`
        : ""
    }
    <text x="${size / 2}" y="${textY}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${color}" text-anchor="middle" letter-spacing="-0.5px">M</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Converts a MetroStation into a unified Place object suitable for app/page.tsx.
 */
export function metroStationToPlace(station: MetroStation) {
  const details = getMetroLineDetails(station.line);

  return {
    id: station.id,
    name: station.name,
    locality: `${station.locality} · ${details.name}`,
    address: `${station.name}, Kolkata Metro (${details.name})`,
    category: "Metro" as const,
    rating: "4.9",
    reviews: 320,
    distance: "Metro Station",
    color: details.color,
    x: 50,
    y: 50,
    latitude: station.latitude,
    longitude: station.longitude,
    facilities: [
      `Metro (${details.name})`,
      station.isInterchange ? "Interchange Station" : "Rapid Transit",
      "Ticket Counter",
      "Smart Card Gate",
    ],
    description: `${station.description} Connected via Kolkata Metro ${details.name}.`,
    metroLine: station.line,
  };
}
