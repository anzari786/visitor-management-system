// prisma/seed.ts
import { IdType, VisitStatus } from '../src/generated/prisma/client.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import {
   subMonths,
   addDays,
   addMinutes,
   setHours,
   setMinutes,
   setSeconds,
   isWeekend,
   isBefore,
   isAfter,
   differenceInMinutes,
} from 'date-fns';
import { prisma } from '../src/lib/prisma.js';

const BCRYPT_COST = 12;
const MONTHS_OF_HISTORY = 11;
const OVERSTAY_AFTER_MINS = 120;
const BADGE_PREFIX = 'ATI';
const ORG_NAME = 'Ethiopian Agricultural Transformation Institute';

// ── Roles ─────────────────────────────────────
const ROLE_NAMES = ['admin', 'front_desk'] as const;

// ── Departments ───────────────────────────────
const DEPARTMENTS = [
   { name: 'Human Resources', shortName: 'HR', color: '#35B9E9' },
   { name: 'Finance', shortName: 'FIN', color: '#6E3FF3' },
   { name: 'Information Technology', shortName: 'IT', color: '#375DFB' },
   { name: 'Research & Development', shortName: 'R&D', color: '#00D084' },
   { name: 'Procurement', shortName: 'PROC', color: '#FF6900' },
   { name: 'Legal Affairs', shortName: 'LEGAL', color: '#EB144C' },
];

// ── Users ─────────────────────────────────────
const USERS: Array<{
   firstName: string;
   lastName: string;
   username: string;
   role: (typeof ROLE_NAMES)[number];
   phone: string;
}> = [
   {
      firstName: 'System',
      lastName: 'Administrator',
      username: 'admin',
      role: 'admin',
      phone: '+251 911 223 344',
   },
   {
      firstName: 'Operations',
      lastName: 'Manager',
      username: 'manager',
      role: 'admin',
      phone: '+251 911 556 677',
   },
   {
      firstName: 'Abel',
      lastName: 'Tesfaye',
      username: 'reception1',
      role: 'front_desk',
      phone: '+251 922 334 455',
   },
   {
      firstName: 'Sara',
      lastName: 'Bekele',
      username: 'reception2',
      role: 'front_desk',
      phone: '+251 933 445 566',
   },
];

const DEFAULT_PASSWORD = 'Password123!';

// ── Helpers ───────────────────────────────────

function randomBusinessHourTimestamp(day: Date): Date {
   // Weighted toward 9am–11am and 1pm–3pm arrival clusters, spread 8am–5pm
   const clusters = [
      { start: 8, end: 9, weight: 1 },
      { start: 9, end: 11, weight: 3 },
      { start: 11, end: 13, weight: 2 },
      { start: 13, end: 15, weight: 3 },
      { start: 15, end: 17, weight: 1 },
   ];
   const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);
   let roll = Math.random() * totalWeight;
   const cluster = clusters.find((c) => {
      roll -= c.weight;
      return roll <= 0;
   })!;

   const hour = faker.number.int({ min: cluster.start, max: cluster.end - 1 });
   const minute = faker.number.int({ min: 0, max: 59 });

   return setSeconds(setMinutes(setHours(day, hour), minute), 0);
}

function randomVisitDurationMins(overstay: boolean): number {
   if (overstay) {
      // Overstay: 2h05m to 5h
      return faker.number.int({ min: OVERSTAY_AFTER_MINS + 5, max: 300 });
   }
   // Normal: 10 minutes to just under 2 hours
   return faker.number.int({ min: 10, max: OVERSTAY_AFTER_MINS - 5 });
}

async function hashPassword(password: string): Promise<string> {
   return bcrypt.hash(password, BCRYPT_COST);
}

// ── Seed ──────────────────────────────────────

