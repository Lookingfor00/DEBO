import { FavoritesView } from "@/components/favorites/favorites-view";
import { loadFavoritesPage } from "@/hooks/pages/load-favorites-page";
import { getVisitorSession } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getVisitorSession();
  const state = await loadFavoritesPage(session.sub);
  return (
    <FavoritesView
      isAuthenticated={session.isAuthenticated}
      items={state.data.items}
      isError={state.isError}
      error={state.error}
    />
  );
}
