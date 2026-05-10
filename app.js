// ============================================================
// SMARTLING INTEGRATIONS HUB — APP LOGIC
// ============================================================
// Rendering and interaction logic. Content data lives in
// data.js — edit that file for routine content updates.
// ============================================================

// ── Utility helpers ──────────────────────────────────────────

// Parses a date string flexibly — handles ISO (2026-04-28), M/D/YYYY, and
// natural-language formats. Appending T00:00:00 prevents UTC-offset day shifts.
function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d) ? null : d;
  }
  // M/D/YYYY or MM/DD/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const d = new Date(`${slash[3]}-${slash[1].padStart(2,'0')}-${slash[2].padStart(2,'0')}T00:00:00`);
    return isNaN(d) ? null : d;
  }
  // Fall back to native parse (handles "April 28, 2026" etc.)
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function formatDate(val) {
  const d = parseDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(val) {
  const d = parseDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthLabel(val) {
  const d = parseDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getDayNum(val) {
  const d = parseDate(val);
  return d ? d.getDate() : '—';
}

function getDayName(val) {
  const d = parseDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function getMonthAbbr(val) {
  const d = parseDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ── Navigation / Router ──────────────────────────────────────

const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.section');

function navigateTo(sectionId) {
  navItems.forEach(n => {
    n.classList.toggle('active', n.dataset.section === sectionId);
  });
  sections.forEach(s => {
    s.classList.toggle('active', s.id === `section-${sectionId}`);
  });
  window.location.hash = sectionId;
  try { localStorage.setItem('hub-section', sectionId); } catch(e) {}
  window.scrollTo(0, 0);
}

navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.section));
});

// Restore section from URL hash (primary) or localStorage (fallback) on load
function restoreRoute() {
  const hash   = window.location.hash.replace('#', '');
  const stored = (() => { try { return localStorage.getItem('hub-section'); } catch(e) { return null; } })();
  const valid  = Array.from(navItems).map(n => n.dataset.section);
  const target = (hash && valid.includes(hash))     ? hash
               : (stored && valid.includes(stored)) ? stored
               : 'whats-new';
  navigateTo(target);
}

// ── SECTION 1: What's New ─────────────────────────────────────

function renderReleases() {
  const feed = document.getElementById('releases-feed');
  if (!RELEASES.length) {
    feed.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No releases to show yet.</p></div>';
    return;
  }
  feed.innerHTML = RELEASES.map(r => `
    <div class="release-item">
      <div class="release-date-col">
        <div class="release-date-month">${getMonthAbbr(r.date)}</div>
        <div class="release-date-day">${getDayNum(r.date)}</div>
      </div>
      <div class="release-content">
        <div class="release-header">
          <span class="release-connector">${escapeHtml(r.connector)}</span>
          ${r.version ? `<span class="release-version">v${escapeHtml(r.version)}</span>` : ''}
          <span class="badge badge-${r.type}">${capitalize(r.type)}</span>
        </div>
        <div class="release-summary">${escapeHtml(r.summary)}</div>
        ${r.details ? `<div class="release-details">${escapeHtml(r.details)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// ── SECTION 2: Work in Progress ──────────────────────────────

const STAGES = ['Discovery', 'Design', 'Build', 'QA', 'Launching'];

function renderWIP() {
  const board = document.getElementById('kanban-board');
  board.innerHTML = STAGES.map(stage => {
    const items = WIP_ITEMS.filter(w => w.stage === stage);
    return `
      <div class="kanban-column" data-stage="${stage}">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${stage}</span>
          <span class="kanban-col-count">${items.length}</span>
        </div>
        ${items.length ? items.map(w => `
          <div class="kanban-card">
            <div class="kanban-card-name">${escapeHtml(w.connector)}</div>
            <div class="kanban-card-cat">${escapeHtml(w.category)}</div>
            <div class="kanban-card-desc">${escapeHtml(w.description)}</div>
            <div class="kanban-card-footer">
              ${w.eta ? `<span class="kanban-eta">🗓 ${escapeHtml(w.eta)}</span>` : ''}
            </div>
            ${w.blockers ? `<div class="kanban-blocker">⚠️ ${escapeHtml(w.blockers)}</div>` : ''}
          </div>
        `).join('') : '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px 0;">No items</div>'}
      </div>
    `;
  }).join('');
}

// ── SECTION 3: Roadmap ────────────────────────────────────────

function renderRoadmap() {
  const grid = document.getElementById('roadmap-grid');
  const horizons = [
    { key: 'now',   label: 'Now',   sub: 'In progress or launching soon', cls: 'now'  },
    { key: 'next',  label: 'Next',  sub: 'Committed, coming up',          cls: 'next' },
    { key: 'later', label: 'Later', sub: 'Planned or under evaluation',   cls: 'later' }
  ];
  grid.innerHTML = horizons.map(h => `
    <div class="roadmap-column">
      <div class="roadmap-col-header ${h.cls}">
        <div class="roadmap-col-title">${h.label}</div>
        <div class="roadmap-col-subtitle">${h.sub}</div>
      </div>
      <div class="roadmap-items">
        ${(ROADMAP[h.key] || []).map(item => `
          <div class="roadmap-item">
            <div class="roadmap-item-header">
              <span class="roadmap-item-name">${escapeHtml(item.connector)}</span>
              <span class="badge badge-${item.confidence}">${capitalize(item.confidence)}</span>
            </div>
            <div class="roadmap-item-cat">${escapeHtml(item.category)}</div>
            <div class="roadmap-item-desc">${escapeHtml(item.description)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── SECTION 4: Connector Catalog ─────────────────────────────

function renderCatalog(filterText = '', filterCat = '', filterStatus = '') {
  const grid = document.getElementById('connector-grid');
  let items = CONNECTORS;

  if (filterText) {
    const q = filterText.toLowerCase();
    items = items.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }
  if (filterCat)    items = items.filter(c => c.category === filterCat);
  if (filterStatus) items = items.filter(c => c.status === filterStatus);

  if (!items.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔍</div><p>No connectors match your search. Try adjusting your filters.</p></div>';
    return;
  }

  grid.innerHTML = items.map(c => `
    <div class="connector-card">
      <div class="connector-card-header">
        <div>
          <div class="connector-name">${escapeHtml(c.name)}</div>
          <div class="connector-category">${escapeHtml(c.category)}</div>
        </div>
        <span class="badge badge-${c.status}">${escapeHtml(c.badge)}</span>
      </div>
      <div class="connector-desc">${escapeHtml(c.description)}</div>
      <div class="connector-types">
        ${c.contentTypes.map(t => `<span class="connector-type-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="connector-footer">
        <span class="connector-version">${c.version ? `v${escapeHtml(c.version)}` : 'In Development'}</span>
        ${c.docsUrl ? `<a class="connector-docs-link" href="${escapeHtml(c.docsUrl)}" target="_blank" rel="noopener">View Docs →</a>` : '<span class="connector-docs-link" style="color:var(--text-muted);">Docs coming soon</span>'}
      </div>
    </div>
  `).join('');
}

function initCatalog() {
  renderCatalog();
  const search = document.getElementById('catalog-search');
  const cat    = document.getElementById('catalog-category');
  const status = document.getElementById('catalog-status');

  const update = () => renderCatalog(search.value, cat.value, status.value);
  search.addEventListener('input', update);
  cat.addEventListener('change', update);
  status.addEventListener('change', update);
}

// ── SECTION 5: Health Status ──────────────────────────────────

function renderHealth() {
  const grid    = document.getElementById('status-grid');
  const summary = document.getElementById('status-summary');

  // Merge connector data with health data — keyed by connector name
  const healthConnectors = CONNECTORS.filter(c => HEALTH_STATUSES[c.name]);
  const counts = { operational: 0, degraded: 0, maintenance: 0, deprecated: 0 };

  healthConnectors.forEach(c => {
    const h = HEALTH_STATUSES[c.name];
    counts[h.status] = (counts[h.status] || 0) + 1;
  });

  const statusInfo = {
    operational:  { label: 'Operational',   dotCls: 'dot-operational', badgeCls: 'badge-operational',  icon: '🟢' },
    degraded:     { label: 'Degraded',       dotCls: 'dot-degraded',    badgeCls: 'badge-degraded',     icon: '🟡' },
    maintenance:  { label: 'Maintenance',    dotCls: 'dot-maintenance', badgeCls: 'badge-maintenance',  icon: '🔵' },
    deprecated:   { label: 'Deprecated',     dotCls: 'dot-deprecated',  badgeCls: 'badge-deprecated-h', icon: '⚫' }
  };

  summary.innerHTML = Object.entries(statusInfo).map(([key, info]) => `
    <div class="status-summary-item">
      <span class="status-dot ${info.dotCls}"></span>
      <span class="status-summary-count">${counts[key] || 0}</span>
      <span>${info.label}</span>
    </div>
  `).join('<span style="color:var(--border);">|</span>');

  grid.innerHTML = healthConnectors.map(c => {
    const h = HEALTH_STATUSES[c.name];
    const info = statusInfo[h.status] || statusInfo.operational;
    return `
      <div class="status-card">
        <div class="status-card-left">
          <div class="status-card-name">${escapeHtml(c.name)}</div>
          <div class="status-card-cat">${escapeHtml(c.category)}</div>
          ${h.note ? `<div class="status-card-note">${escapeHtml(h.note)}</div>` : ''}
        </div>
        <div class="status-card-right">
          <span class="badge ${info.badgeCls}">
            <span class="status-dot ${info.dotCls}"></span>
            ${info.label}
          </span>
          <span class="status-verified">Verified ${formatDateShort(h.lastVerified)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── SECTION 6: Known Issues ───────────────────────────────────

function renderIssues() {
  const tbody = document.getElementById('issues-tbody');
  const badge = document.getElementById('issues-badge');
  const openIssues = KNOWN_ISSUES.filter(i => i.status !== 'resolved');

  // Update nav badge with open issue count
  if (openIssues.length > 0) {
    badge.textContent = openIssues.length;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  if (!KNOWN_ISSUES.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="tracker-empty"><div class="empty-icon">✅</div><p>No known issues at this time.</p></td></tr>';
    return;
  }

  // Sort: open first, then by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder = { investigating: 0, 'in-progress': 1, resolved: 2 };
  const sorted = [...KNOWN_ISSUES].sort((a, b) =>
    (statusOrder[a.status] - statusOrder[b.status]) ||
    (severityOrder[a.severity] - severityOrder[b.severity])
  );

  tbody.innerHTML = sorted.map(i => `
    <tr style="${i.status === 'resolved' ? 'opacity:0.55;' : ''}">
      <td>
        <div class="issue-connector">${escapeHtml(i.connector)}</div>
        ${i.jiraTicket ? `<div class="issue-ticket">${escapeHtml(i.jiraTicket)}</div>` : ''}
      </td>
      <td>
        <div class="issue-summary">${escapeHtml(i.summary)}</div>
        ${i.workaround ? `<div class="issue-workaround">💡 Workaround: ${escapeHtml(i.workaround)}</div>` : ''}
      </td>
      <td><span class="badge badge-${i.severity}">${capitalize(i.severity)}</span></td>
      <td><span class="badge badge-${i.status}">${capitalize(i.status)}</span></td>
      <td class="issue-date">${formatDateShort(i.dateOpened)}</td>
    </tr>
  `).join('');
}

// ── SECTION 7: Integration Request Tracker ───────────────────

let CONNECTOR_REQUESTS = [];

// Urgency label → display label (abbreviated for table)
const URGENCY_SHORT = {
  'Must Have requirement for an RFP/RFI':                                              'Must Have / RFP',
  'Existing Smartling customer and/or potential SLS opportunity upside':               'Existing Customer',
  'No SLS opportunity upside, and provides Smartling customer retention and automation value': 'Retention',
  'I would like to have this integration to create new ecosystem market opportunities': 'Ecosystem',
  'Initial interest from a QBR or inbound lead call. Opportunity is not yet qualified.': 'Initial Interest',
  'Nice to Have requirement for an RFP/RFI':                                           'Nice to Have',
  'A new interested ISV Technology Partner integration request':                       'ISV Partner',
};

// Urgency → badge class
const URGENCY_BADGE = {
  'Must Have / RFP':   'badge-urg-critical',
  'Existing Customer': 'badge-urg-high',
  'Retention':         'badge-urg-medium',
  'Ecosystem':         'badge-urg-low',
  'Initial Interest':  'badge-urg-low',
  'Nice to Have':      'badge-urg-low',
  'ISV Partner':       'badge-urg-medium',
};

// Render Launch ETA cell — handles "Launched", date strings, and blanks
function renderEta(r) {
  const s = (r.status || '').toLowerCase();
  if (s.includes('launch')) {
    return '<span class="badge badge-req-launched">✓ Launched</span>';
  }
  if (!r.launchEta) return '<span style="color:var(--text-muted);">TBD</span>';
  // Format as "Mon YYYY" (e.g. "Aug 2026")
  const d = parseDate(r.launchEta);
  if (!d) return `<span style="color:var(--text-secondary);">${escapeHtml(r.launchEta)}</span>`;
  const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `<span style="color:var(--text-primary);font-weight:600;">${label}</span>`;
}

// Status → badge class
function reqStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('new request') || s === 'new') return 'badge-req-new';
  if (s.includes('launch'))    return 'badge-req-launched';
  if (s.includes('develop'))   return 'badge-req-dev';
  if (s.includes('commit') || s.includes('plan')) return 'badge-req-planned';
  if (s.includes('review'))    return 'badge-req-review';
  return 'badge-req-default';
}

// Robustly pull a value from a row object by any of a set of key fragments
function rowGet(row, ...fragments) {
  const keys = Object.keys(row);
  for (const frag of fragments) {
    const f = frag.toLowerCase();
    const k = keys.find(k => k.toLowerCase() === f) ||
              keys.find(k => k.toLowerCase().includes(f));
    if (k !== undefined && row[k] !== undefined && row[k] !== '') return String(row[k]);
  }
  return '';
}

function renderRequestTable() {
  const tbody   = document.getElementById('requests-tbody');
  const empty   = document.getElementById('requests-empty');
  const countEl = document.getElementById('requests-count');
  const table   = document.getElementById('requests-table');

  let reqs = [...CONNECTOR_REQUESTS];

  // If no data loaded show empty state
  if (reqs.length === 0 && CONNECTOR_REQUESTS.length === 0 && empty) {
    tbody.innerHTML = '';
    empty.style.display = '';
    empty.querySelector('p').textContent = 'No requests loaded. Check your sheet connection.';
    if (table) table.style.display = 'none';
    return;
  }

  // Apply filters
  const searchVal  = (document.getElementById('req-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const urgencyFilter = document.getElementById('filter-urgency')?.value || '';
  const sortVal    = document.getElementById('filter-sort')?.value || 'sheet';

  if (searchVal) {
    reqs = reqs.filter(r =>
      r.connector.toLowerCase().includes(searchVal) ||
      r.clients.toLowerCase().includes(searchVal) ||
      r.category.toLowerCase().includes(searchVal) ||
      r.submittedBy.toLowerCase().includes(searchVal)
    );
  }
  if (statusFilter)  reqs = reqs.filter(r => r.status === statusFilter);
  if (urgencyFilter) reqs = reqs.filter(r => r.urgency === urgencyFilter);

  // 'sheet' = preserve original row order from the spreadsheet (no sort applied)
  if (sortVal === 'date-asc')   reqs.sort((a, b) => (a.dateRequested || '').localeCompare(b.dateRequested || ''));
  if (sortVal === 'date-desc')  reqs.sort((a, b) => (b.dateRequested || '').localeCompare(a.dateRequested || ''));
  if (sortVal === 'connector')  reqs.sort((a, b) => a.connector.localeCompare(b.connector));
  if (sortVal === 'status')     reqs.sort((a, b) => a.status.localeCompare(b.status));

  countEl.textContent = `${reqs.length} of ${CONNECTOR_REQUESTS.length}`;

  if (!reqs.length) {
    tbody.innerHTML = '';
    if (empty) { empty.style.display = ''; empty.querySelector('p').textContent = 'No requests match the current filters.'; }
    if (table) table.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (table) table.style.display = '';

  tbody.innerHTML = reqs.map((r, idx) => {
    const urgShort   = URGENCY_SHORT[r.urgency] || r.urgency || '—';
    const urgBadge   = URGENCY_BADGE[urgShort]  || 'badge-req-default';
    const statusCls  = reqStatusBadge(r.status);
    const hasNotes   = r.notes || r.competitors || r.sources;
    const rowId      = `req-notes-${idx}`;
    return `
      <tr class="req-row-main" onclick="toggleReqNotes('${rowId}', this)" data-idx="${idx}">
        <td style="text-align:center;padding:8px 6px;">
          ${hasNotes ? `<button class="req-expand-btn" id="btn-${rowId}" aria-label="Toggle notes" onclick="event.stopPropagation();toggleReqNotes('${rowId}', this.closest('tr'))">›</button>` : ''}
        </td>
        <td><strong>${escapeHtml(r.connector)}</strong></td>
        <td style="color:var(--text-secondary);">${escapeHtml(r.category)}</td>
        <td><span class="badge ${statusCls}">${escapeHtml(r.status || '—')}</span></td>
        <td style="white-space:nowrap;">${renderEta(r)}</td>
        <td><span class="badge ${urgBadge}" style="white-space:normal;text-transform:none;letter-spacing:0;font-weight:600;font-size:11px;">${escapeHtml(urgShort)}</span></td>
        <td>${escapeHtml(r.clients) || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="color:var(--text-secondary);">${escapeHtml(r.submittedBy) || '—'}</td>
        <td>${escapeHtml(r.funding) || '—'}</td>
        <td style="white-space:nowrap;color:var(--text-secondary);">${r.dateRequested ? formatDateShort(r.dateRequested) : '—'}</td>
      </tr>
      ${hasNotes ? `<tr class="req-notes-row" id="${rowId}" style="display:none;">
        <td></td>
        <td colspan="8">
          <div class="req-notes-inner">
            ${r.notes ? `<div><strong>Notes / Use Case</strong><br>${escapeHtml(r.notes)}</div>` : ''}
            ${r.competitors ? `<div style="margin-top:8px;"><strong>Competitors w/ Integration</strong><br>${escapeHtml(r.competitors)}</div>` : ''}
            ${r.sources ? `<div style="margin-top:8px;"><strong>Source(s)</strong><br>${escapeHtml(r.sources)}</div>` : ''}
          </div>
        </td>
      </tr>` : ''}
    `;
  }).join('');
}

function toggleReqNotes(rowId, triggerEl) {
  const notesRow = document.getElementById(rowId);
  if (!notesRow) return;
  const isOpen = notesRow.style.display !== 'none';
  notesRow.style.display = isOpen ? 'none' : '';
  // Toggle chevron button
  const btn = document.getElementById(`btn-${rowId}`);
  if (btn) btn.classList.toggle('open', !isOpen);
}

function initRequestTracker() {
  renderRequestTable();

  const onFilter = () => renderRequestTable();
  document.getElementById('req-search')?.addEventListener('input', onFilter);
  document.getElementById('filter-status')?.addEventListener('change', onFilter);
  document.getElementById('filter-urgency')?.addEventListener('change', onFilter);
  document.getElementById('filter-sort')?.addEventListener('change', onFilter);

  // ── Toggle form ───────────────────────────────────────────
  const toggleBtn = document.getElementById('btn-toggle-req-form');
  const formWrap  = document.getElementById('req-form-wrap');
  toggleBtn?.addEventListener('click', () => {
    const isOpen = formWrap.style.display !== 'none';
    formWrap.style.display = isOpen ? 'none' : '';
    toggleBtn.textContent  = isOpen ? '+ Submit a Request' : '− Close Form';
    toggleBtn.classList.toggle('open', !isOpen);
    if (!isOpen) formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('req-cancel-btn')?.addEventListener('click', () => {
    formWrap.style.display = 'none';
    toggleBtn.textContent  = '+ Submit a Request';
    toggleBtn.classList.remove('open');
  });

  // ── "Other" workaround checkbox enables text input ────────
  document.getElementById('req-workaround-other-cb')?.addEventListener('change', function() {
    const input = document.getElementById('req-workaround-other');
    input.disabled = !this.checked;
    if (!this.checked) input.value = '';
  });

  // Default date to today
  const dateInput = document.getElementById('req-date');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  // ── Form submission ───────────────────────────────────────
  document.getElementById('request-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const get = id => (document.getElementById(id)?.value || '').trim();

    // Validate required fields
    const required = [
      { id: 'req-connector',    label: 'Smartling Integration Requested' },
      { id: 'req-submitted-by', label: 'Smartling Employee Name' },
      { id: 'req-clients',      label: 'Company Requesting' },
      { id: 'req-urgency',      label: 'Urgency' },
      { id: 'req-competitors',  label: 'Any competitors mentioned' },
    ];
    const missing = required.filter(f => !get(f.id));
    if (missing.length) {
      showToast(`Please fill in: ${missing.map(f => f.label).join(', ')}`, 'error');
      document.getElementById(missing[0].id)?.focus();
      return;
    }

    // Collect workaround checkboxes
    const workaroundChecked = Array.from(document.querySelectorAll('.req-workaround-cb:checked')).map(cb => cb.value);
    const otherCb = document.getElementById('req-workaround-other-cb');
    if (otherCb?.checked) {
      const otherVal = get('req-workaround-other');
      workaroundChecked.push(otherVal ? `Other: ${otherVal}` : 'Other');
    }
    const workaround = workaroundChecked.join(', ');

    // Combine contact into clients field if provided
    const contact = get('req-contact');
    const clientsVal = contact ? `${get('req-clients')} (${contact})` : get('req-clients');

    const submitBtn = document.getElementById('req-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const params = new URLSearchParams({
        action:       'submit',
        connector:    get('req-connector'),
        clients:      clientsVal,
        submittedBy:  get('req-submitted-by'),
        urgency:      get('req-urgency'),
        funding:      get('req-funding'),
        competitors:  get('req-competitors'),
        notes:        get('req-notes'),
        sfLink:       get('req-sf-link'),
        workaround,
        date:         get('req-date'),
      });

      const res  = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        showToast(`✅ Request for ${get('req-connector')} submitted!`);
        document.getElementById('request-form').reset();
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        document.getElementById('req-workaround-other').disabled = true;
        // Close form and reload tracker data
        formWrap.style.display = 'none';
        toggleBtn.textContent  = '+ Submit a Request';
        toggleBtn.classList.remove('open');
        // Re-fetch the sheet to show the new row
        const newRows = await fetchSheet('Connector_Requests');
        const mapped  = mapRequests(newRows);
        if (mapped) CONNECTOR_REQUESTS = mapped;
        renderRequestTable();
      } else {
        showToast(`Submission failed: ${json.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(`Network error — please try again.`, 'error');
      console.error('[Hub] Submit error:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });
}

// ── SECTION 8: Calendar ───────────────────────────────────────

function renderCalendar() {
  const container = document.getElementById('calendar-timeline');

  const typeInfo = {
    'release':      { label: 'Release',       badgeCls: 'badge-release' },
    'training':     { label: 'Training',      badgeCls: 'badge-training' },
    'webinar':      { label: 'Webinar',       badgeCls: 'badge-webinar' },
    'office-hours': { label: 'Office Hours',  badgeCls: 'badge-office-hours' },
    'milestone':    { label: 'Milestone',     badgeCls: 'badge-milestone' }
  };

  // Group by month
  const sorted = [...CALENDAR_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = {};
  sorted.forEach(ev => {
    const m = getMonthLabel(ev.date);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(ev);
  });

  container.innerHTML = Object.entries(byMonth).map(([month, events]) => `
    <div class="calendar-month-group">
      <div class="calendar-month-label">${month}</div>
      <div class="calendar-events">
        ${events.map(ev => {
          const info = typeInfo[ev.type] || { label: capitalize(ev.type), badgeCls: 'badge-training' };
          return `
            <div class="calendar-event">
              <div>
                <div class="cal-day-num">${getDayNum(ev.date)}</div>
                <div class="cal-day-name">${getDayName(ev.date)}</div>
              </div>
              <div class="cal-type-col">
                <span class="badge ${info.badgeCls}">${info.label}</span>
              </div>
              <div class="cal-body">
                <div class="cal-title">${escapeHtml(ev.title)}</div>
                <div class="cal-connector">${escapeHtml(ev.connector)}</div>
                ${ev.description ? `<div class="cal-desc">${escapeHtml(ev.description)}</div>` : ''}
              </div>
              ${ev.link ? `<a class="cal-link" href="${escapeHtml(ev.link)}" target="_blank" rel="noopener">Join →</a>` : '<span></span>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// ── SECTION 9: Training Resources ────────────────────────────

function renderTraining(filterAudience = '', filterConnector = '', filterType = '') {
  const grid = document.getElementById('resource-grid');
  let items = TRAINING_RESOURCES;

  if (filterAudience) items = items.filter(r => r.audience.includes(filterAudience));
  if (filterConnector) items = items.filter(r => r.connector === filterConnector);
  if (filterType)     items = items.filter(r => r.type === filterType);

  if (!items.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📂</div><p>No resources match your filters.</p></div>';
    return;
  }

  const audienceLabels = { sales: 'Sales', cs: 'CS', se: 'SE', all: 'All' };
  const typeIcons = {
    recording: '🎬', deck: '📊', guide: '📋', battlecard: '⚔️',
    matrix: '📐', walkthrough: '🚶', 'quick-ref': '⚡'
  };

  grid.innerHTML = items.map(r => `
    <div class="resource-card">
      <div class="resource-header">
        <div class="resource-title">${escapeHtml(r.title)}</div>
        <span class="resource-type-badge">${typeIcons[r.type] || '📄'} ${capitalize(r.type)}</span>
      </div>
      <div class="resource-meta">
        <span class="resource-connector">📦 ${escapeHtml(r.connector)}</span>
      </div>
      <div class="resource-desc">${escapeHtml(r.description)}</div>
      <div class="resource-footer">
        <div class="resource-audiences">
          ${r.audience.map(a => `<span class="audience-tag aud-${a}">${audienceLabels[a] || a}</span>`).join('')}
        </div>
        <a href="${escapeHtml(r.link)}" target="_blank" rel="noopener" class="btn-resource">Open →</a>
      </div>
    </div>
  `).join('');
}

function initTraining() {
  // Populate connector dropdown
  const connectorSelect = document.getElementById('training-connector');
  const connectors = [...new Set(TRAINING_RESOURCES.map(r => r.connector))].sort();
  connectors.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    connectorSelect.appendChild(opt);
  });

  renderTraining();
  const aud  = document.getElementById('training-audience');
  const conn = document.getElementById('training-connector');
  const type = document.getElementById('training-type');
  const update = () => renderTraining(aud.value, conn.value, type.value);
  aud.addEventListener('change', update);
  conn.addEventListener('change', update);
  type.addEventListener('change', update);
}

// ── SECTION 11: Research ──────────────────────────────────────
// RESEARCH_ITEMS is declared in data.js as a global

function mapResearch(rows) {
  if (!rows || !rows.length) return null;
  return rows
    .filter(r => r.id && r.title)
    .map(r => ({
      id:      r.id      || '',
      title:   r.title   || '',
      type:    (r.type   || 'doc').toLowerCase().trim(),
      date:    r.date    || '',
      status:  (r.status || 'published').toLowerCase().trim(),
      author:  r.author  || '',
      summary: r.summary || '',
      link:    r.link    || '',
      tags:    r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));
}

function renderResearch(filterType = '', filterTag = '', filterStatus = '') {
  const grid = document.getElementById('research-grid');
  let items = RESEARCH_ITEMS;

  // Filter only published items for the default view (show draft with filter)
  if (!filterStatus) items = items.filter(r => r.status !== 'archived');
  if (filterType)   items = items.filter(r => r.type === filterType);
  if (filterTag)    items = items.filter(r => r.tags.includes(filterTag));
  if (filterStatus) items = items.filter(r => r.status === filterStatus);

  // Sort: newest first
  items = [...items].sort((a, b) => {
    const da = parseDate(a.date), db = parseDate(b.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db - da;
  });

  if (!items.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔬</div><p>No research found matching your filters.</p></div>';
    return;
  }

  const typeConfig = {
    slides: { icon: '📊', label: 'Slide Deck',  color: 'orange' },
    doc:    { icon: '📄', label: 'Document',    color: 'blue'   },
    pdf:    { icon: '📕', label: 'PDF',         color: 'red'    },
  };

  const statusConfig = {
    published: { label: 'Published', cls: 'research-status-published' },
    draft:     { label: 'Draft',     cls: 'research-status-draft'     },
    archived:  { label: 'Archived',  cls: 'research-status-archived'  },
  };

  grid.innerHTML = items.map(r => {
    const tc  = typeConfig[r.type]   || typeConfig.doc;
    const sc  = statusConfig[r.status] || statusConfig.published;
    const dateStr = r.date ? formatDate(r.date) : '';
    const hasLink = r.link && r.link.startsWith('http');

    return `
      <div class="research-card">
        <div class="research-card-top">
          <div class="research-type-icon research-type-${r.type}">${tc.icon}</div>
          <span class="research-type-badge research-type-badge-${tc.color}">${tc.label}</span>
          <span class="research-status-badge ${sc.cls}">${sc.label}</span>
        </div>
        <div class="research-title">${escapeHtml(r.title)}</div>
        ${r.summary ? `<div class="research-summary">${escapeHtml(r.summary)}</div>` : ''}
        <div class="research-meta">
          ${r.author ? `<span class="research-author">👤 ${escapeHtml(r.author)}</span>` : ''}
          ${dateStr  ? `<span class="research-date">📅 ${dateStr}</span>`               : ''}
        </div>
        ${r.tags.length ? `
          <div class="research-tags">
            ${r.tags.map(t => `<span class="research-tag">${escapeHtml(t)}</span>`).join('')}
          </div>` : ''}
        <div class="research-footer">
          ${hasLink
            ? `<a href="${escapeHtml(r.link)}" target="_blank" rel="noopener" class="btn-research">Open ${tc.icon}</a>`
            : `<span class="btn-research btn-research-disabled">No link yet</span>`}
        </div>
      </div>
    `;
  }).join('');
}

function initResearch() {
  // Populate tag filter from all tags in dataset
  const tagSelect = document.getElementById('research-tag');
  const allTags = [...new Set(RESEARCH_ITEMS.flatMap(r => r.tags))].sort();
  allTags.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tagSelect.appendChild(opt);
  });

  renderResearch();

  const typeEl   = document.getElementById('research-type');
  const tagEl    = document.getElementById('research-tag');
  const statusEl = document.getElementById('research-status');
  const update   = () => renderResearch(typeEl.value, tagEl.value, statusEl.value);
  typeEl.addEventListener('change', update);
  tagEl.addEventListener('change', update);
  statusEl.addEventListener('change', update);
}

// ── SECTION 10: Comparison Matrix ────────────────────────────

// Connector groups — defines which connectors appear under each tab
const MATRIX_CONNECTOR_GROUPS = [
  { key: 'cms', label: 'CMS', connectors: [
    'Adobe Experience Manager (Cloud)', 'Adobe Experience Manager (Touch UI)',
    'Contentful', 'Contentful (Fields)', 'Contentstack',
    'Sitecore XP', 'Sitecore XM Cloud', 'WordPress', 'Drupal', 'Episerver / Optimizely'
  ]},
  { key: 'email', label: 'Email & Marketing', connectors: [
    'Marketo', 'Marketo (Legacy)', 'HubSpot', 'Salesforce Marketing Cloud',
    'Braze', 'Oracle Eloqua', 'Iterable', 'Sendwithus'
  ]},
  { key: 'support', label: 'Support & KB', connectors: [
    'Zendesk', 'Intercom', 'ServiceNow', 'Confluence', 'MindTouch'
  ]},
  { key: 'crm', label: 'CRM & Commerce', connectors: [
    'Salesforce CRM', 'Salesforce Commerce Cloud', 'Salesforce Knowledge',
    'Salesforce Service Cloud', 'Workfront'
  ]},
  { key: 'creative', label: 'Creative & Design', connectors: [
    'Figma', 'Adobe Illustrator Plugin', 'Adobe InDesign (INDD) Plugin',
    'Adobe InDesign (JSON) Plugin', 'Adobe Photoshop Plugin'
  ]},
  { key: 'dev', label: 'Developer & Files', connectors: [
    'GitHub', 'Repository', 'Google Drive', 'CaptionHub'
  ]},
  { key: 'web', label: 'Web & E-commerce', connectors: [
    'Shopify', 'Webflow', 'Yext', 'Sanity', 'Sanity (Documents)', 'Akeneo'
  ]}
];

let activeMatrixKey = 'cms';

// Normalize a display name to the key the Apps Script proxy produces
function normalizeKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Parse a raw sheet cell value into one of: 'true' | 'false' | 'partial' | 'planned' | ''
function parseMatrixVal(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return '';
  if (['true', 'yes', 'y', '✓', '1', 'x'].includes(v))       return 'true';
  if (['false', 'no', 'n', '-', '0'].includes(v))             return 'false';
  if (['partial', '~', 'p', 'partial support'].includes(v))   return 'partial';
  if (['planned', 'roadmap', 'future'].includes(v))           return 'planned';
  return '';
}

function mapComparisonMatrix(rows) {
  if (!rows || rows.length === 0) return null;

  // Build normalized-key → display-name lookup from all groups
  const normToDisplay = {};
  MATRIX_CONNECTOR_GROUPS.forEach(g => {
    g.connectors.forEach(c => { normToDisplay[normalizeKey(c)] = c; });
  });

  const META = new Set(['feature_id', 'category', 'sub_category', 'feature']);

  return rows.filter(r => r.feature_id && r.feature).map(r => {
    const values = {};
    Object.keys(r).forEach(k => {
      if (!META.has(k) && normToDisplay[k]) {
        values[normToDisplay[k]] = parseMatrixVal(r[k]);
      }
    });
    return {
      id:           r.feature_id,
      category:     r.category     || '',
      sub_category: r.sub_category || '',
      feature:      r.feature      || '',
      values
    };
  });
}

function renderMatrix(key) {
  activeMatrixKey = key;
  const container = document.getElementById('matrix-container');
  const group = MATRIX_CONNECTOR_GROUPS.find(g => g.key === key);
  const features = COMPARISON_MATRIX_DATA;

  if (!group || !features || features.length === 0) {
    container.innerHTML = `<div class="matrix-empty">No data available yet. Fill in the Comparison_matrix sheet to populate this view.</div>`;
    return;
  }

  const connectors = group.connectors;

  // Value cell HTML
  const valCell = (rawVal) => {
    switch (rawVal) {
      case 'true':    return `<td class="matrix-val"><span class="matrix-check" title="Supported">✓</span></td>`;
      case 'partial': return `<td class="matrix-val"><span class="matrix-partial" title="Partial support">~</span></td>`;
      case 'planned': return `<td class="matrix-val"><span class="matrix-planned-badge" title="Planned">Planned</span></td>`;
      case 'false':   return `<td class="matrix-val"><span class="matrix-x" title="Not supported">✕</span></td>`;
      default:        return `<td class="matrix-val"><span class="matrix-unknown" title="No data">—</span></td>`;
    }
  };

  // Group features by category
  const categories = [];
  const seen = new Set();
  features.forEach(f => {
    if (!seen.has(f.category)) { seen.add(f.category); categories.push(f.category); }
  });

  const bodyRows = categories.map(cat => {
    const catFeatures = features.filter(f => f.category === cat);
    const catRow = `
      <tr class="matrix-cat-row">
        <td colspan="${connectors.length + 1}">
          <span class="matrix-cat-label">${escapeHtml(cat)}</span>
        </td>
      </tr>`;
    const featureRows = catFeatures.map(f => `
      <tr class="matrix-feature-row">
        <td class="matrix-feature-col">
          ${f.sub_category ? `<span class="matrix-sub-cat">${escapeHtml(f.sub_category)}</span>` : ''}
          <span class="matrix-feature-name">${escapeHtml(f.feature)}</span>
        </td>
        ${connectors.map(c => valCell(f.values[c] || '')).join('')}
      </tr>`).join('');
    return catRow + featureRows;
  }).join('');

  container.innerHTML = `
    <div class="matrix-wrap">
      <div class="matrix-table-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-feature-th">Feature</th>
              ${connectors.map(c => `<th class="matrix-connector-th"><span class="matrix-connector-name">${escapeHtml(c)}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    </div>`;
}

function initMatrix() {
  const tabsEl = document.getElementById('matrix-tabs');

  tabsEl.innerHTML = `
    <div class="matrix-tabs-inner">
      ${MATRIX_CONNECTOR_GROUPS.map(g => `
        <button class="matrix-tab ${g.key === activeMatrixKey ? 'active' : ''}" data-key="${g.key}">
          ${escapeHtml(g.label)}
        </button>`).join('')}
    </div>
    <div class="matrix-legend">
      <span class="legend-item"><span class="matrix-check">✓</span> Supported</span>
      <span class="legend-item"><span class="matrix-partial">~</span> Partial</span>
      <span class="legend-item"><span class="matrix-planned-badge">Planned</span></span>
      <span class="legend-item"><span class="matrix-x">✕</span> Not supported</span>
      <span class="legend-item"><span class="matrix-unknown">—</span> No data</span>
    </div>`;

  tabsEl.querySelectorAll('.matrix-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabsEl.querySelectorAll('.matrix-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMatrix(tab.dataset.key);
    });
  });

  renderMatrix(activeMatrixKey);
}


// ── Seed Data Loader ──────────────────────────────────────────
// Request Tracker now pulls live from the Connector_Requests sheet.
// Seed data is no longer injected into localStorage.

function loadSeedData() {
  // No-op — kept for call-site compatibility during init.
}

// ── Google Sheets Integration ─────────────────────────────────
// Apps Script web app proxy — runs as ssorenson@smartling.com,
// reads the private sheet, and returns plain JSON.
// Set SHEETS_ENABLED = false to use data.js values only.

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3wqKGIuGMd4pEj-ZOXSz5oj2UWoaUmh-o4hSURg31xQNstwI8iBOznGH_8NK8GwyBLg/exec';
const SHEETS_ENABLED  = true;

async function fetchSheet(sheetName) {
  const url = `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Apps Script returns { rows: [...] } — extract the array
    if (data && Array.isArray(data.rows)) return data.rows;
    // Fallback: handle a direct array response
    if (Array.isArray(data)) return data;
    return null;
  } catch (e) {
    console.warn(`[Hub] Sheet fetch failed for "${sheetName}":`, e.message);
    return null;
  }
}

// ── Sheet → Data Mappers ──────────────────────────────────────

function mapReleases(rows) {
  if (!rows) return null;
  return rows.filter(r => r.id && r.connector).map(r => ({
    id: r.id, connector: r.connector, version: r.version || '',
    date: r.date || '', type: r.type || 'improvement',
    summary: r.summary || '', details: r.details || ''
  }));
}

function mapWipItems(rows) {
  if (!rows) return null;
  const stageMap = {
    'Spec': 'Discovery', 'Discovery': 'Discovery', 'Design': 'Design',
    'Build': 'Build', 'Development': 'Build', 'In Progress': 'Build',
    'Beta': 'QA', 'In QA': 'QA', 'QA': 'QA',
    'Launching': 'Launching', 'Paused': 'Discovery', 'Roadmap': 'Discovery'
  };
  return rows.filter(r => r.id).map(r => ({
    id: r.id,
    connector: r.connector,
    category: r.connector,
    description: r.title + (r.notes ? ` — ${r.notes}` : ''),
    stage: stageMap[r.stage] || 'Discovery',
    eta: r.priority === 'Critical' ? 'Urgent' : '',
    blockers: r.stage === 'Paused' ? `Paused — ${r.notes || ''}` : ''
  }));
}

function mapRoadmap(rows) {
  if (!rows) return null;
  const result = { now: [], next: [], later: [] };
  rows.filter(r => r.id).forEach(r => {
    const bucket = String(r.status || '').trim().toLowerCase();
    const item = {
      connector:   r.connector,
      category:    r.quarter || '',
      description: r.description || r.title || '',
      confidence:  String(r.priority || '').toLowerCase() || (bucket === 'now' ? 'high' : bucket === 'next' ? 'medium' : 'low')
    };
    if      (bucket === 'now')  result.now.push(item);
    else if (bucket === 'next') result.next.push(item);
    else                        result.later.push(item);
  });
  return result;
}

function mapKnownIssues(rows) {
  if (!rows) return null;
  const statusMap  = { 'Investigating': 'investigating', 'In Progress': 'in-progress', 'Resolved': 'resolved', 'In QA': 'in-progress' };
  const severityMap = { 'Critical': 'critical', 'High': 'high', 'Medium': 'medium', 'Low': 'low' };
  return rows.filter(r => r.id).map(r => ({
    id: r.id, connector: r.connector,
    severity: severityMap[r.severity] || (r.severity || '').toLowerCase() || 'medium',
    summary: r.title || '',
    status: statusMap[r.status] || (r.status || '').toLowerCase() || 'investigating',
    dateOpened: r.reported_date || '',
    workaround: r.workaround || ''
  }));
}

function mapCalendarEvents(rows) {
  if (!rows) return null;
  return rows.filter(r => r.id && r.date).map(r => ({
    id: r.id, title: r.title || '', date: r.date,
    connector: r.connector || '',
    type: r.type || 'event', description: r.description || '',
    link: r.link || r.url || '', attendees: r.attendees || ''
  }));
}

function mapTrainingResources(rows) {
  if (!rows) return null;

  // Normalize sheet type values → internal icon keys
  const typeMap = {
    'video': 'recording', 'recording': 'recording', 'webinar recording': 'recording',
    'deck + recording': 'deck', 'deck': 'deck', 'slides': 'deck', 'slide': 'deck',
    'guide': 'guide', 'article': 'guide', 'document': 'guide',
    'battlecard': 'battlecard', 'battle card': 'battlecard',
    'interactive reference': 'matrix', 'matrix': 'matrix', 'reference': 'matrix',
    'walkthrough': 'walkthrough', 'demo': 'walkthrough',
    'quick-ref': 'quick-ref', 'quick ref': 'quick-ref', 'cheat sheet': 'quick-ref'
  };

  // Normalize audience strings → short codes used by CSS + filter
  const audienceMap = {
    'sales': 'sales', 'ae': 'sales', 'account executive': 'sales', 'account executives': 'sales',
    'cs': 'cs', 'customer success': 'cs', 'implementation': 'cs',
    'se': 'se', 'solutions engineer': 'se', 'solutions engineers': 'se',
    'developer': 'se', 'developer customer': 'se',
    'all': 'all', 'all employees': 'all', 'everyone': 'all',
    'marketing': 'all', 'marketing teams': 'all'
  };

  function parseAudience(str) {
    if (!str) return ['all'];
    const lc = str.toLowerCase().trim();
    if (lc.includes('all')) return ['all'];
    return str.split(',')
      .map(a => a.trim())
      .map(a => audienceMap[a.toLowerCase()] || a.toLowerCase())
      .filter(Boolean);
  }

  // Derive connector name from title e.g. "AEM Cloud Connector — Setup" → "AEM Cloud"
  function connectorFromTitle(title) {
    const m = (title || '').match(/^(.+?)\s+Connector\b/i);
    return m ? m[1].trim() : 'General';
  }

  return rows.filter(r => r.id).map(r => {
    const rawType = (r.type || '').toLowerCase().trim();
    return {
      id:          r.id,
      title:       r.title || '',
      type:        typeMap[rawType] || 'guide',
      link:        r.url || '#',
      duration:    r.duration_mins ? parseInt(r.duration_mins) : 0,
      description: r.description || '',
      tags:        r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      audience:    parseAudience(r.audience),
      connector:   connectorFromTitle(r.title)
    };
  });
}

function mapConnectors(rows) {
  if (!rows) return null;
  const statusNorm = { 'stable': 'stable', 'beta': 'beta', 'early access': 'beta',
    'pilot': 'beta', 'deprecated': 'deprecated', 'coming soon': 'coming-soon',
    'coming-soon': 'coming-soon', 'in development': 'coming-soon' };
  return rows.filter(r => r.id && r.name).map(r => {
    const raw = (r.status || '').toLowerCase().trim();
    const status = statusNorm[raw] || 'beta';
    return {
      id: r.id,
      name: r.name,
      category: r.category || 'General',
      description: r.description || '',
      contentTypes: [],
      version: r.version && r.version !== '0' ? r.version : null,
      docsUrl: r.help_url || null,
      status,
      badge: r.status || 'Beta'
    };
  });
}

function mapHealthStatuses(rows) {
  if (!rows) return null;
  const statusNorm = { 'operational': 'operational', 'degraded': 'degraded',
    'maintenance': 'maintenance', 'deprecated': 'deprecated',
    'incident': 'degraded', 'outage': 'degraded' };
  const result = {};
  rows.filter(r => r.connector && r.status).forEach(r => {
    const raw = (r.status || '').toLowerCase().trim();
    // Parse date from Apps Script's Date.toString() format or ISO
    let lastVerified = r.last_checked || '';
    if (lastVerified) {
      const d = new Date(lastVerified);
      if (!isNaN(d)) lastVerified = d.toISOString().split('T')[0];
    }
    result[r.connector] = {
      status: statusNorm[raw] || 'operational',
      lastVerified,
      note: r.notes && r.notes.trim() ? r.notes.trim() : null
    };
  });
  return result;
}

function mapRequests(rows) {
  if (!rows) return null;
  return rows.filter(r => {
    // Accept any row that has a connector name under any likely key
    return rowGet(r, 'connector_integration', 'connector / integration', 'connector') !== '';
  }).map(r => ({
    connector:    rowGet(r, 'connector_integration', 'connector / integration', 'connector'),
    category:     rowGet(r, 'category'),
    status:       rowGet(r, 'status'),
    clients:      rowGet(r, 'requesting_client', 'requesting_clients', 'requesting client'),
    submittedBy:  rowGet(r, 'submitted_by', 'submitted by'),
    urgency:      rowGet(r, 'urgency'),
    funding:      rowGet(r, 'funding_discussion', 'funding'),
    competitors:  rowGet(r, 'competitors_w', 'competitors'),
    notes:        rowGet(r, 'notes_use_case', 'notes / use case', 'notes'),
    sources:      rowGet(r, 'source_s', 'source(s)', 'sources'),
    dateRequested: rowGet(r, 'date_first_requested', 'date first requested', 'date'),
    launchEta:    rowGet(r, 'launch_eta', 'launch eta', 'eta'),
  }));
}

// ── Master Sheet Loader ───────────────────────────────────────

async function loadFromSheets() {
  if (!SHEETS_ENABLED) return;
  console.log('[Hub] Fetching live content from Google Sheets…');

  const [releasesRows, wipRows, roadmapRows, connectorRows, healthRows,
         issuesRows, calendarRows, trainingRows,
         requestRows, matrixRows, researchRows] = await Promise.all([
    fetchSheet('Releases'),
    fetchSheet('WIP'),
    fetchSheet('Roadmap'),
    fetchSheet('Connectors'),
    fetchSheet('Health_Status'),
    fetchSheet('Known_Issues'),
    fetchSheet('Calendar'),
    fetchSheet('Training'),
    fetchSheet('Connector_Requests'),
    fetchSheet('Comparison_matrix'),
    fetchSheet('Research'),
  ]);

  const updates = [
    [mapReleases(releasesRows),           v => { RELEASES               = v; }],
    [mapWipItems(wipRows),                v => { WIP_ITEMS              = v; }],
    [mapRoadmap(roadmapRows),             v => { ROADMAP                = v; }],
    [mapConnectors(connectorRows),        v => { CONNECTORS             = v; }],
    [mapHealthStatuses(healthRows),       v => { HEALTH_STATUSES        = v; }],
    [mapKnownIssues(issuesRows),          v => { KNOWN_ISSUES           = v; }],
    [mapCalendarEvents(calendarRows),     v => { CALENDAR_EVENTS        = v; }],
    [mapTrainingResources(trainingRows),  v => { TRAINING_RESOURCES     = v; }],
    [mapRequests(requestRows),            v => { CONNECTOR_REQUESTS     = v; }],
    [mapComparisonMatrix(matrixRows),     v => { COMPARISON_MATRIX_DATA = v; }],
    [mapResearch(researchRows),           v => { RESEARCH_ITEMS         = v; }],
  ];

  let loaded = 0;
  updates.forEach(([data, setter]) => {
    if (data !== null && data !== undefined) { setter(data); loaded++; }
  });

  console.log(`[Hub] Sheet sync complete — ${loaded}/11 sections loaded live.`);
}

// ── Bootstrap ─────────────────────────────────────────────────

async function init() {
  loadSeedData();

  // Show the correct section immediately (before the async sheet fetch)
  restoreRoute();

  // Fetch live content from Google Sheet (falls back to data.js on error)
  await loadFromSheets();

  // Re-render all sections with live sheet data, then re-apply route
  renderReleases();
  renderWIP();
  renderRoadmap();
  initCatalog();
  renderHealth();
  renderIssues();
  initRequestTracker();
  renderCalendar();
  initTraining();
  initResearch();
  initMatrix();

  // Re-apply route after rendering in case any render reset section state
  restoreRoute();
}

document.addEventListener('DOMContentLoaded', init);
