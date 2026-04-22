
// --- UTILS & IMAGES ---
// Image Cache to avoid DataCloneError in IndexedDB
const imageCache = new Map();

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

function processHighQualityImage(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.match('image.*')) {
            reject(new Error("Apenas imagens são permitidas."));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 2048;
                let width = img.width;
                let height = img.height;
                const size = Math.min(width, height);
                const startX = (width - size) / 2;
                const startY = (height - size) / 2;
                let targetSize = size > MAX_SIZE ? MAX_SIZE : size;
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
                resolve(canvas.toDataURL('image/webp', 0.95));
            };
            img.onerror = () => reject(new Error("Erro ao carregar a imagem."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
        reader.readAsDataURL(file);
    });
}

// --- ESTADO DA APLICAÇÃO ---
let appState = {
    theme: 'dark',
    currentRouletteId: null,
    roulettes: [],
    userTemplates: []
};

// Objeto padrão para uma nova roleta
const defaultRoulette = (name = "Minha Roleta") => ({
    id: Date.now().toString() + Math.floor(Math.random()*1000),
    name: name,
    pointerColor: "#ff0000",
    options: [
        { id: Date.now().toString() + '1', name: "Opção 1", bgColor: "#4CAF50", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 1!" },
        { id: Date.now().toString() + '2', name: "Opção 2", bgColor: "#2196F3", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 2!" },
        { id: Date.now().toString() + '3', name: "Opção 3", bgColor: "#F44336", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 3!" }
    ]
});


// --- TEMPLATES PADRÕES ---
const defaultTemplates = [
  {
    id: 'tpl_1', name: "Cara ou Coroa",
    eliminationMode: false,
    options: [
      { id: 't1_1', name: "Cara", bgColor: "#FFD700", textColor: "#000000", weight: 1, message: "Deu Cara!" },
      { id: 't1_2', name: "Coroa", bgColor: "#C0C0C0", textColor: "#000000", weight: 1, message: "Deu Coroa!" }
    ]
  },
  {
    id: 'tpl_2', name: "Sim, Não ou Talvez",
    eliminationMode: false,
    options: [
      { id: 't2_1', name: "Sim", bgColor: "#22c55e", textColor: "#ffffff", weight: 45, message: "A resposta é Sim!" },
      { id: 't2_2', name: "Não", bgColor: "#ef4444", textColor: "#ffffff", weight: 45, message: "A resposta é Não!" },
      { id: 't2_3', name: "Talvez", bgColor: "#64748b", textColor: "#ffffff", weight: 10, message: "Talvez... tente de novo!" }
    ]
  },
  {
    id: 'tpl_3', name: "Verdade ou Desafio",
    eliminationMode: false,
    options: [
      { id: 't3_1', name: "Verdade", bgColor: "#8b5cf6", textColor: "#ffffff", weight: 1, message: "Conte uma Verdade!" },
      { id: 't3_2', name: "Desafio", bgColor: "#f97316", textColor: "#ffffff", weight: 1, message: "Cumpra um Desafio!" }
    ]
  },
  {
    id: 'tpl_4', name: "Roleta do Alfabeto",
    eliminationMode: true, // Ativo por padrão para não repetir letras
    options: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letra, index) => ({
      id: 't4_' + index,
      name: letra,
      bgColor: `hsl(${(index * 360) / 26}, 70%, 50%)`, // Gera um arco-íris perfeito
      textColor: "#ffffff",
      weight: 1,
      message: `A letra escolhida é: ${letra}`
    }))
  },
  {
    id: 'tpl_5', name: "Quem É Mais Provável",
    eliminationMode: true,
    options: [
      { id: 't5_1', name: "...ficar rico do nada?", bgColor: "#1A05A2", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de ficar rico do nada?" },
      { id: 't5_2', name: "...chorar vendo filme?", bgColor: "#8F0177", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de chorar vendo filme?" },
      { id: 't5_3', name: "...ser preso?", bgColor: "#DE1A58", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de ser preso?" },
      { id: 't5_4', name: "...esquecer o aniversário do amigo?", bgColor: "#F67D31", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de esquecer o aniversário do amigo?" },
      { id: 't5_5', name: "...sobreviver a um apocalipse zumbi?", bgColor: "#1A05A2", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de sobreviver a um apocalipse zumbi?" },
      { id: 't5_6', name: "...entregar o próximo por dinheiro?", bgColor: "#8F0177", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de entregar o próximo por dinheiro?" },
      { id: 't5_7', name: "...morrer solteiro?", bgColor: "#DE1A58", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de morrer solteiro?" },
      { id: 't5_8', name: "...ficar endividado por casa de aposta?", bgColor: "#F67D31", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de ficar endividado por casa de aposta?" },
      { id: 't5_9', name: "...construir o melhor shape?", bgColor: "#1A05A2", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de construir o melhor shape?" },
      { id: 't5_10', name: "...ser cancelado na Internet por memes?", bgColor: "#8F0177", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de ser cancelado na Internet por memes?" },
      { id: 't5_11', name: "...ser hackeado e perder tudo no banco?", bgColor: "#DE1A58", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de ser hackeado e perder tudo no banco?" },
      { id: 't5_12', name: "...trair o parceiro amoroso?", bgColor: "#F67D31", textColor: "#ffffff", weight: 1, message: "Quem é mais provável de trair o parceiro amoroso?" }
    ]
  },
  {
    id: 'tpl_6', name: "Roda da Fortuna",
    eliminationMode: false,
    options: [
      { id: 't6_1', name: "x2", bgColor: "#3b82f6", textColor: "#ffffff", weight: 20, message: "Você ganhou x2!" },
      { id: 't6_2', name: "x5", bgColor: "#8b5cf6", textColor: "#ffffff", weight: 10, message: "Você ganhou x5!" },
      { id: 't6_3', name: "Passa a Vez", bgColor: "#64748b", textColor: "#ffffff", weight: 15, message: "Passa a Vez!" },
      { id: 't6_4', name: "Perdeu Tudo!", bgColor: "#ef4444", textColor: "#ffffff", weight: 5, message: "Perdeu Tudo!" },
      { id: 't6_5', name: "Jackpot 💰", bgColor: "#eab308", textColor: "#000000", weight: 1, message: "JACKPOT! Você ganhou o grande prêmio!" } // Probabilidade super rara
    ]
  },
  {
    id: 'tpl_7', name: "Roleta Clássica Europeia",
    eliminationMode: false,
    options: [
      { id: 't7_0', name: "0", bgColor: "#22c55e", textColor: "#ffffff", weight: 1, message: "0 - Verde" },
      ...Array.from({ length: 36 }, (_, i) => ({
        id: 't7_' + (i + 1),
        name: (i + 1).toString(),
        bgColor: (i + 1) % 2 === 0 ? "#1e293b" : "#ef4444", // Preto e Vermelho intercalados
        textColor: "#ffffff",
        weight: 1,
        message: `${i + 1} - ${(i + 1) % 2 === 0 ? "Preto" : "Vermelho"}`
      }))
    ]
  },
  {
    id: 'tpl_8', name: "Roleta de Personagens",
    eliminationMode: true,
    options: [
      { id: 't8_1', name: "O Herói", bgColor: "#3b82f6", textColor: "#ffffff", weight: 1, message: "Você é o Herói!" },
      { id: 't8_2', name: "O Vilão", bgColor: "#ef4444", textColor: "#ffffff", weight: 1, message: "Você é o Vilão!" },
      { id: 't8_3', name: "O Alívio Cômico", bgColor: "#eab308", textColor: "#000000", weight: 1, message: "Você é o Alívio Cômico!" },
      { id: 't8_4', name: "O Sábio", bgColor: "#10b981", textColor: "#ffffff", weight: 1, message: "Você é o Sábio!" },
      { id: 't8_5', name: "O Traidor", bgColor: "#64748b", textColor: "#ffffff", weight: 1, message: "Você é o Traidor!" }
    ]
  },
  {
    id: 'tpl_9', name: "Caixa Misteriosa",
    eliminationMode: false,
    options: [
      { id: 't9_1', name: "Comum (50%)", bgColor: "#94a3b8", textColor: "#000000", weight: 50, message: "Você ganhou um item Comum." },
      { id: 't9_2', name: "Raro (30%)", bgColor: "#3b82f6", textColor: "#ffffff", weight: 30, message: "Você ganhou um item Raro!" },
      { id: 't9_3', name: "Épico (15%)", bgColor: "#a855f7", textColor: "#ffffff", weight: 15, message: "Você ganhou um item Épico!!!" },
      { id: 't9_4', name: "Lendário (5%)", bgColor: "#eab308", textColor: "#000000", weight: 5, message: "LENDÁRIO! Prêmio máximo alcançado!" }
    ]
  },
  {
    id: 'tpl_10', name: "Roleta Russa",
    eliminationMode: true, // Crucial para eliminar as câmaras vazias rodada a rodada
    options: [
      { id: 't10_1', name: "BANG! 💥 (Eliminado)", bgColor: "#7f1d1d", textColor: "#ffffff", weight: 1, message: "BANG! Você foi eliminado." }, // Vermelho escuro/sangue
      { id: 't10_2', name: "Click...", bgColor: "#e2e8f0", textColor: "#000000", weight: 1, message: "Click... Você sobreviveu." },
      { id: 't10_3', name: "Click...", bgColor: "#cbd5e1", textColor: "#000000", weight: 1, message: "Click... Você sobreviveu." },
      { id: 't10_4', name: "Click...", bgColor: "#94a3b8", textColor: "#000000", weight: 1, message: "Click... Você sobreviveu." },
      { id: 't10_5', name: "Click...", bgColor: "#64748b", textColor: "#ffffff", weight: 1, message: "Click... Você sobreviveu." },
      { id: 't10_6', name: "Click...", bgColor: "#475569", textColor: "#ffffff", weight: 1, message: "Click... Você sobreviveu." }
    ]
  }
];

// Referências do DOM
const elements = {
    themeDropdownBtn: document.getElementById('theme-dropdown-btn'),
    themeDropdownMenu: document.getElementById('theme-dropdown-menu'),
    themeDropdownLabel: document.getElementById('theme-dropdown-label'),
    themeDropdownItems: document.querySelectorAll('.theme-dropdown-item'),
    btnBack: document.getElementById('btn-back'),

    // Views
    dashboardView: document.getElementById('dashboard-view'),
    editorView: document.getElementById('editor-view'),

    // Dashboard Elements
    roulettesGrid: document.getElementById('roulettes-grid'),
    btnNewRouletteDash: document.getElementById('btn-new-roulette'), // Usando o id do HTML

    // Editor Elements
    currentRouletteTitle: document.getElementById('current-roulette-title'),

    inputRouletteName: document.getElementById('input-roulette-name'),
    inputPointerColor: document.getElementById('input-pointer-color'),
    toggleAdvanced: document.getElementById('toggle-advanced'),
    optionsList: document.getElementById('options-list'),
    btnEditRoulette: document.getElementById('btn-edit-roulette'),
    btnSaveEdit: document.getElementById('btn-save-edit'),
    btnSaveTemplate: document.getElementById('btn-save-template'),
    createModal: document.getElementById('create-modal'),
    btnCancelCreate: document.getElementById('btn-cancel-create'),
    btnConfirmCreate: document.getElementById('btn-confirm-create'),
    tabBlank: document.getElementById('tab-blank'),
    tabTemplate: document.getElementById('tab-template'),
    createBlankArea: document.getElementById('create-blank-area'),
    createTemplateArea: document.getElementById('create-template-area'),
    userTemplatesList: document.getElementById('user-templates-list'),
    defaultTemplatesList: document.getElementById('default-templates-list'),
    createRouletteName: document.getElementById('create-roulette-name'),
    selectedTemplateId: document.getElementById('selected-template-id'),
    previewCanvas: document.getElementById('preview-canvas'),
    toastContainer: document.getElementById('toast-container'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    toggleElimination: document.getElementById('toggle-elimination'),
    configSection: document.querySelector('.config-section'),
    eliminationHistoryContainer: document.getElementById('elimination-history-container'),
    eliminationHistory: document.getElementById('elimination-history'),
    optionsCount: document.getElementById('options-count'),
    btnAddOption: document.getElementById('btn-add-option'),
    btnSpin: document.getElementById('btn-spin'),
    canvas: document.getElementById('roulette-canvas'),
    pointer: document.getElementById('pointer'),

    // Modal
    modal: document.getElementById('winner-modal'),
    winnerTitle: document.getElementById('winner-title'),
    winnerImageContainer: document.getElementById('winner-image-container'),
    winnerImage: document.getElementById('winner-image'),
    winnerMessage: document.getElementById('winner-message'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('roulette-canvas').getContext('2d')
};

// Variáveis de Animação
let currentAngle = 0;
let isSpinning = false;
let isEditing = false;
let sessionOptions = [];
let eliminatedOptions = [];
let temporaryState = null;
let lastWinningOptionId = null;
let spinAnimation;

// --- INICIALIZAÇÃO ---
async function init() {
    if (typeof loadFromDB === 'function') {
        const saved = await loadFromDB();
        if (saved) {
            appState = saved;
            if (!appState.roulettes || appState.roulettes.length === 0) resetData();
        } else resetData();
    } else {
        loadData();
    }
    setupEventListeners();
    applyTheme(appState.theme);
    showDashboard(); // Começar sempre no dashboard
}

function loadData() {
    const saved = localStorage.getItem('megaRouletteData');
    if (saved) {
        try {
            appState = JSON.parse(saved);
            if (!appState.roulettes || appState.roulettes.length === 0) {
                const initial = defaultRoulette();
                appState.roulettes = [initial];
                appState.currentRouletteId = initial.id;
            }
        } catch (e) {
            console.error("Erro ao carregar dados", e);
            resetData();
        }
    } else {
        resetData();
    }
}

function resetData() {
    const initial = defaultRoulette();
    appState.roulettes = [initial];
    appState.currentRouletteId = initial.id;
    saveData();
}

function saveData() {
    if (typeof saveToDB === 'function') saveToDB(appState);
    else localStorage.setItem('megaRouletteData', JSON.stringify(appState));
}

function getCurrentRoulette() {
    return appState.roulettes.find(r => r.id === appState.currentRouletteId);
}

// --- ROTEAMENTO (VIEWS) ---
function showDashboard() {
    elements.editorView.style.display = 'none';
    elements.editorView.classList.remove('active');

    elements.dashboardView.style.display = 'block';
    // Pequeno delay para a animação
    setTimeout(() => elements.dashboardView.classList.add('active'), 10);

    elements.btnBack.style.display = 'none';

    renderDashboard();
}

function showEditor(rouletteId) {
    appState.currentRouletteId = rouletteId;
    saveData();

    elements.dashboardView.style.display = 'none';
    elements.dashboardView.classList.remove('active');

    elements.editorView.style.display = 'block';
    setTimeout(() => elements.editorView.classList.add('active'), 10);

    elements.btnBack.style.display = 'inline-flex';
    currentAngle = 0;

    initPlaySession();
}

function initPlaySession() {
    isEditing = false;
    elements.configSection.style.display = 'none';
    elements.btnSpin.style.display = 'block';
    elements.btnEditRoulette.style.display = 'flex';

    const current = getCurrentRoulette();
    sessionOptions = JSON.parse(JSON.stringify(current.options));
    eliminatedOptions = [];

    updateEliminationHistoryUI();
    drawRoulette();
}

function startEditing() {
    if (isSpinning) return; // Edge case protected
    if (isSpinning) return;
    isEditing = true;
    elements.configSection.style.display = 'block';
    elements.btnSpin.style.display = 'none';
    elements.btnEditRoulette.style.display = 'none';

    const current = getCurrentRoulette();
    temporaryState = JSON.parse(JSON.stringify(current));

    renderEditor();
    drawRoulette();
}

function saveEditing() {
    saveData();
    initPlaySession();
}

function cancelEditing() {
    if (temporaryState) {
        const index = appState.roulettes.findIndex(r => r.id === temporaryState.id);
        if (index !== -1) {
            appState.roulettes[index] = temporaryState;
            saveData();
        }
    }
    initPlaySession();
}

function updateEliminationHistoryUI() {
    const r = getCurrentRoulette();
    if (!r || !r.eliminationMode || eliminatedOptions.length === 0) {
        elements.eliminationHistoryContainer.style.display = 'none';
        elements.eliminationHistory.innerHTML = '';
        return;
    }

    elements.eliminationHistoryContainer.style.display = 'block';
    elements.eliminationHistory.innerHTML = '';

    eliminatedOptions.forEach((opt, idx) => {
        const badge = document.createElement('div');
        badge.style.padding = '4px 10px';
        badge.style.borderRadius = '20px';
        badge.style.fontSize = '0.8rem';
        badge.style.fontWeight = 'bold';
        badge.style.color = opt.textColor;
        badge.style.background = opt.bgColor;
        badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        badge.textContent = `${idx + 1}º: ${opt.name}`;
        elements.eliminationHistory.appendChild(badge);
    });
}

// --- RENDERIZAÇÃO DO DASHBOARD ---
function renderDashboard() {
    elements.roulettesGrid.innerHTML = '';

    appState.roulettes.forEach(r => {
        const card = document.createElement('div');
        card.className = 'roulette-card';

        // Criar um canvas miniatura
        const canvasId = `thumb-${r.id}`;

        const profileImageHTML = r.profileImage ? `<img src="${r.profileImage}" class="profile-thumb" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : `<canvas id="${canvasId}" width="130" height="130"></canvas>`;

        card.innerHTML = `
            <div class="card-canvas-container" style="position: relative;">
                ${profileImageHTML}
                <div style="position: absolute; bottom: -10px; right: -10px; display: flex; gap: 5px;">
                    <label class="upload-profile-btn" title="Fazer Upload de Imagem" style="background: var(--primary-color); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        <i class="fa-solid fa-folder-open"></i>
                        <input type="file" style="display:none;" accept="image/png, image/jpeg, image/webp" data-id="${r.id}" class="profile-image-input">
                    </label>
                    <button class="btn btn-primary" title="Escolher Ícone Padrão" onclick="showDefaultIconsGallery('${r.id}')" style="border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0;"><i class="fa-solid fa-palette"></i></button>
                </div>
                ${r.profileImage ? `<button class="remove-profile-btn" title="Remover Foto" data-id="${r.id}" style="position: absolute; top: 0; right: 0; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>
            <div class="card-info">
                <h3 title="${escapeHTML(r.name)}">${escapeHTML(r.name)}</h3>
                <p>${r.options.length} opções configuradas</p>
            </div>
            <div class="card-actions" style="display: flex; gap: 8px; width: 100%;">
                <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="showEditor('${r.id}')">Abrir Roleta</button>
                <button class="btn btn-outline btn-sm" style="flex-shrink: 0; width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; aspect-ratio: 1/1;" title="Duplicar Roleta" onclick="duplicateSpecificRoulette('${r.id}')"><i class="fa-solid fa-copy" style="font-size: 1.1rem; color: var(--text-color);"></i></button>
                <button class="btn btn-danger btn-sm" style="flex-shrink: 0; width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; aspect-ratio: 1/1;" title="Excluir Roleta" onclick="deleteSpecificRoulette('${r.id}')"><i class="fa-solid fa-trash" style="font-size: 1.1rem;"></i></button>
            </div>
        `;

        elements.roulettesGrid.appendChild(card);

        if (!r.profileImage) {
            setTimeout(() => drawMiniature(canvasId, r), 0);
        }

        const cardCanvas = card.querySelector('.card-canvas-container');
        cardCanvas.addEventListener('dragover', (e) => { e.preventDefault(); cardCanvas.style.opacity = '0.5'; });
        cardCanvas.addEventListener('dragleave', (e) => { e.preventDefault(); cardCanvas.style.opacity = '1'; });
        cardCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            cardCanvas.style.opacity = '1';
            const file = e.dataTransfer.files[0];
            if (file) handleProfileImageUpload({ target: { files: [file], getAttribute: () => r.id } });
        });
    });

    // Create Ghost Card
    const ghostCard = document.createElement('div');
    ghostCard.className = 'roulette-card ghost-card';
    ghostCard.onclick = openCreateModal;
    ghostCard.innerHTML = `<i class="fa-solid fa-plus"></i><span>Criar Nova Roleta</span>`;
    elements.roulettesGrid.appendChild(ghostCard);


    document.querySelectorAll('.profile-image-input').forEach(input => input.addEventListener('change', handleProfileImageUpload));
    document.querySelectorAll('.remove-profile-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const r = appState.roulettes.find(ro => ro.id === id);
            if(r) { r.profileImage = null; saveData(); renderDashboard(); }
        });
    });
}

function drawMiniature(canvasId, r) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2;

    ctx.clearRect(0, 0, width, height);

    if (r.options.length === 0) return;

    const totalWeight = r.options.reduce((sum, opt) => sum + opt.weight, 0);
    let startAngle = 0;

    for (let i = 0; i < r.options.length; i++) {
        const opt = r.options[i];
        const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = opt.bgColor;
        ctx.fill();

        if (opt.image) {
            ctx.save();
            ctx.clip();

            let imgObj = imageCache.get(opt.image);
            if (!imgObj) {
                imgObj = new Image();
                imgObj.src = opt.image;
                imageCache.set(opt.image, imgObj);
                imgObj.onload = () => { drawMiniature(canvasId, r); };
            }

            if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
                const imgSize = radius * 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + sliceAngle / 2);
                ctx.drawImage(imgObj, 0, -imgSize/2, imgSize, imgSize);
                ctx.rotate(-(startAngle + sliceAngle / 2));
                ctx.translate(-centerX, -centerY);
            }
            ctx.restore();
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        startAngle += sliceAngle;
    }
}

// --- RENDERIZAÇÃO DO EDITOR ---
function renderEditor() {
    const current = getCurrentRoulette();
    if (!current) return showDashboard();

    elements.currentRouletteTitle.textContent = current.name;
    elements.inputRouletteName.value = current.name;
    elements.inputPointerColor.value = current.pointerColor;
    elements.pointer.style.borderTopColor = current.pointerColor;
    elements.optionsCount.textContent = current.options.length;

    renderOptionsList();
    drawRoulette();
}

function renderOptionsList() {
    const current = getCurrentRoulette();
    elements.optionsList.innerHTML = '';

    current.options.forEach((opt, index) => {
        const item = document.createElement('div');
        item.className = 'option-item';

        // Thumbnail Logic
        const thumbHTML = opt.image ? `<img src="${opt.image}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--panel-border); flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" alt="Thumb">` : '';

        item.innerHTML = `
            <div class="drag-handle" title="Arraste para reordenar" style="width: 100%; text-align: center; color: var(--text-color); opacity: 0.3; cursor: grab; padding-bottom: 5px; margin-top: -5px; font-size: 1.2rem;">
                <i class="fa-solid fa-grip-vertical"></i>
            </div>
            <div class="option-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 8px; width: 100%;">
                ${thumbHTML}
                <input type="text" class="input-text" value="${escapeHTML(opt.name)}" data-id="${opt.id}" data-field="name" placeholder="Nome" title="${escapeHTML(opt.name)}" style="padding: 8px; flex: 1; min-width: 0;">

                <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    <input type="color" value="${escapeHTML(opt.bgColor)}" data-id="${opt.id}" data-field="bgColor" title="Fundo" style="width: 30px; height: 30px; padding: 0; border: none; border-radius: 50%; cursor: pointer; flex-shrink: 0; overflow: hidden; appearance: none; -webkit-appearance: none;">
                    <input type="color" value="${escapeHTML(opt.textColor)}" data-id="${opt.id}" data-field="textColor" title="Texto" style="width: 30px; height: 30px; padding: 0; border: none; border-radius: 50%; cursor: pointer; flex-shrink: 0; overflow: hidden; appearance: none; -webkit-appearance: none;">
                </div>

                <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    <button class="btn btn-outline btn-sm" onclick="duplicateOption('${opt.id}')" style="padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" title="Duplicar"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="removeOption('${opt.id}')" style="padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" title="Remover"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="option-row advanced-field" style="align-items: center; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 3px;">
                    <input type="checkbox" ${opt.hideText ? 'checked' : ''} data-id="${opt.id}" data-field="hideText" title="Ocultar Texto"> Ocultar Texto
                </label>
                <label style="font-size: 0.75rem; margin-left: auto;">Peso:</label>
                <input type="number" min="1" max="100" value="${opt.weight}" data-id="${opt.id}" data-field="weight" style="width: 45px; padding: 4px;">
            </div>
            <div class="option-row advanced-field" style="margin-top: 5px;">
                <input type="text" class="input-text" value="${escapeHTML(opt.message)}" data-id="${opt.id}" data-field="message" placeholder="Mensagem de Vitória..." style="padding: 6px; width: 100%; font-size: 0.85rem;">
            </div>
            <div class="option-row advanced-field" style="align-items: center; justify-content: space-between; margin-top: 5px;">
                <label style="font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 5px; margin: 0; flex: 1; justify-content: center;" class="btn btn-outline btn-sm option-dropzone" data-id="${opt.id}">
                    <i class="fa-solid fa-camera"></i> ${opt.image ? 'Trocar Imagem' : 'Imagem (Arraste)'}
                    <input type="file" style="display:none;" accept="image/png, image/jpeg, image/webp" data-id="${opt.id}" class="option-image-input">
                </label>
                ${opt.image ? `<button class="btn btn-danger btn-sm option-image-remove" data-id="${opt.id}" style="margin-left: 5px; padding: 4px 8px; font-size: 0.75rem;">Remover</button>` : ''}
            </div>
        `;
        elements.optionsList.appendChild(item);
    });

    elements.optionsList.querySelectorAll('input').forEach(input => {
        if (input.classList.contains('option-image-input')) {
            input.addEventListener('change', (e) => handleOptionImageUpload(e, input.dataset.id));
        } else if (input.type === 'checkbox') {
            input.addEventListener('change', handleOptionCheckboxChange);
        } else if (input.type === 'color') {
            input.addEventListener('change', handleOptionChange);
        } else {
            input.addEventListener('input', handleOptionChange);
        }
    });

    elements.optionsList.querySelectorAll('.option-image-remove').forEach(btn => {
        btn.addEventListener('click', () => removeOptionImage(btn.dataset.id));
    });

        elements.optionsList.querySelectorAll('.option-dropzone').forEach(dropzone => {
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.opacity = '0.5'; });
        dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.opacity = '1'; });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.opacity = '1';
            const file = e.dataTransfer.files[0];
            if (file) handleOptionImageUpload({target: {files: [file]}}, dropzone.dataset.id);
        });
    });

    // Inicializar SortableJS para Drag and Drop de opções
    if (window.Sortable) {
        // Destroi se já existir pra não acumular
        if (elements.optionsList._sortable) {
            elements.optionsList._sortable.destroy();
        }
        elements.optionsList._sortable = Sortable.create(elements.optionsList, {
            handle: '.drag-handle', // Usa a área com os pontinhos
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                const current = getCurrentRoulette();
                // Reordenar o array baseado no movimento
                const movedItem = current.options.splice(evt.oldIndex, 1)[0];
                current.options.splice(evt.newIndex, 0, movedItem);

                saveData();
                drawRoulette();
            }
        });
    }
}
function handleOptionChange(e) {
    const id = e.target.getAttribute('data-id');
    const field = e.target.getAttribute('data-field');
    let value = e.target.value;

    if (field === 'weight') {
        value = parseInt(value) || 1;
        if (value < 1) value = 1;
    }

    const current = getCurrentRoulette();
    const option = current.options.find(o => o.id === id);
    if (option) {
        option[field] = value;
        saveData();

        if (field === 'name' || field === 'bgColor' || field === 'textColor' || field === 'weight') {
            drawRoulette();
        }
    }
}

function addOption() {
    const current = getCurrentRoulette();

    // Gerador de cor aleatória para novas opções
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

    const newOpt = {
        id: Date.now().toString() + Math.floor(Math.random()*100),
        name: `Opção ${current.options.length + 1}`,
        bgColor: randomColor,
        textColor: "#ffffff",
        weight: 1,
        message: ""
    };
    current.options.push(newOpt);
    saveData();
    renderEditor();
}

function removeOption(id) {
    const current = getCurrentRoulette();
    if (current.options.length <= 2) {
        alert("A roleta precisa ter no mínimo 2 opções.");
        return;
    }
    current.options = current.options.filter(o => o.id !== id);
    saveData();
    renderEditor();
}



function duplicateCurrentRoulette() {
    const current = getCurrentRoulette();
    if (!current) return;

    const duplicate = JSON.parse(JSON.stringify(current)); // Deep copy
    duplicate.id = Date.now().toString() + Math.floor(Math.random()*100);
    duplicate.name = current.name + " (Cópia)";

    // Gerar novos IDs para as opções para evitar conflitos
    duplicate.options.forEach(opt => {
        opt.id = Date.now().toString() + Math.floor(Math.random()*1000);
    });

    appState.roulettes.push(duplicate);
    saveData();
    showEditor(duplicate.id);
}

function deleteCurrentRoulette() {
    if (confirm("Tem certeza que deseja excluir esta roleta?")) {
        appState.roulettes = appState.roulettes.filter(r => r.id !== appState.currentRouletteId);
        appState.currentRouletteId = null;
        saveData();
        showDashboard();
    }
}

function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    appState.theme = themeName;

    // Update Dropdown UI
    if (elements.themeDropdownItems) {
        elements.themeDropdownItems.forEach(item => {
            if (item.getAttribute('data-theme-val') === themeName) {
                item.classList.add('active');
                if(elements.themeDropdownLabel) {
                    elements.themeDropdownLabel.textContent = 'Tema: ' + item.textContent;
                }
            } else {
                item.classList.remove('active');
            }
        });
    }

    saveData();
}

