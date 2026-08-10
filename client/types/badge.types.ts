export type BadgeStatus = 'available' | 'assigned' | 'lost' | 'inactive';

export type BadgeAssignment = {
   id: number;
   visitorName: string;
   visitCode: string;
   assignedAt: string;
   releasedAt?: string | null;
};

export type Badge = {
   id: number;
   badgeNumber: string;
   qrToken: string;
   status: BadgeStatus;
   notes: string | null;
   assignedTo: string | null;
   assignedAt: string | null;
   lastUsedAt: string | null;
   lastAssignedAt: string | null;
   createdAt: string;
   assignmentHistory: BadgeAssignment[];
};

export type BadgeStats = {
   total: number;
   available: number;
   assigned: number;
   lost: number;
   inactive: number;
};

export type CreateBadgePayload = {
   badgeNumber: string;
};

export type UpdateBadgeStatusPayload = {
   id: number;
   status: Extract<BadgeStatus, 'inactive' | 'lost' | 'available'>;
   reason?: string;
};
