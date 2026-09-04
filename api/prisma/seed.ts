import {
   AttendanceStatus,
   AuthProvider,
   BadgePrintJobStatus,
   IdType,
   NotificationChannel,
   NotificationType,
   RoleName,
   VisitDurationType,
   VisitPurpose,
   VisitSource,
   VisitStatus,
   VisitorGroupType,
} from '../src/generated/prisma/client.js';
import { prisma } from '../src/config/prisma.js';
import { generateQrToken } from '../src/services/qr.service.js';
import bcrypt from 'bcrypt';
import { addDays, format, startOfDay, subDays } from 'date-fns';

const DEFAULT_PASSWORD = 'Password123!';
const ORG_NAME = 'Ethiopian Agricultural Transformation Institute';
const PASSWORD_HASH_COST = 12;

const DEPARTMENTS = [
   ['Human Resources', 'HR'],
   ['Finance', 'FIN'],
   ['Information Technology', 'IT'],
   ['Research & Development', 'R&D'],
   ['Procurement', 'PROC'],
   ['Legal Affairs', 'LEGAL'],
] as const;

const STAFF = [
   ['System', 'Administrator', 'admin', 'admin@ati.gov.et', '+251 911 223 344', RoleName.ADMIN],
   ['Operations', 'Manager', 'manager', 'manager@ati.gov.et', '+251 911 556 677', RoleName.MANAGER],
   ['Abel', 'Tesfaye', 'guard1', 'guard1@ati.gov.et', '+251 922 334 455', RoleName.GUARD],
   ['Sara', 'Bekele', 'reception1', 'reception1@ati.gov.et', '+251 933 445 566', RoleName.RECEPTION],
] as const;

const HOSTS = [
   ['Meron', 'Gebre', 'meron.gebre@ati.gov.et', '+251 911 101 201', 'Director of Partnerships', 'HR'],
   ['Dawit', 'Kebede', 'dawit.kebede@ati.gov.et', '+251 911 101 202', 'Research Program Lead', 'R&D'],
   ['Liya', 'Tadesse', 'liya.tadesse@ati.gov.et', '+251 911 101 203', 'Procurement Specialist', 'PROC'],
   ['Nahom', 'Alemu', 'nahom.alemu@ati.gov.et', '+251 911 101 204', 'IT Infrastructure Manager', 'IT'],
   ['Hana', 'Wondimu', 'hana.wondimu@ati.gov.et', '+251 911 101 205', 'Finance Manager', 'FIN'],
   ['Samuel', 'Bekele', 'samuel.bekele@ati.gov.et', '+251 911 101 206', 'Legal Counsel', 'LEGAL'],
] as const;

const VISITORS = [
   ['Kidist', 'Alemu', 'kidist.alemu@example.com', '+251 911 300 001', 'Green Horizon Ltd', 'NATIONAL_ID', 'ID-SEED-001'],
   ['Yonas', 'Hailu', 'yonas.hailu@example.com', '+251 911 300 002', 'AgriTech Ethiopia', 'PASSPORT', 'P-SEED-002'],
   ['Marta', 'Gebre', 'marta.gebre@example.com', '+251 911 300 003', 'AgriTech Ethiopia', 'NATIONAL_ID', 'ID-SEED-003'],
   ['Daniel', 'Kebede', 'daniel.kebede@example.com', '+251 911 300 004', 'AgriTech Ethiopia', 'NATIONAL_ID', 'ID-SEED-004'],
   ['Rahel', 'Mekonnen', 'rahel.mekonnen@example.com', '+251 911 300 005', 'Blue Nile Consulting', 'KEBELE_ID', 'K-SEED-005'],
   ['Henok', 'Fikru', 'henok.fikru@example.com', '+251 911 300 006', 'Blue Nile Consulting', 'NATIONAL_ID', 'ID-SEED-006'],
   ['Selam', 'Abebe', 'selam.abebe@example.com', '+251 911 300 007', 'ATI Partner Network', 'DRIVERS_LICENSE', 'DL-SEED-007'],
   ['Robel', 'Worku', 'robel.worku@example.com', '+251 911 300 008', 'ATI Partner Network', 'NATIONAL_ID', 'ID-SEED-008'],
   ['Tigist', 'Assefa', 'tigist.assefa@example.com', '+251 911 300 009', 'Mekong Systems', 'PASSPORT', 'P-SEED-009'],
   ['Bekele', 'Girma', 'bekele.girma@example.com', '+251 911 300 010', 'Mekong Systems', 'NATIONAL_ID', 'ID-SEED-010'],
   ['Aster', 'Desta', 'aster.desta@example.com', '+251 911 300 011', 'ATI Visitor', 'NATIONAL_ID', 'ID-SEED-011'],
   ['Mulu', 'Kassa', 'mulu.kassa@example.com', '+251 911 300 012', 'ATI Visitor', 'NATIONAL_ID', 'ID-SEED-012'],
] as const;

