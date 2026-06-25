const logger = {
  info: async (pkg: string, msg: string) => console.log(`[INFO] [${pkg}] ${msg}`),
  error: async (pkg: string, msg: string) => console.log(`[ERROR] [${pkg}] ${msg}`),
  fatal: async (pkg: string, msg: string) => console.log(`[FATAL] [${pkg}] ${msg}`),
};

const BASE_URL = "http://4.224.186.213/evaluation-service";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";
const requestHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

interface Depot {
  ID: number;
  MechanicHours: number;
}

interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

function findBestSchedule(budgetHours: number, vehicles: Vehicle[]) {
  const n = vehicles.length;
  const dp = new Array(budgetHours + 1).fill(0);
  const picked: boolean[][] = Array.from({ length: n }, () =>
    new Array(budgetHours + 1).fill(false)
  );

  for (let i = 0; i < n; i++) {
    const { Duration, Impact } = vehicles[i];
    for (let w = budgetHours; w >= Duration; w--) {
      if (dp[w - Duration] + Impact > dp[w]) {
        dp[w] = dp[w - Duration] + Impact;
        picked[i][w] = true;
      }
    }
  }

  const selectedTaskIDs: string[] = [];
  let remaining = budgetHours;

  for (let i = n - 1; i >= 0; i--) {
    if (picked[i][remaining]) {
      selectedTaskIDs.push(vehicles[i].TaskID);
      remaining -= vehicles[i].Duration;
    }
  }

  return {
    maxImpact: dp[budgetHours],
    selectedTaskIDs,
    hoursUsed: budgetHours - remaining,
  };
}

async function getDepots(): Promise<Depot[]> {
  await logger.info("fetcher", "Fetching depots from API...");
  try {
    const res = await fetch(`${BASE_URL}/depots`, { headers: requestHeaders });
    if (!res.ok) {
      await logger.error("fetcher", `Failed to fetch depots — HTTP ${res.status}`);
      throw new Error(`Depots API returned ${res.status}`);
    }
    const data = await res.json() as { depots: Depot[] };
    await logger.info("fetcher", `Got ${data.depots.length} depots successfully`);
    return data.depots;
  } catch (err) {
    await logger.fatal("fetcher", `Exception while fetching depots: ${err}`);
    throw err;
  }
}

async function getVehicles(): Promise<Vehicle[]> {
  await logger.info("fetcher", "Fetching vehicles from API...");
  try {
    const res = await fetch(`${BASE_URL}/vehicles`, { headers: requestHeaders });
    if (!res.ok) {
      await logger.error("fetcher", `Failed to fetch vehicles — HTTP ${res.status}`);
      throw new Error(`Vehicles API returned ${res.status}`);
    }
    const data = await res.json() as { vehicles: Vehicle[] };
    await logger.info("fetcher", `Got ${data.vehicles.length} vehicles successfully`);
    return data.vehicles;
  } catch (err) {
    await logger.fatal("fetcher", `Exception while fetching vehicles: ${err}`);
    throw err;
  }
}

async function main() {
  await logger.info("main", "Vehicle Maintenance Scheduler starting...");

  const [depots, vehicles] = await Promise.all([getDepots(), getVehicles()]);

  await logger.info("main", `Loaded ${depots.length} depots and ${vehicles.length} vehicles`);

  console.log("\n" + "=".repeat(65));
  console.log("       VEHICLE MAINTENANCE SCHEDULER — RESULTS");
  console.log("=".repeat(65));

  for (const depot of depots) {
    await logger.info("scheduler", `Running scheduler for Depot ${depot.ID} — budget: ${depot.MechanicHours} hours`);

    const { maxImpact, selectedTaskIDs, hoursUsed } = findBestSchedule(depot.MechanicHours, vehicles);

    console.log(`\nDepot ID         : ${depot.ID}`);
    console.log(`Budget (hours)   : ${depot.MechanicHours}`);
    console.log(`Hours Used       : ${hoursUsed}`);
    console.log(`Max Impact Score : ${maxImpact}`);
    console.log(`Tasks Selected   : ${selectedTaskIDs.length}`);
    console.log(`Task IDs:`);
    selectedTaskIDs.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
    console.log("-".repeat(65));

    await logger.info("scheduler", `Depot ${depot.ID} complete — impact: ${maxImpact}, hours used: ${hoursUsed}/${depot.MechanicHours}, tasks: ${selectedTaskIDs.length}`);
  }

  await logger.info("main", "All depots processed — scheduler finished successfully");
}

main().catch(async (err) => {
  await logger.fatal("main", `Unhandled error in scheduler: ${err}`);
  console.error(err);
  process.exit(1);
});