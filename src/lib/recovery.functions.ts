import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { generateTrackingCode } from "./recovery.server";
import { RECOVERY_STATUSES } from "./recovery-shared";

const submitSchema = z.object({
  email: z.string().trim().email().max(255),
  serviceType: z.string().trim().min(1).max(40),
  fileName: z.string().trim().min(1).max(255),
  filePath: z.string().trim().min(1).max(500),
  userNotes: z.string().trim().max(2000).optional(),
});

export const submitRecoveryRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.filePath.startsWith("uploads/")) {
      throw new Error("Invalid upload reference.");
    }

    const trackingCode = generateTrackingCode();
    const { error } = await supabaseAdmin.from("recovery_requests").insert({
      tracking_code: trackingCode,
      email: data.email,
      service_type: data.serviceType,
      file_name: data.fileName,
      file_path: data.filePath,
      user_notes: data.userNotes ?? null,
    });

    if (error) {
      console.error("submitRecoveryRequest", error);
      throw new Error("Could not submit your request. Please try again.");
    }

    return { trackingCode };
  });

export const getRecoveryStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ trackingCode: z.string().trim().min(4).max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("recovery_requests")
      .select(
        "tracking_code, service_type, file_name, status, admin_notes, recovered_password, result_file_path, result_file_name, created_at, completed_at",
      )
      .eq("tracking_code", data.trackingCode.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("getRecoveryStatus", error);
      throw new Error("Could not look up that tracking code.");
    }
    if (!row) return null;

    let resultUrl: string | null = null;
    if (row.status === "completed" && row.result_file_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("recovery-results")
        .createSignedUrl(row.result_file_path, 60 * 30);
      resultUrl = signed?.signedUrl ?? null;
    }

    return {
      trackingCode: row.tracking_code,
      serviceType: row.service_type,
      fileName: row.file_name,
      status: row.status,
      adminNotes: row.admin_notes,
      recoveredPassword: row.status === "completed" ? row.recovered_password : null,
      resultFileName: row.result_file_name,
      resultUrl,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  });

export const checkIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const listRecoveryRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recovery_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listRecoveryRequests", error);
      throw new Error("Could not load recovery requests.");
    }
    return data ?? [];
  });

export const getUploadDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ filePath: z.string().trim().min(1).max(500) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("recovery-uploads")
      .createSignedUrl(data.filePath, 60 * 10);
    if (error) {
      console.error("getUploadDownloadUrl", error);
      throw new Error("Could not create a download link.");
    }
    return { url: signed.signedUrl };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(RECOVERY_STATUSES),
  adminNotes: z.string().trim().max(2000).optional(),
  recoveredPassword: z.string().trim().max(500).optional(),
  resultFilePath: z.string().trim().max(500).optional(),
  resultFileName: z.string().trim().max(255).optional(),
});

export const updateRecoveryRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recovery_requests")
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        recovered_password: data.recoveredPassword || null,
        result_file_path: data.resultFilePath || null,
        result_file_name: data.resultFileName || null,
        completed_at: data.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);

    if (error) {
      console.error("updateRecoveryRequest", error);
      throw new Error("Could not save the update.");
    }
    return { ok: true };
  });
