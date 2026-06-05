import { searchCards } from "./api.js";
import { getCollection, addCardToStore, removeCardFromStore } from "./store.js";
import {
  buildCardElement,
  showToast,
  updateColBadge,
  updateCollectionStats,
  renderStatsPage,
  openModal,
} from "./ui.js";

let currentSearchData = [];

document.addEventListener("DOMContentLoaded", () => {
  updateColBadge();
  setupEventListeners();
});

function setupEventListeners() {
  // 1. Chuyển Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => (c.style.display = "none"));

      const target = e.currentTarget.dataset.target;
      e.currentTarget.classList.add("active");
      document.getElementById("tab-" + target).style.display = "block";

      if (target === "collection") renderCollectionTab();
      if (target === "stats") renderStatsPage(getCollection());
    });
  });

  // 2. Tìm kiếm thẻ (Click nút hoặc nhấn Enter)
  document.getElementById("btn-search").addEventListener("click", handleSearch);
  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // 3. Logic Lưới Tìm Kiếm (Thêm thẻ & Bật Modal)
  document.getElementById("search-grid").addEventListener("click", (e) => {
    const cardEl = e.target.closest(".poke-card");
    if (!cardEl) return;

    const id = cardEl.dataset.id;
    const card = currentSearchData.find((c) => c.id === id);
    if (!card) return;

    // Nếu bấm nút Thêm
    if (e.target.classList.contains("add-action")) {
      if (addCardToStore(card)) {
        showToast("✅ Đã thêm vào bộ sưu tập!");
        updateColBadge();
        e.target.textContent = "✓ Đã có";
        e.target.classList.replace("add-action", "collected");
        e.target.disabled = true;
      }
    }
    // Nếu bấm vào khung thẻ (Bật Modal)
    else if (e.target.tagName !== "BUTTON") {
      openModal(card);
    }
  });

  // 4. Bấm nút thêm trong Modal
  document.getElementById("m-add-btn").addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    const card = currentSearchData.find((c) => c.id === id);
    if (card && addCardToStore(card)) {
      showToast("✅ Đã thêm vào bộ sưu tập!");
      updateColBadge();
      e.target.textContent = "✓ Đã có trong BST";
      e.target.style.opacity = "0.55";
      e.target.disabled = true;

      // Cập nhật lại nút ở ngoài lưới tìm kiếm (nếu đang ở tab tìm kiếm)
      const outBtn = document.querySelector(
        `.poke-card[data-id="${id}"] .add-action`,
      );
      if (outBtn) {
        outBtn.textContent = "✓ Đã có";
        outBtn.classList.replace("add-action", "collected");
        outBtn.disabled = true;
      }
    }
  });

  // 5. Đóng Modal
  document
    .getElementById("btn-close-modal")
    .addEventListener("click", () =>
      document.getElementById("overlay").classList.remove("open"),
    );
  document
    .getElementById("btn-close-modal-footer")
    .addEventListener("click", () =>
      document.getElementById("overlay").classList.remove("open"),
    );
  document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("overlay"))
      document.getElementById("overlay").classList.remove("open");
  });

  // 6. Logic Lưới Bộ Sưu Tập (Xóa thẻ) & Lọc
  document.getElementById("col-grid").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-card")) {
      const id = e.target.dataset.id;
      if (confirm("Bạn có chắc muốn xóa thẻ này?")) {
        removeCardFromStore(id);
        showToast("🗑️ Đã xóa thẻ khỏi BST", "err");
        updateColBadge();
        renderCollectionTab();
      }
    }
  });

  document
    .getElementById("f-rarity")
    .addEventListener("change", renderCollectionTab);
  document
    .getElementById("f-type")
    .addEventListener("change", renderCollectionTab);
  document.getElementById("btn-clear-filters").addEventListener("click", () => {
    document.getElementById("f-rarity").value = "";
    document.getElementById("f-type").value = "";
    renderCollectionTab();
  });
}

// HÀM XỬ LÝ TÌM KIẾM CHÍNH
async function handleSearch() {
  const name = document.getElementById("search-input").value.trim();
  const type = document.getElementById("type-filter").value;
  const grid = document.getElementById("search-grid");

  // Fix lỗi 1: Bắt buộc phải nhập gì đó mới cho tìm
  if (!name && !type) {
    showToast("Vui lòng nhập tên thẻ hoặc chọn Type!", "err");
    return;
  }

  grid.innerHTML =
    '<div class="state-box"><div class="spinner" style="margin:0 auto"></div><p>Đang tìm kiếm...</p></div>';
  document.getElementById("results-meta").style.display = "none";

  try {
    currentSearchData = await searchCards(name, type);
    grid.innerHTML = "";

    // Fix lỗi 2: Báo Không tìm thấy nếu mảng rỗng
    if (currentSearchData.length === 0) {
      grid.innerHTML =
        '<div class="state-box"><div class="icon">😔</div><p>Không tìm thấy thẻ nào phù hợp.</p></div>';
      return;
    }

    document.getElementById("results-meta").style.display = "block";
    document.getElementById("results-meta").innerHTML =
      `Tìm thấy <strong>${currentSearchData.length}</strong> thẻ`;

    currentSearchData.forEach((card) => {
      grid.appendChild(buildCardElement(card, false));
    });
  } catch (error) {
    grid.innerHTML =
      '<div class="state-box"><div class="icon">⚠️</div><p>Lỗi kết nối API. Vui lòng thử lại.</p></div>';
    showToast("Lỗi kết nối API", "err");
  }
}

// HÀM RENDER TAB BỘ SƯU TẬP
function renderCollectionTab() {
  let collection = getCollection();
  updateCollectionStats(collection);

  const rar = document.getElementById("f-rarity").value;
  const typ = document.getElementById("f-type").value;

  if (rar) collection = collection.filter((c) => c.rarity === rar);
  if (typ) collection = collection.filter((c) => (c.types || []).includes(typ));

  const grid = document.getElementById("col-grid");
  grid.innerHTML = "";

  if (collection.length === 0) {
    grid.innerHTML =
      '<div class="state-box"><div class="icon">📭</div><p>Không có thẻ nào phù hợp.</p></div>';
  } else {
    collection.forEach((card) => {
      grid.appendChild(buildCardElement(card, true));
    });
  }
}
