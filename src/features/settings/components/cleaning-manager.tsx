"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CleaningContext } from "@/features/settings/lib/cleaning";
import { cleaningPreview, findCleaningConflicts } from "@/features/settings/lib/cleaning";
import { formatDay } from "@/features/settings/lib/schedule";
import type {
  CleaningSectorData,
  GeneralCleaningData,
  GeneralSectorData,
  ScheduleData,
  SpecialEventData,
  WeeklyCleaningData,
  WeeklySectorData,
} from "@/features/settings/lib/types";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import type {
  CleaningGeneralInput,
  CleaningGeneralUpdateInput,
  CleaningListSectorInput,
  CleaningSectorInput,
  CleaningWeeklyInput,
} from "../schemas";
import { CleaningPreview } from "./cleaning-preview";
import { CleaningSectorsCard } from "./cleaning-sectors-card";
import { GeneralCleaningCard } from "./general-cleaning-card";
import { GeneralCleaningDialog } from "./general-cleaning-dialog";
import { SectorDialog } from "./sector-dialog";
import { SectorListCard } from "./sector-list-card";
import { SectorTaskDialog } from "./sector-task-dialog";
import { WeeklyCleaningCard } from "./weekly-cleaning-card";
import { WeeklyCleaningDialog } from "./weekly-cleaning-dialog";

