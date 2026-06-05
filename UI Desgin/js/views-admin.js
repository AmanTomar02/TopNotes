/* ============================================================
   TopNotes — Admin views
   ============================================================ */
window.Views = window.Views || {};

(function (V) {
  const T = window.TN;

  function miniChart(data) {
    const w = 600, h = 240, pad = { t: 16, r: 10, b: 28, l: 44 };
    const max = Math.max(...data) * 1.15;
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const x = i => pad.l + (i / (data.length - 1)) * iw;
    const y = v => pad.t + ih - (v / max) * ih;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(data.length-1).toFixed(1)},${pad.t+ih} L${pad.l},${pad.t+ih} Z`;
    const grid = [0,.25,.5,.75,1].map(f => {
      const gy = pad.t + ih - f*ih;
      return `<line x1="${pad.l}" y1="${gy}" x2="${w-pad.r}" y2="${gy}" stroke="#EAECF0"/><text x="${pad.l-8}" y="${gy+4}" text-anchor="end" font-size="10" fill="#98A2B3">₹${((max*f)/1000).toFixed(0)}k</text>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B4BE0" stop-opacity=".22"/><stop offset="1" stop-color="#5B4BE0" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#ag)"/><path d="${line}" fill="none" stroke="#5B4BE0" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  }
  const REV = [22,28,24,33,40,36,44,41,52,58,49,63,68,64,74].map(v=>v*1000);

  /* ---------------- ADMIN DASHBOARD ---------------- */
  V.admin = function () {
    return `
    <div class="page-head"><div><div class="crumb">Admin</div><h1>Platform overview</h1><p>Monitor users, revenue and pending approvals.</p></div></div>
    <div class="stat-grid" style="grid-template-columns:repeat(5,1fr);">
      ${stat('Total users','12,480',icUsers)}
      ${stat('Sellers','2,412',icShield)}
      ${stat('Notes','8,930',icDoc)}
      ${stat('Revenue','₹14.2L',icMoney)}
      <a href="#/admin/verifications" class="stat-card" style="background:var(--indigo-800);border-color:var(--indigo-800);color:#fff;text-decoration:none;cursor:pointer;display:block;">
        <div class="s-top"><span class="s-label" style="color:rgba(255,255,255,.8);">Pending approvals</span><span class="s-ic" style="background:rgba(255,255,255,.15);color:#fff;">${icBell(20)}</span></div>
        <div class="s-value" style="color:#fff;">5</div>
        <div class="s-delta" style="color:#fff;">Review now →</div>
      </a>
    </div>

    <div class="dash-grid">
      <div class="card chart-card">
        <div class="chart-head"><h3>Platform revenue · last 30 days</h3><span class="badge badge-success">+22% MoM</span></div>
        ${miniChart(REV)}
      </div>
      <div class="card card-pad">
        <div class="chart-head"><h3>Pending approvals</h3><a class="link" href="#/admin/verifications">View all</a></div>
        ${T.PENDING_VERIF.slice(0,3).map(p => `
          <div class="sale-row">
            <span class="avatar avatar-sm">${p.initials}</span>
            <div class="sr-body"><div class="sr-note">${p.name}</div><div class="sr-meta">${p.inst} · ${p.score}% test</div></div>
            <a class="btn btn-secondary btn-sm" href="#/admin/verifications">Review</a>
          </div>`).join('')}
      </div>
    </div>

    <div class="card card-pad" style="margin-top:20px;">
      <div class="chart-head"><h3>Recent activity</h3></div>
      <div class="activity-feed">
        ${[
          {ic:icUserPlus,t:'<b>Ishaan Gupta</b> registered as a buyer',time:'2 minutes ago'},
          {ic:icShield,t:'<b>Nisha Verma</b> submitted seller verification',time:'18 minutes ago'},
          {ic:icDoc,t:'<b>Rohan Mehta</b> published a new note in Physics',time:'1 hour ago'},
          {ic:icMoney,t:'Payout of <b>₹42,800</b> processed to 38 sellers',time:'3 hours ago'},
          {ic:icBell,t:'<b>Dev Patel</b> was suspended for a policy violation',time:'Yesterday'},
        ].map(a => `<div class="act-row"><span class="ar-dot">${a.ic(16)}</span><div class="ar-body">${a.t}<time>${a.time}</time></div></div>`).join('')}
      </div>
    </div>`;
  };

  /* ---------------- ADMIN USERS ---------------- */
  V.adminUsers = function () {
    const roleBadge = r => r === 'Seller' ? 'badge-amber' : 'badge-indigo';
    const statusBadge = s => s === 'Active' ? 'badge-success' : 'badge-danger';
    const rows = T.USERS.map(u => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:12px;"><span class="avatar avatar-sm">${u.initials}</span><div><div style="font-weight:700;">${u.name}</div><div class="muted" style="font-size:13px;">${u.email}</div></div></div></td>
        <td><span class="badge ${roleBadge(u.role)}">${u.role}</span></td>
        <td><span class="badge ${statusBadge(u.status)}"><span class="dot"></span>${u.status}</span></td>
        <td class="hide-mobile">${u.joined}</td>
        <td><div class="tbl-actions">
          ${u.status==='Active' ? '<button class="btn btn-ghost btn-sm" style="color:var(--danger);">Suspend</button>' : '<button class="btn btn-ghost btn-sm" style="color:var(--success);">Activate</button>'}
          <button class="btn btn-secondary btn-sm">View</button>
        </div></td>
      </tr>`).join('');
    return `
    <div class="page-head"><div><div class="crumb">Admin</div><h1>Users</h1><p>${T.USERS.length} accounts</p></div></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;">
      <div class="tabs" style="border:none;">
        <button class="tab" aria-selected="true">All</button>
        <button class="tab" aria-selected="false">Buyers</button>
        <button class="tab" aria-selected="false">Sellers</button>
      </div>
      <div class="search" style="width:260px;"><span class="s-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7"/><path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><input class="input" placeholder="Search by name or email" /></div>
    </div>
    <div class="table-wrap responsive">
      <table class="tn"><thead><tr><th>User</th><th>Role</th><th>Status</th><th class="hide-mobile">Joined</th><th style="text-align:right;">Actions</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap;gap:10px;">
      <span class="muted" style="font-size:14px;">Showing 1–${T.USERS.length} of 12,480</span>
      <div class="pager"><button disabled>‹</button><button aria-current="true">1</button><button>2</button><button>3</button><button>…</button><button>312</button><button>›</button></div>
    </div>`;
  };

  /* ---------------- ADMIN VERIFICATIONS ---------------- */
  V.adminVerifications = function () {
    if (window.__noVerif) {
      return `<div class="page-head"><div><div class="crumb">Admin</div><h1>Verifications</h1></div></div>
      <div class="card empty"><div class="e-ic" style="background:var(--success-bg);color:var(--success);"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h3>No pending verifications 🎉</h3><p>You're all caught up. New seller submissions will appear here.</p></div>`;
    }
    const cards = T.PENDING_VERIF.map((p, i) => `
      <div class="card verif-review">
        <div class="vr-top">
          <span class="avatar avatar-lg">${p.initials}</span>
          <div style="flex:1;"><h4 style="font-size:var(--t-16);">${p.name}</h4><div class="muted" style="font-size:13px;">${p.inst}</div><div style="margin-top:6px;"><span class="badge badge-amber">★ ${p.exam}</span></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <span class="badge badge-success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Test passed · ${p.score}%</span>
          <span class="muted" style="font-size:12px;margin-left:auto;">${p.date}</span>
        </div>
        <div class="marksheet-thumb" onclick="TNApp.openImg()"><span class="muted" style="font-size:12px;">Marksheet</span><span class="ms-zoom">⤢ Enlarge</span></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-danger btn-block" onclick="TNApp.openReject('${p.name}')">Reject</button>
          <button class="btn btn-primary btn-block" style="background:var(--success);" onclick="TNApp.toast('${p.name} approved','success')">Approve</button>
        </div>
      </div>`).join('');
    return `
    <div class="page-head"><div><div class="crumb">Admin</div><h1>Verifications</h1><p>${T.PENDING_VERIF.length} sellers awaiting review.</p></div></div>
    <div class="verif-cards">${cards}</div>`;
  };

  /* ---------------- ADMIN TEST MANAGER ---------------- */
  V.adminTest = function () {
    const tab = window.__testTab || 'config';
    const tabs = `<div class="tabs" style="margin-bottom:24px;">
      <button class="tab" aria-selected="${tab==='config'}" onclick="window.__testTab='config';TNApp.render()">Test Config</button>
      <button class="tab" aria-selected="${tab==='questions'}" onclick="window.__testTab='questions';TNApp.render()">Questions</button>
      <button class="tab" aria-selected="${tab==='preview'}" onclick="window.__testTab='preview';TNApp.render()">Seller Preview</button>
    </div>`;

    let body = '';
    if (tab === 'config') {
      body = `<div class="card card-pad" style="max-width:620px;">
        <div class="config-row"><div><div class="cr-label">Pass score</div><div class="cr-help">Minimum percentage a seller must score to pass.</div></div><div class="cr-control"><div style="display:flex;align-items:center;gap:8px;"><input class="input" type="number" value="70" style="width:90px;" /><span class="slate">%</span></div></div></div>
        <div class="config-row"><div><div class="cr-label">Time limit</div><div class="cr-help">Total time allowed to complete the test.</div></div><div class="cr-control"><div style="display:flex;align-items:center;gap:8px;"><input class="input" type="number" value="15" style="width:90px;" /><span class="slate">min</span></div></div></div>
        <div class="config-row"><div><div class="cr-label">Questions per test</div><div class="cr-help">Randomly drawn from the active question pool.</div></div><div class="cr-control"><input class="input" type="number" value="10" style="width:90px;" /></div></div>
        <div class="config-row"><div><div class="cr-label">Shuffle questions</div><div class="cr-help">Randomise question order for each attempt.</div></div><div class="cr-control" style="min-width:auto;">${toggle(true,'shufQ')}</div></div>
        <div class="config-row"><div><div class="cr-label">Shuffle options</div><div class="cr-help">Randomise A–D answer order.</div></div><div class="cr-control" style="min-width:auto;">${toggle(true,'shufO')}</div></div>
        <div style="margin-top:20px;"><button class="btn btn-primary" onclick="TNApp.toast('Test config saved','success')">Save changes</button></div>
      </div>`;
    } else if (tab === 'questions') {
      const rows = T.TEST_QUESTIONS.map((q, i) => `
        <div class="card card-pad" style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">
          <span class="opt-key" style="margin-top:2px;">${i+1}</span>
          <div style="flex:1;">
            <div style="font-weight:600;">${q.q}</div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center;"><span class="badge badge-indigo">${q.subject}</span><span class="muted" style="font-size:12px;">Correct: ${'ABCD'[q.correct]}</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            ${toggle(q.active,'q'+i)}
            <button class="btn btn-ghost btn-sm btn-icon" aria-label="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></button>
            <button class="btn btn-ghost btn-sm btn-icon" aria-label="Delete" style="color:var(--danger);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
        </div>`).join('');
      body = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span class="muted" style="font-size:14px;">${T.TEST_QUESTIONS.length} questions · ${T.TEST_QUESTIONS.filter(q=>q.active).length} active</span>
          <button class="btn btn-primary" onclick="TNApp.openAddQ()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Add question</button>
        </div>${rows}`;
    } else {
      const q = T.TEST_QUESTIONS[0];
      body = `<div class="card card-pad" style="max-width:620px;">
        <div class="badge badge-warning" style="margin-bottom:16px;">Seller view · correct answers hidden</div>
        <div class="test-q" style="padding:0;border:none;box-shadow:none;">
          <div class="tq-num">QUESTION 1 · ${q.subject}</div>
          <div class="tq-text">${q.q}</div>
          ${q.opts.map((o,i)=>`<label class="opt-row"><input type="radio" name="pv" /><span class="opt-key">${'ABCD'[i]}</span><span>${o}</span></label>`).join('')}
        </div>
      </div>`;
    }
    return `<div class="page-head"><div><div class="crumb">Admin</div><h1>Test manager</h1><p>Configure the seller qualification test.</p></div></div>${tabs}${body}`;
  };

  /* ---------------- ADMIN CONFIG ---------------- */
  V.adminConfig = function () {
    return `
    <div class="page-head"><div><div class="crumb">Admin</div><h1>Platform config</h1><p>Global settings for the marketplace.</p></div></div>
    <div style="max-width:680px;">
      <div class="card card-pad" style="margin-bottom:20px;">
        <h3 style="font-size:var(--t-16);">Revenue split</h3>
        <p class="cr-help" style="margin-top:4px;">How sale revenue is divided between the platform and the seller. Always sums to 100%.</p>
        <div class="split-bar"><div class="sb-platform" id="sbPlatform" style="width:15%;">15%</div><div class="sb-seller" id="sbSeller" style="width:85%;">85%</div></div>
        <div style="display:flex;align-items:center;gap:14px;">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;"><span style="width:12px;height:12px;border-radius:3px;background:var(--indigo-700);"></span>Platform</span>
          <input type="range" id="splitRange" min="5" max="40" value="15" step="1" style="flex:1;accent-color:var(--indigo-700);" oninput="TNApp.updateSplit(this.value)" />
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;"><span style="width:12px;height:12px;border-radius:3px;background:var(--amber);"></span>Seller</span>
        </div>
        <div style="margin-top:18px;"><button class="btn btn-primary" onclick="TNApp.toast('Revenue split updated','success')">Save split</button></div>
      </div>

      <div class="card card-pad">
        <div class="config-row"><div><div class="cr-label">Currency</div><div class="cr-help">Display and payout currency.</div></div><div class="cr-control"><select class="select"><option>₹ INR — Indian Rupee</option><option>$ USD — US Dollar</option></select></div></div>
        <div class="config-row"><div><div class="cr-label">Test pass score</div><div class="cr-help">Minimum score sellers need on the academic test.</div></div><div class="cr-control"><div style="display:flex;align-items:center;gap:8px;"><input class="input" type="number" value="70" style="width:90px;" /><span class="slate">%</span></div></div></div>
        <div class="config-row"><div><div class="cr-label">Min note price</div><div class="cr-help">Lowest price a seller can set for a note.</div></div><div class="cr-control"><div style="display:flex;align-items:center;gap:8px;"><span class="slate">₹</span><input class="input" type="number" value="49" style="width:90px;" /></div></div></div>
        <div style="margin-top:18px;"><button class="btn btn-primary" onclick="TNApp.toast('Settings saved','success')">Save changes</button></div>
      </div>
    </div>`;
  };

  // helpers
  function toggle(on, id) {
    return `<button class="tn-toggle" role="switch" aria-checked="${on}" onclick="this.setAttribute('aria-checked', this.getAttribute('aria-checked')==='true'?'false':'true')"><span class="kn"></span></button>`;
  }
  function stat(label, value, ic) {
    return `<div class="stat-card"><div class="s-top"><span class="s-label">${label}</span><span class="s-ic">${ic(20)}</span></div><div class="s-value">${value}</div></div>`;
  }
  function icUsers(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 7.5a3 3 0 0 1 0 6m4.5 5.5a4.7 4.7 0 0 0-3.2-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icShield(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
  function icDoc(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M7 3h8l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;}
  function icMoney(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4s-5 .9-5 3 2.5 2.8 5 3.2 5 1.1 5 3.3-2.2 3-5 3-5-.8-5-2.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icBell(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icUserPlus(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M18 7v6m3-3h-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}

})(window.Views);
