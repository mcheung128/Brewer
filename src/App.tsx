import { useEffect, useMemo, useState } from "react";
import {
  clearStoredToken,
  fetchCurrentUser,
  fetchRemoteState,
  loginUser,
  logoutUser,
  registerUser,
  saveRemoteState,
  storeToken,
  getStoredToken,
} from "./api";
import AuthView from "./components/AuthView";
import BeansView from "./components/BeansView";
import HistoryView from "./components/HistoryView";
import HomeView from "./components/HomeView";
import InsightsView from "./components/InsightsView";
import NewBrewView from "./components/NewBrewView";
import TemplatesView from "./components/TemplatesView";
import { createDefaultScores, createDefaultState, createId } from "./storage";
import {
  BREW_METHODS,
  type AppState,
  type Bean,
  type Brew,
  type BrewMethod,
  type NewBeanDraft,
  type NewBrewDraft,
  type RecipeTemplate,
  type TasteAttribute,
  type User,
} from "./types";

type View = "home" | "new" | "beans" | "history" | "templates" | "insights";
type AuthMode = "login" | "register";

const tasteFields: Array<{ key: TasteAttribute; label: string }> = [
  { key: "acidity", label: "Acidity" },
  { key: "sweetness", label: "Sweetness" },
  { key: "bitterness", label: "Bitterness" },
  { key: "body", label: "Body" },
  { key: "clarity", label: "Clarity" },
  { key: "aftertaste", label: "Aftertaste" },
  { key: "strength", label: "Strength" },
  { key: "balance", label: "Overall balance" },
];

const tabLabels: Record<View, string> = {
  home: "Home",
  new: "Log Brew",
  beans: "Beans",
  history: "History",
  templates: "Templates",
  insights: "Insights",
};

const brewSteps = [
  "Brew basics",
  "Beans",
  "Recipe",
  "Taste",
  "Review",
] as const;

const POUR_OVER_METHODS: BrewMethod[] = ["V60", "Chemex"];
const FILTER_METHODS: BrewMethod[] = ["V60", "Chemex", "AeroPress"];

const todayLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

const buildDraft = (): NewBrewDraft => ({
  name: "",
  method: "V60",
  brewedAt: todayLocal(),
  beanId: "",
  templateId: "",
  rating: 7,
  notes: "",
  dose: 0,
  water: 0,
  grindSize: "",
  grinderUsed: "",
  waterTemp: 0,
  filterType: "",
  totalBrewTime: "",
  numberOfPours: 0,
  pourTiming: "",
  changeNextTime: "",
  tasteScores: createDefaultScores(),
});

const buildBeanDraft = (): NewBeanDraft => ({
  roaster: "",
  coffeeName: "",
  originCountry: "",
  regionFarm: "",
  variety: "",
  process: "",
  roastLevel: "",
  roastDate: "",
  bagNotes: "",
  price: "",
  bagSize: "",
  grinderPairing: "",
});

const formatDateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";

const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString([], { dateStyle: "medium" })
    : "Not set";

const calcRatio = (dose: number, water: number) =>
  dose > 0 ? (water / dose).toFixed(1) : "0.0";

const daysOffRoast = (roastDate: string, brewedAt: string) => {
  if (!roastDate || !brewedAt) return null;
  const diff = new Date(brewedAt).getTime() - new Date(roastDate).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
};

const normalizeDraftForMethod = (
  draft: NewBrewDraft,
  method: BrewMethod,
): NewBrewDraft => ({
  ...draft,
  method,
  filterType: FILTER_METHODS.includes(method) ? draft.filterType : "",
  numberOfPours: POUR_OVER_METHODS.includes(method) ? draft.numberOfPours : 0,
  pourTiming: POUR_OVER_METHODS.includes(method) ? draft.pourTiming : "",
});

