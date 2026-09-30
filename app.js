/**
 * PAD Simple Image Receipt Maker PRO (Photo Download & Persistent Box Support)
 * Keeps Party Photo & Original Receipt boxes visible and adds "Save/Download Image" links!
 */

const DEFAULT_RECEIPTS = [
  {
    id: "colosseum14_v4",
    title: "14周年シンクロコロシアム1",
    partyPhoto: null,
    originalReceiptPhoto: null,
    floors: [
      {
        floorNum: "1F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "4 2 1 5 6 5  闇を3つ残す", cleared: false }
        ],
        branches: []
      },
      {
        floorNum: "2F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "1 闇を消す", cleared: false }
        ],
        branches: []
      },
      {
        floorNum: "3F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "1 5", cleared: false }
        ],
        branches: [
          { enemyPattern: "光属性出現時", actionText: "1 ➔ 2 ➔ 5" },
          { enemyPattern: "闇属性出現時", actionText: "1 ➔ 5 闇L字消し" }
        ]
      },
      {
        floorNum: "4F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "1 4 6", cleared: false },
          { turnNum: "2T", text: "1 5 で突破", cleared: false }
        ],
        branches: []
      },
      {
        floorNum: "5F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "1 6", cleared: false }
        ],
        branches: []
      },
      {
        floorNum: "9F",
        photos: [],
        turns: [
          { turnNum: "1T", text: "4 1 6", cleared: false },
          { turnNum: "2T", text: "3 1 5 突破！", cleared: false }
        ],
        branches: []
      }
    ]
  }
];

class PADSimpleReceiptAppV5 {
  constructor() {
    this.receipts = [];
    this.currentReceipt = null;
    this.activeFloorIndex = 0;
    this.isEditMode = false;

    this.initElements();
    this.initEvents();
    this.initGlobalPasteEvent();
    this.loadReceipts();
  }

  initElements() {
    this.toggleModeBtn = document.getElementById("toggle-mode-btn");
    this.receiptTitleInput = document.getElementById("receipt-title-input");
    this.receiptSelect = document.getElementById("receipt-select");
    this.deleteReceiptBtn = document.getElementById("delete-receipt-btn");
    this.floorsContainer = document.getElementById("floors-container");

    this.resetChecksBtn = document.getElementById("reset-checks-btn");
    this.newReceiptBtn = document.getElementById("new-receipt-btn");
    this.addFloorBtn = document.getElementById("add-floor-btn");
    this.saveReceiptBtn = document.getElementById("save-receipt-btn");

    this.partyPhotoBox = document.getElementById("party-photo-box");
    this.partyPhotoInput = document.getElementById("party-photo-input");
    this.partyPhotoPlaceholder = document.getElementById("party-photo-placeholder");
    this.partyPhotoImg = document.getElementById("party-photo-img");
    this.removePartyPhotoBtn = document.getElementById("remove-party-photo-btn");
    this.downloadPartyPhotoBtn = document.getElementById("download-party-photo-btn");

    this.originalReceiptPhotoBox = document.getElementById("original-receipt-photo-box");
    this.originalReceiptInput = document.getElementById("original-receipt-input");
    this.originalReceiptPlaceholder = document.getElementById("original-receipt-placeholder");
    this.originalReceiptImg = document.getElementById("original-receipt-img");
    this.removeOriginalReceiptBtn = document.getElementById("remove-original-receipt-btn");
    this.downloadOriginalReceiptBtn = document.getElementById("download-original-receipt-btn");

    // Sync & Backup Elements
    this.openSyncModalBtn = document.getElementById("open-sync-modal-btn");
    this.metaSyncBtn = document.getElementById("meta-sync-btn");
    this.closeSyncModalBtn = document.getElementById("close-sync-modal-btn");
    this.syncModal = document.getElementById("sync-modal");
    this.exportJsonBtn = document.getElementById("export-json-btn");
    this.importJsonInput = document.getElementById("import-json-input");
    this.copySyncCodeBtn = document.getElementById("copy-sync-code-btn");
    this.importSyncCodeTextarea = document.getElementById("import-sync-code-textarea");
    this.importSyncCodeBtn = document.getElementById("import-sync-code-btn");
    this.copyDefaultCodeBtn = document.getElementById("copy-default-code-btn");
  }

