type ScheduledJob = {
   name: string;
   hour: number;
   minute: number;
   run: () => Promise<void>;
};

type RepeatingJob = {
   name: string;
   intervalMs: number;
   run: () => Promise<void>;
};

const jobs: ScheduledJob[] = [];
const repeatingJobs: RepeatingJob[] = [];
const runningJobs = new Set<string>();
let schedulerStarted = false;

export const registerDailyJob = (
   name: string,
   hour: number,
   minute: number,
   run: () => Promise<void>,
): void => {
   if (jobs.some((job) => job.name === name)) {
      return;
   }

   jobs.push({ name, hour, minute, run });
};

export const registerIntervalJob = (
   name: string,
   intervalMs: number,
   run: () => Promise<void>,
): void => {
   if (repeatingJobs.some((job) => job.name === name)) {
      return;
   }

   repeatingJobs.push({ name, intervalMs, run });
};

const msUntilNextRun = (hour: number, minute: number): number => {
   const now = new Date();
   const next = new Date(now);
   next.setHours(hour, minute, 0, 0);

   if (next <= now) {
      next.setDate(next.getDate() + 1);
   }

   return next.getTime() - now.getTime();
};

const runJobSafely = async (job: ScheduledJob): Promise<boolean> => {
   if (runningJobs.has(job.name)) {
      console.warn(
         `[scheduler] Skipping "${job.name}" — previous run still in progress`,
      );
      return false;
   }

   runningJobs.add(job.name);
   const startedAt = new Date().toISOString();

   try {
      console.log(`[scheduler] Starting job "${job.name}" at ${startedAt}`);
      await job.run();
      return true;
   } catch (error) {
      console.error(`[scheduler] Job "${job.name}" failed:`, error);
      return false;
   } finally {
      runningJobs.delete(job.name);
      console.log(`[scheduler] Finished job "${job.name}"`);
   }
};

const scheduleJob = (job: ScheduledJob): void => {
   const scheduleNext = (): void => {
      const delayMs = msUntilNextRun(job.hour, job.minute);

      setTimeout(async () => {
         await runJobSafely(job);
         scheduleNext();
      }, delayMs);
   };

   scheduleNext();
};

const scheduleRepeatingJob = (job: RepeatingJob): void => {
   const scheduleNext = (): void => {
      setTimeout(async () => {
         await runJobSafely({
            name: job.name,
            hour: 0,
            minute: 0,
            run: job.run,
         });
         scheduleNext();
      }, job.intervalMs);
   };

   scheduleNext();
};

export const startScheduler = (): void => {
   if (schedulerStarted) {
      return;
   }

   schedulerStarted = true;

   const scheduledJobs = jobs.length + repeatingJobs.length;

   if (scheduledJobs === 0) {
      return;
   }

   console.log(
      `[scheduler] Starting ${scheduledJobs} job(s): ${[...jobs.map((job) => job.name), ...repeatingJobs.map((job) => job.name)].join(', ')}`,
   );

   for (const job of jobs) {
      scheduleJob(job);
   }

   for (const job of repeatingJobs) {
      scheduleRepeatingJob(job);
   }
};