export function CleaningManager({
  organizationId,
  schedule,
  events,
  today,
  initialSectors,
  initialWeekly,
  initialWeeklySectors,
  initialGeneral,
  initialGeneralSectors,
  canEdit,
}: {
  organizationId: string;
  schedule: ScheduleData;
  events: SpecialEventData[];
  today: string;
  initialSectors: CleaningSectorData[];
  initialWeekly: WeeklyCleaningData;
  initialWeeklySectors: WeeklySectorData[];
  initialGeneral: GeneralCleaningData[];
  initialGeneralSectors: GeneralSectorData[];
  canEdit: boolean;
}) {
  const [sectors, setSectors] = useState<CleaningSectorData[]>(initialSectors);
  const [weekly, setWeekly] = useState<WeeklyCleaningData>(initialWeekly);
  const [weeklySectors, setWeeklySectors] = useState<WeeklySectorData[]>(initialWeeklySectors);
  const [general, setGeneral] = useState<GeneralCleaningData[]>(initialGeneral);
  const [generalSectors, setGeneralSectors] = useState<GeneralSectorData[]>(initialGeneralSectors);
  const [editingSector, setEditingSector] = useState<CleaningSectorData | "new" | null>(null);
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [editingWeeklySector, setEditingWeeklySector] = useState<WeeklySectorData | "new" | null>(
    null,
  );
  const [editingGeneral, setEditingGeneral] = useState<GeneralCleaningData | "new" | null>(null);
  const [editingGeneralSector, setEditingGeneralSector] = useState<
    GeneralSectorData | "new" | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [deletingWeeklySectorId, setDeletingWeeklySectorId] = useState<string | null>(null);
  const [deletingWeekly, setDeletingWeekly] = useState(false);
  const [deletingGeneralId, setDeletingGeneralId] = useState<string | null>(null);
  const [deletingGeneralSectorId, setDeletingGeneralSectorId] = useState<string | null>(null);

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

  const weeklyActive = weekly.time !== null && weekly.dates.length > 0;

  const scheduledDates = useMemo(
    () => [...weekly.dates, ...general.map((item) => item.date)],
    [weekly.dates, general],
  );

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

  async function handleDisableWeekly() {
    if (!confirm("Desativar a Limpeza Semanal? As datas programadas serão removidas.")) return;
    setDeletingWeekly(true);
    try {
      await apiFetch(`/api/organizations/${organizationId}/settings/cleaning/weekly`, {
        method: "DELETE",
      });
      setWeekly({ time: null, dates: [] });
      toast.success("Limpeza Semanal desativada.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingWeekly(false);
    }
  }

  async function handleSaveWeeklySector(payload: CleaningListSectorInput) {
    setSaving(true);
    try {
      const { sector } = await apiFetch<{ sector: WeeklySectorData }>(
        editingWeeklySector && editingWeeklySector !== "new"
          ? `/api/organizations/${organizationId}/settings/cleaning/weekly-sectors/${editingWeeklySector.id}`
          : `/api/organizations/${organizationId}/settings/cleaning/weekly-sectors`,
        {
          method: editingWeeklySector && editingWeeklySector !== "new" ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setWeeklySectors((current) =>
        editingWeeklySector && editingWeeklySector !== "new"
          ? current.map((item) => (item.id === sector.id ? sector : item))
          : [...current, sector],
      );
      setEditingWeeklySector(null);
      toast.success("Setor salvo!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWeeklySector(sector: WeeklySectorData) {
    if (!confirm(`Excluir o setor "${sector.name}" da Limpeza Semanal?`)) return;
    setDeletingWeeklySectorId(sector.id);
    try {
      await apiFetch(
        `/api/organizations/${organizationId}/settings/cleaning/weekly-sectors/${sector.id}`,
        { method: "DELETE" },
      );
      setWeeklySectors((current) => current.filter((item) => item.id !== sector.id));
      toast.success("Setor excluído.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingWeeklySectorId(null);
    }
  }

  async function handleSaveGeneral(payload: CleaningGeneralInput | CleaningGeneralUpdateInput) {
    setSaving(true);
    try {
      if (editingGeneral && editingGeneral !== "new") {
        const { cleaning } = await apiFetch<{ cleaning: GeneralCleaningData }>(
          `/api/organizations/${organizationId}/settings/cleaning/general/${editingGeneral.id}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        setGeneral((current) =>
          [...current.filter((item) => item.id !== cleaning.id), cleaning].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        );
      } else {
        const { cleanings } = await apiFetch<{ cleanings: GeneralCleaningData[] }>(
          `/api/organizations/${organizationId}/settings/cleaning/general`,
          { method: "POST", body: JSON.stringify(payload) },
        );
        setGeneral((current) =>
          [
            ...current.filter((item) => !cleanings.some((c) => c.id === item.id)),
            ...cleanings,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        );
      }
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

  async function handleSaveGeneralSector(payload: CleaningListSectorInput) {
    setSaving(true);
    try {
      const { sector } = await apiFetch<{ sector: GeneralSectorData }>(
        editingGeneralSector && editingGeneralSector !== "new"
          ? `/api/organizations/${organizationId}/settings/cleaning/general-sectors/${editingGeneralSector.id}`
          : `/api/organizations/${organizationId}/settings/cleaning/general-sectors`,
        {
          method: editingGeneralSector && editingGeneralSector !== "new" ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setGeneralSectors((current) =>
        editingGeneralSector && editingGeneralSector !== "new"
          ? current.map((item) => (item.id === sector.id ? sector : item))
          : [...current, sector],
      );
      setEditingGeneralSector(null);
      toast.success("Setor salvo!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGeneralSector(sector: GeneralSectorData) {
    if (!confirm(`Excluir o setor "${sector.name}" da Limpeza Geral?`)) return;
    setDeletingGeneralSectorId(sector.id);
    try {
      await apiFetch(
        `/api/organizations/${organizationId}/settings/cleaning/general-sectors/${sector.id}`,
        { method: "DELETE" },
      );
      setGeneralSectors((current) => current.filter((item) => item.id !== sector.id));
      toast.success("Setor excluído.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingGeneralSectorId(null);
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
        deleting={deletingWeekly}
        onConfigure={() => setEditingWeekly(true)}
        onDisable={handleDisableWeekly}
      />
      {weeklyActive && (
        <SectorListCard
          title="Setores da Limpeza Semanal"
          description="Setores e tarefas executados nas datas programadas da limpeza semanal."
          addLabel="Adicionar setor"
          sectors={weeklySectors}
          canEdit={canEdit}
          deletingId={deletingWeeklySectorId}
          onAdd={() => setEditingWeeklySector("new")}
          onEdit={(sector) => setEditingWeeklySector(sector)}
          onDelete={handleDeleteWeeklySector}
        />
      )}
      <GeneralCleaningCard
        cleaning={general}
        conflicts={conflicts}
        canEdit={canEdit}
        deletingId={deletingGeneralId}
        onAdd={() => setEditingGeneral("new")}
        onEdit={(item) => setEditingGeneral(item)}
        onDelete={handleDeleteGeneral}
      />
      {general.length > 0 && (
        <SectorListCard
          title="Setores da Limpeza Geral"
          description="Setores e tarefas executados nas datas programadas da limpeza geral."
          addLabel="Adicionar setor"
          sectors={generalSectors}
          canEdit={canEdit}
          deletingId={deletingGeneralSectorId}
          onAdd={() => setEditingGeneralSector("new")}
          onEdit={(sector) => setEditingGeneralSector(sector)}
          onDelete={handleDeleteGeneralSector}
        />
      )}
      <CleaningPreview weeks={previewWeeks} weekly={weekly} />

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
          scheduled={scheduledDates}
          saving={saving}
          onSave={handleSaveWeekly}
          onClose={() => setEditingWeekly(false)}
        />
      )}
      {editingWeeklySector && (
        <SectorTaskDialog
          sector={editingWeeklySector === "new" ? null : editingWeeklySector}
          title="Limpeza Semanal"
          description="Configure os setores e tarefas da limpeza semanal."
          saving={saving}
          onSave={handleSaveWeeklySector}
          onClose={() => setEditingWeeklySector(null)}
        />
      )}
      {editingGeneral && (
        <GeneralCleaningDialog
          cleaning={editingGeneral === "new" ? null : editingGeneral}
          weekly={weekly}
          scheduled={scheduledDates}
          saving={saving}
          onSave={handleSaveGeneral}
          onClose={() => setEditingGeneral(null)}
        />
      )}
      {editingGeneralSector && (
        <SectorTaskDialog
          sector={editingGeneralSector === "new" ? null : editingGeneralSector}
          title="Limpeza Geral"
          description="Configure os setores e tarefas da limpeza geral."
          saving={saving}
          onSave={handleSaveGeneralSector}
          onClose={() => setEditingGeneralSector(null)}
        />
      )}
    </div>
  );
}
