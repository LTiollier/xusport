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
import { ApiError, api, auth } from '@/lib/api';
import { useStore } from '@/lib/store';
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
    void store.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (store.ready && !store.authed) {
      router.replace('/login');
    }
  }, [store.ready, store.authed, router]);

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
  const streak = store.dashboard?.streak ?? 0;

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

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      auth.clearToken();
      router.replace('/login');
      return;
    }
    setSaveError(
      err instanceof Error ? err.message : 'Erreur réseau',
    );
  };

  const saveModel = async (draft: BuilderDraft) => {
    const editingId =
      route.name === 'builder' ? route.modelId : undefined;
    const apiBody = {
      name: draft.name,
      exercises: draft.blocks.map((b, i) => ({
        exercise_id: b.exerciseId,
        sets_count: b.sets,
        goal_type: b.goalType,
        goal_value: b.goalType === 'max' ? null : b.goalValue,
        rest_time: b.rest,
        order: i,
      })),
    };
    try {
      const res = editingId
        ? await api.updateModel(editingId, apiBody)
        : await api.createModel(apiBody);
      const saved: SessionModel = {
        ...res.data,
        // preserve UI-only flavor fields
        color: res.data.color ?? draft.color,
        subtitle: res.data.subtitle ?? draft.subtitle,
      };
      if (editingId) {
        store.setModels(
          store.models.map((m) => (m.id === editingId ? saved : m)),
        );
      } else {
        store.setModels([...store.models, saved]);
      }
      goTabs('models');
    } catch (err) {
      handleApiError(err);
    }
  };

  const completeWorkout = async (summary: WorkoutSummary) => {
    setLastSummary(summary);
    if (route.name !== 'workout') return;
    const modelId = route.modelId;
    const completed_at = new Date().toISOString();
    try {
      const { data: saved } = await api.createLog({
        session_model_id: modelId,
        duration: summary.duration,
        completed_at,
        performance_logs: summary.results.map((r) => ({
          exercise_id: r.exerciseId,
          set_number: r.setNumber,
          reps_done: r.reps,
        })),
      });
      store.prependLog(saved);
      void store.refreshDashboard();
      setRoute({ name: 'celebration', modelId });
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateSettings = async (s: UserSettings) => {
    const prev = store.profile?.settings ?? s;
    store.setSettings(s);
    try {
      await api.updateSettings(s);
    } catch (err) {
      store.setSettings(prev);
      handleApiError(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      /* even if it fails, clear token locally */
    }
    auth.clearToken();
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
                onSettings={updateSettings}
                onLogout={handleLogout}
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
            onSave={saveModel}
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
