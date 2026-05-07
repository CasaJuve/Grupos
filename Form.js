const SHEET_URL = 'https://sheetdb.io/api/v1/a4uec69xydxbr';

const DAYS  = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const HOURS = ['10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

const selected = new Set();
let activeDay = null;

function abrirDropdown() {
  document.getElementById('escola-dropdown').classList.add('open');
  filtrarEscolas();
}

function fecharDropdown() {
  document.getElementById('escola-dropdown').classList.remove('open');
}

function filtrarEscolas() {
  const val = document.getElementById('f-escola').value.toLowerCase();
  document.querySelectorAll('.custom-option').forEach(opt => {
    opt.classList.toggle('hidden', !opt.textContent.toLowerCase().includes(val));
  });
  document.getElementById('escola-dropdown').classList.add('open');
}

function selecionarEscola(el) {
  document.getElementById('f-escola').value = el.textContent;
  document.getElementById('escola-dropdown').classList.remove('open');
  document.getElementById('clear-escola').style.display = 'block';
}

function limparEscola() {
  document.getElementById('f-escola').value = '';
  document.getElementById('clear-escola').style.display = 'none';
}

function buildGrid() {
  const container = document.getElementById('avail-container');

  // Botões dos dias
  const daysRow = document.createElement('div');
  daysRow.className = 'days-chips';
  DAYS.forEach(day => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-chip';
    btn.textContent = day.slice(0, 3);
    btn.dataset.day = day;
    btn.addEventListener('click', () => selectDay(btn, day));
    daysRow.appendChild(btn);
  });
  container.appendChild(daysRow);

  // Área das horas
  const hoursWrap = document.createElement('div');
  hoursWrap.id = 'hours-wrap';
  hoursWrap.style.display = 'none';

  const hoursLabel = document.createElement('div');
  hoursLabel.id = 'hours-label';
  hoursLabel.className = 'hours-label';
  hoursWrap.appendChild(hoursLabel);

  const hoursRow = document.createElement('div');
  hoursRow.className = 'hours-chips';
  hoursRow.id = 'hours-row';
  HOURS.forEach(hour => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hour-chip';
    btn.textContent = hour;
    btn.dataset.hour = hour;
    btn.addEventListener('click', () => toggleHour(btn));
    hoursRow.appendChild(btn);
  });
  hoursWrap.appendChild(hoursRow);
  container.appendChild(hoursWrap);
}

function selectDay(btn, day) {
  document.querySelectorAll('.day-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeDay = day;

  document.getElementById('hours-wrap').style.display = 'block';
  document.getElementById('hours-label').textContent = day;

  // Atualiza os botões das horas para refletir as seleções deste dia
  document.querySelectorAll('.hour-chip').forEach(b => {
    const slot = `${day}|${b.dataset.hour}`;
    b.classList.toggle('on', selected.has(slot));
  });
}

function toggleHour(btn) {
  if (!activeDay) return;
  const slot = `${activeDay}|${btn.dataset.hour}`;
  if (selected.has(slot)) {
    selected.delete(slot);
    btn.classList.remove('on');
  } else {
    selected.add(slot);
    btn.classList.add('on');
  }

  // Marca o dia como tendo seleções
  document.querySelectorAll('.day-chip').forEach(b => {
    const hasSlots = HOURS.some(h => selected.has(`${b.dataset.day}|${h}`));
    b.classList.toggle('has-slots', hasSlots);
  });
}

async function submitForm() {
  const nome     = document.getElementById('f-nome').value.trim();
  lastNome = nome;  
  const contacto = document.getElementById('f-contacto').value.trim();
  const turma    = document.getElementById('f-turma').value.trim();
  const escola   = document.getElementById('f-escola').value.trim();
  const notasEl  = document.getElementById('f-notas');
  const notas    = notasEl ? notasEl.value.trim() : '';

  const nomeErr = document.getElementById('nome-err');
nomeErr.style.display = nome ? 'none' : 'block';

  const escolaErr = document.getElementById('escola-err');
escolaErr.style.display = escola ? 'none' : 'block';

const turmaErr = document.getElementById('turma-err');
turmaErr.style.display = turma ? 'none' : 'block';

const dispErr = document.getElementById('disp-err');
dispErr.style.display = selected.size > 0 ? 'none' : 'block';
  
  const contactoErr = document.getElementById('contacto-err');
  const contactoValido = /^9\d{8}$/.test(contacto);
  contactoErr.style.display = contactoValido ? 'none' : 'block';

  if (!nome || !contactoValido || !turma || !escola || selected.size === 0) {
    return;
  }

  document.getElementById('submit-btn').disabled = true;

  const dispStr = [...selected]
    .sort((a, b) => {
      const [dayA, hA] = a.split('|');
      const [dayB, hB] = b.split('|');
      const di = d => DAYS.indexOf(d);
      const hi = h => HOURS.indexOf(h);
      return di(dayA) !== di(dayB) ? di(dayA) - di(dayB) : hi(hA) - hi(hB);
    })
    .map(s => s.replace('|', ' '))
    .join(', ');

  const payload = [{
    'Nome Completo': nome,
    Contacto: contacto,
    Turma: turma,
    Escola: escola,
    Disponibilidade: dispStr,
    'Informações Adicionais': notas,
  }];

  fetch(SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  document.getElementById('form-card').style.display = 'none';
  document.querySelector('.header').style.display = 'none';
  document.getElementById('success-screen').style.display = 'block';
  document.body.style.paddingTop = '1rem';
  setProgress(2);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let selectedActivity = null;
let lastNome = '';

function selectActivity(el, name) {
  document.querySelectorAll('.activity-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedActivity = name;
  document.getElementById('activity-btn').disabled = false;
}

function submitActivity() {
  if (!selectedActivity) return;
  document.getElementById('activity-btn').disabled = true;

  const url = `${SHEET_URL}/Nome%20Completo/${encodeURIComponent(lastNome)}`;

  fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { 'Atividade': selectedActivity } })
  }).catch(() => {});

  document.getElementById('activity-btn').style.display = 'none';
  document.querySelectorAll('.activity-card').forEach(c => c.style.pointerEvents = 'none');

  // Mostra a 3ª página
  document.getElementById('success-screen').style.display = 'none';
  document.getElementById('activities-screen').style.display = 'block';
  document.body.style.paddingTop = '1rem';
  setProgress(3);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function submitActivitiesCasa() {
  const checked = [...document.querySelectorAll('.activities-list input:checked')]
    .map(c => c.value)
    .join(', ');

  const url = `${SHEET_URL}/Nome%20Completo/${encodeURIComponent(lastNome)}`;

  fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { 'Atividades da Casa': checked || 'Nenhuma' } })
  }).catch(() => {});

  mostrarFim();
}

function skipActivitiesCasa() {
  mostrarFim();
}

function mostrarFim() {
  document.getElementById('activities-screen').innerHTML = `
    <div class="success-icon" style="margin: 0 auto 1.5rem;">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2>Obrigado!</h2>
    <p style="color: var(--ink-soft); font-size:15px; line-height:1.8;">As tuas preferências foram guardadas.<br>Até breve!</p>
  `;
}
function setProgress(page) {
  if (page === 2) document.getElementById('progress-bar').style.display = 'block';
  if (page === 3) document.getElementById('progress-bar-3').style.display = 'block';
}

 document.addEventListener('DOMContentLoaded', () => {
  buildGrid();
  document.getElementById('progress-bar-1').style.display = 'block';
});
