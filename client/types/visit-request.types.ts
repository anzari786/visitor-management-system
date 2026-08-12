import type { Department } from './department.types';
import type { IdType } from './visit.types';

export type VisitRequestStatus = 'pending' | 'approved' | 'rejected';

export type VisitPurpose =
   | 'meeting'
   | 'interview'
   | 'delivery'
   | 'official_visit'
   | 'maintenance'
   | 'other';

export type DateFilter =
   | 'all'
   | 'today'
   | 'yesterday'
   | 'last7days'
   | 'last30days';

export type VisitRequestVisitor = {
   id: number;
   fullName: string;
   phone: string;
   email: string;
   organization: string | null;
   idType: IdType;
   idNumber: string;
};

export type VisitRequest = {
   id: number;
   visitorName: string;
   phone: string;
   email: string;
   organization: string | null;
   idType: IdType | null;
   idNumber: string | null;
   additionalVisitorCount: number;
   visitors: VisitRequestVisitor[];
   host: string;
   hostEmail: string | null;
   department: Pick<
      Department,
      'id' | 'name' | 'shortName' | 'color' | 'isActive'
   > | null;
   purpose: VisitPurpose;
   startDate: string;
   endDate: string;
   startTime: string;
   endTime: string;
   status: VisitRequestStatus;
   rejectionReason: string | null;
   reviewedAt: string | null;
   reviewedBy: { id: number; name: string } | null;
   createdAt: string;
   updatedAt: string;
};

export type VisitRequestsParams = {
   page: number;
   pageSize: number;
   search?: string;
   status?: VisitRequestStatus | 'all';
   dateFilter?: DateFilter;
   departmentId?: string;
};

export type VisitRequestsPaginatedData = {
   data: VisitRequest[];
   total: number;
   page: number;
   pageSize: number;
   pageCount: number;
};

export type SubmitVisitRequestApiPayload = {
   visitors: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      idType: IdType;
      idNumber: string;
      organization?: string;
   }>;
   hostName: string;
   hostEmail?: string;
   departmentCode: string;
   purpose: VisitPurpose;
   startDate: string;
   endDate: string;
   startTime: string;
   endTime: string;
};

export type SubmitVisitRequestResponse = {
   requestId: string;
   id: number;
   submittedAt: string;
};

export type RejectVisitRequestPayload = {
   id: number;
   reason?: string;
};
