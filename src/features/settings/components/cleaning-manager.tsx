"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CleaningContext } from "@/features/settings/lib/cleaning";
import { cleaningPreview, findCleaningConflicts } from "@/features/settings/lib/cleaning";
import { formatDay } from "@/features/settings/lib/schedule";
import type {
  CleaningSectorData,
  GeneralCleaningData,
  ScheduleData,
  SpecialEventData,
  WeeklyCleaningData,
} from "@/features/settings/lib/types";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import type { CleaningGeneralInput, CleaningSectorInput, CleaningWeeklyInput } from "../schemas";
import { CleaningPreview } from "./cleaning-preview";
import { CleaningSectorsCard } from "./cleaning-sectors-card";
import { GeneralCleaningCard } from "./general-cleaning-card";
import { GeneralCleaningDialog } from "./general-cleaning-dialog";
import { SectorDialog } from "./sector-dialog";
import { WeeklyCleaningCard } from "./weekly-cleaning-card";
import { WeeklyCleaningDialog } from "./weekly-cleaning-dialog";

export function CleaningManager({
  organizationId,
  schedule,
  events,
  today,
  initialSectors,
  initialWeekly,
  initialGeneral,
  canEdit,
}: {
  organizationId: string;
  schedule: ScheduleData;
  events: SpecialEventData[];
  today: string;
  initialSectors: CleaningSectorData[];
  initialWeekly: WeeklyCleaningData;
  initialGeneral: GeneralCleaningData[];
  canEdit: boolean;
}) {
  const [sectors, setSectors] = useState<CleaningSectorData[]>(initialSectors);
  const [weekly, setWeekly] = useState<WeeklyCleaningData>(initialWeekly);
  const [general, setGeneral] = useState<GeneralCleaningData[]>(initialGeneral);
  const [editingSector, setEditingSector] = useState<CleaningSectorData | "new" | null>(null);
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [editingGeneral, setEditingGeneral] = useState<GeneralCleaningData | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [deletingGeneralId, setDeletingGeneralId] = useState<string | null>(null);

  const context: CleaningContext = useMemo(
    () => ({
      schedule,
      events,
      weekly,
      general,
      today: new Date(today),
    }),
    [schedule, events, weekly, general, today],
  );

  const conflicts = useMemo(() => findCleaningConflicts(context), [context]);
  const previewWeeks = useMemo(() => cleaningPreview(context), [context]);

  async function handleSaveSector(payload: CleaningSectorInput) {
    setSaving(true);
    try {
      const { sector } = await apiFetch<{ sector: CleaningSectorData }>(
        editingSector && editingSector !== "new"
          ? `/api/organizations/${organizationId}/settings/cleaning/sectors/${editingSector.id}`
          : `/api/organizations/${organizationId}/settings/cleaning/sectors`,
        {
          method: editingSector && editingSector !== "new" ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setSectors((current) =>
        editingSector && editingSector !== "new"
          ? current.map((item) => (item.id === sector.id ? sector : item))
          : [...current, sector],
      );
      setEditingSector(null);
      toast.success("Setor salvo!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSector(sector: CleaningSectorData) {
    if (!confirm(`Excluir o setor "${sector.name}"?`)) return;
    setDeletingSectorId(sector.id);
    try {
      await apiFetch(
        `/api/organizations/${organizationId}/settings/cleaning/sectors/${sector.id}`,
        { method: "DELETE" },
      );
      setSectors((current) => current.filter((item) => item.id !== sector.id));
      toast.success("Setor excluído.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingSectorId(null);
    }
  }

  async function handleSaveWeekly(payload: CleaningWeeklyInput) {
    setSaving(true);
    try {
      const saved = await apiFetch<WeeklyCleaningData>(
        `/api/organizations/${organizationId}/settings/cleaning/weekly`,
        { method: "PUT", body: JSON.stringify(payload) },
      );
      setWeekly(saved);
      setEditingWeekly(false);
      toast.success("Limpeza Semanal salva!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGeneral(payload: CleaningGeneralInput) {
    setSaving(true);
    try {
      const { cleaning } = await apiFetch<{ cleaning: GeneralCleaningData }>(
        editingGeneral && editingGeneral !== "new"
          ? `/api/organizations/${organizationId}/settings/cleaning/general/${editingGeneral.id}`
          : `/api/organizations/${organizationId}/settings/cleaning/general`,
        {
          method: editingGeneral && editingGeneral !== "new" ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setGeneral((current) =>
        [...current.filter((item) => item.id !== cleaning.id), cleaning].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setEditingGeneral(null);
      toast.success("Limpeza Geral salva!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGeneral(item: GeneralCleaningData) {
    const day = formatDay(new Date(`${item.date}T00:00:00.000Z`));
    if (!confirm(`Excluir a Limpeza Geral de ${day}?`)) return;
    setDeletingGeneralId(item.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/settings/cleaning/general/${item.id}`, {
        method: "DELETE",
      });
      setGeneral((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Limpeza Geral excluída.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingGeneralId(null);
    }
  }

  return (
    <div className="space-y-4">
      <CleaningSectorsCard
        sectors={sectors}
        canEdit={canEdit}
        deletingId={deletingSectorId}
        onAdd={() => setEditingSector("new")}
        onEdit={(sector) => setEditingSector(sector)}
        onDelete={handleDeleteSector}
      />
      <WeeklyCleaningCard
        weekly={weekly}
        conflicts={conflicts}
        canEdit={canEdit}
        onConfigure={() => setEditingWeekly(true)}
      />
      <GeneralCleaningCard
        cleaning={general}
        conflicts={conflicts}
        canEdit={canEdit}
        deletingId={deletingGeneralId}
        onAdd={() => setEditingGeneral("new")}
        onEdit={(item) => setEditingGeneral(item)}
        onDelete={handleDeleteGeneral}
      />
      <CleaningPreview weeks={previewWeeks} weeklyDay={weekly.day} weeklyTime={weekly.time} />

      {editingSector && (
        <SectorDialog
          sector={editingSector === "new" ? null : editingSector}
          saving={saving}
          onSave={handleSaveSector}
          onClose={() => setEditingSector(null)}
        />
      )}
      {editingWeekly && (
        <WeeklyCleaningDialog
          weekly={weekly}
          saving={saving}
          onSave={handleSaveWeekly}
          onClose={() => setEditingWeekly(false)}
        />
      )}
      {editingGeneral && (
        <GeneralCleaningDialog
          cleaning={editingGeneral === "new" ? null : editingGeneral}
          weeklyEnabled={weekly.enabled}
          saving={saving}
          onSave={handleSaveGeneral}
          onClose={() => setEditingGeneral(null)}
        />
      )}
    </div>
  );
}
