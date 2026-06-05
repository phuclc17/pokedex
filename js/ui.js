import { isInCollection, getCollection } from "./store.js";

const TYPE_COLORS = {
  Fire: ["#FF6B35", "#FF4500"],
  Water: ["#4FC3F7", "#0288D1"],
  Grass: ["#66BB6A", "#2E7D32"],
  Lightning: ["#FFD54F", "#F57F17"],
  Psychic: ["#F06292", "#AD1457"],
  Fighting: ["#A1887F", "#4E342E"],
  Darkness: ["#7986CB", "#283593"],
  Metal: ["#90A4AE", "#37474F"],
  Dragon: ["#9575CD", "#4527A0"],
  Fairy: ["#F48FB1", "#880E4F"],
  Colorless: ["#BDBDBD", "#616161"],
};

export function getTypeStyle(type) {
  const c = TYPE_COLORS[type] || ["#888", "#444"];
  return `background:linear-gradient(135deg,${c[0]},${c[1]});color:#fff;`;
}

export function showToast(msg, type = "ok") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast${type === "err" ? " err" : ""} show`;
  setTimeout(() => el.classList.remove("show"), 2800);
}

export function getCardPrice(card) {
  if (!card.tcgplayer?.prices) return 0;
  const p = card.tcgplayer.prices;
  return (
    p.holofoil?.market || p.normal?.market || p.reverseHolofoil?.market || 0
  );
}

export function buildCardElement(card, isCollectionView) {
  const div = document.createElement("div");
  div.className = "poke-card";
  div.dataset.id = card.id;

  const imgSrc = card.images?.small || "";
  const type1 = (card.types || [])[0] || "";
  const collected = isInCollection(card.id);

  let marketPrice = "N/A";
  const priceVal = getCardPrice(card);
  if (priceVal > 0) marketPrice = "$" + priceVal.toFixed(2);

  div.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgSrc}" loading="lazy"/>
      ${card.rarity ? `<span class="rarity-badge">${card.rarity}</span>` : ""}
      ${collected && !isCollectionView ? `<span class="collected-badge">✓ Có</span>` : ""}
    </div>
    <div class="card-info">
      <div class="card-name">${card.name}</div>
      <div class="card-sub">
        ${type1 ? `<span class="type-pip" style="${getTypeStyle(type1)}">${type1}</span>` : ""}
        <span style="color:var(--gold); font-weight:bold; margin-left:auto;">${marketPrice}</span>
      </div>
    </div>
    <div class="card-action">
      ${
        isCollectionView
          ? `<button class="btn-remove-card" data-id="${card.id}">🗑️ Xóa</button>`
          : collected
            ? `<button class="btn-add-card collected" disabled>✓ Đã có</button>`
            : `<button class="btn-add-card add-action" data-id="${card.id}">+ Thêm</button>`
      }
    </div>
  `;
  return div;
}

export function updateColBadge() {
  document.getElementById("col-badge").textContent = getCollection().length;
}

export function updateCollectionStats(collection) {
  const rare = collection.filter((c) =>
    (c.rarity || "").toLowerCase().includes("rare"),
  ).length;
  const types = new Set(collection.flatMap((c) => c.types || [])).size;
  const sets = new Set(collection.map((c) => c.set?.id).filter(Boolean)).size;

  document.getElementById("st-total").textContent = collection.length;
  document.getElementById("st-rare").textContent = rare;
  document.getElementById("st-types").textContent = types;
  document.getElementById("st-sets").textContent = sets;
}

export function renderStatsPage(collection) {
  const rare = collection.filter((c) =>
    (c.rarity || "").toLowerCase().includes("rare"),
  ).length;
  const sets = new Set(collection.map((c) => c.set?.id).filter(Boolean)).size;
  const totalValue = collection.reduce(
    (sum, card) => sum + getCardPrice(card),
    0,
  );

  document.getElementById("stats-strip2").innerHTML = `
    <div class="stat-card"><div class="num">${collection.length}</div><div class="lbl">Tổng thẻ</div></div>
    <div class="stat-card"><div class="num" style="color:var(--gold)">$${totalValue.toFixed(2)}</div><div class="lbl">Tổng giá trị</div></div>
    <div class="stat-card"><div class="num">${rare}</div><div class="lbl">Rare+</div></div>
    <div class="stat-card"><div class="num">${sets}</div><div class="lbl">Series</div></div>
  `;

  const typeMap = {};
  collection.forEach((c) =>
    (c.types || []).forEach((t) => {
      typeMap[t] = (typeMap[t] || 0) + 1;
    }),
  );
  const typeSorted = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
  const tMax = typeSorted[0]?.[1] || 1;

  const tc = document.getElementById("type-chart");
  if (!typeSorted.length)
    tc.innerHTML =
      '<p style="color:var(--muted);padding:20px 0">Chưa có dữ liệu.</p>';
  else {
    tc.innerHTML = typeSorted
      .map(([t, n]) => {
        const c = TYPE_COLORS[t] || ["#888", "#444"];
        return `
      <div class="type-row">
        <span class="type-name">${t}</span>
        <div class="bar-bg">
          <div class="bar-fill" style="width:${Math.max((n / tMax) * 100, 8)}%;background:linear-gradient(135deg,${c[0]},${c[1]})">${n}</div>
        </div>
        <span class="bar-count">${n}</span>
      </div>`;
      })
      .join("");
  }

  const rarMap = {};
  collection.forEach((c) => {
    const r = c.rarity || "Unknown";
    rarMap[r] = (rarMap[r] || 0) + 1;
  });
  const rc = document.getElementById("rarity-chart");
  if (!Object.keys(rarMap).length)
    rc.innerHTML =
      '<p style="color:var(--muted);padding:20px 0">Chưa có dữ liệu.</p>';
  else {
    rc.innerHTML = Object.entries(rarMap)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([r, n]) => `
      <div class="rarity-item"><div class="r-count">${n}</div><div class="r-name">${r}</div></div>
    `,
      )
      .join("");
  }
}

// HÀM MỞ MODAL
export function openModal(card) {
  document.getElementById("m-img").src =
    card.images?.large || card.images?.small || "";
  document.getElementById("m-name").textContent = card.name;
  document.getElementById("m-set").textContent = card.set?.name
    ? `📦 ${card.set.name}`
    : "";

  const type1 = (card.types || [])[0] || "";
  const typeHtml = type1
    ? `<span class="type-pip" style="${getTypeStyle(type1)}">${type1}</span>`
    : "N/A";

  document.getElementById("m-details").innerHTML = `
    <div class="detail-item"><div class="dk">HP</div><div class="dv">${card.hp || "N/A"}</div></div>
    <div class="detail-item"><div class="dk">Type</div><div class="dv">${typeHtml}</div></div>
    <div class="detail-item"><div class="dk">Độ hiếm</div><div class="dv">${card.rarity || "N/A"}</div></div>
    <div class="detail-item"><div class="dk">Series</div><div class="dv" style="font-size:0.78rem">${card.set?.name || "N/A"}</div></div>
  `;

  const addBtn = document.getElementById("m-add-btn");
  if (isInCollection(card.id)) {
    addBtn.textContent = "✓ Đã có trong BST";
    addBtn.style.opacity = "0.55";
    addBtn.disabled = true;
  } else {
    addBtn.textContent = "+ Thêm vào BST";
    addBtn.style.opacity = "1";
    addBtn.disabled = false;
    addBtn.dataset.id = card.id; // Gắn ID để app.js bắt sự kiện
  }

  document.getElementById("overlay").classList.add("open");
}
