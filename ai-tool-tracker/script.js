/* ============================================================
   AI TOOL STACK TRACKER — script.js
   Plain JS, localStorage, no build step required.
   ============================================================ */

'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
const state = {
  tools:       [],
  commands:    [],
  checklist:   {},   // { [itemId]: boolean }
  reviewNotes: '',
  lastReviewed: null,
  billingView:  'monthly',
  sort: { key: 'name', dir: 'asc' },
  charts: {},        // Chart.js instances keyed by id
};

/* ── SAMPLE DATA ───────────────────────────────────────────── */
function buildSampleTools() {
  return [
    {
      id: uid(), name: 'Claude Pro',
      category: 'coding', cost: 20, billingCycle: 'monthly',
      purpose: 'Primary AI for coding, writing, and research',
      lastUsed: today(), roiScore: 5, status: 'Keep',
      notes: 'Best ROI of any AI tool. Daily driver.',
      lastReviewed: today(),
      moneyLink: 'Saves 3–5 hrs/wk on client deliverables',
    },
    {
      id: uid(), name: 'Midjourney',
      category: 'image', cost: 10, billingCycle: 'monthly',
      purpose: 'AI image generation for marketing assets',
      lastUsed: daysAgo(5), roiScore: 4, status: 'Keep',
      notes: 'Great for thumbnails and brand visuals.',
      lastReviewed: daysAgo(7),
      moneyLink: 'Used for client social content packages',
    },
    {
      id: uid(), name: 'ChatGPT Plus',
      category: 'content', cost: 20, billingCycle: 'monthly',
      purpose: 'Brainstorming, drafts, and DALL-E access',
      lastUsed: daysAgo(14), roiScore: 3, status: 'Review',
      notes: 'Heavy overlap with Claude — evaluate if both needed.',
      lastReviewed: daysAgo(14),
      moneyLink: 'Occasional use for client copy',
    },
    {
      id: uid(), name: 'Notion AI',
      category: 'productivity', cost: 10, billingCycle: 'monthly',
      purpose: 'In-app AI for notes and documentation',
      lastUsed: daysAgo(32), roiScore: 2, status: 'Cut',
      notes: 'Not using regularly. Notion base is enough.',
      lastReviewed: daysAgo(21),
      moneyLink: 'No direct revenue connection',
    },
    {
      id: uid(), name: 'Perplexity Pro',
      category: 'research', cost: 20, billingCycle: 'monthly',
      purpose: 'Deep research with cited sources',
      lastUsed: daysAgo(3), roiScore: 4, status: 'Keep',
      notes: 'Great for competitive and market analysis.',
      lastReviewed: daysAgo(7),
      moneyLink: 'Accelerates research for consulting clients',
    },
  ];
}

function buildSampleCommands() {
  return [
    { id: uid(), text: 'Build automated monthly spend report',      category: 'automation',  icon: '🤖' },
    { id: uid(), text: 'Connect to bank API for charge tracking',   category: 'integration', icon: '🔗' },
    { id: uid(), text: 'Zapier flow to tag new AI tool emails',     category: 'workflow',    icon: '⚡' },
    { id: uid(), text: 'ROI calculator with revenue attribution',   category: 'idea',        icon: '💡' },
  ];
}

/* ── CHECKLIST DEFINITIONS ─────────────────────────────────── */
const CHECKLIST_ITEMS = [
  { id: 'bank',     title: 'Check bank charges',           desc: 'Review credit card for AI tool charges this week.'                },
  { id: 'email',    title: 'Check email receipts',         desc: 'Search inbox for subscription confirmations and renewals.'        },
  { id: 'lastused', title: 'Update Last Used dates',       desc: 'Refresh last-used for every tool you touched this week.'         },
  { id: 'cut',      title: 'Cut at least one tool',        desc: 'Cancel or downgrade any tool with ROI score ≤ 2.'                 },
  { id: 'roi',      title: 'Reassess ROI scores',          desc: 'Update scores for tools whose value has shifted.'                 },
  { id: 'money',    title: 'Validate money links',         desc: 'Confirm each paid tool has a clear, measurable revenue link.'     },
  { id: 'radar',    title: 'Review new tools on radar',    desc: 'Evaluate any new AI tools you discovered this week.'             },
];

