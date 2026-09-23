"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrgContext } from "@/lib/org/context";

const ProfileInput = z.object({
  displayName: z.string().optional(),
  division: z.string().optional(),
  employeeNumber: z.string().optional(),
});

export async function saveProfile(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("unauthorized");
  const parsed = ProfileInput.parse({
    displayName: fd.get("displayName") ?? undefined,
    division: fd.get("division") ?? undefined,
    employeeNumber: fd.get("employeeNumber") ?? undefined,
  });
  await prisma.user.update({
    where: { id: s.user.id },
    data: {
      displayName: parsed.displayName?.trim() || null,
      division: parsed.division?.trim() || null,
      employeeNumber: parsed.employeeNumber?.trim() || null,
    },
  });
  // Division / employee no. are printed from the company membership.
  const ctx = await getOrgContext();
  if (ctx?.membership) {
    await prisma.membership.update({
      where: { id: ctx.membership.id },
      data: {
        division: parsed.division?.trim() || null,
        employeeNumber: parsed.employeeNumber?.trim() || null,
      },
    });
  }
  revalidatePath("/settings");
}
