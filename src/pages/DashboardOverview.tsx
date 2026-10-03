import { useDashboardData } from '@/hooks/useDashboardData';
import type { Hunde } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HundeDialog } from '@/components/dialogs/HundeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconSearch, IconPencil, IconTrash, IconDog,
  IconUsers, IconGenderMale, IconGenderFemale, IconCalendar,
  IconPhone, IconMail, IconChevronRight,
} from '@tabler/icons-react';

const APPGROUP_ID = '6ac124c57311caba2f46a63b';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const { hunde, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Hunde | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hunde | null>(null);
  const [selectedHund, setSelectedHund] = useState<Hunde | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return hunde.filter(h => {
      const matchesSearch = !q || [
        h.fields.hundename,
        h.fields.rasse,
        h.fields.halter_vorname,
        h.fields.halter_nachname,
        h.fields.halter_email,
      ].some(v => v?.toLowerCase().includes(q));

      const matchesGender = genderFilter === 'alle' ||
        (h.fields.geschlecht as any)?.key === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [hunde, search, genderFilter]);

  const stats = useMemo(() => {
    const ruede = hunde.filter(h => (h.fields.geschlecht as any)?.key === 'ruede').length;
    const huendin = hunde.filter(h => (h.fields.geschlecht as any)?.key === 'huendin').length;
    const uniqueHalter = new Set(
      hunde.map(h => [h.fields.halter_vorname, h.fields.halter_nachname].filter(Boolean).join(' ')).filter(Boolean)
    ).size;
    return { total: hunde.length, ruede, huendin, uniqueHalter };
  }, [hunde]);

  const handleCreate = async (fields: Hunde['fields']) => {
    await LivingAppsService.createHundeEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: Hunde['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateHundeEntry(editRecord.record_id, fields);
    if (selectedHund?.record_id === editRecord.record_id) {
      setSelectedHund(null);
    }
    setEditRecord(null);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteHundeEntry(deleteTarget.record_id);
    if (selectedHund?.record_id === deleteTarget.record_id) setSelectedHund(null);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hunde</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle registrierten Hunde und ihre Halter</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-2 shrink-0" />
          Hund hinzufügen
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(stats.total)}
          description="Hunde"
          icon={<IconDog size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Rüden"
          value={String(stats.ruede)}
          description="männlich"
          icon={<IconGenderMale size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Hündinnen"
          value={String(stats.huendin)}
          description="weiblich"
          icon={<IconGenderFemale size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Halter"
          value={String(stats.uniqueHalter)}
          description="registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: List */}
        <div className={`lg:col-span-${selectedHund ? '1' : '3'} space-y-3`}>
          {/* Search + Filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hund oder Halter suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['alle', 'ruede', 'huendin'] as const).map(key => {
                const labels: Record<string, string> = { alle: 'Alle', ruede: 'Rüden', huendin: 'Hündinnen' };
                return (
                  <button
                    key={key}
                    onClick={() => setGenderFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      genderFilter === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dog Cards Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed bg-muted/20">
              <IconDog size={48} className="text-muted-foreground" stroke={1.5} />
              <p className="text-muted-foreground text-sm">
                {hunde.length === 0 ? 'Noch keine Hunde eingetragen.' : 'Keine Treffer gefunden.'}
              </p>
              {hunde.length === 0 && (
                <Button size="sm" variant="outline" onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
                  <IconPlus size={14} className="mr-1" /> Ersten Hund anlegen
                </Button>
              )}
            </div>
          ) : (
            <div className={`grid gap-3 ${selectedHund ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {filtered.map(hund => {
                const isSelected = selectedHund?.record_id === hund.record_id;
                const genderKey = (hund.fields.geschlecht as any)?.key;
                const genderLabel = (hund.fields.geschlecht as any)?.label;
                return (
                  <div
                    key={hund.record_id}
                    onClick={() => setSelectedHund(isSelected ? null : hund)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        genderKey === 'ruede' ? 'bg-blue-100 text-blue-600' :
                        genderKey === 'huendin' ? 'bg-pink-100 text-pink-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <IconDog size={20} stroke={1.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {hund.fields.hundename ?? '(kein Name)'}
                          </span>
                          {genderLabel && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {genderLabel}
                            </Badge>
                          )}
                        </div>
                        {hund.fields.rasse && (
                          <p className="text-sm text-muted-foreground truncate">{hund.fields.rasse}</p>
                        )}
                        {(hund.fields.halter_vorname || hund.fields.halter_nachname) && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Halter: {[hund.fields.halter_vorname, hund.fields.halter_nachname].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setEditRecord(hund); setDialogOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Bearbeiten"
                        >
                          <IconPencil size={15} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(hund); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Löschen"
                        >
                          <IconTrash size={15} />
                        </button>
                        <IconChevronRight size={14} className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        {selectedHund && (
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card shadow-sm sticky top-24">
              {/* Detail Header */}
              <div className="p-6 border-b">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    (selectedHund.fields.geschlecht as any)?.key === 'ruede' ? 'bg-blue-100 text-blue-600' :
                    (selectedHund.fields.geschlecht as any)?.key === 'huendin' ? 'bg-pink-100 text-pink-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <IconDog size={28} stroke={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">
                      {selectedHund.fields.hundename ?? '(kein Name)'}
                    </h2>
                    {selectedHund.fields.rasse && (
                      <p className="text-muted-foreground">{selectedHund.fields.rasse}</p>
                    )}
                    {(selectedHund.fields.geschlecht as any)?.label && (
                      <Badge variant="secondary" className="mt-1">
                        {(selectedHund.fields.geschlecht as any).label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditRecord(selectedHund); setDialogOpen(true); }}
                    >
                      <IconPencil size={14} className="mr-1" /> Bearbeiten
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(selectedHund)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detail Body */}
              <div className="p-6 space-y-6">
                {/* Hund Info */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hund</h3>
                  <div className="space-y-2">
                    {selectedHund.fields.geburtsdatum && (
                      <div className="flex items-center gap-3">
                        <IconCalendar size={16} className="text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Geburtsdatum</p>
                          <p className="text-sm font-medium">{formatDate(selectedHund.fields.geburtsdatum)}</p>
                        </div>
                      </div>
                    )}
                    {selectedHund.fields.bemerkungen && (
                      <div className="mt-2 p-3 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Bemerkungen</p>
                        <p className="text-sm">{selectedHund.fields.bemerkungen}</p>
                      </div>
                    )}
                    {!selectedHund.fields.geburtsdatum && !selectedHund.fields.bemerkungen && (
                      <p className="text-sm text-muted-foreground">Keine weiteren Angaben.</p>
                    )}
                  </div>
                </div>

                {/* Halter Info */}
                {(selectedHund.fields.halter_vorname || selectedHund.fields.halter_nachname || selectedHund.fields.halter_email || selectedHund.fields.halter_telefon) && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Halter</h3>
                    <div className="rounded-xl border bg-background p-4 space-y-3">
                      {(selectedHund.fields.halter_vorname || selectedHund.fields.halter_nachname) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {[selectedHund.fields.halter_vorname?.[0], selectedHund.fields.halter_nachname?.[0]].filter(Boolean).join('')}
                            </span>
                          </div>
                          <p className="font-semibold text-foreground">
                            {[selectedHund.fields.halter_vorname, selectedHund.fields.halter_nachname].filter(Boolean).join(' ')}
                          </p>
                        </div>
                      )}
                      {selectedHund.fields.halter_email && (
                        <a
                          href={`mailto:${selectedHund.fields.halter_email}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors group"
                          onClick={e => e.stopPropagation()}
                        >
                          <IconMail size={16} className="text-muted-foreground group-hover:text-primary shrink-0" />
                          <span className="text-sm truncate">{selectedHund.fields.halter_email}</span>
                        </a>
                      )}
                      {selectedHund.fields.halter_telefon && (
                        <a
                          href={`tel:${selectedHund.fields.halter_telefon}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors group"
                          onClick={e => e.stopPropagation()}
                        >
                          <IconPhone size={16} className="text-muted-foreground group-hover:text-primary shrink-0" />
                          <span className="text-sm">{selectedHund.fields.halter_telefon}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <HundeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Hunde']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Hunde']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hund löschen"
        description={`Soll "${deleteTarget?.fields.hundename ?? 'dieser Hund'}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