/* ── HELPERS ───────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function formatDate(ds) {
  if (!ds) return '–';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysSince(ds) {
  if (!ds) return Infinity;
  return Math.floor((Date.now() - new Date(ds + 'T00:00:00')) / 86400000);
}

function toMonthly(cost, cycle) {
  if (cycle === 'annual')   return cost / 12;
  if (cycle === 'one-time') return 0;
  if (cycle === 'free')     return 0;
  return cost; // monthly
}

function toAnnual(cost, cycle) {
  if (cycle === 'annual')   return cost;
  if (cycle === 'one-time') return cost;
  if (cycle === 'free')     return 0;
  return cost * 12;
}

function monthlyEquiv(tool) {
  return toMonthly(tool.cost, tool.billingCycle);
}

function costDisplay(tool) {
  if (tool.billingCycle === 'free' || tool.cost === 0) return 'Free';
  if (state.billingView === 'annual') {
    return '$' + toAnnual(tool.cost, tool.billingCycle).toFixed(0) + '/yr';
  }
  return '$' + toMonthly(tool.cost, tool.billingCycle).toFixed(2) + '/mo';
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function starsHtml(score) {
  const cls = ['','roi-1','roi-2','roi-3','roi-4','roi-5'];
  const c = cls[score] || 'roi-3';
  return '<div class="roi-stars">' +
    [1,2,3,4,5].map(i =>
      `<span class="roi-star ${i <= score ? c : ''}">★</span>`
    ).join('') +
    '</div>';
}

/* ── LOCALSTORAGE ──────────────────────────────────────────── */
const LS = {
  tools:       'ait_tools',
  commands:    'ait_commands',
  checklist:   'ait_checklist',
  notes:       'ait_notes',
  lastReviewed:'ait_lastReviewed',
  billingView: 'ait_billingView',
};

function save() {
  localStorage.setItem(LS.tools,        JSON.stringify(state.tools));
  localStorage.setItem(LS.commands,     JSON.stringify(state.commands));
  localStorage.setItem(LS.checklist,    JSON.stringify(state.checklist));
  localStorage.setItem(LS.notes,        state.reviewNotes);
  localStorage.setItem(LS.lastReviewed, state.lastReviewed || '');
  localStorage.setItem(LS.billingView,  state.billingView);
}

function load() {
  const t = localStorage.getItem(LS.tools);
  const c = localStorage.getItem(LS.commands);
  state.tools        = t ? JSON.parse(t) : buildSampleTools();
  state.commands     = c ? JSON.parse(c) : buildSampleCommands();
  state.checklist    = JSON.parse(localStorage.getItem(LS.checklist) || '{}');
  state.reviewNotes  = localStorage.getItem(LS.notes) || '';
  state.lastReviewed = localStorage.getItem(LS.lastReviewed) || null;
  state.billingView  = localStorage.getItem(LS.billingView) || 'monthly';
}

/* ── INIT ──────────────────────────────────────────────────── */
function init() {
  load();
  applyBillingView();
  renderSummary();
  renderTable();
  renderChecklist();
  renderCommandList();
  refreshLastReviewed();
  const ta = document.getElementById('reviewNotes');
  if (ta) ta.value = state.reviewNotes;
}

/* ── BILLING VIEW ──────────────────────────────────────────── */
function setBillingView(v) {
  state.billingView = v;
  save();
  applyBillingView();
  renderSummary();
  renderTable();
}

function applyBillingView() {
  document.getElementById('toggleMonthly').classList.toggle('active', state.billingView === 'monthly');
  document.getElementById('toggleAnnual').classList.toggle('active',  state.billingView === 'annual');
  document.getElementById('spendLabel').textContent =
    state.billingView === 'monthly' ? 'Monthly Spend' : 'Normalized Monthly';
}

