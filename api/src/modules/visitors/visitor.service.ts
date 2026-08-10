import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { visitorSelect, visitorHistorySelect } from './visitor.types.js';
import type {
   VisitorWithSelect,
   VisitorHistoryEntry,
   VisitorInput,
} from './visitor.types.js';

interface ListVisitorsFilters extends PaginationParams {
   search?: string;
   phone?: string;
   idNumber?: string;
}

/**
 * Structural subset of the Prisma client this module actually touches.
 * Both the singleton `prisma` and a `$transaction` callback's `tx` satisfy
 * this shape, so callers (e.g. the Visits module) can pass a transaction
 * client to keep visitor dedup atomic with the rest of their write.
 */
type VisitorDbClient = Pick<typeof prisma, 'visitor'>;

/** Powers guard's "search by name" / "search by phone" lookups. */
export const listVisitors = async (filters: ListVisitorsFilters) => {
   const where: Prisma.VisitorWhereInput = {
      ...(filters.phone && { phone: { contains: filters.phone } }),
      ...(filters.idNumber && { idNumber: { contains: filters.idNumber } }),
      ...(filters.search && {
         OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
         ],
      }),
   };

   const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
         where,
         select: visitorSelect,
         orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
         ...getSkipTake(filters),
      }),
      prisma.visitor.count({ where }),
   ]);

   return {
      visitors,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getVisitorById = async (
   id: number,
): Promise<VisitorWithSelect> => {
   const visitor = await prisma.visitor.findUnique({
      where: { id },
      select: visitorSelect,
   });

   if (!visitor) {
      throw new NotFoundError('Visitor not found');
   }

   return visitor;
};

/**
 * Visitors are deduplicated on their identification document
 * (idType + idNumber). If a record already exists for the submitted
 * ID, contact details are refreshed in place rather than creating a
 * duplicate person — the same visitor may return across many visits.
 */
export const findOrCreateVisitor = async (
   input: VisitorInput,
   db: VisitorDbClient = prisma,
): Promise<VisitorWithSelect> => {
   const existing = await db.visitor.findUnique({
      where: {
         idType_idNumber: {
            idType: input.idType,
            idNumber: input.idNumber,
         },
      },
      select: visitorSelect,
   });

   if (existing) {
      return db.visitor.update({
         where: { id: existing.id },
         data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            email: input.email,
            organization: input.organization,
         },
         select: visitorSelect,
      });
   }

   return db.visitor.create({
      data: input,
      select: visitorSelect,
   });
};

/**
 * Explicit correction of a visitor's contact details (e.g. guard
 * fixing a mistyped phone number). idType/idNumber are intentionally
 * not editable here — they're the dedup key handled by findOrCreateVisitor.
 */
export const updateVisitor = async (
   id: number,
   input: Partial<Omit<VisitorInput, 'idType' | 'idNumber'>>,
): Promise<VisitorWithSelect> => {
   await getVisitorById(id);

   return prisma.visitor.update({
      where: { id },
      data: input,
      select: visitorSelect,
   });
};

export const getVisitorHistory = async (
   id: number,
   pagination: PaginationParams,
) => {
   await getVisitorById(id);

   const where: Prisma.VisitParticipantWhereInput = { visitorId: id };

   const [entries, total] = await Promise.all([
      prisma.visitParticipant.findMany({
         where,
         select: visitorHistorySelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(pagination),
      }),
      prisma.visitParticipant.count({ where }),
   ]);

   return {
      entries,
      meta: buildPaginationMeta(pagination, total),
   };
};

export const formatVisitor = (visitor: VisitorWithSelect) => ({
   id: String(visitor.id),
   firstName: visitor.firstName,
   lastName: visitor.lastName,
   phone: visitor.phone,
   email: visitor.email ?? undefined,
   organization: visitor.organization ?? undefined,
   idType: visitor.idType,
   idNumber: visitor.idNumber,
   createdAt: visitor.createdAt,
   updatedAt: visitor.updatedAt,
});

export const formatVisitorHistoryEntry = (entry: VisitorHistoryEntry) => ({
   participantId: String(entry.id),
   joinedAt: entry.createdAt,
   visit: {
      id: String(entry.visit.id),
      visitCode: entry.visit.visitCode,
      status: entry.visit.status,
      source: entry.visit.source,
      purpose: entry.visit.purpose,
      createdAt: entry.visit.createdAt,
      host: entry.visit.hostEmployee
         ? {
              firstName: entry.visit.hostEmployee.firstName,
              lastName: entry.visit.hostEmployee.lastName,
              departmentName: entry.visit.hostEmployee.departmentName,
           }
         : undefined,
   },
});
