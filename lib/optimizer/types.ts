export type TravelMode = "WALKING" | "TRANSIT" | "DRIVING";

export type OptimizationObjective = "FASTEST" | "SHORTEST" | "MIN_WALKING";

export type LocationNode = {
  id: string;
  name: string;
  locality?: string;
  address?: string;
  latitude: number;
  longitude: number;
  dwellMinutes?: number;
  isUserOrigin?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
};

export type RouteMatrixElement = {
  originIndex: number;
  destIndex: number;
  distanceMeters: number;
  durationSeconds: number;
  walkingDistanceMeters: number;
  transitDurationSeconds?: number;
  transitStepsCount?: number;
  transitLines?: string[];
  status: "OK" | "ZERO_RESULTS" | "UNREACHABLE" | "FALLBACK";
};

export type RouteConstraints = {
  fixedStartIndex?: number; // Pin specific start node (e.g. current GPS location or first pandal)
  fixedEndIndex?: number;   // Pin specific end node (e.g. transit station or hotel)
  returnToStart?: boolean;  // Round-trip TSP tour returning to the starting point
  startTime?: Date;         // Starting time for timetable arrival estimates
  dwellMinutesPerPandal?: number; // Time spent at each pandal (default: 25-30m)
};

export type LegSummary = {
  fromNode: LocationNode;
  toNode: LocationNode;
  distanceMeters: number;
  durationSeconds: number;
  walkingDistanceMeters: number;
  transitDurationSeconds?: number;
  transitLines?: string[];
  departureTime?: string;
  arrivalTime?: string;
};

export type RouteComparison = {
  originalDistanceMeters: number;
  originalDurationSeconds: number;
  originalWalkingMeters: number;
  optimizedDistanceMeters: number;
  optimizedDurationSeconds: number;
  optimizedWalkingMeters: number;
  distanceSavedMeters: number;
  durationSavedSeconds: number;
  walkingSavedMeters: number;
  percentDistanceSaved: number;
  percentDurationSaved: number;
};

export type OptimizationResult = {
  orderedIndices: number[];
  orderedStops: LocationNode[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalWalkingDistanceMeters: number;
  legs: LegSummary[];
  isExactOptimal: boolean;
  algorithmUsed: "held-karp" | "2-opt" | "brute-force" | "trivial";
  timeComplexity: string;
  executionTimeMs: number;
  comparison?: RouteComparison;
  overviewPolyline?: string;
  warningNotice?: string;
};