/* ── SUMMARY CARDS ─────────────────────────────────────────── */
function renderSummary() {
  const active = state.tools.filter(t => t.status !== 'Cut');
  const cut    = state.tools.filter(t => t.status === 'Cut');

  const monthly = active.reduce((s, t) => s + monthlyEquiv(t), 0);
  const annual  = active.reduce((s, t) => s + toAnnual(t.cost, t.billingCycle), 0);
  const avgRoi  = active.length
    ? (active.reduce((s, t) => s + t.roiScore, 0) / active.length).toFixed(1)
    : '0.0';

  el('totalMonthly').textContent = '$' + monthly.toFixed(2);
  el('totalAnnual').textContent  = '$' + annual.toFixed(0);
  el('activeTools').textContent  = active.length;
  el('cutTools').textContent     = cut.length;
  el('avgRoi').textContent       = avgRoi;
}

function el(id) { return document.getElementById(id); }

/* ── TABLE ─────────────────────────────────────────────────── */
function filteredSorted() {
  const search  = (el('searchInput')?.value    || '').toLowerCase();
  const fStatus = el('filterStatus')?.value    || '';
  const fCat    = el('filterCategory')?.value  || '';
  const fRoi    = el('filterRoi')?.value       || '';

  let list = state.tools.filter(t => {
    if (search) {
      const hay = [t.name, t.purpose, t.notes, t.category, t.moneyLink].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (fStatus && t.status !== fStatus) return false;
    if (fCat    && t.category !== fCat)  return false;
    if (fRoi    && t.roiScore !== +fRoi) return false;
    return true;
  });

  const { key, dir } = state.sort;
  list.sort((a, b) => {
    let va = key === 'cost' ? monthlyEquiv(a) : (a[key] ?? '');
    let vb = key === 'cost' ? monthlyEquiv(b) : (b[key] ?? '');
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ?  1 : -1;
    return 0;
  });

  return list;
}

function renderTable() {
  const tools   = filteredSorted();
  const tbody   = el('tableBody');
  const empty   = el('emptyState');
  const counter = el('toolCount');

  if (counter) counter.textContent = `${tools.length} tool${tools.length !== 1 ? 's' : ''}`;

  if (tools.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = tools.map(t => {
    const ds      = daysSince(t.lastUsed);
    const ageClass = ds > 60 ? 'very-stale' : ds > 30 ? 'stale' : '';
    const rowClass = t.status === 'Cut' ? 'row-cut' : '';
    const sClass   = { Keep:'s-keep', Review:'s-review', Cut:'s-cut' }[t.status] || 's-keep';

    return `<tr class="${rowClass}">
      <td>
        <div class="tool-name">${esc(t.name)}</div>
        ${t.moneyLink ? `<div class="tool-sub" title="${esc(t.moneyLink)}">💰 ${esc(t.moneyLink.length > 42 ? t.moneyLink.slice(0,42)+'…' : t.moneyLink)}</div>` : ''}
      </td>
      <td><span class="cat-badge cat-${esc(t.category)}">${esc(t.category)}</span></td>
      <td><div class="cost-val">${costDisplay(t)}</div></td>
      <td><span class="billing-badge">${esc(t.billingCycle)}</span></td>
      <td><div class="purpose-cell" title="${esc(t.purpose)}">${esc(t.purpose) || '–'}</div></td>
      <td><div class="last-used-cell ${ageClass}">${formatDate(t.lastUsed)}</div></td>
      <td>${starsHtml(t.roiScore)}</td>
      <td><span class="status-badge ${sClass}">${esc(t.status)}</span></td>
      <td><div class="note-cell" title="${esc(t.notes)}">${esc(t.notes) || '–'}</div></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit"   onclick="openEditModal('${t.id}')" title="Edit">✏️</button>
          <button class="btn-icon delete" onclick="deleteTool('${t.id}')"   title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Update sort header indicators
  document.querySelectorAll('.tools-table th[data-sort]').forEach(th => {
    const k    = th.dataset.sort;
    const icon = th.querySelector('.sort-icon');
    th.classList.toggle('sorted', k === state.sort.key);
    if (icon) icon.textContent = k === state.sort.key ? (state.sort.dir === 'asc' ? '↑' : '↓') : '';
  });
}

function sortBy(key) {
  state.sort = state.sort.key === key
    ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: 'asc' };
  renderTable();
}

function clearFilters() {
  ['searchInput','filterStatus','filterCategory','filterRoi'].forEach(id => {
    const e = el(id); if (e) e.value = '';
  });
  renderTable();
}

/* ── MODAL ─────────────────────────────────────────────────── */
function openAddModal() {
  el('modalTitle').textContent = 'Add Tool';
  el('editId').value           = '';
  el('toolName').value         = '';
  el('toolCategory').value     = 'coding';
  el('toolCost').value         = '';
  el('toolBilling').value      = 'monthly';
  el('toolRoi').value          = '3';
  el('toolStatus').value       = 'Keep';
  el('toolLastUsed').value     = today();
  el('toolLastReviewed').value = today();
  el('toolPurpose').value      = '';
  el('toolMoneyLink').value    = '';
  el('toolNotes').value        = '';
  openModal();
}

function openEditModal(id) {
  const t = state.tools.find(x => x.id === id);
  if (!t) return;
  el('modalTitle').textContent = 'Edit Tool';
  el('editId').value           = id;
  el('toolName').value         = t.name         || '';
  el('toolCategory').value     = t.category     || 'other';
  el('toolCost').value         = t.cost         ?? 0;
  el('toolBilling').value      = t.billingCycle || 'monthly';
  el('toolRoi').value          = t.roiScore     ?? 3;
  el('toolStatus').value       = t.status       || 'Keep';
  el('toolLastUsed').value     = t.lastUsed     || '';
  el('toolLastReviewed').value = t.lastReviewed || '';
  el('toolPurpose').value      = t.purpose      || '';
  el('toolMoneyLink').value    = t.moneyLink    || '';
  el('toolNotes').value        = t.notes        || '';
  openModal();
}

function openModal()  { el('modal').classList.add('open');    el('toolName').focus(); }
function closeModal() { el('modal').classList.remove('open'); }

function handleOverlayClick(e) {
  if (e.target === el('modal')) closeModal();
}

function saveTool() {
  const name = el('toolName').value.trim();
  if (!name) { toast('Tool name is required', 'error'); el('toolName').focus(); return; }

  const id   = el('editId').value;
  const tool = {
    id:           id || uid(),
    name,
    category:     el('toolCategory').value,
    cost:         parseFloat(el('toolCost').value) || 0,
    billingCycle: el('toolBilling').value,
    purpose:      el('toolPurpose').value.trim(),
    lastUsed:     el('toolLastUsed').value,
    roiScore:     parseInt(el('toolRoi').value),
    status:       el('toolStatus').value,
    notes:        el('toolNotes').value.trim(),
    lastReviewed: el('toolLastReviewed').value,
    moneyLink:    el('toolMoneyLink').value.trim(),
  };

  if (id) {
    const i = state.tools.findIndex(t => t.id === id);
    if (i !== -1) state.tools[i] = tool;
    toast('Tool updated ✓', 'success');
  } else {
    state.tools.push(tool);
    toast('Tool added ✓', 'success');
  }

  save();
  renderSummary();
  renderTable();
  closeModal();
}

function deleteTool(id) {
  const t = state.tools.find(x => x.id === id);
  if (!t) return;
  if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
  state.tools = state.tools.filter(x => x.id !== id);
  save();
  renderSummary();
  renderTable();
  toast('Tool deleted', 'info');
}

/* ── WEEKLY REVIEW ─────────────────────────────────────────── */
function renderChecklist() {
  const container = el('checklist');
  if (!container) return;

  container.innerHTML = CHECKLIST_ITEMS.map(item => {
    const checked = !!state.checklist[item.id];
    return `<div class="checklist-item ${checked ? 'checked' : ''}" onclick="toggleCheck('${item.id}')">
      <div class="check-box">${checked ? '✓' : ''}</div>
      <div>
        <div class="cl-title">${esc(item.title)}</div>
        <div class="cl-desc">${esc(item.desc)}</div>
      </div>
    </div>`;
  }).join('');

  renderFlaggedTools();
}

function toggleCheck(id) {
  state.checklist[id] = !state.checklist[id];
  save();
  renderChecklist();
}

function resetChecklist() {
  state.checklist = {};
  save();
  renderChecklist();
  toast('Checklist reset', 'info');
}

function renderFlaggedTools() {
  const container = el('toolsToCut');
  if (!container) return;

  const flagged = state.tools.filter(t =>
    t.status === 'Review' || t.status === 'Cut' || t.roiScore <= 2
  );

  if (!flagged.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.84rem">No tools flagged. Stack is clean 🎯</p>';
    return;
  }

  container.innerHTML = flagged.map(t => `
    <div class="flagged-item">
      <div style="flex:1;min-width:0">
        <div class="flagged-name">${esc(t.name)}</div>
        <div style="margin-top:3px">${starsHtml(t.roiScore)}</div>
      </div>
      <div class="flagged-cost">$${monthlyEquiv(t).toFixed(2)}/mo</div>
      <div class="flagged-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditModal('${t.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTool('${t.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function saveReviewNotes() {
  state.reviewNotes = el('reviewNotes').value;
  save();
  toast('Notes saved ✓', 'success');
}

function markReviewed() {
  state.lastReviewed = today();
  save();
  refreshLastReviewed();
  toast('Marked as reviewed ✓', 'success');
}

function refreshLastReviewed() {
  const e = el('lastReviewedDate');
  if (e) e.textContent = state.lastReviewed ? formatDate(state.lastReviewed) : 'Never';
}

/* ── CHARTS ────────────────────────────────────────────────── */
const CAT_COLORS = {
  coding:      '#818cf8',
  content:     '#86efac',
  automation:  '#d8b4fe',
  image:       '#f9a8d4',
  research:    '#93c5fd',
  sales:       '#fdba74',
  productivity:'#fde047',
  other:       '#94a3b8',
};

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#888899', font: { family: 'Inter, sans-serif', size: 11 }, padding: 14 },
      },
      tooltip: {
        backgroundColor: '#10101e',
        titleColor: '#e6e6f0',
        bodyColor: '#888899',
        borderColor: '#1c1c32',
        borderWidth: 1,
        padding: 10,
      },
    },
  };
}

