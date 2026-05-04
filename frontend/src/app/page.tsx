'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TabBar, type TabId } from '@/components/ui/TabBar';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { ModelsScreen } from '@/components/screens/ModelsScreen';
import { ModelDetailScreen } from '@/components/screens/ModelDetailScreen';
import {
  BuilderScreen,
  type BuilderDraft,
} from '@/components/screens/BuilderScreen';
import { HistoryScreen } from '@/components/screens/HistoryScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import {
  WorkoutScreen,
  type WorkoutVariant,
} from '@/components/workout/WorkoutScreen';
import {
  CelebrationScreen,
  type CelebrationVariant,
} from '@/components/workout/CelebrationScreen';
import {
  bootstrap,
  createLog,
  logoutAndReset,
  runSync,
  saveModel,
  updateSettings,
  useStore,
} from '@/lib/store';
import { XS } from '@/lib/tokens';
import type {
  SessionLog,
  SessionModel,
  UserSettings,
  WorkoutSummary,
} from '@/lib/types';

type Route =
  | { name: 'tabs' }
  | { name: 'modelDetail'; modelId: SessionModel['id'] }
  | { name: 'builder'; modelId?: SessionModel['id'] }
  | { name: 'workout'; modelId: SessionModel['id'] }
  | { name: 'celebration'; modelId: SessionModel['id'] };

const WORKOUT_VARIANT: WorkoutVariant = 'B';
const CELEBRATION_VARIANT: CelebrationVariant = 'A';

export default function HomePage() {
  const router = useRouter();
  const store = useStore();
  const [tab, setTab] = React.useState<TabId>('home');
  const [route, setRoute] = React.useState<Route>({ name: 'tabs' });
  const [lastSummary, setLastSummary] =
    React.useState<WorkoutSummary | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void bootstrap();
  }, []);

  React.useEffect(() => {
    if (store.ready && !store.authed) {
      router.replace('/login');
    }
  }, [store.ready, store.authed, router]);

  // Re-sync whenever the network comes back up.
  React.useEffect(() => {
    const onOnline = () => void runSync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  if (!store.ready || !store.authed) {
    return <SplashScreen />;
  }

  const settings: UserSettings = store.profile?.settings ?? {
    sound: true,
    vibrate: true,
    demo_mode: false,
  };
  const pbCount =
    store.dashboard?.pb_count ?? computePbCount(store.history);
  const streak = store.dashboard?.streak ?? computeStreak(store.history);

  const goWorkout = (modelId: SessionModel['id']) =>
    setRoute({ name: 'workout', modelId });
  const goModelDetail = (modelId: SessionModel['id']) =>
    setRoute({ name: 'modelDetail', modelId });
  const goBuilder = (modelId?: SessionModel['id']) =>
    setRoute({ name: 'builder', modelId });
  const goTabs = (t?: TabId) => {
    if (t) setTab(t);
    setRoute({ name: 'tabs' });
  };

  const handleSaveModel = async (draft: BuilderDraft) => {
    const editingId =
      route.name === 'builder' ? route.modelId : undefined;
    try {
      await saveModel(
        {
          name: draft.name,
          exercises: draft.blocks.map((b, i) => ({
            exercise_id: b.exerciseId,
            sets_count: b.sets,
            goal_type: b.goalType,
            goal_value: b.goalType === 'max' ? null : b.goalValue,
            rest_time: b.rest,
            order: i,
          })),
        },
        {
          editingId,
          flavor: { color: draft.color, subtitle: draft.subtitle },
        },
      );
      goTabs('models');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur locale');
    }
  };

  const completeWorkout = async (summary: WorkoutSummary) => {
    setLastSummary(summary);
    if (route.name !== 'workout') return;
    const modelId = route.modelId;
    const completed_at = new Date().toISOString();
    try {
      await createLog({
        session_model_id: modelId,
        duration: summary.duration,
        completed_at,
        performance_logs: summary.results.map((r) => ({
          exercise_id: r.exerciseId,
          set_number: r.setNumber,
          reps_done: r.reps,
        })),
        has_pb: summary.results.some((r) => r.isPb),
      });
      // Best-effort full sync at end of session — the log is already saved
      // locally so this never blocks the celebration screen.
      void runSync();
      setRoute({ name: 'celebration', modelId });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur locale');
    }
  };

  const handleSettings = async (s: UserSettings) => {
    try {
      await updateSettings(s);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur locale');
    }
  };

  const handleSyncNow = async () => {
    try {
      await runSync();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur de sync');
    }
  };

  const handleLogout = async () => {
    await logoutAndReset();
    router.replace('/login');
  };

  const currentModel: SessionModel | null = (() => {
    if (route.name === 'tabs') return null;
    if (route.name === 'builder' && !route.modelId) return null;
    const id =
      'modelId' in route ? route.modelId : undefined;
    if (id == null) return null;
    return store.models.find((m) => String(m.id) === String(id)) ?? null;
  })();

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        {route.name === 'tabs' && (
          <>
            {tab === 'home' && (
              <HomeScreen
                models={store.models}
                history={store.history}
                pbCount={pbCount}
                streak={streak}
                onOpenModel={goModelDetail}
                onStart={goWorkout}
              />
            )}
            {tab === 'models' && (
              <ModelsScreen
                models={store.models}
                onOpenModel={goModelDetail}
                onCreate={() => goBuilder()}
                onStart={goWorkout}
              />
            )}
            {tab === 'history' && (
              <HistoryScreen
                history={store.history}
                models={store.models}
                exercises={store.exercises}
              />
            )}
            {tab === 'profile' && store.profile && (
              <ProfileScreen
                profile={store.profile}
                history={store.history}
                pbCount={pbCount}
                settings={settings}
                onSettings={handleSettings}
                onLogout={handleLogout}
                onSyncNow={handleSyncNow}
                lastSyncAt={store.lastSyncAt}
                pendingCount={store.pending}
                syncing={store.syncing}
              />
            )}
          </>
        )}

        {route.name === 'modelDetail' && currentModel && (
          <ModelDetailScreen
            model={currentModel}
            exercises={store.exercises}
            onBack={() => goTabs()}
            onStart={goWorkout}
            onEdit={() => goBuilder(currentModel.id)}
          />
        )}

        {route.name === 'builder' && (
          <BuilderScreen
            initial={currentModel}
            exercises={store.exercises}
            onSave={handleSaveModel}
            onCancel={() => goTabs('models')}
          />
        )}

        {route.name === 'workout' && currentModel && (
          <WorkoutScreen
            model={currentModel}
            exercises={store.exercises}
            history={store.history}
            variant={WORKOUT_VARIANT}
            settings={{
              sound: settings.sound,
              vibrate: settings.vibrate,
              demo: settings.demo_mode,
            }}
            onComplete={completeWorkout}
            onAbort={() => setRoute({ name: 'tabs' })}
          />
        )}

        {route.name === 'celebration' && lastSummary && currentModel && (
          <CelebrationScreen
            summary={lastSummary}
            model={currentModel}
            exercises={store.exercises}
            variant={CELEBRATION_VARIANT}
            onDone={() => {
              setRoute({ name: 'tabs' });
              setTab('home');
            }}
          />
        )}
      </div>

      <OfflineBadge />

      {saveError && (
        <ErrorToast
          message={saveError}
          onClose={() => setSaveError(null)}
        />
      )}

      {route.name === 'tabs' && (
        <TabBar
          tab={tab}
          onTab={setTab}
          onStart={() => {
            const lastId =
              store.history[0]?.session_model_id ?? store.models[0]?.id;
            if (lastId != null) goWorkout(lastId);
          }}
        />
      )}
    </>
  );
}

