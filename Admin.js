const ADMIN_PASSWORD = 'casajuventude';
const SHEET_URL      = 'https://sheetdb.io/api/v1/a4uec69xydxbr';

const DAY_ORDER = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'];

const PALETTES = [
  { dot:'#c1440e', bg:'#f5ddd5', text:'#7a2508', pillBg:'#fae8e1', pillText:'#7a2508' },
  { dot:'#2d6a4f', bg:'#d8f0e5', text:'#1a3f2f', pillBg:'#e8f7ef', pillText:'#1a3f2f' },
  { dot:'#1d4e89', bg:'#dceaf8', text:'#0e2d50', pillBg:'#eaf2fb', pillText:'#0e2d50' },
  { dot:'#7b5ea7', bg:'#ede5f7', text:'#4a3465', pillBg:'#f4eefb', pillText:'#4a3465' },
  { dot:'#9e6b00', bg:'#faecd0', text:'#5e3f00', pillBg:'#fdf4e3', pillText:'#5e3f00' },
];

let allData = [];

function doLogin() {
  const pw = document.getElementById('pw-input').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
    loadData();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function logout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-screen').style.display = 'none';
  document.getElementById('pw-input').value = '';
}

async function loadData() {
  const container = document.getElementById('rooms-container');
  container.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div> A carregar...</div>';

  try {
    const res  = await fetch(SHEET_URL);
    const json = await res.json();
    allData = json;
    renderRooms();
  } catch (e) {
    console.error('Erro:', e);
    container.innerHTML = '<div class="empty-state"><span>⚠️</span>Erro: ' + e.message + '</div>';
  }
}

function getInitials(nome) {
  return (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function normDay(day) {
  return day.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function renderRooms() {
  const container = document.getElementById('rooms-container');
  document.getElementById('total-badge').textContent =
    allData.length + (allData.length === 1 ? ' inscrito' : ' inscritos');

  if (allData.length === 0) {
    container.innerHTML = '<div class="empty-state"><span>📋</span>Ainda não há inscrições.</div>';
    return;
  }

  // Agrupa por escola
  const schools = {};
  allData.forEach(row => {
    const escola = row.Escola || row.escola || 'Sem escola';
    if (!schools[escola]) schools[escola] = [];
    schools[escola].push(row);
  });

  const grid = document.createElement('div');
  grid.className = 'rooms-grid';

  Object.keys(schools).sort().forEach((escola, schoolIdx) => {
    const pal = PALETTES[schoolIdx % PALETTES.length];
    const pessoas = schools[escola];

    // Agrupa por slot dentro da escola
    const rooms = {};
    pessoas.forEach(row => {
      const slots = (row.Disponibilidade || row.disponibilidade || '').split(',').map(s => s.trim()).filter(Boolean);
      slots.forEach(slot => {
        if (!rooms[slot]) rooms[slot] = [];
        rooms[slot].push(row);
      });
    });

    const sortedSlots = Object.keys(rooms).sort((a, b) => {
      const [dayA, hourA] = a.split(' ');
      const [dayB, hourB] = b.split(' ');
      const di = d => DAY_ORDER.indexOf(d);
      const hi = h => parseInt(h);
      return di(dayA) !== di(dayB) ? di(dayA) - di(dayB) : hi(hourA) - hi(hourB);
    });

    // Card da escola
    const schoolCard = document.createElement('div');
    schoolCard.className = 'school-card';

    const schoolHeader = document.createElement('div');
    schoolHeader.className = 'school-header';
    schoolHeader.innerHTML = `
      <div class="room-dot" style="background:${pal.dot}"></div>
      <div class="room-day">${escola}</div>
      <div class="room-meta">${pessoas.length} ${pessoas.length === 1 ? 'pessoa' : 'pessoas'}</div>
    `;
    schoolCard.appendChild(schoolHeader);

    // Slots dentro da escola
    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'slots-wrap';

    sortedSlots.forEach((slot, idx) => {
      const slotPal = PALETTES[idx % PALETTES.length];
      const slotPeople = rooms[slot];

      const card = document.createElement('div');
      card.className = 'room-card';
      card.style.animationDelay = (idx * 0.05) + 's';

      const rows = slotPeople.map(p => `
        <tr>
          <td>
            <div class="avatar-cell">
              <div class="avatar" style="background:${slotPal.bg};color:${slotPal.text}">${getInitials(p['Nome Completo'] || p.nome)}</div>
              <span>${p['Nome Completo'] || p.nome}</span>
            </div>
          </td>
          <td>${p.Contacto || p.contacto}</td>
          <td>${p.Turma || p.turma}</td>
          <td>${p['Informações Adicionais'] || '—'}</td>
        </tr>`).join('');

      card.innerHTML = `
        <div class="room-header" onclick="this.closest('.room-card').classList.toggle('open')">
          <div class="room-dot" style="background:${slotPal.dot}"></div>
          <div class="room-day">${slot}</div>
          <div class="room-meta">${slotPeople.length} ${slotPeople.length === 1 ? 'pessoa' : 'pessoas'}</div>
          <div class="room-chevron">▼</div>
        </div>
        <div class="room-body">
          <table>
            <thead><tr>
              <th>Nome</th>
              <th>Contacto</th>
              <th>Turma</th>
              <th>Informações Adicionais</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

      slotsWrap.appendChild(card);
    });

    schoolCard.appendChild(slotsWrap);
    grid.appendChild(schoolCard);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

function exportCSV() {
  if (allData.length === 0) { alert('Não há dados para exportar.'); return; }

  const headers = ['Nome', 'Contacto', 'Turma', 'Escola', 'Disponibilidade', 'Notas'];
  const rows = allData.map(r =>
    [r.Nome||r.nome, r.Contacto||r.contacto, r.Turma||r.turma, r.Escola||r.escola, r.Disponibilidade||r.disponibilidade, r.Notas||r.notas]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'inscricoes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pw-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});
