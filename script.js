// --- ESTADO DA APLICAÇÃO ---
let appState = {
    theme: 'dark',
    currentRouletteId: null,
    roulettes: []
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

// Referências do DOM
const elements = {
    themeSelect: document.getElementById('theme-select'),
    btnBack: document.getElementById('btn-back'),

    // Views
    dashboardView: document.getElementById('dashboard-view'),
    editorView: document.getElementById('editor-view'),

    // Dashboard Elements
    roulettesGrid: document.getElementById('roulettes-grid'),
    btnNewRouletteDash: document.getElementById('btn-new-roulette'), // Usando o id do HTML

    // Editor Elements
    currentRouletteTitle: document.getElementById('current-roulette-title'),
    btnDuplicateRoulette: document.getElementById('btn-duplicate-roulette'),
    btnDeleteRoulette: document.getElementById('btn-delete-roulette'),
    inputRouletteName: document.getElementById('input-roulette-name'),
    inputPointerColor: document.getElementById('input-pointer-color'),
    toggleAdvanced: document.getElementById('toggle-advanced'),
    optionsList: document.getElementById('options-list'),
    optionsCount: document.getElementById('options-count'),
    btnAddOption: document.getElementById('btn-add-option'),
    btnSpin: document.getElementById('btn-spin'),
    canvas: document.getElementById('roulette-canvas'),
    pointer: document.getElementById('pointer'),

    // Modal
    modal: document.getElementById('winner-modal'),
    winnerTitle: document.getElementById('winner-title'),
    winnerMessage: document.getElementById('winner-message'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('roulette-canvas').getContext('2d')
};

// Variáveis de Animação
let currentAngle = 0;
let isSpinning = false;
let spinAnimation;

// --- INICIALIZAÇÃO ---
function init() {
    loadData();
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
    localStorage.setItem('megaRouletteData', JSON.stringify(appState));
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

    currentAngle = 0; // Resetar ângulo ao abrir
    renderEditor();
}

// --- RENDERIZAÇÃO DO DASHBOARD ---
function renderDashboard() {
    elements.roulettesGrid.innerHTML = '';

    appState.roulettes.forEach(r => {
        const card = document.createElement('div');
        card.className = 'roulette-card';

        // Criar um canvas miniatura
        const canvasId = `thumb-${r.id}`;

        card.innerHTML = `
            <div class="card-canvas-container">
                <canvas id="${canvasId}" width="130" height="130"></canvas>
            </div>
            <div class="card-info">
                <h3 title="${r.name}">${r.name}</h3>
                <p>${r.options.length} opções configuradas</p>
            </div>
            <div class="card-actions">
                <button class="btn btn-outline btn-sm" onclick="showEditor('${r.id}')">Editar / Girar</button>
            </div>
        `;

        elements.roulettesGrid.appendChild(card);

        // Desenhar a miniatura
        setTimeout(() => drawMiniature(canvasId, r), 0);
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
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

        item.innerHTML = `
            <div class="option-row">
                <input type="text" class="input-text" value="${opt.name}" data-id="${opt.id}" data-field="name" placeholder="Nome da Opção" title="${opt.name}">
                <input type="color" value="${opt.bgColor}" data-id="${opt.id}" data-field="bgColor" title="Cor de Fundo">
                <input type="color" value="${opt.textColor}" data-id="${opt.id}" data-field="textColor" title="Cor do Texto">
                <button class="btn btn-danger btn-sm" onclick="removeOption('${opt.id}')">X</button>
            </div>
            <div class="option-row advanced-field">
                <label style="font-size: 0.8rem">Peso:</label>
                <input type="number" min="1" max="100" value="${opt.weight}" data-id="${opt.id}" data-field="weight" style="width: 60px;">
                <input type="text" class="input-text" value="${opt.message}" data-id="${opt.id}" data-field="message" placeholder="Mensagem de Vitória" style="flex: 1;">
            </div>
        `;
        elements.optionsList.appendChild(item);
    });

    // Adicionar listeners para os inputs gerados dinamicamente
    const inputs = elements.optionsList.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', handleOptionChange);
        // Atualização em tempo real para cores e nomes
        if(input.type === 'color' || (input.type === 'text' && input.dataset.field === 'name')) {
            input.addEventListener('input', handleOptionChange);
        }
    });
}

