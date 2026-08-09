/** Floors available for host-selected visit locations. */
export const FLOOR_OPTIONS = [
   'Ground Floor',
   '1st Floor',
   '2nd Floor',
   '3rd Floor',
   '4th Floor',
   '5th Floor',
   'Basement',
   'Mezzanine',
] as const;

export type FloorOption = (typeof FLOOR_OPTIONS)[number];

/** Rooms available for host-selected visit locations. */
export const ROOM_OPTIONS = [
   'Reception Hall',
   'Conference Room A',
   'Conference Room B',
   'Conference Room C',
   'Meeting Room 1',
   'Meeting Room 2',
   'Meeting Room 3',
   'Training Room 1',
   'Training Room 2',
   'Board Room',
   'Executive Suite',
   'Visitor Lounge',
] as const;

export type RoomOption = (typeof ROOM_OPTIONS)[number];
