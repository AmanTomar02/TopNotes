/* ============================================================
   TopNotes — Seller views
   ============================================================ */
window.Views = window.Views || {};

(function (V) {
  const T = window.TN;

  // simple area+line chart
  function areaChart(data, opts) {
    opts = opts || {};
    const w = 600, h = 240, pad = { t: 16, r: 10, b: 28, l: 40 };
    const max = Math.max(...data) * 1.15, min = 0;
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const x = i => pad.l + (i / (data.length - 1)) * iw;
    const y = v => pad.t + ih - ((v - min) / (max - min)) * ih;
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(data.length - 1).toFixed(1)},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;
    const grid = [0, .25, .5, .75, 1].map(f => {
      const gy = pad.t + ih - f * ih;
      const val = Math.round((min + f * (max - min)));
      return `<line x1="${pad.l}" y1="${gy}" x2="${w - pad.r}" y2="${gy}" stroke="#EAECF0" stroke-width="1"/>
        <text x="${pad.l - 8}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#98A2B3">${opts.fmt ? opts.fmt(val) : val}</text>`;
    }).join('');
    const labels = (opts.labels || []).map((l, i) => {
      const idx = Math.round(i * (data.length - 1) / (opts.labels.length - 1));
      return `<text x="${x(idx)}" y="${h - 8}" text-anchor="middle" font-size="10" fill="#98A2B3">${l}</text>`;
    }).join('');
    const dot = `<circle cx="${x(data.length - 1)}" cy="${y(data[data.length - 1])}" r="4" fill="#5B4BE0" stroke="#fff" stroke-width="2"/>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Revenue chart">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B4BE0" stop-opacity=".22"/><stop offset="1" stop-color="#5B4BE0" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#cg)"/><path d="${line}" fill="none" stroke="#5B4BE0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dot}${labels}
    </svg>`;
  }

  const REV = [820, 940, 760, 1120, 1340, 1180, 1460, 1280, 1620, 1740, 1520, 1880, 2040, 1960, 2280];

  /* ---------------- SELLER DASHBOARD ---------------- */
  V.seller = function () {
    if (window.__newSeller) {
      return `
      <div class="page-head"><div><div class="crumb">Seller</div><h1>Welcome, Priya 👋</h1></div></div>
      <div class="card empty">
        <div class="e-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>
        <h3>No sales yet</h3>
        <p>Upload your first set of notes to start earning. Verified toppers earn on every download.</p>
        <a class="btn btn-primary" href="#/upload">Upload your first note</a>
      </div>`;
    }
    const sales = T.SALES.map(s => `
      <div class="sale-row">
        <span class="avatar avatar-sm">${s.initials}</span>
        <div class="sr-body"><div class="sr-note">${s.note}</div><div class="sr-meta">${s.buyer} · ${s.date}</div></div>
        <span class="sr-amt">+${T.inr(s.amount)}</span>
      </div>`).join('');

    return `
    <div class="page-head">
      <div><div class="crumb">Seller</div><h1>Welcome back, Priya</h1><p>Here's how your notes are performing.</p></div>
      <div class="head-actions"><a class="btn btn-primary" href="#/upload"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Upload new note</a></div>
    </div>

    <div class="stat-grid">
      ${statCard('Total earnings', T.inr(48720), 'up', '+12.4%', icMoney)}
      ${statCard('This month', T.inr(8240), 'up', '+18.2%', icCal)}
      ${statCard('Notes sold', '344', 'up', '+24', icCart)}
      ${statCard('Avg. rating', '4.86', 'up', '+0.1', icStar)}
    </div>

    <div class="dash-grid">
      <div class="card chart-card">
        <div class="chart-head"><h3>Revenue · last 30 days</h3><span class="badge badge-success">+18% vs last month</span></div>
        ${areaChart(REV, { fmt: v => '₹' + (v/1000).toFixed(1) + 'k', labels: ['May 4','May 12','May 20','May 28','Jun 3'] })}
      </div>
      <div>
        <div class="card card-pad" style="margin-bottom:16px;">
          <div class="verif-card" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:var(--r-ctrl);background:var(--success-bg);border:1px solid var(--success-line);">
            <span style="color:var(--success);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <div style="line-height:1.3;"><b style="font-size:13px;color:#067647;">Verified Seller</b><br><small style="font-size:12px;color:var(--slate);">AIR 312 · NEET 2024</small></div>
          </div>
          <a class="quick-action" href="#/upload" style="margin-top:14px;"><span class="qa-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span><b>Upload new note</b><small>Add to your catalogue</small></span></a>
          <a class="quick-action" href="#/earnings"><span class="qa-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19V5m0 14h16M8 15l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span><b>View payouts</b><small>Next payout: 7 Jun</small></span></a>
        </div>
      </div>
    </div>

    <div class="card card-pad" style="margin-top:20px;">
      <div class="chart-head"><h3>Recent sales</h3><a class="link" href="#/earnings">View all</a></div>
      <div class="sales-list">${sales}</div>
    </div>`;
  };

  /* ---------------- UPLOAD ---------------- */
  V.upload = function () {
    return `
    <div class="page-head"><div><div class="crumb">Seller</div><h1>Upload a note</h1><p>Add a new set of notes to the marketplace.</p></div></div>

    <div class="upload-grid">
      <div>
        <div class="card form-section">
          <h3><span class="sec-num">1</span> Details</h3>
          <p class="sec-desc">Tell buyers what's inside.</p>
          <div class="field"><label class="label">Title</label><input class="input" id="uTitle" placeholder="e.g. Organic Chemistry — Reaction Mechanisms" value="" /><div class="field-err">Add a title.</div></div>
          <div class="field"><label class="label">Description</label><textarea class="textarea" id="uDesc" placeholder="What topics are covered? What makes these notes useful?"></textarea></div>
          <div class="grid-2">
            <div class="field"><label class="label">Class</label><select class="select"><option>Class 11</option><option>Class 12</option></select></div>
            <div class="field"><label class="label">Subject</label><select class="select" id="uSubject"><option>Chemistry</option><option>Physics</option><option>Maths</option><option>Biology</option></select></div>
          </div>
          <div class="grid-2">
            <div class="field"><label class="label">Exam type</label><select class="select" id="uExam"><option>NEET</option><option>JEE</option><option>Boards</option></select></div>
            <div class="field"><label class="label">Price (₹)</label><input class="input" id="uPrice" type="number" placeholder="199" value="" /><div class="field-err">Set a price.</div></div>
          </div>
        </div>

        <div class="card form-section">
          <h3><span class="sec-num">2</span> Files</h3>
          <p class="sec-desc">Upload the notes PDF and an optional cover.</p>
          <div class="dropzone" id="dropzone">
            <div class="dz-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15V4m0 0L8 8m4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>
            <h4>Drag &amp; drop your PDF here</h4>
            <p>or click to browse · PDF only · max 50MB</p>
          </div>
          <div class="upload-file" id="uploadFile" style="display:none;">
            <span class="uf-ic">PDF</span>
            <div class="uf-body">
              <div style="display:flex;justify-content:space-between;"><span class="uf-name">organic-chemistry-notes.pdf</span><span class="uf-pct" id="ufPct">0%</span></div>
              <div class="uf-bar"><i id="ufBar" style="width:0%"></i></div>
            </div>
          </div>
          <div class="field" style="margin-top:18px;"><label class="label">Cover thumbnail <span class="opt">(optional)</span></label>
            <div class="dropzone" style="padding:20px;"><p style="margin:0;">Drop an image or click to upload</p></div>
          </div>
        </div>

        <div class="card form-section">
          <h3><span class="sec-num">3</span> Review &amp; publish</h3>
          <p class="sec-desc">Check the preview, then publish to the marketplace.</p>
          <button class="btn btn-primary btn-lg" id="publishBtn"><span class="btn-spin"></span><span class="bl">Publish note</span></button>
        </div>
      </div>

      <div class="preview-pane">
        <div class="pp-label">Live preview · how it appears in Browse</div>
        <div id="livePreview">${T.noteCard({ id:'preview', title:'Your note title', subject:'Chemistry', exam:'NEET', cls:'Class 12', price:199, pages:0, rating:0, reviews:0, seller:{ name:'Priya Nair', initials:'PN', inst:'', air:'' } }).replace('href="#/note/preview"','href="javascript:void(0)" onclick="return false"')}</div>
      </div>
    </div>`;
  };

  /* ---------------- MY NOTES ---------------- */
  V.myNotes = function () {
    const badge = s => s === 'Active' ? 'badge-success' : s === 'Draft' ? 'badge-warning' : 'badge-muted';
    const rows = T.SELLER_NOTES.map(n => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:50px;border-radius:6px;overflow:hidden;flex:none;">${T.thumb(n,50).replace('border-radius: var(--r-card) var(--r-card) 0 0','border-radius:6px')}</div>
            <div style="font-weight:700;">${n.title}</div>
          </div>
        </td>
        <td><span class="badge ${badge(n.status)}">${n.status}</span></td>
        <td class="hide-mobile">
          <div class="price-edit"><span>₹</span><input type="number" value="${n.price}" aria-label="Price" /></div>
        </td>
        <td class="hide-mobile">${n.sales}</td>
        <td class="hide-mobile">${n.rating ? '★ ' + n.rating : '—'}</td>
        <td>
          <div class="tbl-actions">
            <button class="btn btn-ghost btn-sm">Edit</button>
            ${n.status === 'Active' ? '<button class="btn btn-ghost btn-sm">Unpublish</button>' : n.status === 'Draft' ? '<button class="btn btn-secondary btn-sm">Publish</button>' : '<span class="muted" style="font-size:13px;">Removed</span>'}
          </div>
        </td>
      </tr>`).join('');
    return `
    <div class="page-head">
      <div><div class="crumb">Seller</div><h1>My notes</h1><p>Manage your catalogue, pricing and visibility.</p></div>
      <div class="head-actions">
        <select class="select" style="width:auto;height:40px;"><option>All statuses</option><option>Active</option><option>Draft</option><option>Deleted</option></select>
        <a class="btn btn-primary" href="#/upload"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Upload new</a>
      </div>
    </div>
    <div class="table-wrap responsive">
      <table class="tn">
        <thead><tr><th>Note</th><th>Status</th><th class="hide-mobile">Price</th><th class="hide-mobile">Sales</th><th class="hide-mobile">Rating</th><th style="text-align:right;">Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  };

  /* ---------------- EARNINGS ---------------- */
  V.earnings = function () {
    const sales = T.SALES.concat(T.SALES).map(s => `
      <tr><td><div style="display:flex;align-items:center;gap:10px;"><span class="avatar avatar-sm">${s.initials}</span><span>${s.buyer}</span></div></td>
      <td class="hide-mobile">${s.note}</td><td class="hide-mobile">${s.date}</td><td style="font-weight:700;color:var(--success);">+${T.inr(s.amount)}</td></tr>`).join('');
    return `
    <div class="page-head"><div><div class="crumb">Seller</div><h1>Earnings</h1><p>Track revenue and upcoming payouts.</p></div>
      <div class="head-actions"><button class="btn btn-secondary">Download statement</button></div></div>
    <div class="stat-grid">
      ${statCard('Available balance', T.inr(8240), 'up', 'Payout 7 Jun', icMoney)}
      ${statCard('Total earnings', T.inr(48720), 'up', 'All time', icWallet)}
      ${statCard('This month', T.inr(8240), 'up', '+18.2%', icCal)}
      ${statCard('Platform fee', '15%', null, 'Seller keeps 85%', icPct)}
    </div>
    <div class="card chart-card" style="margin-top:20px;">
      <div class="chart-head"><h3>Revenue · last 30 days</h3></div>
      ${areaChart(REV, { fmt: v => '₹' + (v/1000).toFixed(1) + 'k', labels: ['May 4','May 12','May 20','May 28','Jun 3'] })}
    </div>
    <div class="card card-pad" style="margin-top:20px;">
      <div class="chart-head"><h3>Transactions</h3></div>
      <div class="table-wrap responsive" style="border:none;">
        <table class="tn"><thead><tr><th>Buyer</th><th class="hide-mobile">Note</th><th class="hide-mobile">Date</th><th>Amount</th></tr></thead><tbody>${sales}</tbody></table>
      </div>
    </div>`;
  };

  /* ---------------- VERIFICATION ---------------- */
  V.verification = function () {
    const stage = window.__verifStage || 'intro'; // intro|test|pass|fail|upload|pending|approved|rejected
    const top = (s1, s2) => `
      <div class="stepper-top">
        <div class="step-node ${s1}"><span class="sn-dot">${s1==='done'?'✓':'1'}</span><span class="sn-label">Academic test</span></div>
        <div class="step-line ${s1==='done'?'done':''}"></div>
        <div class="step-node ${s2}"><span class="sn-dot">2</span><span class="sn-label">Marksheet</span></div>
      </div>`;

    if (stage === 'test') return verifTest(top);
    if (stage === 'pass') return verifResult(top, true);
    if (stage === 'fail') return verifResult(top, false);
    if (stage === 'upload') return verifUpload(top);
    if (stage === 'pending') return verifStatus(top, 'pending');
    if (stage === 'approved') return verifStatus(top, 'approved');
    if (stage === 'rejected') return verifStatus(top, 'rejected');

    // intro
    return `
    <div class="page-head" style="justify-content:center;text-align:center;"><div><div class="crumb">Seller onboarding</div><h1>Become a verified seller</h1></div></div>
    ${top('active','')}
    <div class="card card-pad" style="max-width:560px;margin:0 auto;">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
        <span style="width:48px;height:48px;border-radius:12px;background:var(--indigo-50);color:var(--indigo-700);display:grid;place-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 8h5M8 12h8M8 16h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span>
        <div><h3 style="font-size:var(--t-20);">Step 1 — Academic test</h3><p class="muted" style="font-size:14px;margin:2px 0 0;">Prove your subject mastery to sell on TopNotes.</p></div>
      </div>
      <ul class="pc-includes" style="margin:0 0 20px;">
        <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--indigo-600)" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="var(--indigo-600)" stroke-width="1.6" stroke-linecap="round"/></svg> 10 questions · 15 minute time limit</li>
        <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Pass mark: 70% or higher</li>
        <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="var(--slate)" stroke-width="1.7" stroke-linecap="round"/></svg> Multiple choice (A–D), one attempt per day</li>
      </ul>
      <button class="btn btn-primary btn-lg btn-block" onclick="window.__verifStage='test';location.hash='#/verification';TNApp.render()">Start test</button>
    </div>`;
  };

  function verifTest(top) {
    const q = T.TEST_QUESTIONS[0];
    return `
    <div class="page-head" style="justify-content:center;text-align:center;"><div><h1>Academic test</h1></div></div>
    ${top('active','')}
    <div style="max-width:620px;margin:0 auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span class="muted" style="font-size:14px;font-weight:600;">Question 1 of 10</span>
        <span class="timer"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg> 14:32</span>
      </div>
      <div class="progress" style="margin-bottom:18px;"><i style="width:10%"></i></div>
      <div class="card test-q">
        <div class="tq-num">QUESTION 1 · ${q.subject}</div>
        <div class="tq-text">${q.q}</div>
        ${q.opts.map((o, i) => `<label class="opt-row"><input type="radio" name="q1" /><span class="opt-key">${'ABCD'[i]}</span><span>${o}</span></label>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:18px;">
        <button class="btn btn-secondary" disabled>Previous</button>
        <button class="btn btn-primary" onclick="window.__verifStage='pass';TNApp.render()">Next question</button>
      </div>
    </div>`;
  }

  function verifResult(top, pass) {
    return `
    ${top('active','')}
    <div class="card result-hero" style="max-width:520px;margin:0 auto;">
      <div class="rh-ic ${pass?'pass':'fail'}">${pass
        ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'}</div>
      <h2 style="font-size:var(--t-24);">${pass ? 'You passed!' : 'Not quite there'}</h2>
      <div class="rh-score" style="color:${pass?'var(--success)':'var(--danger)'}">${pass ? '90%' : '60%'}</div>
      <p class="muted" style="max-width:360px;margin:8px auto 22px;">${pass ? 'Great work — you scored above the 70% pass mark. Continue to upload your marksheet.' : 'You scored below the 70% pass mark. You can retake the test after 24 hours.'}</p>
      ${pass
        ? '<button class="btn btn-primary btn-lg" onclick="window.__verifStage=\'upload\';TNApp.render()">Continue to Step 2</button>'
        : '<button class="btn btn-secondary btn-lg" onclick="window.__verifStage=\'intro\';TNApp.render()">Retake test</button>'}
    </div>`;
  }

  function verifUpload(top) {
    return `
    <div class="page-head" style="justify-content:center;text-align:center;"><div><h1>Upload your marksheet</h1></div></div>
    ${top('done','active')}
    <div class="card card-pad" style="max-width:560px;margin:0 auto;">
      <p class="muted" style="font-size:14px;margin:0 0 18px;">Upload a clear photo of your exam result / rank card. Our team verifies it within 24–48 hours.</p>
      <div class="dropzone" id="msDrop">
        <div class="dz-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="1.7"/><path d="m4 19 5-4 4 3 3-2 4 3" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div>
        <h4>Drop your marksheet image</h4><p>JPG or PNG · max 10MB</p>
      </div>
      <button class="btn btn-primary btn-lg btn-block" style="margin-top:18px;" onclick="window.__verifStage='pending';TNApp.render()">Submit for review</button>
    </div>`;
  }

  function verifStatus(top, kind) {
    const cfg = {
      pending:  { cls:'badge-warning', ic:icClock, color:'var(--warning)', bg:'var(--warning-bg)', t:'Awaiting admin approval', d:'Your test passed and your marksheet is under review. We\'ll notify you within 24–48 hours.' },
      approved: { cls:'badge-success', ic:icShield, color:'var(--success)', bg:'var(--success-bg)', t:'You\'re a verified seller!', d:'Your account is approved. You can now upload and sell notes on TopNotes.' },
      rejected: { cls:'badge-danger', ic:icX, color:'var(--danger)', bg:'var(--danger-bg)', t:'Verification rejected', d:'We couldn\'t verify your marksheet — the image was unclear. Please re-upload a legible copy.' },
    }[kind];
    return `
    ${top('done','active')}
    <div class="card result-hero" style="max-width:520px;margin:0 auto;">
      <div class="rh-ic" style="background:${cfg.bg};color:${cfg.color};">${cfg.ic(34)}</div>
      <h2 style="font-size:var(--t-24);">${cfg.t}</h2>
      <p class="muted" style="max-width:380px;margin:10px auto 0;">${cfg.d}</p>
      ${kind==='rejected' ? '<button class="btn btn-primary btn-lg" style="margin-top:22px;" onclick="window.__verifStage=\'upload\';TNApp.render()">Re-upload marksheet</button>' : ''}
      ${kind==='approved' ? '<a class="btn btn-primary btn-lg" style="margin-top:22px;" href="#/upload">Upload your first note</a>' : ''}
      ${kind==='pending' ? '<div class="timer" style="margin-top:22px;">Submitted 2 Jun 2026 · 3:14 PM</div>' : ''}
    </div>`;
  }

  // ---- stat card + icon helpers ----
  function statCard(label, value, dir, delta, ic) {
    return `<div class="stat-card">
      <div class="s-top"><span class="s-label">${label}</span><span class="s-ic">${ic(20)}</span></div>
      <div class="s-value">${value}</div>
      ${delta ? `<div class="s-delta ${dir||''}">${dir==='up'?'▲':dir==='down'?'▼':''} ${delta}</div>` : ''}
    </div>`;
  }
  function icMoney(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4s-5 .9-5 3 2.5 2.8 5 3.2 5 1.1 5 3.3-2.2 3-5 3-5-.8-5-2.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icCal(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M4 9h16M8 3v4m8-4v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icCart(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2 12h10l2-8H6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="17" cy="19" r="1.5" fill="currentColor"/></svg>`;}
  function icStar(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="m12 3 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.3 6.8 19l1-5.75-4.2-4.1 5.8-.85L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;}
  function icWallet(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M16 12h2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icPct(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M5 19 19 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.7"/></svg>`;}
  function icClock(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
  function icShield(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
  function icX(s){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;}

})(window.Views);