function toggleAdvancedMode() {
    if (elements.toggleAdvanced.checked) {
        document.body.classList.add('show-advanced');
    } else {
        document.body.classList.remove('show-advanced');
    }
}

// --- DESENHO DA ROLETA PRINCIPAL (CANVAS) ---
function drawRoulette() {
    const r = getCurrentRoulette();
    if (!r) return;

    const ctx = elements.ctx;
    const canvas = elements.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2;

    ctx.clearRect(0, 0, width, height);

    const activeOptions = isEditing ? r.options : sessionOptions;
    const totalWeight = activeOptions.reduce((sum, opt) => sum + opt.weight, 0);
    let startAngle = currentAngle;

    for (let i = 0; i < activeOptions.length; i++) {
        const opt = activeOptions[i];
        const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;

                // Path para a fatia
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = opt.bgColor;
        ctx.fill();

        if (opt.image) {
            ctx.save();
            ctx.clip();

            let imgObj = imageCache.get(opt.image);
            if (!imgObj) {
                imgObj = new Image();
                imgObj.src = opt.image;
                imageCache.set(opt.image, imgObj);
                imgObj.onload = () => { if (!isSpinning) drawRoulette(); };
            }

            if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
                const imgSize = radius * 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + sliceAngle / 2);
                ctx.drawImage(imgObj, 0, -imgSize/2, imgSize, imgSize);
                ctx.rotate(-(startAngle + sliceAngle / 2));
                ctx.translate(-centerX, -centerY);
            }
            ctx.restore();
        }

        ctx.lineWidth = 1.5;
        const borderColor = getComputedStyle(document.body).getPropertyValue('--panel-border').trim() || 'rgba(0,0,0,0.1)';
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        if (opt.hideText !== true) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = opt.textColor;
            let text = opt.name;
            let fontSize = 24;
            ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
            let textWidth = ctx.measureText(text).width;
            while ((textWidth > radius * 0.7 || fontSize > (sliceAngle * radius) * 0.4) && fontSize > 10) {
                fontSize--;
                ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
                textWidth = ctx.measureText(text).width;
            }
            if (textWidth > radius * 0.75) { text = text.substring(0, Math.floor(text.length * 0.8)) + '...'; }
            ctx.fillText(text, radius * 0.85, 0);
            ctx.restore();
        }

        startAngle += sliceAngle;
    }
}