function computePbCount(history: SessionLog[]): number {
  return history.reduce(
    (s, log) => s + log.performance_logs.filter((pl) => pl.is_pb).length,
    0,
  );
}

// Streak = consecutive days (anchored on today) with at least one log.
function computeStreak(history: SessionLog[]): number {
  if (history.length === 0) return 0;
  const days = new Set<string>();
  for (const log of history) {
    if (!log.completed_at) continue;
    days.add(new Date(log.completed_at).toISOString().slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) {
      // Allow today to be empty before breaking.
      if (streak === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (streak > 365) break;
  }
  return streak;
}

function OfflineBadge() {
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  if (online) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 12px',
        background: 'rgba(15,23,42,0.92)',
        border: `1px solid ${XS.divider}`,
        color: XS.fg1,
        borderRadius: 999,
        fontFamily: XS.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      Hors ligne
    </div>
  );
}

function ErrorToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 96,
        background: XS.danger,
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 14,
        fontFamily: XS.font,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 12px 32px rgba(239,68,68,0.4)',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  );
}

function SplashScreen() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A, #06081A)',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 22,
          background: `linear-gradient(135deg, ${XS.v2}, ${XS.v0})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 16px 48px ${XS.vGlow}`,
          fontFamily: XS.font,
          fontSize: 32,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: -1,
        }}
      >
        XS
      </div>
      <div
        style={{
          fontFamily: XS.mono,
          fontSize: 11,
          color: XS.v3,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
        }}
      >
        Chargement…
      </div>
    </div>
  );
}
