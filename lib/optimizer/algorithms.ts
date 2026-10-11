/**
 * PUJA26 — TSP & Graph Routing Algorithms
 *
 * Implements:
 * 1. Held-Karp Dynamic Programming (O(N^2 * 2^N)) - Exact optimal solution for N <= 12.
 * 2. Multi-restart Nearest Neighbor + 2-Opt Local Search (O(k * N^2)) - Heuristic for N > 12.
 * 3. Permutation Brute Force (O(N!)) - Ground truth verification for small test suites (N <= 7).
 *
 * Supports:
 * - Directed / Asymmetric graphs (real-world one-way streets, pedestrian detours, transit timetables).
 * - Fixed Start Point (e.g. Current Location or Starting Pandal).
 * - Fixed End Point (e.g. Transit Station or Final Pandal).
 * - Closed TSP Tour (Return to Start) vs Open-ended Hamiltonian Path (One-way hopping).
 */

export type AlgorithmType = "held-karp" | "2-opt" | "brute-force" | "trivial";

export type TSPInput = {
  costMatrix: number[][]; // N x N edge costs (directed/asymmetric supported)
  fixedStartIndex?: number;
  fixedEndIndex?: number;
  returnToStart?: boolean;
  maxHeldKarpNodes?: number; // Cutoff for exact DP (default: 11)
};

export type TSPOutput = {
  orderedIndices: number[];
  totalCost: number;
  algorithmUsed: AlgorithmType;
  isExactOptimal: boolean;
  timeComplexity: string;
  executionTimeMs: number;
};

/**
 * Solves the Traveling Salesperson / Hamiltonian Path Problem
 * using a hybrid strategy (Held-Karp exact for small N, 2-Opt for large N).
 */