function renderCharts() {
  renderCategoryChart();
  renderRoiChart();
  renderStatusChart();
  renderTopSpend();
}

function renderCategoryChart() {
  const canvas = el('categoryChart');
  if (!canvas) return;
  if (state.charts.category) state.charts.category.destroy();

  const active = state.tools.filter(t => t.status !== 'Cut');
  const cats   = {};
  active.forEach(t => {
    const k = t.category || 'other';
    cats[k] = (cats[k] || 0) + monthlyEquiv(t);
  });

  const labels = Object.keys(cats);
  const data   = Object.values(cats);
  const colors = labels.map(l => CAT_COLORS[l] || '#6366f1');

  state.charts.category = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#0d0d1a', borderWidth: 2 }] },
    options: { ...chartDefaults(), cutout: '62%' },
  });
}

function renderRoiChart() {
  const canvas = el('roiChart');
  if (!canvas) return;
  if (state.charts.roi) state.charts.roi.destroy();

  const counts = [0,0,0,0,0];
  state.tools.forEach(t => { if (t.roiScore >= 1 && t.roiScore <= 5) counts[t.roiScore-1]++; });

  state.charts.roi = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['1★','2★','3★','4★','5★'],
      datasets: [{
        label: 'Tools',
        data: counts,
        backgroundColor: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      ...chartDefaults(),
      plugins: { ...chartDefaults().plugins, legend: { display: false } },
      scales: {
        y: { beginAtZero:true, ticks:{ color:'#676788', stepSize:1 }, grid:{ color:'#1c1c32' } },
        x: { ticks:{ color:'#676788' }, grid:{ display:false } },
      },
    },
  });
}