function App() {
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [view, setView] = useState<View>("home");
  const [selectedBrewId, setSelectedBrewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewBrewDraft>(() => buildDraft());
  const [beanDraft, setBeanDraft] = useState<NewBeanDraft>(() =>
    buildBeanDraft(),
  );
  const [step, setStep] = useState(1);
  const [showBeanForm, setShowBeanForm] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({
    name: "",
    method: "V60" as BrewMethod,
  });
  const [session, setSession] = useState<{ token: string; user: User } | null>(
    null,
  );
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [hasLoadedRemoteState, setHasLoadedRemoteState] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setAuthReady(true);
        return;
      }

      try {
        const [{ user }, { state: remoteState }] = await Promise.all([
          fetchCurrentUser(token),
          fetchRemoteState(token),
        ]);
        setSession({ token, user });
        setState(remoteState);
        setHasLoadedRemoteState(true);
      } catch {
        clearStoredToken();
      } finally {
        setAuthReady(true);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!session || !hasLoadedRemoteState) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveRemoteState(session.token, state)
        .then(() => setSyncError(""))
        .catch((error: Error) => {
          setSyncError(error.message);
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [hasLoadedRemoteState, session, state]);

  const beansById = useMemo(
    () => Object.fromEntries(state.beans.map((bean) => [bean.id, bean])),
    [state.beans],
  );

  const brewsSorted = useMemo(
    () =>
      [...state.brews].sort(
        (a, b) => +new Date(b.brewedAt) - +new Date(a.brewedAt),
      ),
    [state.brews],
  );

  const selectedBrew =
    brewsSorted.find((brew) => brew.id === selectedBrewId) ??
    brewsSorted[0] ??
    null;

  const averageRating = brewsSorted.length
    ? (
        brewsSorted.reduce((sum, brew) => sum + brew.rating, 0) /
        brewsSorted.length
      ).toFixed(1)
    : "0.0";

  const topBean = useMemo(() => {
    const beanRatings = state.beans
      .map((bean) => {
        const beanBrews = state.brews.filter((brew) => brew.beanId === bean.id);
        if (beanBrews.length === 0) return null;
        const avg =
          beanBrews.reduce((sum, brew) => sum + brew.rating, 0) /
          beanBrews.length;
        return { bean, avg };
      })
      .filter((entry): entry is { bean: Bean; avg: number } => entry !== null)
      .sort((a, b) => b.avg - a.avg)[0];

    return beanRatings ?? null;
  }, [state.beans, state.brews]);

  const bestMethod = useMemo(() => {
    const grouped = BREW_METHODS.map((method) => {
      const matches = state.brews.filter((brew) => brew.method === method);
      const avg = matches.length
        ? matches.reduce((sum, brew) => sum + brew.rating, 0) / matches.length
        : 0;
      return { method, avg, count: matches.length };
    }).filter((entry) => entry.count > 0);

    return grouped.sort((a, b) => b.avg - a.avg)[0] ?? null;
  }, [state.brews]);

  const resetDraft = () => {
    setDraft(buildDraft());
    setStep(1);
    setShowBeanForm(false);
    setBeanDraft(buildBeanDraft());
  };

  const updateDraft = <K extends keyof NewBrewDraft>(
    key: K,
    value: NewBrewDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateBeanDraft = <K extends keyof NewBeanDraft>(
    key: K,
    value: NewBeanDraft[K],
  ) => {
    setBeanDraft((current) => ({ ...current, [key]: value }));
  };

  const updateMethod = (method: BrewMethod) => {
    setDraft((current) => normalizeDraftForMethod(current, method));
  };

  const applyTemplate = (templateId: string) => {
    const template = state.templates.find((entry) => entry.id === templateId);
    if (!template) return;

    setDraft((current) =>
      normalizeDraftForMethod(
        {
          ...current,
          templateId,
          method: template.method,
          dose: template.dose,
          water: template.water,
          grindSize: template.grindSize,
          waterTemp: template.waterTemp,
          numberOfPours: template.numberOfPours,
          pourTiming: template.pourTiming,
          totalBrewTime: template.totalBrewTime,
          filterType: template.filterType,
        },
        template.method,
      ),
    );
  };

  const saveBean = () => {
    if (!beanDraft.roaster || !beanDraft.coffeeName) return;

    const bean: Bean = {
      id: createId(),
      createdAt: new Date().toISOString(),
      ...beanDraft,
    };

    setState((current) => ({ ...current, beans: [bean, ...current.beans] }));
    setDraft((current) => ({ ...current, beanId: bean.id }));
    setBeanDraft(buildBeanDraft());
    setShowBeanForm(false);
  };

  const updateBeanRecord = (beanId: string, updates: NewBeanDraft) => {
    setState((current) => ({
      ...current,
      beans: current.beans.map((bean) =>
        bean.id === beanId ? { ...bean, ...updates } : bean,
      ),
    }));
  };

  const deleteBeanRecord = (beanId: string) => {
    setState((current) => ({
      ...current,
      beans: current.beans.filter((bean) => bean.id !== beanId),
      brews: current.brews.filter((brew) => brew.beanId !== beanId),
    }));

    if (draft.beanId === beanId) {
      setDraft((current) => ({ ...current, beanId: "" }));
    }
  };

  const saveBrew = () => {
    if (!draft.name || !draft.beanId) return;

    const brew: Brew = {
      id: createId(),
      createdAt: new Date().toISOString(),
      name: draft.name,
      method: draft.method,
      brewedAt: draft.brewedAt,
      beanId: draft.beanId,
      templateId: draft.templateId || undefined,
      rating: draft.rating,
      notes: draft.notes,
      dose: draft.dose,
      water: draft.water,
      grindSize: draft.grindSize,
      grinderUsed: draft.grinderUsed,
      waterTemp: draft.waterTemp,
      filterType: draft.filterType,
      totalBrewTime: draft.totalBrewTime,
      numberOfPours: draft.numberOfPours,
      pourTiming: draft.pourTiming,
      changeNextTime: draft.changeNextTime,
      tasteScores: draft.tasteScores,
    };

    setState((current) => ({ ...current, brews: [brew, ...current.brews] }));
    setSelectedBrewId(brew.id);
    setView("history");
    resetDraft();
  };

  const duplicateBrew = (brew: Brew) => {
    setDraft(
      normalizeDraftForMethod(
        {
          name: `${brew.name} Copy`,
          method: brew.method,
          brewedAt: todayLocal(),
          beanId: brew.beanId,
          templateId: brew.templateId ?? "",
          rating: brew.rating,
          notes: brew.notes,
          dose: brew.dose,
          water: brew.water,
          grindSize: brew.grindSize,
          grinderUsed: brew.grinderUsed,
          waterTemp: brew.waterTemp,
          filterType: brew.filterType,
          totalBrewTime: brew.totalBrewTime,
          numberOfPours: brew.numberOfPours,
          pourTiming: brew.pourTiming,
          changeNextTime: brew.changeNextTime,
          tasteScores: brew.tasteScores,
        },
        brew.method,
      ),
    );
    setStep(3);
    setView("new");
  };

  const deleteBrewRecord = (brewId: string) => {
    setState((current) => ({
      ...current,
      brews: current.brews.filter((brew) => brew.id !== brewId),
    }));
    setSelectedBrewId((current) => (current === brewId ? null : current));
  };

  const saveTemplateFromDraft = () => {
    if (!templateDraft.name) return;

    const template: RecipeTemplate = {
      id: createId(),
      name: templateDraft.name,
      method: draft.method || templateDraft.method,
      dose: draft.dose,
      water: draft.water,
      grindSize: draft.grindSize,
      waterTemp: draft.waterTemp,
      numberOfPours: draft.numberOfPours,
      pourTiming: draft.pourTiming,
      totalBrewTime: draft.totalBrewTime,
      filterType: draft.filterType,
    };

    setState((current) => ({
      ...current,
      templates: [template, ...current.templates],
    }));
    setTemplateDraft({ name: "", method: draft.method });
    setDraft((current) => ({ ...current, templateId: template.id }));
  };

  const createTemplate = (templateDraft: Omit<RecipeTemplate, "id">) => {
    const template: RecipeTemplate = {
      id: createId(),
      ...templateDraft,
    };

    setState((current) => ({
      ...current,
      templates: [template, ...current.templates],
    }));
  };

  const updateTemplateRecord = (
    templateId: string,
    updates: Omit<RecipeTemplate, "id">,
  ) => {
    setState((current) => ({
      ...current,
      templates: current.templates.map((template) =>
        template.id === templateId ? { ...template, ...updates } : template,
      ),
    }));
  };

  const deleteTemplateRecord = (templateId: string) => {
    setState((current) => ({
      ...current,
      templates: current.templates.filter(
        (template) => template.id !== templateId,
      ),
      brews: current.brews.map((brew) =>
        brew.templateId === templateId
          ? { ...brew, templateId: undefined }
          : brew,
      ),
    }));

    if (draft.templateId === templateId) {
      setDraft((current) => ({ ...current, templateId: "" }));
    }
  };

  const handleAuthSubmit = async (
    mode: AuthMode,
    name: string,
    email: string,
    password: string,
  ) => {
    setIsAuthSubmitting(true);
    setAuthError("");
    setHasLoadedRemoteState(false);

    try {
      const authResponse =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser(name, email, password);
      storeToken(authResponse.token);
      const { state: remoteState } = await fetchRemoteState(authResponse.token);
      setSession(authResponse);
      setState(remoteState);
      setHasLoadedRemoteState(true);
      setView("home");
      setSyncError("");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Authentication failed",
      );
    } finally {
      setIsAuthSubmitting(false);
      setAuthReady(true);
    }
  };

  const handleLogout = async () => {
    const token = session?.token;
    if (token) {
      try {
        await logoutUser(token);
      } catch {
        // Ignore logout failures and clear the local session anyway.
      }
    }

    clearStoredToken();
    setSession(null);
    setState(createDefaultState());
    setSelectedBrewId(null);
    setView("home");
    setHasLoadedRemoteState(false);
    setSyncError("");
    resetDraft();
  };

  const showsFilterType = FILTER_METHODS.includes(draft.method);
  const showsPourFields = POUR_OVER_METHODS.includes(draft.method);

  if (!authReady) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Brewer</p>
          <h1>Loading your coffee logbook</h1>
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthView
        error={authError}
        isSubmitting={isAuthSubmitting}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">Brewer</p>
          <h2>The coffee logbook</h2>
        </div>
        <nav>
          {Object.entries(tabLabels).map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "nav-link active" : "nav-link"}
              onClick={() => setView(key as View)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span>Signed in as</span>
          <strong>{session.user.name || session.user.email}</strong>
          {syncError ? <p className="sync-error">{syncError}</p> : null}
          <button className="sidebar-signout-button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="content">
        {view === "home" && (
          <HomeView
            averageRating={averageRating}
            beansById={beansById}
            beanCount={state.beans.length}
            bestMethod={bestMethod}
            brews={brewsSorted}
            brewCount={state.brews.length}
            formatDateTime={formatDateTime}
            onLogBrew={() => setView("new")}
            onOpenHistory={() => setView("history")}
            onSelectBrew={(brewId) => {
              setSelectedBrewId(brewId);
              setView("history");
            }}
            topBean={topBean}
          />
        )}
        {view === "new" && (
          <NewBrewView
            applyTemplate={applyTemplate}
            beanDraft={beanDraft}
            beans={state.beans}
            beansById={beansById}
            brewSteps={brewSteps}
            calcRatio={calcRatio}
            draft={draft}
            formatDateTime={formatDateTime}
            saveBean={saveBean}
            saveBrew={saveBrew}
            saveTemplateFromDraft={saveTemplateFromDraft}
            setShowBeanForm={setShowBeanForm}
            setStep={setStep}
            setTemplateDraft={setTemplateDraft}
            showBeanForm={showBeanForm}
            showsFilterType={showsFilterType}
            showsPourFields={showsPourFields}
            step={step}
            tasteFields={tasteFields}
            templateDraft={templateDraft}
            templates={state.templates}
            updateBeanDraft={updateBeanDraft}
            updateDraft={updateDraft}
            updateMethod={updateMethod}
          />
        )}
        {view === "beans" && (
          <BeansView
            calcRatio={calcRatio}
            formatDate={formatDate}
            onAddBeans={() => {
              setView("new");
              setStep(2);
              setShowBeanForm(true);
            }}
            onUpdateBean={updateBeanRecord}
            onDeleteBean={deleteBeanRecord}
            state={state}
          />
        )}
        {view === "history" && (
          <HistoryView
            beansById={beansById}
            brews={brewsSorted}
            calcRatio={calcRatio}
            daysOffRoast={daysOffRoast}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onDuplicateBrew={duplicateBrew}
            onDeleteBrew={deleteBrewRecord}
            onSelectBrew={setSelectedBrewId}
            selectedBrew={selectedBrew}
            tasteFields={tasteFields}
          />
        )}
        {view === "templates" && (
          <TemplatesView
            calcRatio={calcRatio}
            onCreateTemplate={createTemplate}
            onStartBrew={(templateId) => {
              applyTemplate(templateId);
              setView("new");
              setStep(1);
            }}
            onUpdateTemplate={updateTemplateRecord}
            onDeleteTemplate={deleteTemplateRecord}
            templates={state.templates}
          />
        )}
        {view === "insights" && (
          <InsightsView
            beansById={beansById}
            bestMethod={bestMethod}
            daysOffRoast={daysOffRoast}
            state={state}
            topBean={topBean}
          />
        )}
      </main>
    </div>
  );
}

export default App;