// --- LÓGICA DE GIRO ---
function spin() {
    if (isSpinning) return;

    const r = getCurrentRoulette();
    const activeOptions = isEditing ? r.options : sessionOptions;
    if (activeOptions.length < 2) {
        alert("Adicione pelo menos 2 opções para girar.");
        return;
    }

    isSpinning = true;
    elements.btnSpin.disabled = true;
    elements.btnBack.disabled = true; // Impedir voltar enquanto gira

    // Configurações do giro
    const spinTimeTotal = Math.random() * 4000 + 4000; // 4 a 8 segundos
    let spinTime = 0;

    const startVelocity = 0.25 + Math.random() * 0.1;

    function easeOutBack(t, b, c, d, s = 1.70158) {
        t /= d;
        t--;
        return c * (t * t * ((s + 1) * t + s) + 1) + b;
    }

    function rotateAnimation() {
        spinTime += 30;

        if (spinTime >= spinTimeTotal) {
            stopRotate();
            return;
        }

        const angleChange = easeOutBack(spinTime, startVelocity, -startVelocity, spinTimeTotal, 0.3);
        currentAngle += angleChange;

        if (currentAngle >= 2 * Math.PI) currentAngle -= 2 * Math.PI;
        if (currentAngle < 0) currentAngle += 2 * Math.PI;

        drawRoulette();
        spinAnimation = requestAnimationFrame(rotateAnimation);
    }

    rotateAnimation();
}