function renderStatusChart() {
  const canvas = el('statusChart');
  if (!canvas) return;
  if (state.charts.status) state.charts.status.destroy();

  const keep   = state.tools.filter(t => t.status === 'Keep').length;
  const review = state.tools.filter(t => t.status === 'Review').length;
  const cut    = state.tools.filter(t => t.status === 'Cut').length;

  state.charts.status = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Keep','Review','Cut'],
      datasets: [{ data:[keep,review,cut], backgroundColor:['#22c55e','#eab308','#ef4444'], borderColor:'#0d0d1a', borderWidth:2 }],
    },
    options: { ...chartDefaults(), cutout: '62%' },
  });
}

function renderTopSpend() {
  const container = el('topSpendList');
  if (!container) return;

  const sorted = state.tools
    .filter(t => t.status !== 'Cut')
    .map(t => ({ ...t, monthly: monthlyEquiv(t) }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 8);

  const max = sorted[0]?.monthly || 1;

  container.innerHTML = sorted.map(t => `
    <div class="spend-item">
      <div class="spend-item-name">${esc(t.name)}</div>
      <div class="spend-bar-wrap">
        <div class="spend-bar" style="width:${(t.monthly / max * 100).toFixed(1)}%"></div>
      </div>
      <div class="spend-cost">$${t.monthly.toFixed(2)}</div>
    </div>
  `).join('');
}

/* ── COMMAND CENTER ────────────────────────────────────────── */
const CMD_ICONS = { idea:'💡', workflow:'⚡', automation:'🤖', integration:'🔗', review:'📋' };

function renderCommandList() {
  const container = el('commandList');
  if (!container) return;

  if (!state.commands.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.84rem;padding:16px 0">No ideas yet. Start adding!</p>';
    return;
  }

  container.innerHTML = state.commands.map(cmd => `
    <div class="command-item">
      <span class="cmd-icon">${cmd.icon || CMD_ICONS[cmd.category] || '💡'}</span>
      <span class="cmd-text">${esc(cmd.text)}</span>
      <span class="cmd-cat">${esc(cmd.category)}</span>
      <button class="btn-icon delete" onclick="deleteCommand('${cmd.id}')" title="Remove">✕</button>
    </div>
  `).join('');
}

function addCommand() {
  const input = el('commandInput');
  const text  = input.value.trim();
  if (!text) return;

  const cat = el('commandCategory').value;
  state.commands.push({ id: uid(), text, category: cat, icon: CMD_ICONS[cat] || '💡' });
  input.value = '';
  save();
  renderCommandList();
  toast('Idea added ✓', 'success');
}

function deleteCommand(id) {
  state.commands = state.commands.filter(c => c.id !== id);
  save();
  renderCommandList();
}

/* ── EXPORT / IMPORT ───────────────────────────────────────── */
function exportJSON() {
  const data = {
    exportedAt:  new Date().toISOString(),
    version:     '1.0',
    tools:       state.tools,
    commands:    state.commands,
    reviewNotes: state.reviewNotes,
    lastReviewed:state.lastReviewed,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `ai-tool-tracker-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported ✓', 'success');
}

function importJSON() { el('importInput').click(); }

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.tools || !Array.isArray(data.tools)) { toast('Invalid file format', 'error'); return; }
      if (!confirm(`Import ${data.tools.length} tools? This replaces your current data.`)) return;

      state.tools        = data.tools;
      state.commands     = data.commands  || state.commands;
      state.reviewNotes  = data.reviewNotes  || '';
      state.lastReviewed = data.lastReviewed || null;

      save();
      renderSummary();
      renderTable();
      renderCommandList();
      refreshLastReviewed();
      const ta = el('reviewNotes'); if (ta) ta.value = state.reviewNotes;
      toast(`Imported ${data.tools.length} tools ✓`, 'success');
    } catch {
      toast('Failed to parse JSON', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ── TABS ──────────────────────────────────────────────────── */
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));

  if (name === 'chart')  setTimeout(renderCharts, 50);
  if (name === 'review') renderChecklist();
}

/* ── TOAST ─────────────────────────────────────────────────── */
let _toastTimer;
function toast(msg, type = 'info') {
  const t = el('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── KEYBOARD SHORTCUTS ────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openAddModal(); }
});

document.addEventListener('DOMContentLoaded', () => {
  const ci = el('commandInput');
  if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') addCommand(); });
});

/* ── START ─────────────────────────────────────────────────── */
init();