// --- GERENCIAMENTO DE DADOS ---
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

function createNewRoulette(name) {
    const newRoul = defaultRoulette(name);
    appState.roulettes.push(newRoul);
    saveData();
    showEditor(newRoul.id);
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
    elements.themeSelect.value = themeName;
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

    const totalWeight = r.options.reduce((sum, opt) => sum + opt.weight, 0);
    let startAngle = currentAngle;

    for (let i = 0; i < r.options.length; i++) {
        const opt = r.options[i];
        const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;

        // Desenhar Fatias com estilo premium
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = opt.bgColor;
        ctx.fill();
        ctx.lineWidth = 1.5;

        // Obter cor da borda via variavel CSS dependendo do tema, default transparente/escuro
        const borderColor = getComputedStyle(document.body).getPropertyValue('--panel-border').trim() || 'rgba(0,0,0,0.1)';
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        // Desenhar Texto Inteligente com sombra para contraste
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Sombra leve no texto para sempre ser legível
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = opt.textColor;

        let text = opt.name;
        const maxTextWidth = radius - 50; // Margem maior para não colar na borda

        // Algoritmo para diminuir a fonte se o texto for grande
        let fontSize = 22; // Fonte base um pouco maior
        ctx.font = `bold ${fontSize}px Poppins, sans-serif`;

        // Reduzir o tamanho da fonte até caber ou chegar no mínimo (12px)
        while(ctx.measureText(text).width > maxTextWidth && fontSize > 12) {
            fontSize -= 1;
            ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
        }

        // Se ainda for muito grande, cortar com reticências
        if(ctx.measureText(text).width > maxTextWidth) {
            while(ctx.measureText(text + "...").width > maxTextWidth && text.length > 0) {
                text = text.slice(0, -1);
            }
            text += "...";
        }

        ctx.fillText(text, radius - 30, 0); // Puxar mais pro centro
        ctx.restore();

        startAngle += sliceAngle;
    }
}

// --- LÓGICA DE GIRO ---
function spin() {
    if (isSpinning) return;

    const r = getCurrentRoulette();
    if (r.options.length < 2) {
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
    const totalWeight = r.options.reduce((sum, opt) => sum + opt.weight, 0);

    let pointerAngle = (1.5 * Math.PI) - currentAngle;

    while (pointerAngle < 0) pointerAngle += 2 * Math.PI;
    while (pointerAngle >= 2 * Math.PI) pointerAngle -= 2 * Math.PI;

    let accumulatedAngle = 0;
    let winningOption = null;

    for (let i = 0; i < r.options.length; i++) {
        const opt = r.options[i];
        const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;

        if (pointerAngle >= accumulatedAngle && pointerAngle < accumulatedAngle + sliceAngle) {
            winningOption = opt;
            break;
        }
        accumulatedAngle += sliceAngle;
    }

    if (!winningOption) winningOption = r.options[0];

    showWinnerModal(winningOption);
}

// --- MODAL E CONFETES ---
function showWinnerModal(option) {
    elements.winnerTitle.textContent = option.name;
    elements.winnerMessage.textContent = option.message ? option.message : "Fantástico! Você foi sorteado.";
    elements.modal.classList.add('show');
    elements.confettiCanvas.classList.add('show');
    startConfetti();
}

function hideWinnerModal() {
    elements.modal.classList.remove('show');
    elements.confettiCanvas.classList.remove('show');
    stopConfetti();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Top Bar
    elements.themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    elements.btnBack.addEventListener('click', () => {
        if(!isSpinning) showDashboard();
    });

    // Dashboard
    elements.btnNewRouletteDash.addEventListener('click', () => {
        const name = prompt("Nome da nova roleta:", "Nova Roleta Premium");
        if (name) createNewRoulette(name);
    });

    // Editor Actions
    elements.btnDuplicateRoulette.addEventListener('click', duplicateCurrentRoulette);
    elements.btnDeleteRoulette.addEventListener('click', deleteCurrentRoulette);

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