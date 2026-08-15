// prisma/seed.ts
import {
   RoleName,
   AuthProvider,
   BadgeStatus,
   VisitSource,
   VisitStatus,
   VisitorGroupType,
   VisitDurationType,
   VisitPurpose,
   IdType,
   AttendanceStatus,
} from '../src/generated/prisma/client.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { addDays, format, isBefore, isWeekend, subMonths } from 'date-fns';
import { prisma } from '../src/config/prisma.js';
import { randomBytes } from 'node:crypto';

const BCRYPT_COST = 12;
const DEFAULT_PASSWORD = 'Password123!';
const ORG_NAME = 'Ethiopian Agricultural Transformation Institute';
const BADGE_PREFIX = 'ATI';
const OVERSTAY_AFTER_MINS = 120;

const DEPARTMENTS = [
   { name: 'Human Resources', shortName: 'HR' },
   { name: 'Finance', shortName: 'FIN' },
   { name: 'Information Technology', shortName: 'IT' },
   { name: 'Research & Development', shortName: 'R&D' },
   { name: 'Procurement', shortName: 'PROC' },
   { name: 'Legal Affairs', shortName: 'LEGAL' },
] as const;

const STAFF_USERS: Array<{
   firstName: string;
   lastName: string;
   username: string;
   email: string;
   role: RoleName;
   phone: string;
}> = [
   {
      firstName: 'System',
      lastName: 'Administrator',
      username: 'admin',
      email: 'admin@ati.gov.et',
      role: RoleName.ADMIN,
      phone: '+251 911 223 344',
   },
   {
      firstName: 'Operations',
      lastName: 'Manager',
      username: 'manager',
      email: 'manager@ati.gov.et',
      role: RoleName.MANAGER,
      phone: '+251 911 556 677',
   },
   {
      firstName: 'Abel',
      lastName: 'Tesfaye',
      username: 'guard1',
      email: 'guard1@ati.gov.et',
      role: RoleName.GUARD,
      phone: '+251 922 334 455',
   },
   {
      firstName: 'Sara',
      lastName: 'Bekele',
      username: 'reception1',
      email: 'reception1@ati.gov.et',
      role: RoleName.RECEPTION,
      phone: '+251 933 445 566',
   },
];

function token(bytes = 24) {
   return randomBytes(bytes).toString('hex');
}

function visitCode() {
   return `VIS-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`;
}

function startOf(date: Date) {
   const d = new Date(date);
   d.setHours(0, 0, 0, 0);
   return d;
}

