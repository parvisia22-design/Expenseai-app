"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ProfileInput = z.object({
  displayName: z.string().optional(),
  division: z.string().optional(),
  employeeNumber: z.string().optional(),
  companyName: z.string().optional(),
  supervisorName: z.string().optional(),
  financeName: z.string().optional(),
});

export async function saveProfile(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const parsed = ProfileInput.parse({
    displayName: fd.get("displayName") ?? undefined,
    division: fd.get("division") ?? undefined,
    employeeNumber: fd.get("employeeNumber") ?? undefined,
    companyName: fd.get("companyName") ?? undefined,
    supervisorName: fd.get("supervisorName") ?? undefined,
    financeName: fd.get("financeName") ?? undefined,
  });
  await prisma.user.update({
    where: { id: s.user.id },
    data: {
      displayName: parsed.displayName?.trim() || null,
      division: parsed.division?.trim() || null,
      employeeNumber: parsed.employeeNumber?.trim() || null,
      companyName: parsed.companyName?.trim() || null,
      supervisorName: parsed.supervisorName?.trim() || null,
      financeName: parsed.financeName?.trim() || null,
    },
  });
  revalidatePath("/settings");
}
