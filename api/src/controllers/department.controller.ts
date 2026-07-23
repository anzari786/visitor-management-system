import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
   NotFoundError,
   ConflictError,
   BadRequestError,
} from '../lib/errors.js';
import {
   colorDistance,
   isValidHex,
   SIMILARITY_THRESHOLD,
} from '../utils/department.js';

const departmentSelect = {
   id: true,
   name: true,
   shortName: true,
   color: true,
   isActive: true,
   createdAt: true,
   _count: {
      select: { visits: true },
   },
} satisfies Prisma.DepartmentSelect;

type DepartmentWithCount = Prisma.DepartmentGetPayload<{
   select: typeof departmentSelect;
}>;

// Maps the Prisma shape onto the frontend `Department` type
// (stringified id, totalVisits flattened out of _count).
const formatDepartment = (department: DepartmentWithCount) => ({
   id: department.id,
   name: department.name,
   shortName: department.shortName ?? undefined,
   color: department.color,
   isActive: department.isActive,
   createdAt: department.createdAt,
   totalVisits: department._count.visits,
});

export async function getDepartments(req: Request, res: Response) {
   const { activeOnly } = req.query as unknown as { activeOnly: boolean };

   const departments = await prisma.department.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      select: departmentSelect,
      orderBy: { name: 'asc' },
   });

   return res.status(200).json({
      success: true,
      data: departments.map(formatDepartment),
   });
}

export async function getDepartmentById(req: Request, res: Response) {
   const id = Number(req.params.id);

   const department = await prisma.department.findUnique({
      where: { id },
      select: departmentSelect,
   });

   if (!department) {
      throw new NotFoundError('Department not found');
   }

   return res.status(200).json({
      success: true,
      data: formatDepartment(department),
   });
}

export async function createDepartment(req: Request, res: Response) {
   const { name, shortName, color } = req.body;

   if (!isValidHex(color)) {
      throw new BadRequestError(
         'Color must be a valid 6-digit hex code (e.g. #35B9E9)',
      );
   }

   const existingDepartment = await prisma.department.findUnique({
      where: { name },
   });

   if (existingDepartment) {
      throw new ConflictError('Department already exists');
   }

   const allDepartments = await prisma.department.findMany({
      select: { color: true },
   });

   const isSimilarColor = allDepartments.some(
      (dept) => colorDistance(color, dept.color) < SIMILARITY_THRESHOLD,
   );

   if (isSimilarColor) {
      throw new ConflictError(
         'Color is too similar to an existing department color',
      );
   }

   const department = await prisma.department.create({
      data: { name, shortName, color },
      select: departmentSelect,
   });

   return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: formatDepartment(department),
   });
}

export async function updateDepartment(req: Request, res: Response) {
   const id = Number(req.params.id);
   const { name, shortName, color } = req.body;

   const existingDepartment = await prisma.department.findUnique({
      where: { id },
   });

   if (!existingDepartment) {
      throw new NotFoundError('Department not found');
   }

   if (!isValidHex(color)) {
      throw new BadRequestError(
         'Color must be a valid 6-digit hex code (e.g. #35B9E9)',
      );
   }

   const duplicateName = await prisma.department.findFirst({
      where: { name, NOT: { id } },
   });

   if (duplicateName) {
      throw new ConflictError('Department already exists');
   }

   const otherDepartments = await prisma.department.findMany({
      where: { NOT: { id } },
      select: { color: true },
   });

   const isSimilarColor = otherDepartments.some(
      (dept) => colorDistance(color, dept.color) < SIMILARITY_THRESHOLD,
   );

   if (isSimilarColor) {
      throw new ConflictError(
         'Color is too similar to an existing department color',
      );
   }

   const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { name, shortName, color },
      select: departmentSelect,
   });

   return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: formatDepartment(updatedDepartment),
   });
}

export async function updateDepartmentStatus(req: Request, res: Response) {
   const id = Number(req.params.id);
   const { isActive } = req.body;

   const department = await prisma.department.findUnique({ where: { id } });

   if (!department) {
      throw new NotFoundError('Department not found');
   }

   const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { isActive },
      select: departmentSelect,
   });

   return res.status(200).json({
      success: true,
      message: isActive
         ? 'Department activated successfully'
         : 'Department deactivated successfully',
      data: formatDepartment(updatedDepartment),
   });
}

export async function deleteDepartment(req: Request, res: Response) {
   const id = Number(req.params.id);

   const department = await prisma.department.findUnique({ where: { id } });

   if (!department) {
      throw new NotFoundError('Department not found');
   }

   await prisma.department.delete({
      where: { id },
   });

   return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
   });
}
