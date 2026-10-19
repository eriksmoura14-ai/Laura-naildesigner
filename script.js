/* =========================================================
   CONFIGURAÇÕES — ALTERE AQUI
   ========================================================= */
const CONFIG = {
  // Número do WhatsApp com código do país + DDD, só números (ex.: 5511999999999)
  whatsappNumber: '5511999999999',

  // Nome do estúdio (aparece na mensagem)
  studioName: 'Studio Bella Unhas',

  // Horário de atendimento por dia da semana (0 = domingo ... 6 = sábado)
  // Use null para dias fechados.
  schedule: {
    0: null,
    1: { start: 9, end: 19 },
    2: { start: 9, end: 19 },
    3: { start: 9, end: 19 },
    4: { start: 9, end: 19 },
    5: { start: 9, end: 19 },
    6: { start: 9, end: 15 }
  },

  // Intervalo entre horários, em minutos
  slotMinutes: 60
};

/* =========================================================
   ELEMENTOS
   ========================================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const header = $('#header');
const nav = $('#nav');
const menuToggle = $('#menuToggle');
const form = $('#bookingForm');
const dateInput = $('#data');
const timeSelect = $('#horario');
const serviceSelect = $('#servico');

/* =========================================================
   MENU MOBILE + HEADER AO ROLAR
   ========================================================= */
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});

$$('a', nav).forEach(link => link.addEventListener('click', closeMenu));

function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* =========================================================
   ANIMAÇÃO AO ROLAR
   ========================================================= */
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => observer.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('visible'));
}

/* =========================================================
   BOTÕES "AGENDAR →" NOS CARDS (pré-seleciona o serviço)
   ========================================================= */
$$('[data-service]').forEach(btn => {
  btn.addEventListener('click', () => {
    serviceSelect.value = btn.dataset.service;
    clearError('servico');
    $('#agendar').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('#nome').focus({ preventScroll: true }), 700);
  });
});

/* =========================================================
   DATA E HORÁRIOS
   ========================================================= */
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const today = new Date();
dateInput.min = toISODate(today);
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 3);
dateInput.max = toISODate(maxDate);

function formatTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function buildSlots(date) {
  const rules = CONFIG.schedule[date.getDay()];
  if (!rules) return [];

  const slots = [];
  const startMin = rules.start * 60;
  const endMin = rules.end * 60;
  const isToday = toISODate(date) === toISODate(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  for (let t = startMin; t + CONFIG.slotMinutes <= endMin; t += CONFIG.slotMinutes) {
    // Se for hoje, ignora horários que já passaram (com 30 min de folga)
    if (isToday && t < nowMin + 30) continue;
    slots.push(formatTime(t));
  }
  return slots;
}

function fillTimes() {
  timeSelect.innerHTML = '';

  if (!dateInput.value) {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Escolha a data primeiro</option>';
    return;
  }

  const date = parseISODate(dateInput.value);
  const slots = buildSlots(date);

  if (slots.length === 0) {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Sem horários nesta data</option>';
    return;
  }

  timeSelect.disabled = false;
  timeSelect.innerHTML = '<option value="">Selecione</option>' +
    slots.map(s => `<option value="${s}">${s}</option>`).join('');
}

dateInput.addEventListener('change', () => {
  fillTimes();
  clearError('data');
  clearError('horario');

  if (dateInput.value) {
    const date = parseISODate(dateInput.value);
    if (!CONFIG.schedule[date.getDay()]) {
      setError('data', 'Não atendemos neste dia. Escolha outra data.');
    } else if (timeSelect.disabled) {
      setError('data', 'Sem horários disponíveis hoje. Escolha outra data.');
    }
  }
});

/* =========================================================
   VALIDAÇÃO
   ========================================================= */
function setError(fieldName, message) {
  const el = $(`.error[data-for="${fieldName}"]`);
  if (!el) return;
  el.textContent = message;
  el.closest('.field').classList.add('invalid');
}

function clearError(fieldName) {
  const el = $(`.error[data-for="${fieldName}"]`);
  if (!el) return;
  el.textContent = '';
  el.closest('.field').classList.remove('invalid');
}

['nome', 'servico', 'horario'].forEach(name => {
  const input = form.elements[name];
  input.addEventListener('input', () => clearError(name));
  input.addEventListener('change', () => clearError(name));
});

function validate() {
  let valid = true;
  ['nome', 'servico', 'data', 'horario'].forEach(clearError);

  if (form.nome.value.trim().length < 2) {
    setError('nome', 'Informe seu nome.');
    valid = false;
  }
  if (!form.servico.value) {
    setError('servico', 'Selecione um serviço.');
    valid = false;
  }
  if (!form.data.value) {
    setError('data', 'Escolha uma data.');
    valid = false;
  } else if (!CONFIG.schedule[parseISODate(form.data.value).getDay()]) {
    setError('data', 'Não atendemos neste dia.');
    valid = false;
  }
  if (!form.horario.value) {
    setError('horario', 'Escolha um horário.');
    valid = false;
  }
  return valid;
}

/* =========================================================
   ENVIO → WHATSAPP
   ========================================================= */
function formatDateBR(value) {
  const d = parseISODate(value);
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const date = d.toLocaleDateString('pt-BR');
  return `${date} (${weekday})`;
}

function buildWhatsAppLink(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) {
    const firstInvalid = $('.field.invalid input, .field.invalid select', form);
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const obs = form.obs.value.trim();
  const lines = [
    `Olá! Gostaria de agendar um horário no ${CONFIG.studioName}. 💅`,
    '',
    `*Nome:* ${form.nome.value.trim()}`,
    `*Serviço:* ${form.servico.value}`,
    `*Data:* ${formatDateBR(form.data.value)}`,
    `*Horário:* ${form.horario.value}`
  ];
  if (obs) lines.push(`*Observações:* ${obs}`);
  lines.push('', 'Poderia confirmar a disponibilidade? Obrigada!');

  const url = buildWhatsAppLink(lines.join('\n'));
  window.open(url, '_blank', 'noopener');
});

/* =========================================================
   BOTÃO FLUTUANTE + RODAPÉ
   ========================================================= */
$('#whatsFloat').href = buildWhatsAppLink(
  `Olá! Vim pelo site do ${CONFIG.studioName} e gostaria de mais informações. 💅`
);
$('#year').textContent = new Date().getFullYear();
