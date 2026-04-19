// --- ESTADO DA APLICAÇÃO ---
let appState = {
    theme: 'dark',
    currentRouletteId: null,
    roulettes: []
};

// Objeto padrão para uma nova roleta
const defaultRoulette = () => ({
    id: Date.now().toString(),
    name: "Minha Roleta",
    pointerColor: "#ff0000",
    options: [
        { id: '1', name: "Opção 1", bgColor: "#4CAF50", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 1!" },
        { id: '2', name: "Opção 2", bgColor: "#2196F3", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 2!" },
        { id: '3', name: "Opção 3", bgColor: "#F44336", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 3!" },
        { id: '4', name: "Opção 4", bgColor: "#FF9800", textColor: "#ffffff", weight: 1, message: "Você ganhou a Opção 4!" }
    ]
});

// Referências do DOM
const elements = {
    themeSelect: document.getElementById('theme-select'),
    rouletteSelector: document.getElementById('roulette-selector'),
    btnNewRoulette: document.getElementById('btn-new-roulette'),
    btnDeleteRoulette: document.getElementById('btn-delete-roulette'),
    inputRouletteName: document.getElementById('input-roulette-name'),
    inputPointerColor: document.getElementById('input-pointer-color'),
    toggleAdvanced: document.getElementById('toggle-advanced'),
    optionsList: document.getElementById('options-list'),
    btnAddOption: document.getElementById('btn-add-option'),
    btnSpin: document.getElementById('btn-spin'),
    canvas: document.getElementById('roulette-canvas'),
    pointer: document.getElementById('pointer'),
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
    renderApp();
}

function loadData() {
    const saved = localStorage.getItem('megaRouletteData');
    if (saved) {
        appState = JSON.parse(saved);
        // Garantir que exista pelo menos uma roleta
        if (!appState.roulettes || appState.roulettes.length === 0) {
            const initial = defaultRoulette();
            appState.roulettes = [initial];
            appState.currentRouletteId = initial.id;
        }
    } else {
        const initial = defaultRoulette();
        appState.roulettes = [initial];
        appState.currentRouletteId = initial.id;
    }
}

function saveData() {
    localStorage.setItem('megaRouletteData', JSON.stringify(appState));
    drawRoulette(); // Redesenha a roleta sempre que salvar
}

function getCurrentRoulette() {
    return appState.roulettes.find(r => r.id === appState.currentRouletteId);
}

// --- RENDERIZAÇÃO DA UI ---
function renderApp() {
    const current = getCurrentRoulette();
    if (!current) return;

    renderRouletteSelector();
    
    // Atualizar Configurações Gerais
    elements.inputRouletteName.value = current.name;
    elements.inputPointerColor.value = current.pointerColor;
    elements.pointer.style.borderTopColor = current.pointerColor;

    renderOptionsList();
    drawRoulette();
}

function renderRouletteSelector() {
    elements.rouletteSelector.innerHTML = '';
    appState.roulettes.forEach(r => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = r.name;
        if (r.id === appState.currentRouletteId) option.selected = true;
        elements.rouletteSelector.appendChild(option);
    });
}

function renderOptionsList() {
    const current = getCurrentRoulette();
    elements.optionsList.innerHTML = '';

    current.options.forEach((opt, index) => {
        const item = document.createElement('div');
        item.className = 'option-item';
        
        item.innerHTML = `
            <div class="option-row">
                <input type="text" class="input-text" value="${opt.name}" data-id="${opt.id}" data-field="name" placeholder="Nome da Opção">
                <input type="color" value="${opt.bgColor}" data-id="${opt.id}" data-field="bgColor" title="Cor de Fundo">
                <input type="color" value="${opt.textColor}" data-id="${opt.id}" data-field="textColor" title="Cor do Texto">
                <button class="btn btn-danger" onclick="removeOption('${opt.id}')">X</button>
            </div>
            <div class="option-row advanced-field">
                <label>Peso (Chance):</label>
                <input type="number" min="1" max="100" value="${opt.weight}" data-id="${opt.id}" data-field="weight" style="width: 80px;">
                <label>Mensagem:</label>
                <input type="text" class="input-text" value="${opt.message}" data-id="${opt.id}" data-field="message" placeholder="Mensagem de Vitória">
            </div>
        `;
        elements.optionsList.appendChild(item);
    });

    // Adicionar listeners para os inputs gerados dinamicamente
    const inputs = elements.optionsList.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', handleOptionChange);
        // Atualização em tempo real para cores
        if(input.type === 'color' || input.type === 'text') {
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
    }
}

function addOption() {
    const current = getCurrentRoulette();
    
    // Gerador de cor aleatória para novas opções
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    const newOpt = {
        id: Date.now().toString(),
        name: `Opção ${current.options.length + 1}`,
        bgColor: randomColor,
        textColor: "#ffffff",
        weight: 1,
        message: ""
    };
    current.options.push(newOpt);
    saveData();
    renderOptionsList();
}

function removeOption(id) {
    const current = getCurrentRoulette();
    if (current.options.length <= 2) {
        alert("A roleta precisa ter no mínimo 2 opções.");
        return;
    }
    current.options = current.options.filter(o => o.id !== id);
    saveData();
    renderOptionsList();
}

function createNewRoulette(name) {
    const newRoul = defaultRoulette();
    newRoul.id = Date.now().toString();
    newRoul.name = name;
    appState.roulettes.push(newRoul);
    appState.currentRouletteId = newRoul.id;
    saveData();
    renderApp();
}

function deleteCurrentRoulette() {
    if (appState.roulettes.length <= 1) {
        alert("Você não pode excluir a única roleta existente.");
        return;
    }
    if (confirm("Tem certeza que deseja excluir esta roleta?")) {
        appState.roulettes = appState.roulettes.filter(r => r.id !== appState.currentRouletteId);
        appState.currentRouletteId = appState.roulettes[0].id;
        saveData();
        renderApp();
    }
}

function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    appState.theme = themeName;
    elements.themeSelect.value = themeName;
    localStorage.setItem('megaRouletteData', JSON.stringify(appState));
}

function toggleAdvancedMode() {
    if (elements.toggleAdvanced.checked) {
        document.body.classList.add('show-advanced');
    } else {
        document.body.classList.remove('show-advanced');
    }
}

// --- DESENHO DA ROLETA (CANVAS) ---
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

        // Desenhar Fatias
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = opt.bgColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#333';
        ctx.stroke();

        // Desenhar Texto
        ctx.save();
        ctx.translate(centerX, centerY);
        // Posicionar texto no meio da fatia
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = opt.textColor;
        ctx.font = 'bold 20px Poppins, sans-serif';
        // Ajustar texto se for muito grande (simplificado)
        let text = opt.name;
        if(text.length > 15) text = text.substring(0, 14) + '...';
        ctx.fillText(text, radius - 20, 0);
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

    // Configurações do giro
    const spinTimeTotal = Math.random() * 3000 + 4000; // 4 a 7 segundos
    let spinTime = 0;
    
    // Velocidade inicial alta
    const startVelocity = 0.2 + Math.random() * 0.1; 
    
    // Easing mais dinâmico (com uma pequena volta para trás no final)
    // easeOutBack adaptado para dar um pouco mais de 'peso' à roleta.
    function easeOutBack(t, b, c, d, s = 1.70158) {
        t /= d;
        t--;
        return c * (t * t * ((s + 1) * t + s) + 1) + b;
    }

    function rotateAnimation() {
        spinTime += 30; // approx 30ms per frame
        
        if (spinTime >= spinTimeTotal) {
            stopRotate();
            return;
        }

        // Calcular ângulo baseado em easing
        const angleChange = easeOutBack(spinTime, startVelocity, -startVelocity, spinTimeTotal, 0.5); // s=0.5 faz ela voltar só um pouquinho
        currentAngle += angleChange;
        
        // Manter currentAngle dentro de 0 a 2*PI
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
    
    determineWinner();
}

function determineWinner() {
    const r = getCurrentRoulette();
    const totalWeight = r.options.reduce((sum, opt) => sum + opt.weight, 0);
    
    // O ponteiro está apontando para o topo (270 graus ou -PI/2 em radianos)
    // Precisamos compensar o currentAngle que afeta o desenho
    // A fórmula exata depende de como desenhamos. No Canvas, 0 graus é Direita (3 horas).
    // O Topo é 270 graus (1.5 * PI).
    
    // O ângulo absoluto do topo em relação ao desenho girado
    let pointerAngle = (1.5 * Math.PI) - currentAngle;
    
    // Normalizar entre 0 e 2PI
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

    // Fallback caso dê algum erro de precisão matemática
    if (!winningOption) winningOption = r.options[0];

    showWinnerModal(winningOption);
}

// --- MODAL E CONFETES ---
function showWinnerModal(option) {
    elements.winnerTitle.textContent = option.name;
    elements.winnerMessage.textContent = option.message ? option.message : "Parabéns!";
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
    elements.themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    
    elements.rouletteSelector.addEventListener('change', (e) => {
        appState.currentRouletteId = e.target.value;
        saveData();
        renderApp();
    });

    elements.btnNewRoulette.addEventListener('click', () => {
        const name = prompt("Nome da nova roleta:", "Nova Roleta");
        if (name) createNewRoulette(name);
    });

    elements.btnDeleteRoulette.addEventListener('click', deleteCurrentRoulette);

    elements.inputRouletteName.addEventListener('change', (e) => {
        const r = getCurrentRoulette();
        if (r) {
            r.name = e.target.value || "Sem Nome";
            saveData();
            renderRouletteSelector();
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
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === elements.modal) hideWinnerModal();
    });
}

// --- SISTEMA DE CONFETES SIMPLES ---
let confettiParticles = [];
let confettiAnimationId;

function startConfetti() {
    const canvas = elements.confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    confettiParticles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    // Reduzido o número de confetes para algo mais suave e elegante (explosão única)
    for (let i = 0; i < 70; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3 - (canvas.height * 0.3), // Começam um pouco mais acima do meio
            w: Math.random() * 8 + 4,
            h: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: Math.random() * 6 + 2, // Velocidade de queda
            vx: Math.random() * 6 - 3, // Espalhamento lateral
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
            
            // Suave efeito de ar/desaceleração horizontal e fade out no fim da tela
            p.vx *= 0.99;
            if (p.y > canvas.height * 0.7) {
                p.opacity -= 0.02;
            }
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        
        if (!allDead) {
            confettiAnimationId = requestAnimationFrame(renderConfetti);
        } else {
            // Limpar a tela quando todos sumirem
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

// Redimensionar canvas de confetes
window.addEventListener('resize', () => {
    elements.confettiCanvas.width = window.innerWidth;
    elements.confettiCanvas.height = window.innerHeight;
});

// Inicializar app
window.onload = init;