function stopRotate() {
    cancelAnimationFrame(spinAnimation);
    isSpinning = false;
    elements.btnSpin.disabled = false;
    elements.btnBack.disabled = false;

    determineWinner();
}

function determineWinner() {
    const r = getCurrentRoulette();
    const activeOptions = isEditing ? r.options : sessionOptions;
    const totalWeight = activeOptions.reduce((sum, opt) => sum + opt.weight, 0);

    let pointerAngle = (1.5 * Math.PI) - currentAngle;

    while (pointerAngle < 0) pointerAngle += 2 * Math.PI;
    while (pointerAngle >= 2 * Math.PI) pointerAngle -= 2 * Math.PI;

    let accumulatedAngle = 0;
    let winningOption = null;

    for (let i = 0; i < activeOptions.length; i++) {
        const opt = activeOptions[i];
        const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;

        if (pointerAngle >= accumulatedAngle && pointerAngle < accumulatedAngle + sliceAngle) {
            winningOption = opt;
            break;
        }
        accumulatedAngle += sliceAngle;
    }

    if (!winningOption) winningOption = activeOptions[0];

    showWinnerModal(winningOption);
}

// --- MODAL E CONFETES ---
function showWinnerModal(option) {
    lastWinningOptionId = option.id;
    elements.winnerTitle.textContent = option.name;
    elements.winnerTitle.style.wordBreak = 'break-word';
    elements.winnerTitle.style.maxWidth = '100%';
    if (option.image) {
        elements.winnerImage.src = option.image;
        elements.winnerImageContainer.style.display = 'block';
    } else {
        elements.winnerImageContainer.style.display = 'none';
        elements.winnerImage.src = '';
    }
    elements.winnerMessage.textContent = option.message ? option.message : "Fantástico! Você foi sorteado.";
    elements.modal.classList.add('show');
    elements.confettiCanvas.classList.add('show');
    startConfetti();
}

