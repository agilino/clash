"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clashSchema } from "@/lib/validation";
import { getFieldErrors, type FormState } from "@/lib/form";

export type ActionResult = { ok: boolean; error?: string };

function parseClashForm(formData: FormData) {
  return clashSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    dateTime: formData.get("dateTime"),
    venueId: formData.get("venueId"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });
}

function revalidateClashViews(id?: string) {
  revalidatePath("/clashes");
  revalidatePath("/map");
  revalidatePath("/my-clashes");
  revalidatePath("/participations");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/clashes/${id}`);
}

export async function createClash(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseClashForm(formData);
  if (!parsed.success) {
    return { fieldErrors: getFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  // If attached to a venue, ensure it exists.
  const venueId = data.venueId;
  if (venueId) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, title: true, creatorId: true },
    });
    if (!venue) {
      return { fieldErrors: { venueId: "That venue no longer exists." } };
    }
  }

  const clash = await prisma.clash.create({
    data: {
      title: data.title,
      description: data.description,
      dateTime: data.dateTime,
      latitude: data.latitude,
      longitude: data.longitude,
      venueId: venueId ?? null,
      creatorId: user.id,
    },
  });

  revalidateClashViews(clash.id);
  redirect(`/clashes/${clash.id}`);
}

export async function updateClash(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing clash id." };

  const existing = await prisma.clash.findUnique({
    where: { id },
    select: { creatorId: true },
  });
  if (!existing) return { error: "Clash not found." };
  if (existing.creatorId !== user.id) {
    return { error: "You can only edit clashes you created." };
  }

  const parsed = parseClashForm(formData);
  if (!parsed.success) {
    return { fieldErrors: getFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.venueId) {
    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
      select: { id: true },
    });
    if (!venue) {
      return { fieldErrors: { venueId: "That venue no longer exists." } };
    }
  }

  await prisma.clash.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      dateTime: data.dateTime,
      latitude: data.latitude,
      longitude: data.longitude,
      venueId: data.venueId ?? null,
    },
  });

  revalidateClashViews(id);
  redirect(`/clashes/${id}`);
}

export async function deleteClash(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const clash = await prisma.clash.findUnique({
    where: { id },
    select: { creatorId: true },
  });
  if (!clash) return { ok: false, error: "Clash not found." };
  if (clash.creatorId !== user.id) {
    return { ok: false, error: "You can only delete clashes you created." };
  }

  await prisma.clash.delete({ where: { id } });
  revalidateClashViews(id);
  redirect("/clashes");
}
