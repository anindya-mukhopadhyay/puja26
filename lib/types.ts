import type { Timestamp } from "firebase/firestore";

export type Category =
  | "Pandal"
  | "Metro"
  | "Food"
  | "Toilet"
  | "Medical"
  | "Parking"
  | "Emergency"
  | "Other";

export type LocationItem = {
  id: string;
  name: string;
  category: Category;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  description?: string;
  photoURL?: string;
  facilities: string[];
  rating?: number;
  reviewCount?: number;
  operatingHours?: string;
  festivalDates?: string;
  contactNumber?: string;
  wheelchairAccessible?: boolean;
  status: "published" | "draft" | "archived";
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type UserAccount = {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  photoURL?: string;
  homeLocality?: string;
  createdAt?: number;
};

export type FavouriteItem = {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  locality: string;
  category: Category;
  createdAt: number;
};

export type VisitItem = {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  locality: string;
  visitedAt: string; // ISO date or formatted string
  notes?: string;
  createdAt: number;
};

export type ReviewItem = {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
};

export type GroupMember = {
  uid: string;
  displayName: string;
  role: "owner" | "member";
  joinedAt: number;
};

export type GroupStop = {
  id: string;
  locationId: string;
  name: string;
  locality: string;
  category: Category;
  latitude: number;
  longitude: number;
  completed: boolean;
  order: number;
  addedBy: string;
  suggestedTime?: string;
  notes?: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  inviteCode: string;
  createdAt: number;
  memberCount: number;
};

export type LiveLocation = {
  uid: string;
  displayName: string;
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: number;
  sharing: boolean;
};

export type ItineraryDay = "Day 1 (Saptami)" | "Day 2 (Ashtami)" | "Day 3 (Navami)" | "Custom";

export type Itinerary = {
  id: string;
  userId: string;
  title: string;
  day: ItineraryDay;
  stops: LocationItem[];
  travelMode: "walking" | "transit" | "driving";
  totalDistanceKm: number;
  totalDurationMin: number;
  createdAt: number;
  notes?: string;
};

export type WeatherForecast = {
  locality: string;
  time: string;
  tempC: number;
  condition: string;
  rainProbability: number;
  rainWarning: boolean;
  advice: string;
  updatedAt: string;
};

export type AIRecommendation = {
  id: string;
  title: string;
  summary: string;
  suggestedPandalIds: string[];
  stops: LocationItem[];
  totalDistanceKm: number;
  estimatedDuration: string;
  highlights: string[];
};
