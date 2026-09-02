/** Public employee search result (host autocomplete). */
export type EmployeeSearchResult = {
   id: string;
   firstName: string;
   lastName: string;
   email: string;
   departmentName: string;
   departmentCode?: string;
   position?: string;
   isActive: boolean;
};

export type EmployeeSearchParams = {
   q?: string;
   limit?: number;
};

export type SubmitVisitRequestPayload = {
   groupType: 'SINGLE' | 'GROUP';
   durationType: 'SINGLE_DAY' | 'MULTI_DAY';
   purpose: string;
   hostEmployeeId: number;
   visitors: Array<{
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      organization?: string;
   }>;
   scheduleDates: Array<{
      date: string;
      expectedStartTime: string;
      expectedEndTime: string;
   }>;
};

export type SubmitVisitRequestResponse = {
   id: string;
   visitCode: string;
   status: string;
   startDate: string;
   endDate: string;
   startTime: string;
   endTime: string;
};
