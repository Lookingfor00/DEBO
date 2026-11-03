export type FavoriteToggleViewProps = {
  itemId: string;
  isAuthenticated: boolean;
  isSaved: boolean;
};

export function FavoriteToggleView({
  itemId,
  isAuthenticated,
  isSaved,
}: FavoriteToggleViewProps) {
  if (!isAuthenticated) {
    return (
      <p className="text-sm">
        <a href="/auth/login" className="underline">
          Connexion pour sauver
        </a>
      </p>
    );
  }

  if (isSaved) {
    return (
      <form method="post" action="/api/favorites">
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="intent" value="unsave" />
        <button type="submit" className="text-sm underline">
          Retirer des favoris
        </button>
      </form>
    );
  }

  return (
    <form method="post" action="/api/favorites">
      <input type="hidden" name="item_id" value={itemId} />
      <button type="submit" className="text-sm underline">
        Sauver
      </button>
    </form>
  );
}
