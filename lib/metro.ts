export type MetroLineType = "blue" | "green";

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

export const ALL_METRO_STATIONS: MetroStation[] = [
  ...BLUE_LINE_STATIONS,
  ...GREEN_LINE_STATIONS,
];

/**
 * Returns line metadata and coordinates for rendering polylines on Google Maps.
 */
export const METRO_LINES = [
  {
    id: "line-1-blue",
    name: "Blue Line (Line 1)",
    corridor: "North - South Corridor",
    color: "#0D47A1",
    path: BLUE_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
  {
    id: "line-2-green",
    name: "Green Line (Line 2)",
    corridor: "East - West Corridor (Underwater Metro)",
    color: "#1B5E20",
    path: GREEN_LINE_STATIONS.map((s) => ({ lat: s.latitude, lng: s.longitude })),
  },
];

/**
 * Generates an SVG data URL for a Metro station marker with the letter 'M' inside a circle.
 * - Blue Line: Circular badge with Blue 'M' and border
 * - Green Line: Circular badge with Green 'M' and border
 */
export function getMetroMarkerSvg(line: MetroLineType, isSelected = false, isInterchange = false): string {
  const color = line === "blue" ? "#0D47A1" : "#1B5E20";
  const size = isSelected ? 36 : 28;
  const radius = isSelected ? 15 : 11.5;
  const strokeWidth = isSelected ? 3.5 : 2.5;
  const fontSize = isSelected ? 15 : 12;
  const textY = isSelected ? 22.5 : 18;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <filter id="m-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.38"/>
      </filter>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="#FFFFFF" stroke="${color}" stroke-width="${strokeWidth}" filter="url(#m-shadow)"/>
    ${
      isInterchange
        ? `<circle cx="${size / 2}" cy="${size / 2}" r="${radius - 3.5}" fill="none" stroke="${line === "blue" ? "#1B5E20" : "#0D47A1"}" stroke-width="1.8" stroke-dasharray="3,2"/>`
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
  const isBlue = station.line === "blue";
  const lineColor = isBlue ? "#0D47A1" : "#1B5E20";
  const lineLabel = isBlue ? "Blue Line (Line 1)" : "Green Line (Line 2)";

  return {
    id: station.id,
    name: station.name,
    locality: `${station.locality} · ${lineLabel}`,
    address: `${station.name}, Kolkata Metro (${lineLabel})`,
    category: "Metro" as const,
    rating: "4.9",
    reviews: 320,
    distance: "Metro Station",
    color: lineColor,
    x: 50,
    y: 50,
    latitude: station.latitude,
    longitude: station.longitude,
    facilities: [
      `Metro (${isBlue ? "Blue Line" : "Green Line"})`,
      station.isInterchange ? "Interchange Station" : "Rapid Transit",
      "Ticket Counter",
      "Smart Card Gate",
    ],
    description: `${station.description} Connected via Kolkata Metro ${lineLabel}.`,
    metroLine: station.line,
  };
}
