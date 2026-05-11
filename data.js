// ============================================================
// SMARTLING INTEGRATIONS HUB — DATA FILE
// ============================================================
// All site content lives here. Edit these arrays and objects
// to update the site. No layout or logic files need changing
// for routine content updates.
// ============================================================

// ─────────────────────────────────────────────────────────────
// SECTION 1: WHAT'S NEW — Release Updates
// UPDATE: Add new releases here, newest first.
// ─────────────────────────────────────────────────────────────
let RELEASES = []

// ─────────────────────────────────────────────────────────────
// SECTION 2: WORK IN PROGRESS
// UPDATE: Update connector stages and ETAs here.
// Stages: Discovery | Design | Build | QA | Launching
// ─────────────────────────────────────────────────────────────
let WIP_ITEMS = []

// ─────────────────────────────────────────────────────────────
// SECTION 3: ROADMAP
// UPDATE: Move items between horizons as priorities shift.
// Horizons: now (active this quarter), next (next quarter),
//           later (backlog / under evaluation)
// ─────────────────────────────────────────────────────────────
let ROADMAP = { now: [], next: [], later: [] };

// ─────────────────────────────────────────────────────────────
// SECTION 4: CONNECTOR CATALOG
// UPDATE: Add new connectors here. Keep sorted by category.
// Status values: stable | beta | deprecated | coming-soon
// ─────────────────────────────────────────────────────────────
let CONNECTORS = []

// ─────────────────────────────────────────────────────────────
// SECTION 5: CONNECTOR HEALTH & STATUS
// UPDATE: Update status and lastVerified dates regularly.
// Status values: operational | degraded | maintenance | deprecated
// ─────────────────────────────────────────────────────────────
let HEALTH_STATUSES = {};

// ─────────────────────────────────────────────────────────────
// SECTION 6: KNOWN ISSUES & ACTIVE INCIDENTS
// UPDATE: Add new issues here. Move to status: 'resolved' when fixed.
// Severity: critical | high | medium | low
// Status: investigating | in-progress | resolved
// ─────────────────────────────────────────────────────────────
let KNOWN_ISSUES = []

// ─────────────────────────────────────────────────────────────
// SECTION 8: RELEASE & TRAINING CALENDAR
// UPDATE: Add upcoming releases, training sessions, and events here.
// Types: release | training | webinar | office-hours | milestone
// ─────────────────────────────────────────────────────────────
let CALENDAR_EVENTS = []

// ─────────────────────────────────────────────────────────────
// SECTION 9: TRAINING RESOURCES & ENABLEMENT HUB
// UPDATE: Add new resources here.
// Audiences: sales | cs | se | all
// Types: recording | deck | guide | battlecard | matrix | walkthrough | quick-ref
// ─────────────────────────────────────────────────────────────
let TRAINING_RESOURCES = []

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SECTION 10: CONNECTOR COMPARISON MATRIX
// Populated live from the Comparison_matrix Google Sheet.
// Values come from the sheet: true/yes/✓, false/no/-, partial/~, planned
// ─────────────────────────────────────────────────────────────
let COMPARISON_MATRIX_DATA = [];

// ─────────────────────────────────────────────────────────────
// SECTION 11: RESEARCH
// Populated live from the Research Google Sheet tab.
// Fields: id, title, type (doc|slides|pdf), date, status
//         (draft|published|archived), author, summary, link, tags
// ─────────────────────────────────────────────────────────────
let RESEARCH_ITEMS = [];

// ─────────────────────────────────────────────────────────────
// SECTION 12: PARTNERSHIPS & ECOSYSTEM
// Populated live from the Partners Google Sheet tab.
// Fields: id, partner_name, partner_type, tier, status,
//         description, connector_status, website_url,
//         contact_name, contact_email, notes
// ─────────────────────────────────────────────────────────────
let PARTNERSHIPS = [];

// ─────────────────────────────────────────────────────────────
// SECTION 13: DEV ZONE
// Populated live from the Dev_Zone Google Sheet tab.
// Fields: id, title, category, type, summary, link,
//         tags, author, last_updated
// ─────────────────────────────────────────────────────────────
let DEV_ZONE_ITEMS = [];