async function main() {
   console.log('Seeding started...\n');

   // Clear existing data (respecting FK order)
   await prisma.visit.deleteMany();
   await prisma.visitor.deleteMany();
   await prisma.department.deleteMany();
   await prisma.userRole.deleteMany();
   await prisma.user.deleteMany();
   await prisma.role.deleteMany();
   await prisma.setting.deleteMany();

   // ── Settings ──
   await prisma.setting.create({
      data: {
         id: 1,
         orgName: ORG_NAME,
         badgePrefix: BADGE_PREFIX,
         overstayEnabled: true,
         overstayAfterMins: OVERSTAY_AFTER_MINS,
      },
   });
   console.log('Created settings');

   // ── Roles ──
   const roles = await Promise.all(
      ROLE_NAMES.map((name) => prisma.role.create({ data: { name } })),
   );
   const roleByName = Object.fromEntries(
      roles.map((role) => [role.name, role]),
   ) as Record<(typeof ROLE_NAMES)[number], (typeof roles)[number]>;
   console.log(`Created ${roles.length} roles (${ROLE_NAMES.join(', ')})`);

   // ── Departments ──
   const departments = await Promise.all(
      DEPARTMENTS.map((d) =>
         prisma.department.create({
            data: {
               name: d.name,
               shortName: d.shortName,
               color: d.color,
               isActive: true,
            },
         }),
      ),
   );
   console.log(`Created ${departments.length} departments`);

   // ── Users ──
   const passwordHash = await hashPassword(DEFAULT_PASSWORD);
   const users = await Promise.all(
      USERS.map((u) =>
         prisma.user.create({
            data: {
               firstName: u.firstName,
               lastName: u.lastName,
               username: u.username,
               passwordHash,
               phone: u.phone,
               isActive: true,
               mustChangePassword: false,
               lastLoginAt: faker.date.recent({ days: 3 }),
            },
         }),
      ),
   );

   // ── UserRoles ──
   await Promise.all(
      USERS.map((u, i) =>
         prisma.userRole.create({
            data: {
               userId: users[i].id,
               roleId: roleByName[u.role].id,
            },
         }),
      ),
   );

   const adminUsers = users.filter((_, i) => USERS[i].role === 'admin');
   const frontDeskUsers = users.filter((_, i) => USERS[i].role === 'front_desk');
   console.log(`Created ${users.length} users (2 admin, 2 front desk)`);
   console.log(`Default password for all users: ${DEFAULT_PASSWORD}\n`);

   // ── Visitor pool ──
   // A mix of one-time visitors and repeat visitors (~30% repeat rate)
   const VISITOR_POOL_SIZE = 220;
   const visitorPool = await Promise.all(
      Array.from({ length: VISITOR_POOL_SIZE }).map(async () => {
         const idType = faker.helpers.weightedArrayElement([
            { value: IdType.national_id, weight: 5 },
            { value: IdType.kebele_id, weight: 3 },
            { value: IdType.passport, weight: 1 },
            { value: IdType.drivers_license, weight: 1 },
         ]);
         return prisma.visitor.create({
            data: {
               fullName: faker.person.fullName(),
               phone: faker.helpers.maybe(
                  () =>
                     `+251 ${faker.helpers.arrayElement(['91', '92', '93', '94', '95'])} ${faker.string.numeric(3)} ${faker.string.numeric(3)}`,
                  {
                     probability: 0.85,
                  },
               ),
               idType,
               idNumber: faker.string.alphanumeric({
                  length: 9,
                  casing: 'upper',
               }),
            },
         });
      }),
   );
   console.log(`Created ${visitorPool.length} visitor records`);

   // ── Visits across 11 months ──
   const now = new Date();
   const startDate = subMonths(now, MONTHS_OF_HISTORY);

   type PendingVisit = {
      badgeNumber: number;
      visitorId: number;
      departmentId: number;
      hostName: string;
      checkedInAt: Date;
      checkedInById: number;
      status: VisitStatus;
      checkedOutAt: Date | null;
      checkedOutById: number | null;
      checkoutNote: string | null;
   };

   const visitsToCreate: PendingVisit[] = [];

   let cursor = new Date(startDate);
   while (isBefore(cursor, now)) {
      // Skip weekends — government intranet, low/no weekend traffic
      if (isWeekend(cursor)) {
         cursor = addDays(cursor, 1);
         continue;
      }

      const isToday =
         cursor.getFullYear() === now.getFullYear() &&
         cursor.getMonth() === now.getMonth() &&
         cursor.getDate() === now.getDate();

      // 8–35 visits per business day
      const visitsToday = faker.number.int({ min: 8, max: 35 });
      let dailyBadgeCounter = 1;

      for (let i = 0; i < visitsToday; i++) {
         const checkedInAt = randomBusinessHourTimestamp(cursor);

         // Don't create check-ins in the future
         if (isAfter(checkedInAt, now)) continue;

         const department = faker.helpers.arrayElement(departments);
         const checkedInBy = faker.helpers.arrayElement(frontDeskUsers);
         const visitor = faker.helpers.arrayElement(visitorPool);

         // Status distribution
         // - Rare cancellations (~3%)
         // - If it's today and recent, some remain active
         // - ~8% of completed visits overstayed before checkout
         const isCancelled = faker.number.int({ min: 1, max: 100 }) <= 3;

         const minutesSinceCheckIn = differenceInMinutes(now, checkedInAt);
         const stillOpenCandidate =
            isToday &&
            minutesSinceCheckIn < 480 &&
            faker.number.int({ min: 1, max: 100 }) <= 25;

         let status: VisitStatus;
         let checkedOutAt: Date | null = null;
         let checkedOutById: number | null = null;
         let checkoutNote: string | null = null;

         if (isCancelled) {
            status = VisitStatus.cancelled;
         } else if (stillOpenCandidate) {
            status = VisitStatus.active;
            // If open long enough, this becomes an overstay case naturally
         } else {
            status = VisitStatus.completed;
            const overstay = faker.number.int({ min: 1, max: 100 }) <= 8;
            const durationMins = randomVisitDurationMins(overstay);
            checkedOutAt = addMinutes(checkedInAt, durationMins);

            if (isAfter(checkedOutAt, now)) {
               // Clamp — shouldn't check out in the future
               checkedOutAt = now;
            }

            checkedOutById = faker.helpers.arrayElement(
               faker.datatype.boolean({ probability: 0.9 })
                  ? frontDeskUsers
                  : adminUsers,
            ).id;

            if (overstay) {
               checkoutNote = faker.helpers.arrayElement([
                  'Meeting ran longer than scheduled.',
                  'Waited for host availability.',
                  'Extended discussion with department head.',
                  null,
               ]);
            }
         }

         visitsToCreate.push({
            badgeNumber: dailyBadgeCounter++,
            visitorId: visitor.id,
            departmentId: department.id,
            hostName: faker.person.fullName(),
            checkedInAt,
            checkedInById: checkedInBy.id,
            status,
            checkedOutAt,
            checkedOutById,
            checkoutNote,
         });

         if (dailyBadgeCounter > 999) dailyBadgeCounter = 1; // wrap, matches 3-digit badge constraint
      }

      cursor = addDays(cursor, 1);
   }

   console.log(`Prepared ${visitsToCreate.length} visits, inserting...`);

   // Batch insert in chunks to avoid overwhelming MySQL connection/packet limits
   const CHUNK_SIZE = 500;
   for (let i = 0; i < visitsToCreate.length; i += CHUNK_SIZE) {
      const chunk = visitsToCreate.slice(i, i + CHUNK_SIZE);
      await prisma.visit.createMany({ data: chunk });
      console.log(
         `  Inserted ${Math.min(i + CHUNK_SIZE, visitsToCreate.length)} / ${visitsToCreate.length}`,
      );
   }

   console.log('\nSeeding complete.');
   console.log(`- Org: ${ORG_NAME}`);
   console.log(`- Badge prefix: ${BADGE_PREFIX}`);
   console.log(`- Overstay threshold: ${OVERSTAY_AFTER_MINS} mins (2 hours)`);
   console.log(
      `- Departments: ${departments.map((d) => d.shortName).join(', ')}`,
   );
   console.log(`- Users: ${users.map((u) => u.username).join(', ')}`);
   console.log(`- Total visits: ${visitsToCreate.length}`);
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