export function solveTSP(input: TSPInput): TSPOutput {
  const startTime = performance.now();
  const { costMatrix, fixedStartIndex, fixedEndIndex, returnToStart, maxHeldKarpNodes = 11 } = input;
  const N = costMatrix.length;

  if (N === 0) {
    return {
      orderedIndices: [],
      totalCost: 0,
      algorithmUsed: "trivial",
      isExactOptimal: true,
      timeComplexity: "O(1)",
      executionTimeMs: performance.now() - startTime,
    };
  }

  if (N === 1) {
    return {
      orderedIndices: [0],
      totalCost: 0,
      algorithmUsed: "trivial",
      isExactOptimal: true,
      timeComplexity: "O(1)",
      executionTimeMs: performance.now() - startTime,
    };
  }

  if (N === 2) {
    const s = fixedStartIndex ?? 0;
    const other = s === 0 ? 1 : 0;
    let order: number[];
    let cost: number;

    if (fixedEndIndex !== undefined) {
      order = [fixedStartIndex ?? other, fixedEndIndex];
      cost = costMatrix[order[0]][order[1]];
    } else if (returnToStart) {
      order = [s, other, s];
      cost = costMatrix[s][other] + costMatrix[other][s];
    } else if (fixedStartIndex !== undefined) {
      order = [s, other];
      cost = costMatrix[s][other];
    } else {
      // Pick cheaper direction
      if (costMatrix[0][1] <= costMatrix[1][0]) {
        order = [0, 1];
        cost = costMatrix[0][1];
      } else {
        order = [1, 0];
        cost = costMatrix[1][0];
      }
    }

    return {
      orderedIndices: order,
      totalCost: cost,
      algorithmUsed: "trivial",
      isExactOptimal: true,
      timeComplexity: "O(1)",
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Choose between Held-Karp (Exact) and 2-Opt (Heuristic) based on problem size N
  if (N <= maxHeldKarpNodes) {
    const result = heldKarpTSP(costMatrix, fixedStartIndex, fixedEndIndex, returnToStart);
    return {
      ...result,
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Large N: Multi-restart Nearest Neighbor with 2-Opt local search
  const result = twoOptTSP(costMatrix, fixedStartIndex, fixedEndIndex, returnToStart);
  return {
    ...result,
    executionTimeMs: performance.now() - startTime,
  };
}

/**
 * Held-Karp Dynamic Programming Algorithm
 * Time Complexity: O(N^2 * 2^N)
 * Space Complexity: O(N * 2^N)
 *
 * Finds the exact mathematically optimal order for Hamiltonian Path or TSP Tour.
 */
export function heldKarpTSP(
  costMatrix: number[][],
  fixedStartIndex?: number,
  fixedEndIndex?: number,
  returnToStart?: boolean
): Omit<TSPOutput, "executionTimeMs"> {
  const N = costMatrix.length;
  const numStates = 1 << N;

  // dp[mask][u] = minimum cost to visit the set of vertices represented by mask, ending at vertex u
  const dp: number[][] = Array.from({ length: numStates }, () =>
    new Array<number>(N).fill(Infinity)
  );
  // parent[mask][u] = predecessor vertex of u in the optimal path for state (mask, u)
  const parent: number[][] = Array.from({ length: numStates }, () =>
    new Array<number>(N).fill(-1)
  );

  // Initialize base states
  if (fixedStartIndex !== undefined) {
    dp[1 << fixedStartIndex][fixedStartIndex] = 0;
  } else {
    // If start is not fixed, any node can be a starting point
    for (let i = 0; i < N; i++) {
      if (fixedEndIndex !== undefined && i === fixedEndIndex && N > 1) {
        // Do not start at the fixed end node if N > 1
        continue;
      }
      dp[1 << i][i] = 0;
    }
  }

  // Iterate over all subsets of vertices by increasing mask cardinality
  for (let mask = 1; mask < numStates; mask++) {
    for (let u = 0; u < N; u++) {
      if (!(mask & (1 << u))) continue;
      const currentCost = dp[mask][u];
      if (!Number.isFinite(currentCost)) continue;

      // Try extending path from u to an unvisited vertex v
      for (let v = 0; v < N; v++) {
        if (mask & (1 << v)) continue;
        // If fixedEndIndex is set, do not visit fixedEndIndex until all other nodes are visited
        if (fixedEndIndex !== undefined && v === fixedEndIndex) {
          const nextMask = mask | (1 << v);
          if (nextMask !== numStates - 1) {
            continue;
          }
        }

        const nextMask = mask | (1 << v);
        const newCost = currentCost + costMatrix[u][v];

        if (newCost < dp[nextMask][v]) {
          dp[nextMask][v] = newCost;
          parent[nextMask][v] = u;
        }
      }
    }
  }

  const fullMask = numStates - 1;
  let bestCost = Infinity;
  let bestEndVertex = -1;

  if (returnToStart) {
    const startNode = fixedStartIndex ?? 0;
    for (let u = 0; u < N; u++) {
      if (u === startNode) continue;
      const tourCost = dp[fullMask][u] + costMatrix[u][startNode];
      if (tourCost < bestCost) {
        bestCost = tourCost;
        bestEndVertex = u;
      }
    }
  } else if (fixedEndIndex !== undefined) {
    bestCost = dp[fullMask][fixedEndIndex];
    bestEndVertex = fixedEndIndex;
  } else {
    for (let u = 0; u < N; u++) {
      if (dp[fullMask][u] < bestCost) {
        bestCost = dp[fullMask][u];
        bestEndVertex = u;
      }
    }
  }

  // Reconstruct path
  const path: number[] = [];
  let currMask = fullMask;
  let currVertex = bestEndVertex;

  while (currVertex !== -1) {
    path.push(currVertex);
    const prevVertex = parent[currMask][currVertex];
    currMask ^= 1 << currVertex;
    currVertex = prevVertex;
  }

  path.reverse();

  if (returnToStart && fixedStartIndex !== undefined) {
    path.push(fixedStartIndex);
  } else if (returnToStart && path.length > 0) {
    path.push(path[0]);
  }

  return {
    orderedIndices: path,
    totalCost: Number.isFinite(bestCost) ? bestCost : calculatePathCost(path, costMatrix),
    algorithmUsed: "held-karp",
    isExactOptimal: true,
    timeComplexity: `O(N² · 2ᴺ) [N=${N}]`,
  };
}

/**
 * Multi-restart Nearest Neighbor + 2-Opt Local Search
 * Time Complexity: O(k * N^2) where k is number of 2-opt iterations.
 *
 * Fast, highly effective heuristic for large itineraries (N > 11).
 */
export function twoOptTSP(
  costMatrix: number[][],
  fixedStartIndex?: number,
  fixedEndIndex?: number,
  returnToStart?: boolean
): Omit<TSPOutput, "executionTimeMs"> {
  const N = costMatrix.length;

  // Step 1: Generate initial tour using Nearest Neighbor
  let bestTour = nearestNeighborTour(costMatrix, fixedStartIndex, fixedEndIndex);
  let bestCost = calculatePathCost(bestTour, costMatrix, returnToStart);

  // If start is not fixed, try Nearest Neighbor from multiple start points
  if (fixedStartIndex === undefined) {
    const restarts = Math.min(N, 5);
    for (let startCandidate = 1; startCandidate < restarts; startCandidate++) {
      if (fixedEndIndex !== undefined && startCandidate === fixedEndIndex) continue;
      const candidateTour = nearestNeighborTour(costMatrix, startCandidate, fixedEndIndex);
      const candidateCost = calculatePathCost(candidateTour, costMatrix, returnToStart);
      if (candidateCost < bestCost) {
        bestTour = candidateTour;
        bestCost = candidateCost;
      }
    }
  }

  // Step 2: 2-Opt Local Search Improvement
  let improved = true;
  let iteration = 0;
  const maxIterations = 500;

  // When fixedStartIndex is set, index 0 is immutable.
  // When fixedEndIndex is set, index N-1 is immutable.
  const startIdx = fixedStartIndex !== undefined ? 1 : 0;
  const endIdx = fixedEndIndex !== undefined ? N - 2 : N - 1;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = startIdx; i <= endIdx - 1; i++) {
      for (let j = i + 1; j <= endIdx; j++) {
        // Reverse segment between i and j
        const newTour = twoOptSwap(bestTour, i, j);
        const newCost = calculatePathCost(newTour, costMatrix, returnToStart);

        if (newCost < bestCost - 1e-6) {
          bestTour = newTour;
          bestCost = newCost;
          improved = true;
          break; // First-improvement strategy
        }
      }
      if (improved) break;
    }
  }

  if (returnToStart) {
    bestTour = [...bestTour, bestTour[0]];
  }

  return {
    orderedIndices: bestTour,
    totalCost: bestCost,
    algorithmUsed: "2-opt",
    isExactOptimal: false,
    timeComplexity: `O(k · N²) [Iterations=${iteration}, N=${N}]`,
  };
}

/**
 * Greedy Nearest Neighbor construction heuristic.
 */
function nearestNeighborTour(
  costMatrix: number[][],
  fixedStartIndex?: number,
  fixedEndIndex?: number
): number[] {
  const N = costMatrix.length;
  const visited = new Set<number>();
  const tour: number[] = [];

  const start = fixedStartIndex ?? 0;
  tour.push(start);
  visited.add(start);

  if (fixedEndIndex !== undefined) {
    visited.add(fixedEndIndex); // Hold end until last
  }

  let current = start;
  while (visited.size < (fixedEndIndex !== undefined ? N : N)) {
    let nextNode = -1;
    let minCost = Infinity;

    for (let v = 0; v < N; v++) {
      if (!visited.has(v)) {
        const cost = costMatrix[current][v];
        if (cost < minCost) {
          minCost = cost;
          nextNode = v;
        }
      }
    }

    if (nextNode === -1) break;
    tour.push(nextNode);
    visited.add(nextNode);
    current = nextNode;
  }

  if (fixedEndIndex !== undefined && !tour.includes(fixedEndIndex)) {
    tour.push(fixedEndIndex);
  }

  return tour;
}

/**
 * Performs a 2-opt swap by reversing the path slice [i, j].
 */
function twoOptSwap(tour: number[], i: number, j: number): number[] {
  const result: number[] = [];
  // 1. Take 0 to i-1
  for (let k = 0; k < i; k++) {
    result.push(tour[k]);
  }
  // 2. Reverse i to j
  for (let k = j; k >= i; k--) {
    result.push(tour[k]);
  }
  // 3. Take j+1 to end
  for (let k = j + 1; k < tour.length; k++) {
    result.push(tour[k]);
  }
  return result;
}

/**
 * Calculates the total cost of a path given a cost matrix.
 */
export function calculatePathCost(path: number[], costMatrix: number[][], returnToStart = false): number {
  if (path.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    total += costMatrix[from][to];
  }
  if (returnToStart && path[path.length - 1] !== path[0]) {
    total += costMatrix[path[path.length - 1]][path[0]];
  }
  return total;
}

/**
 * Brute-Force permutation solver (O(N!))
 * Strictly for small-N correctness testing and benchmark validation (N <= 7).
 */
export function bruteForceTSP(
  costMatrix: number[][],
  fixedStartIndex?: number,
  fixedEndIndex?: number,
  returnToStart?: boolean
): Omit<TSPOutput, "executionTimeMs"> {
  const N = costMatrix.length;
  const nodes = Array.from({ length: N }, (_, i) => i);
  let bestCost = Infinity;
  let bestTour: number[] = [];

  function permute(current: number[], available: number[]) {
    if (available.length === 0) {
      if (fixedEndIndex !== undefined && current[current.length - 1] !== fixedEndIndex) {
        return;
      }
      const cost = calculatePathCost(current, costMatrix, returnToStart);
      if (cost < bestCost) {
        bestCost = cost;
        bestTour = [...current];
      }
      return;
    }

    for (let i = 0; i < available.length; i++) {
      const next = available[i];
      const remaining = [...available.slice(0, i), ...available.slice(i + 1)];
      current.push(next);
      permute(current, remaining);
      current.pop();
    }
  }

  if (fixedStartIndex !== undefined) {
    const remaining = nodes.filter((n) => n !== fixedStartIndex);
    permute([fixedStartIndex], remaining);
  } else {
    permute([], nodes);
  }

  if (returnToStart && bestTour.length > 0) {
    bestTour = [...bestTour, bestTour[0]];
  }

  return {
    orderedIndices: bestTour,
    totalCost: bestCost,
    algorithmUsed: "brute-force",
    isExactOptimal: true,
    timeComplexity: `O(N!) [N=${N}]`,
  };
}
