import { useItems } from "../../providers/use-items";

/** テンプレート項目の読込状態と一覧を表示し、再読込操作を受け持ちます。 */
export function ItemListPage() {
  const { state, reload } = useItems();

  return (
    <main>
      <header>
        <h1>Template items</h1>
        <button type="button" onClick={reload}>
          Reload
        </button>
      </header>
      {state.status === "loading" && <p role="status">Loading...</p>}
      {state.status === "error" && (
        <section role="alert">
          <p>Failed to load items</p>
          <button type="button" onClick={reload}>
            Retry
          </button>
        </section>
      )}
      {state.status === "data" && state.items.length === 0 && <p>No items</p>}
      {state.status === "data" && state.items.length > 0 && (
        <ul>
          {state.items.map((item) => (
            <li key={item.id.value}>{item.title.value}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