  initEvents() {
    this.toggleModeBtn.addEventListener("click", () => this.toggleDisplayMode());
    this.resetChecksBtn.addEventListener("click", () => this.resetAllFloorChecks());
    this.newReceiptBtn.addEventListener("click", () => this.createNewReceipt());
    this.addFloorBtn.addEventListener("click", () => this.addFloorItem());
    this.saveReceiptBtn.addEventListener("click", () => this.saveCurrentReceipt());
    this.deleteReceiptBtn.addEventListener("click", () => this.deleteCurrentReceipt());
    this.receiptSelect.addEventListener("change", (e) => this.selectReceiptById(e.target.value));

    this.receiptTitleInput.addEventListener("input", (e) => {
      if (this.currentReceipt) {
        this.currentReceipt.title = e.target.value;
      }
    });

    this.partyPhotoInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (this.currentReceipt) {
            this.currentReceipt.partyPhoto = ev.target.result;
            this.renderHeaderPhotos();
            this.saveReceiptsToStorage();
          }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });

    this.removePartyPhotoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.currentReceipt) {
        this.currentReceipt.partyPhoto = null;
        this.renderHeaderPhotos();
        this.saveReceiptsToStorage();
        this.showToastNotification("🗑️ パーティ編成写真を削除しました");
      }
    });

    this.originalReceiptInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (this.currentReceipt) {
            this.currentReceipt.originalReceiptPhoto = ev.target.result;
            this.renderHeaderPhotos();
            this.saveReceiptsToStorage();
          }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });

    this.removeOriginalReceiptBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.currentReceipt) {
        this.currentReceipt.originalReceiptPhoto = null;
        this.renderHeaderPhotos();
        this.saveReceiptsToStorage();
        this.showToastNotification("🗑️ レシート元画像を削除しました");
      }
    });

    // Sync & Backup Events
    if (this.openSyncModalBtn) {
      this.openSyncModalBtn.addEventListener("click", () => this.openSyncModal());
    }
    if (this.metaSyncBtn) {
      this.metaSyncBtn.addEventListener("click", () => this.openSyncModal());
    }
    if (this.closeSyncModalBtn) {
      this.closeSyncModalBtn.addEventListener("click", () => this.closeSyncModal());
    }
    if (this.syncModal) {
      this.syncModal.addEventListener("click", (e) => {
        if (e.target === this.syncModal) this.closeSyncModal();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.syncModal && !this.syncModal.classList.contains("hidden")) {
        this.closeSyncModal();
      }
    });

    if (this.exportJsonBtn) {
      this.exportJsonBtn.addEventListener("click", () => this.exportJson());
    }
    if (this.importJsonInput) {
      this.importJsonInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImportFile(e.target.files[0]);
          e.target.value = ""; // reset for subsequent uploads
        }
      });
    }
    if (this.copySyncCodeBtn) {
      this.copySyncCodeBtn.addEventListener("click", () => this.copySyncCode());
    }
    if (this.importSyncCodeBtn) {
      this.importSyncCodeBtn.addEventListener("click", () => this.importSyncCode());
    }
    if (this.copyDefaultCodeBtn) {
      this.copyDefaultCodeBtn.addEventListener("click", () => this.copyDefaultCode());
    }
  }

  toggleDisplayMode() {
    this.isEditMode = !this.isEditMode;
    this.updateModeState();
  }

  updateModeState() {
    if (this.isEditMode) {
      document.body.classList.remove("play-mode");
      document.body.classList.add("edit-mode");
      this.toggleModeBtn.innerHTML = "✏️ 編集モード中 (クリックで周回表示へ)";
      this.toggleModeBtn.style.borderColor = "#f59e0b";
      this.toggleModeBtn.style.color = "#f59e0b";
    } else {
      document.body.classList.remove("edit-mode");
      document.body.classList.add("play-mode");
      this.toggleModeBtn.innerHTML = "👁️ 周回プレイモード (閲覧中)";
      this.toggleModeBtn.style.borderColor = "#38bdf8";
      this.toggleModeBtn.style.color = "#38bdf8";
    }

    this.renderHeaderPhotos();
    this.renderFloors();
  }

  initGlobalPasteEvent() {
    document.addEventListener("paste", (e) => {
      if (!this.isEditMode) return;

      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const pastedDataUrl = ev.target.result;
              this.handlePastedImageSilent(pastedDataUrl);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    });
  }

  handlePastedImageSilent(dataUrl) {
    const activeEl = document.activeElement;

    if (activeEl && (activeEl.id === "party-photo-box" || activeEl.closest("#party-photo-box"))) {
      if (this.currentReceipt) {
        this.currentReceipt.partyPhoto = dataUrl;
        this.renderHeaderPhotos();
        this.saveReceiptsToStorage();
        this.showToastNotification("📋 編成写真を貼り付けしました");
      }
      return;
    }

    if (activeEl && (activeEl.id === "original-receipt-photo-box" || activeEl.closest("#original-receipt-photo-box"))) {
      if (this.currentReceipt) {
        this.currentReceipt.originalReceiptPhoto = dataUrl;
        this.renderHeaderPhotos();
        this.saveReceiptsToStorage();
        this.showToastNotification("📋 レシート元画像を貼り付けしました");
      }
      return;
    }

    if (this.currentReceipt && this.currentReceipt.floors && this.currentReceipt.floors[this.activeFloorIndex]) {
      const floor = this.currentReceipt.floors[this.activeFloorIndex];
      if (!floor.photos) floor.photos = [];
      floor.photos.push(dataUrl);
      this.renderFloors();
      this.saveReceiptsToStorage();
      this.showToastNotification(`📋 階層 ${floor.floorNum || (this.activeFloorIndex + 1) + "F"} に敵写真を貼り付けしました`);
    }
  }

  showToastNotification(msg) {
    const toast = document.getElementById("paste-toast");
    if (toast) {
      toast.textContent = msg;
      toast.style.background = "rgba(16, 185, 129, 0.2)";
      toast.style.color = "#10b981";
      toast.style.borderColor = "#10b981";
      setTimeout(() => {
        toast.textContent = "📋 クリップボードからの画像ペースト（Ctrl+V）に対応中！";
        toast.style.background = "rgba(56, 189, 248, 0.12)";
        toast.style.color = "#38bdf8";
        toast.style.borderColor = "#38bdf8";
      }, 2000);
    }
  }

  loadReceipts() {
    const saved = localStorage.getItem("pad_photo_receipts_v5");
    if (saved) {
      try {
        this.receipts = JSON.parse(saved);
      } catch (e) {
        this.receipts = DEFAULT_RECEIPTS;
      }
    } else {
      this.receipts = DEFAULT_RECEIPTS;
      this.saveReceiptsToStorage();
    }

    this.renderReceiptSelect();
    if (this.receipts.length > 0) {
      this.selectReceiptById(this.receipts[0].id);
    }

    this.updateModeState();
  }

  saveReceiptsToStorage() {
    localStorage.setItem("pad_photo_receipts_v5", JSON.stringify(this.receipts));
  }

  renderReceiptSelect() {
    this.receiptSelect.innerHTML = "";
    this.receipts.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.title;
      this.receiptSelect.appendChild(opt);
    });
  }

  selectReceiptById(id) {
    const found = this.receipts.find(r => r.id === id);
    if (found) {
      this.currentReceipt = found;
      this.receiptSelect.value = id;
      this.receiptTitleInput.value = found.title;
      this.renderHeaderPhotos();
      this.renderFloors();
    }
  }

  resetAllFloorChecks() {
    if (!this.currentReceipt || !this.currentReceipt.floors) return;

    this.currentReceipt.floors.forEach(f => {
      if (f.turns) {
        f.turns.forEach(t => t.cleared = false);
      }
    });

    this.saveReceiptsToStorage();
    this.renderFloors();
  }

  createNewReceipt() {
    const newId = "receipt_" + Date.now();
    const newReceipt = {
      id: newId,
      title: "新規ダンジョンレシート",
      partyPhoto: null,
      originalReceiptPhoto: null,
      floors: [
        { floorNum: "1F", photos: [], turns: [{ turnNum: "1T", text: "", cleared: false }], branches: [] },
        { floorNum: "2F", photos: [], turns: [{ turnNum: "1T", text: "", cleared: false }], branches: [] },
        { floorNum: "3F", photos: [], turns: [{ turnNum: "1T", text: "", cleared: false }], branches: [] }
      ]
    };

    this.receipts.unshift(newReceipt);
    this.saveReceiptsToStorage();
    this.renderReceiptSelect();
    this.selectReceiptById(newId);
    if (!this.isEditMode) {
      this.toggleDisplayMode();
    }
  }

  deleteCurrentReceipt() {
    if (!this.currentReceipt) return;
    if (confirm(`「${this.currentReceipt.title}」を削除してもよろしいですか？`)) {
      this.receipts = this.receipts.filter(r => r.id !== this.currentReceipt.id);
      this.saveReceiptsToStorage();
      this.renderReceiptSelect();
      if (this.receipts.length > 0) {
        this.selectReceiptById(this.receipts[0].id);
      } else {
        this.createNewReceipt();
      }
    }
  }

  renderHeaderPhotos() {
    if (!this.currentReceipt) return;

    // 1. Party Photo Display & Download Link setup
    if (this.currentReceipt.partyPhoto) {
      this.partyPhotoImg.src = this.currentReceipt.partyPhoto;
      this.partyPhotoImg.classList.remove("hidden");
      this.downloadPartyPhotoBtn.href = this.currentReceipt.partyPhoto;
      this.downloadPartyPhotoBtn.classList.remove("hidden");

      if (this.isEditMode) {
        this.removePartyPhotoBtn.classList.remove("hidden");
      } else {
        this.removePartyPhotoBtn.classList.add("hidden");
      }
      this.partyPhotoPlaceholder.classList.add("hidden");
    } else {
      this.partyPhotoImg.src = "";
      this.partyPhotoImg.classList.add("hidden");
      this.removePartyPhotoBtn.classList.add("hidden");
      this.downloadPartyPhotoBtn.classList.add("hidden");
      this.partyPhotoPlaceholder.classList.remove("hidden");
    }

    // 2. Original Receipt Photo Display & Download Link setup
    if (this.currentReceipt.originalReceiptPhoto) {
      this.originalReceiptImg.src = this.currentReceipt.originalReceiptPhoto;
      this.originalReceiptImg.classList.remove("hidden");
      this.downloadOriginalReceiptBtn.href = this.currentReceipt.originalReceiptPhoto;
      this.downloadOriginalReceiptBtn.classList.remove("hidden");

      if (this.isEditMode) {
        this.removeOriginalReceiptBtn.classList.remove("hidden");
      } else {
        this.removeOriginalReceiptBtn.classList.add("hidden");
      }
      this.originalReceiptPlaceholder.classList.add("hidden");
    } else {
      this.originalReceiptImg.src = "";
      this.originalReceiptImg.classList.add("hidden");
      this.removeOriginalReceiptBtn.classList.add("hidden");
      this.downloadOriginalReceiptBtn.classList.add("hidden");
      this.originalReceiptPlaceholder.classList.remove("hidden");
    }
  }

  renderFloors() {
    this.floorsContainer.innerHTML = "";
    if (!this.currentReceipt || !this.currentReceipt.floors) return;

    this.currentReceipt.floors.forEach((f, idx) => {
      const row = this.createFloorRowElement(f, idx);
      this.floorsContainer.appendChild(row);
    });
  }

  createFloorRowElement(floorData, index) {
    const div = document.createElement("div");
    div.className = "floor-row-item";
    div.tabIndex = 0;

    const labelText = floorData.floorNum || `${index + 1}F`;

    if (!floorData.photos) floorData.photos = floorData.photo ? [floorData.photo] : [];
    if (!floorData.turns) floorData.turns = [{ turnNum: "1T", text: floorData.text || "", cleared: floorData.cleared || false }];
    if (!floorData.branches) floorData.branches = [];

    div.innerHTML = `
      <div class="floor-main-line">
        <div class="floor-badge-label">${labelText}</div>
        
        <!-- Multi-Photo Gallery -->
        <div class="multi-photo-gallery" id="photo_gallery_${index}">
          <!-- Photo Blue Boxes dynamically inserted here -->
        </div>

        <!-- Turns Container -->
        <div class="turns-container" id="turns_container_${index}">
          <!-- Dynamic Turn rows -->
        </div>
      </div>

      <!-- Toolbar (EDIT ONLY) -->
      <div class="floor-bottom-toolbar edit-only-ui">
        <div class="floor-toolbar-left">
          <button type="button" class="btn btn-secondary btn-sm add-turn-btn">+ ターン追加 (2T/3T...)</button>
          <button type="button" class="btn btn-secondary btn-sm add-branch-btn">+ 分岐追加</button>
        </div>
        <button type="button" class="delete-floor-btn" title="この階層を削除">🗑️ 階層削除</button>
      </div>

      <!-- Sub Branches Container -->
      <div class="branches-container" id="branches_container_${index}">
        <!-- Dynamic Branch Rows -->
      </div>
    `;

    div.addEventListener("focus", () => {
      this.activeFloorIndex = index;
    });

    // 1. Render Multi-Photo Gallery
    const galleryEl = div.querySelector(`#photo_gallery_${index}`);
    galleryEl.innerHTML = "";

    floorData.photos.forEach((pUrl, pIdx) => {
      const pBox = document.createElement("div");
      pBox.className = "blue-photo-box";
      pBox.tabIndex = 0;
      pBox.title = this.isEditMode ? "敵写真 (右上✕で削除)" : "敵写真";
      pBox.innerHTML = `
        <img src="${pUrl}" class="preview-thumb-img" alt="Enemy Photo ${pIdx+1}">
        <button type="button" class="remove-photo-btn ${this.isEditMode ? '' : 'hidden'}" title="この写真を削除">✕</button>
      `;

      pBox.addEventListener("focus", () => {
        this.activeFloorIndex = index;
      });

      const delBtn = pBox.querySelector(".remove-photo-btn");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          floorData.photos.splice(pIdx, 1);
          this.renderFloors();
          this.saveReceiptsToStorage();
          this.showToastNotification(`🗑️ 階層 ${floorData.floorNum} の敵写真を削除しました`);
        });
      }

      galleryEl.appendChild(pBox);
    });

    // Add Photo Button Box (EDIT ONLY)
    if (this.isEditMode) {
      const addPhotoBox = document.createElement("div");
      addPhotoBox.className = "blue-photo-box add-photo-btn-box edit-only-ui";
      addPhotoBox.tabIndex = 0;
      addPhotoBox.title = "写真を追加 または 選択してCtrl+Vペースト";
      addPhotoBox.innerHTML = `
        <input type="file" accept="image/*" class="photo-input-hidden">
        <span class="photo-placeholder-icon">📸</span>
        <span class="photo-placeholder-text">+写真</span>
      `;

      addPhotoBox.addEventListener("focus", () => {
        this.activeFloorIndex = index;
      });

      addPhotoBox.querySelector(".photo-input-hidden").addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            floorData.photos.push(ev.target.result);
            this.renderFloors();
            this.saveReceiptsToStorage();
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });

      galleryEl.appendChild(addPhotoBox);
    }

    // 2. Render Turns
    const turnsContainer = div.querySelector(`#turns_container_${index}`);
    turnsContainer.innerHTML = "";

    floorData.turns.forEach((turn, tIdx) => {
      const tRow = document.createElement("div");
      tRow.className = `turn-row-item ${turn.cleared ? "cleared" : ""}`;
      const checkId = `check_${index}_${tIdx}_${Date.now()}`;

      if (this.isEditMode) {
        tRow.innerHTML = `
          <span class="turn-label-badge">${turn.turnNum || (tIdx + 1) + "T"}</span>
          <input type="text" class="turn-text-input" value="${turn.text || ""}" placeholder="立ち回り (例: 4 2 1 5 6 5)">
          <div class="turn-check-wrap" title="このターンをクリアチェック">
            <input type="checkbox" id="${checkId}" class="check-checkbox" ${turn.cleared ? "checked" : ""}>
            <label for="${checkId}" class="check-btn-sm">✓</label>
          </div>
          ${floorData.turns.length > 1 ? `<button type="button" class="delete-turn-btn edit-only-ui" title="削除">✕</button>` : ""}
        `;

        const tInput = tRow.querySelector(".turn-text-input");
        tInput.addEventListener("focus", () => {
          this.activeFloorIndex = index;
        });
        tInput.addEventListener("input", (e) => {
          turn.text = e.target.value;
        });

        const delTurnBtn = tRow.querySelector(".delete-turn-btn");
        if (delTurnBtn) {
          delTurnBtn.addEventListener("click", () => {
            floorData.turns.splice(tIdx, 1);
            this.renderFloors();
            this.saveReceiptsToStorage();
          });
        }
      } else {
        tRow.innerHTML = `
          <span class="turn-label-badge">${turn.turnNum || (tIdx + 1) + "T"}</span>
          <div class="turn-text-display">${turn.text || "（テキスト未入力）"}</div>
          <div class="turn-check-wrap" title="このターンをクリアチェック">
            <input type="checkbox" id="${checkId}" class="check-checkbox" ${turn.cleared ? "checked" : ""}>
            <label for="${checkId}" class="check-btn-sm">✓</label>
          </div>
        `;
      }

      tRow.querySelector(".check-checkbox").addEventListener("change", (e) => {
        turn.cleared = e.target.checked;
        tRow.classList.toggle("cleared", turn.cleared);
        this.saveReceiptsToStorage();
      });

      turnsContainer.appendChild(tRow);
    });

    // 3. Render Branches
    const branchesContainer = div.querySelector(`#branches_container_${index}`);
    branchesContainer.innerHTML = "";

    floorData.branches.forEach((b, bIdx) => {
      const bRow = document.createElement("div");
      bRow.className = "branch-item";

      if (this.isEditMode) {
        bRow.innerHTML = `
          <span class="branch-tag">🔀 分岐${bIdx + 1}:</span>
          <input type="text" class="branch-text-input branch-enemy-input" value="${b.enemyPattern || ""}" placeholder="パターン (例: 光出現時)">
          <input type="text" class="branch-text-input branch-action-input" value="${b.actionText || ""}" placeholder="立ち回り (例: 1 ➔ 2 ➔ 5)">
          <button type="button" class="delete-branch-btn edit-only-ui" title="削除">✕</button>
        `;

        bRow.querySelector(".branch-enemy-input").addEventListener("input", (e) => {
          b.enemyPattern = e.target.value;
        });
        bRow.querySelector(".branch-action-input").addEventListener("input", (e) => {
          b.actionText = e.target.value;
        });
        bRow.querySelector(".delete-branch-btn").addEventListener("click", () => {
          floorData.branches.splice(bIdx, 1);
          this.renderFloors();
          this.saveReceiptsToStorage();
        });
      } else {
        bRow.innerHTML = `
          <span class="branch-tag">🔀 【${b.enemyPattern || "分岐"}】:</span>
          <div class="branch-text-display">${b.actionText || ""}</div>
        `;
      }

      branchesContainer.appendChild(bRow);
    });

    if (this.isEditMode) {
      div.querySelector(".add-turn-btn").addEventListener("click", () => {
        const nextT = floorData.turns.length + 1;
        floorData.turns.push({ turnNum: `${nextT}T`, text: "", cleared: false });
        this.renderFloors();
      });

      div.querySelector(".add-branch-btn").addEventListener("click", () => {
        floorData.branches.push({ enemyPattern: "", actionText: "" });
        this.renderFloors();
      });

      div.querySelector(".delete-floor-btn").addEventListener("click", () => {
        this.currentReceipt.floors.splice(index, 1);
        this.renderFloors();
        this.saveReceiptsToStorage();
      });
    }

    return div;
  }

  addFloorItem() {
    if (!this.currentReceipt) return;
    const nextNum = this.currentReceipt.floors.length + 1;
    this.currentReceipt.floors.push({
      floorNum: `${nextNum}F`,
      photos: [],
      turns: [{ turnNum: "1T", text: "", cleared: false }],
      branches: []
    });
    this.renderFloors();
    this.saveReceiptsToStorage();
  }

  saveCurrentReceipt() {
    if (!this.currentReceipt) return;
    this.currentReceipt.title = this.receiptTitleInput.value.trim() || "無題のレシート";

    this.saveReceiptsToStorage();
    this.renderReceiptSelect();
    this.showToastNotification(`💾 レシート「${this.currentReceipt.title}」を保存しました`);
  }

  /* ===== Data Sync & Backup Methods ===== */
  openSyncModal() {
    if (this.syncModal) {
      this.syncModal.classList.remove("hidden");
    }
  }

  closeSyncModal() {
    if (this.syncModal) {
      this.syncModal.classList.add("hidden");
    }
  }

  exportJson() {
    try {
      const dataStr = JSON.stringify(this.receipts, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `pad_receipts_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToastNotification("📤 レシートデータをダウンロードしました");
    } catch (err) {
      alert("エクスポート中にエラーが発生しました: " + err.message);
    }
  }

  handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        this.processImportedReceipts(importedData);
      } catch (err) {
        alert("JSONファイルの解析に失敗しました。正しいデータファイルかご確認ください。");
      }
    };
    reader.readAsText(file);
  }

  async copySyncCode() {
    try {
      const codeStr = JSON.stringify(this.receipts);
      await navigator.clipboard.writeText(codeStr);
      this.showToastNotification("📋 同期コードをクリップボードにコピーしました！");
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = JSON.stringify(this.receipts);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      this.showToastNotification("📋 同期コードをコピーしました！");
    }
  }

  importSyncCode() {
    const raw = this.importSyncCodeTextarea ? this.importSyncCodeTextarea.value.trim() : "";
    if (!raw) {
      alert("同期コードが入力されていません。テキストエリアにコードを貼り付けてください。");
      return;
    }
    try {
      const importedData = JSON.parse(raw);
      this.processImportedReceipts(importedData);
      if (this.importSyncCodeTextarea) {
        this.importSyncCodeTextarea.value = "";
      }
    } catch (err) {
      alert("同期コードの解析に失敗しました。貼り付けた内容に誤りがないかご確認ください。");
    }
  }

  async copyDefaultCode() {
    try {
      const formattedCode = `const DEFAULT_RECEIPTS = ${JSON.stringify(this.receipts, null, 2)};`;
      await navigator.clipboard.writeText(formattedCode);
      this.showToastNotification("📋 DEFAULT_RECEIPTS 用のコードをコピーしました！");
      alert("app.js用の初期データコードをコピーしました！\n\nローカルの app.js ファイルを開き、先頭の「const DEFAULT_RECEIPTS = [...]」の部分に上書き貼り付けして保存してください。");
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = `const DEFAULT_RECEIPTS = ${JSON.stringify(this.receipts, null, 2)};`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      this.showToastNotification("📋 DEFAULT_RECEIPTS 用コードをコピーしました！");
    }
  }

  processImportedReceipts(importedData) {
    let list = Array.isArray(importedData) ? importedData : [importedData];
    if (list.length === 0 || !list[0].floors) {
      alert("有効なレシートデータが見つかりませんでした。");
      return;
    }

    const isOverwrite = confirm(
      `【確認】${list.length}件のレシートデータを検出しました。\n\n「OK」: すべて上書き（現在のデータを置き換え）\n「キャンセル」: 既存のデータに追加（マージ）`
    );

    if (isOverwrite) {
      this.receipts = list;
    } else {
      const existingIds = new Set(this.receipts.map(r => r.id));
      list.forEach(r => {
        if (existingIds.has(r.id)) {
          r.id = "receipt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
        }
      });
      this.receipts = [...list, ...this.receipts];
    }

    this.saveReceiptsToStorage();
    this.renderReceiptSelect();
    if (this.receipts.length > 0) {
      this.selectReceiptById(this.receipts[0].id);
    }
    this.closeSyncModal();
    this.showToastNotification(`✅ レシートデータを反映しました（計${this.receipts.length}件）`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new PADSimpleReceiptAppV5();
});
