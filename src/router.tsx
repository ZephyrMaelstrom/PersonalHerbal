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

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: TodayScreen });
const speciesListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/species', component: SpeciesListScreen });
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
});
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsScreen });

const routeTree = rootRoute.addChildren([
  indexRoute,
  speciesListRoute,
  speciesNewRoute,
  speciesDetailRoute,
  speciesEditRoute,
  referenceGenerateRoute,
  settingsRoute,
]);

// Hash history keeps deep links and hard refreshes working on GitHub Pages (no server
// rewrites needed). Capacitor/native builds work the same way.
export const router = createRouter({ routeTree, history: createHashHistory() });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