async function main() {
   console.log('Seeding started...\n');

   await prisma.visitAttendance.deleteMany();
   await prisma.visitStatusHistory.deleteMany();
   await prisma.notification.deleteMany();
   await prisma.visitParticipant.deleteMany();
   await prisma.visitDay.deleteMany();
   await prisma.visit.deleteMany();
   await prisma.badge.deleteMany();
   await prisma.visitor.deleteMany();
   await prisma.userRole.deleteMany();
   await prisma.passwordSetupToken.deleteMany();
   await prisma.user.deleteMany();
   await prisma.employee.deleteMany();
   await prisma.role.deleteMany();
   await prisma.systemSetting.deleteMany();

   await prisma.systemSetting.createMany({
      data: [
         { key: 'orgName', value: ORG_NAME },
         { key: 'badgePrefix', value: BADGE_PREFIX },
         { key: 'overstayEnabled', value: 'true' },
         { key: 'overstayAfterMins', value: String(OVERSTAY_AFTER_MINS) },
      ],
   });
   console.log('Created system settings');

   const roles = await Promise.all(
      (
         [
            RoleName.GUARD,
            RoleName.RECEPTION,
            RoleName.ADMIN,
            RoleName.MANAGER,
         ] as const
      ).map((name) =>
         prisma.role.create({
            data: {
               name,
               description: `${name} role`,
            },
         }),
      ),
   );
   const roleByName = Object.fromEntries(roles.map((r) => [r.name, r])) as Record<
      RoleName,
      (typeof roles)[number]
   >;
   console.log(`Created ${roles.length} roles`);

   const employees = await Promise.all(
      DEPARTMENTS.flatMap((dept, deptIndex) =>
         [0, 1].map(async (i) => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            return prisma.employee.create({
               data: {
                  externalEmployeeId: `HR-${dept.shortName}-${i + 1}`,
                  firstName,
                  lastName,
                  email: `${firstName}.${lastName}.${deptIndex}${i}@ati.gov.et`
                     .toLowerCase()
                     .replace(/[^a-z0-9.@]/g, ''),
                  phone: `+251 9${faker.string.numeric(8)}`,
                  position: faker.person.jobTitle(),
                  departmentName: dept.name,
                  departmentCode: dept.shortName,
                  isActive: true,
                  lastSyncedAt: new Date(),
               },
            });
         }),
      ),
   );
   console.log(`Created ${employees.length} employees (hosts)`);

   const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_COST);

   // Dashboard staff — local username/password auth
   const staffUsers = await Promise.all(
      STAFF_USERS.map((u) =>
         prisma.user.create({
            data: {
               authProvider: AuthProvider.LOCAL,
               firstName: u.firstName,
               lastName: u.lastName,
               username: u.username,
               email: u.email,
               phone: u.phone,
               passwordHash,
               mustChangePassword: false,
               isActive: true,
               lastLoginAt: faker.date.recent({ days: 3 }),
            },
         }),
      ),
   );
   await Promise.all(
      STAFF_USERS.map((u, i) =>
         prisma.userRole.create({
            data: {
               userId: staffUsers[i].id,
               roleId: roleByName[u.role].id,
            },
         }),
      ),
   );

   // Hosts authenticate via company SSO (externalSubject + employee link)
   const hostEmployees = employees.slice(0, 2);
   const hostUsers = await Promise.all(
      hostEmployees.map((employee, index) =>
         prisma.user.create({
            data: {
               authProvider: AuthProvider.SSO,
               externalSubject: `sso-host-${index + 1}`,
               firstName: employee.firstName,
               lastName: employee.lastName,
               email: employee.email,
               phone: employee.phone,
               employeeId: employee.id,
               isActive: true,
               mustChangePassword: false,
            },
         }),
      ),
   );

   const guardUsers = staffUsers.filter(
      (_, i) => STAFF_USERS[i].role === RoleName.GUARD,
   );
   const receptionUsers = staffUsers.filter(
      (_, i) => STAFF_USERS[i].role === RoleName.RECEPTION,
   );
   const adminUser = staffUsers.find(
      (_, i) => STAFF_USERS[i].role === RoleName.ADMIN,
   )!;

   console.log(`Created ${staffUsers.length} staff users + ${hostUsers.length} SSO host users`);
   console.log(`Default local password: ${DEFAULT_PASSWORD}\n`);

   // Badges — mostly available, some assigned / lost / disabled
   const badges = await Promise.all(
      Array.from({ length: 60 }).map((_, i) => {
         let status: BadgeStatus = BadgeStatus.AVAILABLE;
         if (i === 58) status = BadgeStatus.LOST;
         if (i === 59) status = BadgeStatus.DISABLED;

         return prisma.badge.create({
            data: {
               badgeNumber: `${BADGE_PREFIX}-${String(i + 1).padStart(3, '0')}`,
               qrToken: token(16),
               status,
               notes:
                  status === BadgeStatus.DISABLED
                     ? 'Retired from circulation'
                     : status === BadgeStatus.LOST
                       ? 'Reported missing'
                       : undefined,
            },
         });
      }),
   );
   console.log(`Created ${badges.length} badges`);

   const today = startOf(new Date());
   const tomorrow = addDays(today, 1);
   const dayAfter = addDays(today, 2);
   let badgeCursor = 0;
   const nextAssignableBadge = () => badges[badgeCursor++];

   const createVisitor = async (overrides?: {
      firstName?: string;
      lastName?: string;
      idNumber?: string;
   }) =>
      prisma.visitor.create({
         data: {
            firstName: overrides?.firstName ?? faker.person.firstName(),
            lastName: overrides?.lastName ?? faker.person.lastName(),
            email: faker.internet.email().toLowerCase(),
            phone: `+251 9${faker.string.numeric(8)}`,
            organization: faker.company.name(),
            idType: IdType.NATIONAL_ID,
            idNumber:
               overrides?.idNumber ??
               faker.string.alphanumeric({ length: 10, casing: 'upper' }),
         },
      });

   type SeedVisitInput = {
      source: VisitSource;
      groupType: VisitorGroupType;
      durationType: VisitDurationType;
      status: VisitStatus;
      purpose: VisitPurpose;
      host: (typeof employees)[number];
      days: Date[];
      visitors: Array<Awaited<ReturnType<typeof createVisitor>>>;
      floor?: string;
      room?: string;
      createdById?: number;
      decidedById?: number;
   };

   const createSeedVisit = async (input: SeedVisitInput) => {
      const needsDecision =
         input.status !== VisitStatus.PENDING_APPROVAL;

      return prisma.visit.create({
         data: {
            visitCode: visitCode(),
            qrToken: token(),
            source: input.source,
            groupType: input.groupType,
            durationType: input.durationType,
            status: input.status,
            purpose: input.purpose,
            hostEmployeeId: input.host.id,
            hostNameSnapshot: `${input.host.firstName} ${input.host.lastName}`,
            hostEmailSnapshot: input.host.email,
            departmentNameSnapshot: input.host.departmentName,
            departmentCodeSnapshot: input.host.departmentCode,
            floor: input.floor,
            room: input.room,
            startDate: input.days[0],
            endDate: input.days[input.days.length - 1],
            startTime: '09:00',
            endTime: '17:00',
            expectedVisitorCount: input.visitors.length,
            createdById: input.createdById,
            decidedById: needsDecision ? input.decidedById : undefined,
            decisionAt: needsDecision ? new Date() : undefined,
            decisionNote:
               input.status === VisitStatus.REJECTED
                  ? 'Host unavailable'
                  : input.status === VisitStatus.CANCELLED
                    ? 'Visit cancelled'
                    : undefined,
            days: { create: input.days.map((date) => ({ date })) },
            participants: {
               create: input.visitors.map((v) => ({ visitorId: v.id })),
            },
            statusHistory: {
               create: [
                  {
                     fromStatus: null,
                     toStatus: VisitStatus.PENDING_APPROVAL,
                     changedById: input.createdById,
                  },
                  ...(input.status !== VisitStatus.PENDING_APPROVAL
                     ? [
                          {
                             fromStatus: VisitStatus.PENDING_APPROVAL,
                             toStatus:
                                input.status === VisitStatus.RESCHEDULED
                                   ? VisitStatus.APPROVED
                                   : input.status ===
                                          VisitStatus.PARTIALLY_CHECKED_IN ||
                                       input.status === VisitStatus.CHECKED_IN ||
                                       input.status ===
                                          VisitStatus.PARTIALLY_CHECKED_OUT ||
                                       input.status === VisitStatus.CHECKED_OUT
                                     ? VisitStatus.APPROVED
                                     : input.status,
                             changedById: input.decidedById,
                          },
                       ]
                     : []),
                  ...(input.status === VisitStatus.PARTIALLY_CHECKED_IN ||
                  input.status === VisitStatus.CHECKED_IN ||
                  input.status === VisitStatus.PARTIALLY_CHECKED_OUT ||
                  input.status === VisitStatus.CHECKED_OUT
                     ? [
                          {
                             fromStatus: VisitStatus.APPROVED,
                             toStatus: input.status,
                             changedById: guardUsers[0]?.id,
                          },
                       ]
                     : []),
                  ...(input.status === VisitStatus.RESCHEDULED
                     ? [
                          {
                             fromStatus: VisitStatus.APPROVED,
                             toStatus: VisitStatus.RESCHEDULED,
                             changedById: input.decidedById,
                             note: 'Moved to new dates',
                          },
                       ]
                     : []),
               ],
            },
         },
         include: { days: true, participants: true },
      });
   };

   // ── Sample visits covering current workflow ───────────────────────────

   // 1) Single-day individual — currently checked in (QR check-out demo)
   const visitorA = await createVisitor({
      firstName: 'Kidist',
      lastName: 'Alemu',
      idNumber: 'ID-SEED-001',
   });
   const activeSingle = await createSeedVisit({
      source: VisitSource.PUBLIC,
      groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY,
      status: VisitStatus.CHECKED_IN,
      purpose: VisitPurpose.MEETING,
      host: employees[0],
      days: [today],
      visitors: [visitorA],
      floor: '1st Floor',
      room: 'Conference Room A',
      createdById: receptionUsers[0]?.id,
      decidedById: hostUsers[0]?.id ?? receptionUsers[0]?.id,
   });
   const assignedBadge = nextAssignableBadge();
   await prisma.badge.update({
      where: { id: assignedBadge.id },
      data: { status: BadgeStatus.ASSIGNED },
   });
   await prisma.visitAttendance.create({
      data: {
         participantId: activeSingle.participants[0].id,
         visitDayId: activeSingle.days[0].id,
         status: AttendanceStatus.CHECKED_IN,
         badgeId: assignedBadge.id,
         badgeAssignedAt: new Date(),
         personalIdRetained: true,
         checkInAt: new Date(),
         checkedInById: guardUsers[0]?.id,
      },
   });

   // 2) Group single-day — approved, ready for QR check-in (mixed expected)
   const groupVisitors = await Promise.all([
      createVisitor({ firstName: 'Yonas', lastName: 'Hailu', idNumber: 'ID-SEED-G1' }),
      createVisitor({ firstName: 'Marta', lastName: 'Gebre', idNumber: 'ID-SEED-G2' }),
      createVisitor({ firstName: 'Daniel', lastName: 'Kebede', idNumber: 'ID-SEED-G3' }),
   ]);
   const approvedGroup = await createSeedVisit({
      source: VisitSource.RECEPTION,
      groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.SINGLE_DAY,
      status: VisitStatus.APPROVED,
      purpose: VisitPurpose.OFFICIAL_VISIT,
      host: employees[1],
      days: [today],
      visitors: groupVisitors,
      floor: '2nd Floor',
      room: 'Board Room',
      createdById: receptionUsers[0]?.id,
      decidedById: hostUsers[1]?.id ?? adminUser.id,
   });
   for (const participant of approvedGroup.participants) {
      await prisma.visitAttendance.create({
         data: {
            participantId: participant.id,
            visitDayId: approvedGroup.days[0].id,
            status: AttendanceStatus.EXPECTED,
         },
      });
   }

   // 3) Multi-day group — partially checked in today
   const multiVisitors = await Promise.all([
      createVisitor({ idNumber: 'ID-SEED-M1' }),
      createVisitor({ idNumber: 'ID-SEED-M2' }),
   ]);
   const multiDay = await createSeedVisit({
      source: VisitSource.HOST_INVITATION,
      groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.MULTI_DAY,
      status: VisitStatus.PARTIALLY_CHECKED_IN,
      purpose: VisitPurpose.INTERVIEW,
      host: employees[2],
      days: [today, tomorrow, dayAfter],
      visitors: multiVisitors,
      floor: 'Ground Floor',
      room: 'Interview Suite',
      createdById: hostUsers[0]?.id,
      decidedById: hostUsers[0]?.id,
   });
   const multiBadge = nextAssignableBadge();
   await prisma.badge.update({
      where: { id: multiBadge.id },
      data: { status: BadgeStatus.ASSIGNED },
   });
   for (const day of multiDay.days) {
      for (const [index, participant] of multiDay.participants.entries()) {
         const isToday = startOf(day.date).getTime() === today.getTime();
         if (isToday && index === 0) {
            await prisma.visitAttendance.create({
               data: {
                  participantId: participant.id,
                  visitDayId: day.id,
                  status: AttendanceStatus.CHECKED_IN,
                  badgeId: multiBadge.id,
                  badgeAssignedAt: new Date(),
                  personalIdRetained: true,
                  checkInAt: new Date(),
                  checkedInById: guardUsers[0]?.id,
               },
            });
         } else {
            await prisma.visitAttendance.create({
               data: {
                  participantId: participant.id,
                  visitDayId: day.id,
                  status: AttendanceStatus.EXPECTED,
               },
            });
         }
      }
   }

   // 4) Pending approval (public request)
   await createSeedVisit({
      source: VisitSource.PUBLIC,
      groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY,
      status: VisitStatus.PENDING_APPROVAL,
      purpose: VisitPurpose.DELIVERY,
      host: employees[3],
      days: [tomorrow],
      visitors: [await createVisitor({ idNumber: 'ID-SEED-P1' })],
   });

   // 5) Rejected
   await createSeedVisit({
      source: VisitSource.PUBLIC,
      groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY,
      status: VisitStatus.REJECTED,
      purpose: VisitPurpose.OTHER,
      host: employees[4],
      days: [today],
      visitors: [await createVisitor({ idNumber: 'ID-SEED-R1' })],
      decidedById: hostUsers[0]?.id ?? adminUser.id,
   });

   // 6) Cancelled invitation
   await createSeedVisit({
      source: VisitSource.HOST_INVITATION,
      groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY,
      status: VisitStatus.CANCELLED,
      purpose: VisitPurpose.MEETING,
      host: employees[5],
      days: [tomorrow],
      visitors: [await createVisitor({ idNumber: 'ID-SEED-C1' })],
      floor: '3rd Floor',
      room: 'Office 312',
      createdById: hostUsers[1]?.id,
      decidedById: hostUsers[1]?.id,
   });

   // 7) Rescheduled multi-day individual
   await createSeedVisit({
      source: VisitSource.PUBLIC,
      groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.MULTI_DAY,
      status: VisitStatus.RESCHEDULED,
      purpose: VisitPurpose.MAINTENANCE,
      host: employees[0],
      days: [tomorrow, dayAfter],
      visitors: [await createVisitor({ idNumber: 'ID-SEED-RS1' })],
      floor: 'Basement',
      room: 'Plant Room',
      createdById: receptionUsers[0]?.id,
      decidedById: adminUser.id,
   });

   // Historical checked-out visits
   const historyStart = subMonths(new Date(), 2);
   let cursor = new Date(historyStart);
   let createdHistory = 0;

   while (isBefore(cursor, today) && createdHistory < 18) {
      if (isWeekend(cursor)) {
         cursor = addDays(cursor, 1);
         continue;
      }

      const start = startOf(cursor);
      const end = addDays(start, faker.number.int({ min: 0, max: 2 }));
      const hostEmp = faker.helpers.arrayElement(employees);
      const visitorCount = faker.number.int({ min: 1, max: 3 });

      const visitors = await Promise.all(
         Array.from({ length: visitorCount }).map(() => createVisitor()),
      );

      const days: Date[] = [];
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
         days.push(new Date(d));
      }

      const histVisit = await createSeedVisit({
         source: faker.helpers.arrayElement([
            VisitSource.PUBLIC,
            VisitSource.RECEPTION,
            VisitSource.HOST_INVITATION,
         ]),
         groupType:
            visitorCount > 1
               ? VisitorGroupType.GROUP
               : VisitorGroupType.SINGLE,
         durationType:
            days.length > 1
               ? VisitDurationType.MULTI_DAY
               : VisitDurationType.SINGLE_DAY,
         status: VisitStatus.CHECKED_OUT,
         purpose: faker.helpers.arrayElement([
            VisitPurpose.MEETING,
            VisitPurpose.INTERVIEW,
            VisitPurpose.OFFICIAL_VISIT,
         ]),
         host: hostEmp,
         days,
         visitors,
         floor: 'Ground Floor',
         room: 'Meeting Room 1',
         createdById: receptionUsers[0]?.id,
         decidedById: adminUser.id,
      });

      for (const participant of histVisit.participants) {
         for (const day of histVisit.days) {
            const checkIn = new Date(day.date);
            checkIn.setHours(9, faker.number.int({ min: 0, max: 30 }), 0, 0);
            const checkOut = new Date(day.date);
            checkOut.setHours(15, faker.number.int({ min: 0, max: 59 }), 0, 0);

            await prisma.visitAttendance.create({
               data: {
                  participantId: participant.id,
                  visitDayId: day.id,
                  status: AttendanceStatus.CHECKED_OUT,
                  checkInAt: checkIn,
                  checkOutAt: checkOut,
                  checkedInById: guardUsers[0]?.id,
                  checkedOutById: guardUsers[0]?.id,
                  personalIdRetained: false,
                  personalIdReturnedAt: checkOut,
               },
            });
         }
      }

      createdHistory += 1;
      cursor = addDays(end, 1);
   }

   console.log('\nSeeding complete.');
   console.log(`- Org: ${ORG_NAME}`);
   console.log(`- Roles: GUARD, RECEPTION, ADMIN, MANAGER`);
   console.log(`- Staff logins: ${STAFF_USERS.map((u) => u.username).join(', ')}`);
   console.log(`- SSO host subjects: sso-host-1, sso-host-2`);
   console.log(`- Checked-in visit QR token: ${activeSingle.qrToken}`);
   console.log(`- Checked-in visit code: ${activeSingle.visitCode}`);
   console.log(`- Approved group visit code (check-in ready): ${approvedGroup.visitCode}`);
   console.log(`- Assigned badge QR: ${assignedBadge.qrToken} (${assignedBadge.badgeNumber})`);
   console.log(`- Historical visits: ${createdHistory}`);
   console.log(`- Seed date: ${format(today, 'yyyy-MM-dd')}`);
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