function hideWinnerModal() {
    elements.modal.classList.remove('show');
    elements.confettiCanvas.classList.remove('show');
    stopConfetti();

    const r = getCurrentRoulette();
    if (r && r.eliminationMode && lastWinningOptionId && !isEditing) {
        const optionIndex = sessionOptions.findIndex(o => o.id === lastWinningOptionId);
        if (optionIndex !== -1 && sessionOptions.length > 1) {
            eliminatedOptions.push(sessionOptions[optionIndex]);
            sessionOptions.splice(optionIndex, 1);
            updateEliminationHistoryUI();
            drawRoulette();
        }
    }
    lastWinningOptionId = null;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Top Bar
    // Custom Theme Dropdown Events
    if (elements.themeDropdownBtn) {
        elements.themeDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.themeDropdownMenu.classList.toggle('show');
        });
    }
    if (elements.themeDropdownItems) {
        elements.themeDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                applyTheme(e.target.getAttribute('data-theme-val'));
                elements.themeDropdownMenu.classList.remove('show');
            });
        });
    }

    // Close dropdown on click outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-dropdown')) {
            if (elements.themeDropdownMenu && elements.themeDropdownMenu.classList.contains('show')) {
                elements.themeDropdownMenu.classList.remove('show');
            }
        }
    });
    elements.btnEditRoulette.addEventListener('click', startEditing);
    elements.btnSaveEdit.addEventListener('click', saveEditing);
    elements.btnCancelEdit.addEventListener('click', cancelEditing);
    elements.btnCancelCreate?.addEventListener('click', closeCreateModal);
    elements.btnConfirmCreate?.addEventListener('click', confirmCreation);
    elements.tabBlank?.addEventListener('click', () => selectTab('blank'));
    elements.tabTemplate?.addEventListener('click', () => selectTab('template'));
    elements.btnSaveTemplate?.addEventListener('click', saveAsTemplate);

    elements.toggleElimination.addEventListener('change', (e) => {
        const current = getCurrentRoulette();
        current.eliminationMode = e.target.checked;
        saveData();
    });
    elements.btnBack.addEventListener('click', () => {
        if(!isSpinning) showDashboard();
    });

    // Dashboard


    // Editor Actions


    elements.inputRouletteName.addEventListener('change', (e) => {
        const r = getCurrentRoulette();
        if (r) {
            r.name = e.target.value || "Sem Nome";
            elements.currentRouletteTitle.textContent = r.name;
            saveData();
        }
    });

    elements.inputPointerColor.addEventListener('input', (e) => {
        elements.pointer.style.borderTopColor = e.target.value;
    });

    elements.inputPointerColor.addEventListener('change', (e) => {
        const r = getCurrentRoulette();
        if(r) {
            r.pointerColor = e.target.value;
            saveData();
        }
    });

    elements.toggleAdvanced.addEventListener('change', toggleAdvancedMode);
    elements.btnAddOption.addEventListener('click', addOption);
    elements.btnSpin.addEventListener('click', spin);
    elements.btnCloseModal.addEventListener('click', hideWinnerModal);

    window.addEventListener('click', (e) => {
        if (e.target === elements.modal) hideWinnerModal();
    });
}

