const STORE_KEY = "pdx_v1";

export function getCollection() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCollection(col) {
  localStorage.setItem(STORE_KEY, JSON.stringify(col));
}

export function isInCollection(id) {
  return getCollection().some((x) => x.id === id);
}

export function addCardToStore(card) {
  const col = getCollection();
  if (col.some((x) => x.id === card.id)) return false;
  col.push(card);
  saveCollection(col);
  return true;
}

export function removeCardFromStore(id) {
  const col = getCollection();
  saveCollection(col.filter((x) => x.id !== id));
}
