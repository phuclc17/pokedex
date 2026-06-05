export async function searchCards(name, type) {
  const q = [];
  const cleanName = name.trim();

  if (cleanName) q.push(`name:"${cleanName}*"`);
  if (type) q.push(`types:${type}`);

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q.join(" "))}&pageSize=24&select=id,name,images,types,hp,rarity,set,tcgplayer`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.data || [];
}