// --- SISTEMA DE CONFETES PREMIUM ---
let confettiParticles = [];
let confettiAnimationId;

function startConfetti() {
    const canvas = elements.confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    confettiParticles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.2 - (canvas.height * 0.2),
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: Math.random() * 5 + 3,
            vx: Math.random() * 8 - 4,
            rot: Math.random() * 360,
            rotSpeed: Math.random() * 10 - 5,
            opacity: 1
        });
    }

    function renderConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let allDead = true;

        confettiParticles.forEach((p, index) => {
            if (p.opacity <= 0) return;
            allDead = false;

            p.y += p.vy;
            p.x += p.vx;
            p.rot += p.rotSpeed;

            p.vx *= 0.99; // Atrito do ar
            if (p.y > canvas.height * 0.6) {
                p.opacity -= 0.015; // Fade out mais suave
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            // Confetes mais arredondados
            ctx.beginPath();
            ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
            ctx.fill();
            ctx.restore();
        });

        if (!allDead) {
            confettiAnimationId = requestAnimationFrame(renderConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    renderConfetti();
}

function stopConfetti() {
    cancelAnimationFrame(confettiAnimationId);
    const ctx = elements.confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
}

window.addEventListener('resize', () => {
    elements.confettiCanvas.width = window.innerWidth;
    elements.confettiCanvas.height = window.innerHeight;
});

// Inicializar app
window.onload = init;

async function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const id = e.target.getAttribute('data-id') || (e.target.getAttribute && e.target.getAttribute());
    try {
        const compressedBase64 = await processHighQualityImage(file);
        const roulette = appState.roulettes.find(r => r.id === id);
        if (roulette) {
            roulette.profileImage = compressedBase64;
            saveData();
            renderDashboard();
        }
    } catch (err) { alert(err.message); }
}

function showDefaultIconsGallery(rouletteId) {
    const galleryId = `gallery-${rouletteId}`;
    let gallery = document.getElementById(galleryId);
    if (gallery) { gallery.remove(); return; }

    gallery = document.createElement('div');
    gallery.id = galleryId;
    gallery.style.position = 'absolute';
    gallery.style.top = '100%';
    gallery.style.left = '50%';
    gallery.style.transform = 'translateX(-50%)';
    gallery.style.background = 'var(--panel-bg)';
    gallery.style.border = '1px solid var(--panel-border)';
    gallery.style.borderRadius = '8px';
    gallery.style.padding = '10px';
    gallery.style.display = 'flex';
    gallery.style.gap = '10px';
    gallery.style.zIndex = '100';
    gallery.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

    const icons = [{ color: '#EF4444', icon: '🎰' }, { color: '#3B82F6', icon: '🎡' }, { color: '#10B981', icon: '🎯' }, { color: '#F59E0B', icon: '🎲' }];

    icons.forEach(data => {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        c.style.cursor = 'pointer'; c.style.borderRadius = '50%'; c.style.width = '32px'; c.style.height = '32px';
        const ctx = c.getContext('2d');
        ctx.fillStyle = data.color; ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.fill();
        ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(data.icon, 32, 32);

        c.addEventListener('click', () => {
            const r = appState.roulettes.find(ro => ro.id === rouletteId);
            if(r) { r.profileImage = c.toDataURL('image/png'); saveData(); renderDashboard(); }
        });
        gallery.appendChild(c);
    });

    const card = document.querySelector(`.roulette-card [data-id="${rouletteId}"]`).closest('.card-canvas-container');
    card.appendChild(gallery);
}

function handleOptionCheckboxChange(e) {
    const id = e.target.getAttribute('data-id');
    const field = e.target.getAttribute('data-field');
    const current = getCurrentRoulette();
    const option = current.options.find(o => o.id === id);
    if (option) {
        option[field] = e.target.checked;
        saveData();
        drawRoulette();
    }
}

async function handleOptionImageUpload(e, explicitId) {
    const file = e.target.files[0];
    if (!file) return;
    const id = explicitId || e.target.getAttribute('data-id');
    try {
        const compressedBase64 = await processHighQualityImage(file);
        const current = getCurrentRoulette();
        const option = current.options.find(o => o.id === id);
        if (option) {
            option.image = compressedBase64;
            saveData();
            renderEditor();
        }
    } catch (err) { alert("Erro ao processar a imagem. " + err.message); }
}

function removeOptionImage(id) {
    const current = getCurrentRoulette();
    const option = current.options.find(o => o.id === id);
    if (option) {
        option.image = null;
        saveData();
        renderEditor();
    }
}

function duplicateOption(id) {
    const current = getCurrentRoulette();
    if (!current) return;

    const index = current.options.findIndex(o => o.id === id);
    if (index === -1) return;

    const sourceOpt = current.options[index];
    const newOpt = JSON.parse(JSON.stringify(sourceOpt));
    newOpt.id = Date.now().toString() + Math.floor(Math.random() * 1000);
    newOpt.name = sourceOpt.name + " (Cópia)";

    // Insere logo abaixo
    current.options.splice(index + 1, 0, newOpt);

    saveData();
    renderEditor();
    drawRoulette();
}

function duplicateSpecificRoulette(id) {
    const source = appState.roulettes.find(r => r.id === id);
    if (!source) return;

    const duplicate = JSON.parse(JSON.stringify(source));
    duplicate.id = Date.now().toString() + Math.floor(Math.random()*1000);
    duplicate.name = duplicate.name + " (Cópia)";

    appState.roulettes.push(duplicate);
    saveData();
    renderDashboard();
}
function deleteSpecificRoulette(id) {
    if (appState.roulettes.length <= 1) {
        alert("Você não pode excluir a última roleta!");
        return;
    }
    if (confirm("Tem certeza que deseja excluir esta roleta?")) {
        appState.roulettes = appState.roulettes.filter(r => r.id !== id);
        if (appState.currentRouletteId === id) {
            appState.currentRouletteId = appState.roulettes[0].id;
        }
        saveData();
        renderDashboard();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.background = 'var(--primary-color)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}


function openCreateModal() {
    elements.createModal.classList.add('show');
    elements.createRouletteName.value = '';
    selectTab('blank');
    renderTemplateLists();
    drawPreviewCanvas(null);
}

function closeCreateModal() {
    elements.createModal.classList.remove('show');
}

function selectTab(tab) {
    if (tab === 'blank') {
        elements.tabBlank.classList.add('active');
        elements.tabTemplate.classList.remove('active');
        elements.createBlankArea.style.display = 'block';
        elements.createTemplateArea.style.display = 'none';
        elements.selectedTemplateId.value = '';
        drawPreviewCanvas(null);
    } else {
        elements.tabTemplate.classList.add('active');
        elements.tabBlank.classList.remove('active');
        elements.createBlankArea.style.display = 'none';
        elements.createTemplateArea.style.display = 'flex';
    }
}

function drawPreviewCanvas(template) {
    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    let options = template ? template.options : defaultRoulette().options;

    let startAngle = 0;
    const totalWeight = options.reduce((s, o) => s + (o.weight || 1), 0);
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = w / 2;

    options.forEach(opt => {
        const sliceAngle = ((opt.weight || 1) / totalWeight) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = opt.bgColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
        startAngle += sliceAngle;
    });
}

function createTemplateCard(tpl, isUser) {
    const card = document.createElement('div');
    card.style.minWidth = '120px';
    card.style.background = 'var(--input-bg)';
    card.style.border = '1px solid var(--input-border)';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.cursor = 'pointer';
    card.style.textAlign = 'center';
    card.style.transition = 'all 0.2s';

    card.innerHTML = `<div style="font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(tpl.name)}</div>
                       <div style="font-size: 0.75rem; opacity: 0.7;">${tpl.options.length} opções</div>`;

    card.onclick = () => {
        document.querySelectorAll('#create-template-area .template-card').forEach(c => c.style.borderColor = 'var(--input-border)');
        card.style.borderColor = 'var(--primary-color)';
        elements.selectedTemplateId.value = isUser ? 'user_' + tpl.id : 'def_' + tpl.id;
        drawPreviewCanvas(tpl);
    };
    card.className = 'template-card';
    return card;
}

function renderTemplateLists() {
    elements.userTemplatesList.innerHTML = '';
    elements.defaultTemplatesList.innerHTML = '';

    if (appState.userTemplates && appState.userTemplates.length > 0) {
        appState.userTemplates.forEach(tpl => {
            elements.userTemplatesList.appendChild(createTemplateCard(tpl, true));
        });
    } else {
        elements.userTemplatesList.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.85rem; padding: 10px;">Nenhum modelo salvo. Salve uma roleta usando o ícone de estrela nas configurações.</div>';
    }

    defaultTemplates.forEach(tpl => {
        elements.defaultTemplatesList.appendChild(createTemplateCard(tpl, false));
    });
}

function saveAsTemplate() {
    const current = getCurrentRoulette();
    if (!current) return;

    const tpl = JSON.parse(JSON.stringify(current));
    tpl.id = Date.now().toString(); // Novo ID pra não conflitar

    if (!appState.userTemplates) appState.userTemplates = [];
    appState.userTemplates.push(tpl);
    saveData();
    showToast("Roleta salva com sucesso em Meus Modelos!");
}

function confirmCreation() {
    const isBlank = elements.tabBlank.classList.contains('active');
    let newRoul;

    if (isBlank) {
        let name = elements.createRouletteName.value.trim();
        if (!name) name = "Nova Roleta";
        newRoul = defaultRoulette(name);
    } else {
        const selId = elements.selectedTemplateId.value;
        if (!selId) {
            alert("Selecione um modelo primeiro!");
            return;
        }

        let source;
        if (selId.startsWith('user_')) {
            source = appState.userTemplates.find(t => t.id === selId.replace('user_', ''));
        } else {
            source = defaultTemplates.find(t => t.id === selId.replace('def_', ''));
        }

        if (source) {
            newRoul = JSON.parse(JSON.stringify(source));
            newRoul.id = Date.now().toString() + Math.floor(Math.random()*1000);
        }
    }

    if (newRoul) {
        appState.roulettes.push(newRoul);
        saveData();
        closeCreateModal();
        showEditor(newRoul.id);
        startEditing();
    }
}
