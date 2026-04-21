import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { useSession } from "../app/session";
import { AppShell } from "../layout/AppShell";
import { AuthScreen } from "../screens/AuthScreen";
import { BooksScreen } from "../screens/BooksScreen";
import { IngestScreen } from "../screens/IngestScreen";
import { ProjectWorkspaceScreen } from "../screens/ProjectWorkspaceScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { WriterModeScreen } from "../screens/WriterModeScreen";

function ProtectedLayout() {
  const { token, loading } = useSession();
  if (loading) {
    return <main className="app"><section className="panel">Loading session...</section></main>;
  }
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <AppShell />;
}

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthScreen />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/write" replace /> },
      { path: "write", element: <WriterModeScreen /> },
      { path: "projects", element: <ProjectWorkspaceScreen /> },
      {
        path: "projects/:projectId/drafts/:draftId",
        element: <ProjectWorkspaceScreen />,
      },
      { path: "search", element: <SearchScreen /> },
      { path: "ingest", element: <IngestScreen /> },
      { path: "books", element: <BooksScreen /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