const toIdType = (value: string): IdType => value as IdType;

async function clearSeedData() {
   await prisma.badgePrintJob.deleteMany();
   await prisma.visitAttendance.deleteMany();
   await prisma.visitStatusHistory.deleteMany();
   await prisma.notification.deleteMany();
   await prisma.visitParticipant.deleteMany();
   await prisma.visitDay.deleteMany();
   await prisma.visit.deleteMany();
   await prisma.visitor.deleteMany();
   await prisma.passwordSetupToken.deleteMany();
   await prisma.userRole.deleteMany();
   await prisma.user.deleteMany();
   await prisma.employee.deleteMany();
   await prisma.role.deleteMany();
   await prisma.systemSetting.deleteMany();
   await prisma.visitCodeSequence.deleteMany();
   await prisma.session.deleteMany();
}

async function main() {
   await clearSeedData();

   const roles = await Promise.all(
      Object.values(RoleName).map((name) =>
         prisma.role.create({ data: { name, description: `${name} access` } }),
      ),
   );
   const roleByName = new Map(roles.map((role) => [role.name, role]));

   const employees = await Promise.all(
      HOSTS.map(([firstName, lastName, email, phone, position, departmentCode], index) => {
         const department = DEPARTMENTS.find((item) => item[1] === departmentCode)!;
         return prisma.employee.create({
            data: {
               externalEmployeeId: `HR-SEED-${String(index + 1).padStart(3, '0')}`,
               firstName,
               lastName,
               email,
               phone,
               position,
               departmentName: department[0],
               departmentCode,
               isActive: true,
            },
         });
      }),
   );

   const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, PASSWORD_HASH_COST);
   const staffUsers = await Promise.all(
      STAFF.map(([firstName, lastName, username, email, phone]) =>
         prisma.user.create({
            data: {
               authProvider: AuthProvider.LOCAL,
               firstName,
               lastName,
               username,
               email,
               phone,
               passwordHash,
               mustChangePassword: false,
               isActive: true,
            },
         }),
      ),
   );
   await Promise.all(
      STAFF.map((staff, index) =>
         prisma.userRole.create({
            data: { userId: staffUsers[index].id, roleId: roleByName.get(staff[5])!.id },
         }),
      ),
   );

   const hostUsers = await Promise.all(
      employees.map((employee, index) =>
         prisma.user.create({
            data: {
               authProvider: AuthProvider.SSO,
               externalSubject: `seed-sso-host-${index + 1}`,
               firstName: employee.firstName,
               lastName: employee.lastName,
               email: employee.email,
               phone: employee.phone,
               employeeId: employee.id,
               isActive: true,
            },
         }),
      ),
   );

   const [admin, manager, guard, reception] = staffUsers;
   const visitors = await Promise.all(
      VISITORS.map(([firstName, lastName, email, phone, organization, idType, idNumber]) =>
         prisma.visitor.create({
            data: {
               firstName,
               lastName,
               email,
               phone,
               organization,
               idType: toIdType(idType),
               idNumber,
            },
         }),
      ),
   );

   const today = startOfDay(new Date());
   const tomorrow = addDays(today, 1);
   const dayAfter = addDays(today, 2);
   const yesterday = subDays(today, 1);

   type VisitInput = {
      code: string;
      source: VisitSource;
      groupType: VisitorGroupType;
      durationType: VisitDurationType;
      status: VisitStatus;
      purpose: VisitPurpose;
      hostIndex: number;
      visitorIndexes: number[];
      dates: Date[];
      floor: string;
      room: string;
      createdById?: number;
      decidedById?: number;
      startTime?: string;
      endTime?: string;
   };

   const createVisit = async (input: VisitInput) => {
      const host = employees[input.hostIndex];
      const decided = input.status !== VisitStatus.PENDING_APPROVAL;
      return prisma.visit.create({
         data: {
            visitCode: input.code,
            source: input.source,
            groupType: input.groupType,
            durationType: input.durationType,
            status: input.status,
            purpose: input.purpose,
            hostEmployeeId: host.id,
            hostNameSnapshot: `${host.firstName} ${host.lastName}`,
            hostEmailSnapshot: host.email,
            departmentNameSnapshot: host.departmentName,
            departmentCodeSnapshot: host.departmentCode,
            floor: input.floor,
            room: input.room,
            startDate: input.dates[0],
            endDate: input.dates[input.dates.length - 1],
            startTime: input.startTime ?? '09:00',
            endTime: input.endTime ?? '17:00',
            expectedVisitorCount: input.visitorIndexes.length,
            createdById: input.createdById,
            decidedById: decided ? input.decidedById : undefined,
            decisionAt: decided ? new Date() : undefined,
            decisionNote:
               input.status === VisitStatus.REJECTED ? 'Host unavailable' :
               input.status === VisitStatus.CANCELLED ? 'Visit cancelled by requester' : undefined,
            days: { create: input.dates.map((date) => ({ date })) },
            participants: {
               create: input.visitorIndexes.map((index) => ({ visitorId: visitors[index].id })),
            },
            statusHistory: {
               create: [
                  { fromStatus: null, toStatus: VisitStatus.PENDING_APPROVAL, changedById: input.createdById },
                  ...(decided ? [{
                     fromStatus: VisitStatus.PENDING_APPROVAL,
                     toStatus: input.status === VisitStatus.RESCHEDULED ? VisitStatus.APPROVED : input.status,
                     changedById: input.decidedById,
                  }] : []),
                  ...(input.status === VisitStatus.RESCHEDULED ? [{
                     fromStatus: VisitStatus.APPROVED,
                     toStatus: VisitStatus.RESCHEDULED,
                     changedById: input.decidedById,
                     note: 'Moved to a later date',
                  }] : []),
               ],
            },
         },
         include: { days: true, participants: true },
      });
   };

   const pending = await createVisit({
      code: 'ATI-2026-0001', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.PENDING_APPROVAL,
      purpose: VisitPurpose.DELIVERY, hostIndex: 3, visitorIndexes: [10], dates: [tomorrow],
      floor: 'Ground Floor', room: 'Reception Lobby', createdById: reception.id,
   });
   const approvedGroup = await createVisit({
      code: 'ATI-2026-0002', source: VisitSource.RECEPTION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.APPROVED,
      purpose: VisitPurpose.OFFICIAL_VISIT, hostIndex: 1, visitorIndexes: [1, 2, 3], dates: [today],
      floor: '2nd Floor', room: 'Board Room', createdById: reception.id, decidedById: manager.id,
   });
   const checkedIn = await createVisit({
      code: 'ATI-2026-0003', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.CHECKED_IN,
      purpose: VisitPurpose.MEETING, hostIndex: 0, visitorIndexes: [0], dates: [today],
      floor: '1st Floor', room: 'Conference Room A', createdById: reception.id, decidedById: manager.id,
   });
   const partiallyIn = await createVisit({
      code: 'ATI-2026-0004', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.MULTI_DAY, status: VisitStatus.PARTIALLY_CHECKED_IN,
      purpose: VisitPurpose.INTERVIEW, hostIndex: 0, visitorIndexes: [4, 5], dates: [today, tomorrow, dayAfter],
      floor: 'Ground Floor', room: 'Interview Suite', createdById: hostUsers[0].id, decidedById: hostUsers[0].id,
   });
   const partiallyOut = await createVisit({
      code: 'ATI-2026-0005', source: VisitSource.RECEPTION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.PARTIALLY_CHECKED_OUT,
      purpose: VisitPurpose.MEETING, hostIndex: 4, visitorIndexes: [6, 7], dates: [today],
      floor: '1st Floor', room: 'Finance Meeting Room', createdById: reception.id, decidedById: manager.id,
   });
   const checkedOut = await createVisit({
      code: 'ATI-2026-0006', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.CHECKED_OUT,
      purpose: VisitPurpose.MAINTENANCE, hostIndex: 3, visitorIndexes: [8], dates: [yesterday],
      floor: 'Basement', room: 'Plant Room', createdById: hostUsers[3].id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0007', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.REJECTED,
      purpose: VisitPurpose.OTHER, hostIndex: 5, visitorIndexes: [9], dates: [tomorrow],
      floor: '3rd Floor', room: 'Legal Office', createdById: reception.id, decidedById: admin.id,
   });
   await createVisit({
      code: 'ATI-2026-0008', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.RESCHEDULED,
      purpose: VisitPurpose.INTERVIEW, hostIndex: 2, visitorIndexes: [11], dates: [dayAfter],
      floor: '2nd Floor', room: 'Procurement Room', createdById: hostUsers[2].id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0009', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.MULTI_DAY, status: VisitStatus.APPROVED,
      purpose: VisitPurpose.OFFICIAL_VISIT, hostIndex: 2, visitorIndexes: [4, 5], dates: [tomorrow, dayAfter],
      floor: '2nd Floor', room: 'Training Room', createdById: hostUsers[2].id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0011', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.PENDING_APPROVAL,
      purpose: VisitPurpose.MEETING, hostIndex: 2, visitorIndexes: [0], dates: [tomorrow],
      floor: '2nd Floor', room: 'Procurement Room', createdById: reception.id,
   });
   await createVisit({
      code: 'ATI-2026-0012', source: VisitSource.RECEPTION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.MULTI_DAY, status: VisitStatus.PENDING_APPROVAL,
      purpose: VisitPurpose.OFFICIAL_VISIT, hostIndex: 2, visitorIndexes: [2, 3], dates: [dayAfter, addDays(today, 3)],
      floor: '2nd Floor', room: 'Board Room', createdById: reception.id,
   });
   await createVisit({
      code: 'ATI-2026-0013', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.PENDING_APPROVAL,
      purpose: VisitPurpose.DELIVERY, hostIndex: 2, visitorIndexes: [6], dates: [addDays(today, 4)],
      floor: 'Ground Floor', room: 'Reception Lobby', createdById: reception.id,
   });
   await createVisit({
      code: 'ATI-2026-0014', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.APPROVED,
      purpose: VisitPurpose.INTERVIEW, hostIndex: 2, visitorIndexes: [7], dates: [addDays(today, 3)],
      floor: '2nd Floor', room: 'Interview Room', createdById: hostUsers[2].id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0015', source: VisitSource.HOST_INVITATION, groupType: VisitorGroupType.GROUP,
      durationType: VisitDurationType.MULTI_DAY, status: VisitStatus.RESCHEDULED,
      purpose: VisitPurpose.MEETING, hostIndex: 2, visitorIndexes: [8, 9], dates: [addDays(today, 5), addDays(today, 6)],
      floor: '2nd Floor', room: 'Procurement Room', createdById: hostUsers[2].id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0016', source: VisitSource.RECEPTION, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.APPROVED,
      purpose: VisitPurpose.OFFICIAL_VISIT, hostIndex: 2, visitorIndexes: [10], dates: [addDays(today, 7)],
      floor: '2nd Floor', room: 'Training Room', createdById: reception.id, decidedById: manager.id,
   });
   await createVisit({
      code: 'ATI-2026-0010', source: VisitSource.PUBLIC, groupType: VisitorGroupType.SINGLE,
      durationType: VisitDurationType.SINGLE_DAY, status: VisitStatus.CANCELLED,
      purpose: VisitPurpose.MEETING, hostIndex: 4, visitorIndexes: [10], dates: [tomorrow],
      floor: '1st Floor', room: 'Finance Meeting Room', createdById: reception.id, decidedById: admin.id,
   });

   for (const visit of [checkedIn, approvedGroup, partiallyIn, partiallyOut, checkedOut]) {
      for (const day of visit.days) {
         for (const [participantIndex, participant] of visit.participants.entries()) {
            const historical = visit.id === checkedOut.id;
            const isCurrent = visit.id === checkedIn.id || visit.id === partiallyIn.id || visit.id === partiallyOut.id;
            const checkedInAt = historical || (isCurrent && (visit.id !== partiallyIn.id || participantIndex === 0))
               ? new Date(day.date.getTime() + 9 * 60 * 60 * 1000) : undefined;
            const checkedOutAt = historical || (visit.id === partiallyOut.id && participantIndex === 0)
               ? new Date(day.date.getTime() + 16 * 60 * 60 * 1000) : undefined;
            const status = checkedOutAt ? AttendanceStatus.CHECKED_OUT :
               checkedInAt ? AttendanceStatus.CHECKED_IN : AttendanceStatus.EXPECTED;
            const attendance = await prisma.visitAttendance.create({
               data: {
                  participantId: participant.id,
                  visitDayId: day.id,
                  status,
                  badgeToken: checkedInAt ? generateQrToken() : undefined,
                  badgePrintedAt: checkedInAt,
                  checkInAt: checkedInAt,
                  checkOutAt: checkedOutAt,
                  checkedInById: checkedInAt ? guard.id : undefined,
                  checkedOutById: checkedOutAt ? guard.id : undefined,
                  personalIdRetained: Boolean(checkedInAt && !checkedOutAt),
                  personalIdReturnedAt: checkedOutAt,
               },
            });
            if (checkedInAt) {
               await prisma.badgePrintJob.create({
                  data: {
                     attendanceId: attendance.id,
                     status: BadgePrintJobStatus.PRINTED,
                     attemptCount: 1,
                     requestedAt: checkedInAt,
                     printedAt: checkedInAt,
                  },
               });
            }
         }
      }
   }

   await prisma.notification.createMany({
      data: [
         { type: NotificationType.VISIT_APPROVAL_REQUEST, channel: NotificationChannel.DASHBOARD, title: 'Approval required', message: 'A new visit request is waiting for approval.', recipientUserId: manager.id, visitId: pending.id },
         { type: NotificationType.VISIT_SUBMITTED, channel: NotificationChannel.EMAIL, subject: 'Visit request submitted', message: 'Your visit request was submitted for review.', recipientEmail: 'aster.desta@example.com', visitId: pending.id },
         { type: NotificationType.VISIT_APPROVED, channel: NotificationChannel.DASHBOARD, title: 'Visit approved', message: 'Your group visit has been approved.', recipientUserId: hostUsers[1].id, visitId: approvedGroup.id, isRead: true },
         { type: NotificationType.VISITOR_ARRIVED, channel: NotificationChannel.DASHBOARD, title: 'Visitor checked in', message: 'Kidist Alemu has checked in.', recipientUserId: hostUsers[0].id, visitId: checkedIn.id },
         { type: NotificationType.VISITOR_CHECKED_OUT, channel: NotificationChannel.EMAIL, subject: 'Visitor checked out', message: 'The visitor has completed their visit.', recipientEmail: 'nahom.alemu@ati.gov.et', visitId: checkedOut.id },
      ],
   });

   await prisma.systemSetting.createMany({
      data: [
         { key: 'orgName', value: ORG_NAME, updatedById: admin.id },
         { key: 'badgePrefix', value: 'ATI', updatedById: admin.id },
         { key: 'overstayEnabled', value: 'true', updatedById: admin.id },
         { key: 'overstayAfterMins', value: '120', updatedById: admin.id },
      ],
   });

   console.log('Seed complete.');
   console.log(`Local password for admin, manager, guard1, and reception1: ${DEFAULT_PASSWORD}`);
   console.log(`Hosts: ${HOSTS.map((host) => host[2]).join(', ')}`);
   console.log(`Visits: 10 workflow records, seed date ${format(today, 'yyyy-MM-dd')}`);
}

main()
   .catch((error) => {
      console.error(error);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
