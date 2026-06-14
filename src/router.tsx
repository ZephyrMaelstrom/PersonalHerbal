import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { TodayScreen } from '@/routes/today';
import { SpeciesListScreen } from '@/routes/species-list';
import { SpeciesNewScreen } from '@/routes/species-new';
import { SpeciesDetailScreen } from '@/routes/species-detail';
import { SpeciesEditScreen } from '@/routes/species-edit';
import { ReferenceGenerateScreen } from '@/routes/reference-generate';
import { SettingsScreen } from '@/routes/settings';
import { JournalScreen } from '@/routes/journal';
import { CalendarScreen } from '@/routes/calendar';
import { PlacesScreen } from '@/routes/places';
import { CaptureScreen } from '@/routes/capture';
import { FindsMapScreen } from '@/routes/map';
import { ProgressScreen } from '@/routes/progress';
import { CompanionScreen } from '@/routes/companion';
import { SearchScreen } from '@/routes/search';
import { WorkbenchScreen } from '@/routes/workbench';
import { CalculatorScreen } from '@/routes/calculator';
import { FormulasScreen } from '@/routes/formulas';
import { FormulaDetailScreen } from '@/routes/formula-detail';
import { InventoryScreen } from '@/routes/inventory';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: TodayScreen });
/** Search params let attribute chips deep-link into a pre-filtered species list. */
export interface SpeciesSearch {
  edibility?: string;
  nativeStatus?: string;
  action?: string;
  habitat?: string;
  safetyFlag?: string;
  season?: string;
}
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const speciesListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/species',
  component: SpeciesListScreen,
  validateSearch: (s: Record<string, unknown>): SpeciesSearch => ({
    edibility: str(s.edibility),
    nativeStatus: str(s.nativeStatus),
    action: str(s.action),
    habitat: str(s.habitat),
    safetyFlag: str(s.safetyFlag),
    season: str(s.season),
  }),
});
const speciesNewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/species/new', component: SpeciesNewScreen });
const speciesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/species/$speciesId',
  component: SpeciesDetailScreen,
});
const speciesEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/species/$speciesId/edit',
  component: SpeciesEditScreen,
});
const referenceGenerateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/species/$speciesId/reference',
  component: ReferenceGenerateScreen,
  validateSearch: (s: Record<string, unknown>): { improve?: boolean } => ({
    improve: s.improve === true || s.improve === 'true',
  }),
});
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsScreen });
const journalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/journal', component: JournalScreen });
const calendarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/calendar', component: CalendarScreen });
const placesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/places', component: PlacesScreen });
const captureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/capture', component: CaptureScreen });
const mapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/map', component: FindsMapScreen });
const progressRoute = createRoute({ getParentRoute: () => rootRoute, path: '/progress', component: ProgressScreen });
const companionRoute = createRoute({ getParentRoute: () => rootRoute, path: '/companion', component: CompanionScreen });
const searchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/search', component: SearchScreen });
const workbenchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workbench', component: WorkbenchScreen });
const calculatorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/calculator', component: CalculatorScreen });
const formulasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/formulas', component: FormulasScreen });
const formulaDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/formulas/$formulaId', component: FormulaDetailScreen });
const inventoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryScreen });

const routeTree = rootRoute.addChildren([
  indexRoute,
  speciesListRoute,
  speciesNewRoute,
  speciesDetailRoute,
  speciesEditRoute,
  referenceGenerateRoute,
  settingsRoute,
  journalRoute,
  calendarRoute,
  placesRoute,
  captureRoute,
  mapRoute,
  progressRoute,
  companionRoute,
  searchRoute,
  workbenchRoute,
  calculatorRoute,
  formulasRoute,
  formulaDetailRoute,
  inventoryRoute,
]);

// Hash history keeps deep links and hard refreshes working on GitHub Pages (no server
// rewrites needed). Capacitor/native builds work the same way.
export const router = createRouter({ routeTree, history: createHashHistory() });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
