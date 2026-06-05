/* ============================================================
   TopNotes — Buyer views
   ============================================================ */
window.Views = window.Views || {};

(function (V) {
  const T = window.TN;

  /* ---------------- BROWSE ---------------- */
  V.browse = function () {
    const cards = T.NOTES.map(T.noteCard).join('');
    return `
    <div class="page-head">
      <div>
        <div class="crumb">Marketplace</div>
        <h1>Browse notes</h1>
        <p>Verified, handwritten notes from real toppers — for JEE, NEET &amp; Boards.</p>
      </div>
    </div>

    <div class="filter-bar">
      <button class="btn btn-secondary filter-toggle" id="filterToggle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Filters
      </button>
      <div class="chip" tabindex="0">Class <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="m1 1.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="chip active" tabindex="0">Subject: Chemistry <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="m1 1.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="chip" tabindex="0">Exam <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="m1 1.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="chip" tabindex="0">Price <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="m1 1.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    </div>

    <div class="browse-layout">
      <aside class="filter-side" aria-label="Filters">
        <div class="filter-group">
          <h4>Class</h4>
          <label class="filter-opt"><input type="checkbox" /> Class 11</label>
          <label class="filter-opt"><input type="checkbox" /> Class 12</label>
        </div>
        <div class="filter-group">
          <h4>Subject</h4>
          <label class="filter-opt"><input type="checkbox" checked /> Chemistry</label>
          <label class="filter-opt"><input type="checkbox" /> Physics</label>
          <label class="filter-opt"><input type="checkbox" /> Maths</label>
          <label class="filter-opt"><input type="checkbox" /> Biology</label>
        </div>
        <div class="filter-group">
          <h4>Exam type</h4>
          <label class="filter-opt"><input type="checkbox" /> JEE</label>
          <label class="filter-opt"><input type="checkbox" /> NEET</label>
          <label class="filter-opt"><input type="checkbox" /> Boards</label>
        </div>
        <div class="filter-group">
          <h4>Price</h4>
          <label class="filter-opt"><input type="radio" name="price" /> Under ₹150</label>
          <label class="filter-opt"><input type="radio" name="price" /> ₹150 – ₹200</label>
          <label class="filter-opt"><input type="radio" name="price" /> ₹200+</label>
        </div>
      </aside>

      <div>
        <div class="result-row">
          <div class="result-count"><b>${T.NOTES.length}</b> notes found</div>
          <select class="select" style="width:auto;height:40px;">
            <option>Sort: Most popular</option>
            <option>Highest rated</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>
        <div class="notes-grid">${cards}</div>
        <div style="display:flex;justify-content:center;margin-top:32px;">
          <div class="pager">
            <button disabled aria-label="Previous">‹</button>
            <button aria-current="true">1</button>
            <button>2</button>
            <button>3</button>
            <button aria-label="Next">›</button>
          </div>
        </div>
      </div>
    </div>`;
  };

  /* ---------------- NOTE DETAIL ---------------- */
  V.note = function (id) {
    const n = T.noteById(id);
    const purchased = false; // default state; "Read" demoed via button
    const revAvg = n.rating;
    const reviewItems = T.REVIEWS.map(r => `
      <div class="rev-item card">
        <div class="rev-top">
          <span class="avatar avatar-sm">${r.initials}</span>
          <span class="rev-name">${r.name}</span>
          <time>${r.date}</time>
        </div>
        <div style="margin-top:8px;">${T.stars(r.stars, 15)}</div>
        <p class="rev-text">${r.text}</p>
      </div>`).join('');

    return `
    <a class="btn btn-ghost btn-sm" href="#/browse" style="margin-bottom:16px;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> Back to browse
    </a>

    <div class="detail-grid">
      <div>
        <div class="preview-box">
          ${T.thumb(n, 0).replace('height:0px', 'height:100%;position:absolute;inset:0')}
          <div class="preview-lock">
            <span class="lock-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7"/></svg>
              Preview only · full notes after purchase
            </span>
          </div>
        </div>

        <div class="detail-badges">
          <span class="badge badge-indigo">${n.subject}</span>
          <span class="badge badge-amber">${n.exam}</span>
          <span class="badge">${n.cls}</span>
        </div>
        <h1 class="detail-title">${n.title}</h1>
        <div class="nc-meta" style="margin-top:12px;">
          ${T.stars(n.rating, 18)}
          <span class="rating-text">${n.rating}</span>
          <span class="rating-count">(${n.reviews} reviews)</span>
        </div>
        <p class="detail-desc">Complete, exam-focused handwritten notes covering every important concept, derivation and solved example. Color-coded, annotated, and condensed from two years of preparation into a high-yield revision resource — the exact notes that helped crack the ${n.exam}.</p>

        <div class="detail-facts">
          <div class="fact"><div class="f-label">Pages</div><div class="f-value">${n.pages}</div></div>
          <div class="fact"><div class="f-label">Format</div><div class="f-value">PDF</div></div>
          <div class="fact"><div class="f-label">Exam</div><div class="f-value">${n.exam}</div></div>
          <div class="fact"><div class="f-label">Class</div><div class="f-value">${n.cls.replace('Class ', '')}</div></div>
        </div>

        <div class="card seller-mini">
          <span class="avatar avatar-lg">${n.seller.initials}</span>
          <div class="sm-body">
            <h4>${n.seller.name}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z" fill="#EEEBFB" stroke="#5B4BE0" stroke-width="1.4" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="#5B4BE0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </h4>
            <div class="sm-inst">${n.seller.inst}</div>
            <span class="badge badge-amber sm-air">★ ${n.seller.air}</span>
            <p class="sm-bio">Verified topper on TopNotes. Notes trusted by ${n.reviews}+ aspirants across India.</p>
          </div>
          <a class="btn btn-secondary btn-sm" href="#/browse">View profile</a>
        </div>
      </div>

      <!-- purchase card -->
      <div class="card purchase-card" id="purchaseCard">
        <div class="pc-price">${T.inr(n.price)} <small>one-time</small></div>
        <button class="btn btn-primary btn-lg btn-block" id="buyBtn" style="margin-top:16px;" data-price="${n.price}" data-id="${n.id}">
          <span class="btn-spin"></span>
          <span class="bl">Buy for ${T.inr(n.price)}</span>
        </button>
        <div class="pc-secure">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.6"/></svg>
          View-only access · watermarked with your email · no download
        </div>
        <ul class="pc-includes">
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ${n.pages} pages of handwritten notes</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Lifetime access in your library</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Read on any device, secure viewer</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Verified topper · ${n.seller.air}</li>
        </ul>
      </div>
    </div>

    <!-- reviews -->
    <div class="reviews">
      <h2 style="font-size:var(--t-24);font-weight:800;">Reviews</h2>
      <div class="card rev-summary" style="margin-top:14px;">
        <div style="text-align:center;">
          <div class="rev-big">${revAvg}</div>
          <div>${T.stars(revAvg, 16)}</div>
          <div class="rating-count" style="margin-top:6px;">${n.reviews} reviews</div>
        </div>
        <div style="flex:1;min-width:220px;">
          ${[5,4,3,2,1].map((s,i) => {
            const pct = [78,15,5,1,1][i];
            return `<div style="display:flex;align-items:center;gap:10px;margin:5px 0;">
              <span style="font-size:13px;color:var(--slate);width:12px;">${s}</span>
              <div class="progress" style="flex:1;"><i style="width:${pct}%"></i></div>
              <span style="font-size:12px;color:var(--muted);width:34px;text-align:right;">${pct}%</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="rev-list">${reviewItems}</div>

      <div class="card write-review" id="writeReview" style="display:none;">
        <h4 style="font-size:var(--t-16);margin-bottom:6px;">Write a review</h4>
        <p class="muted" style="font-size:var(--t-14);margin:0 0 14px;">You purchased this note — share your experience.</p>
        <div class="stars" style="--st:26px;margin-bottom:12px;cursor:pointer;">
          ${[1,2,3,4,5].map(()=>'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z"/></svg>').join('')}
        </div>
        <textarea class="textarea" placeholder="What did you think of these notes?"></textarea>
        <div style="margin-top:14px;"><button class="btn btn-primary">Submit review</button></div>
      </div>
    </div>`;
  };

  /* ---------------- MY PURCHASES ---------------- */
  V.purchases = function () {
    if (window.__emptyPurchases) {
      return `
      <div class="page-head"><div><div class="crumb">Account</div><h1>My purchases</h1></div></div>
      <div class="card empty">
        <div class="e-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 7h16l-1.4 11.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8L4 7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.7"/></svg></div>
        <h3>You haven't bought any notes yet</h3>
        <p>Browse verified topper notes for your exam and start your library.</p>
        <a class="btn btn-primary" href="#/browse">Browse notes</a>
      </div>`;
    }
    const rows = T.PURCHASES.map(p => {
      const n = T.noteById(p.noteId);
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:56px;border-radius:6px;overflow:hidden;flex:none;">${T.thumb(n,56).replace('border-radius: var(--r-card) var(--r-card) 0 0','border-radius:6px')}</div>
            <div><div style="font-weight:700;">${n.title}</div><div class="muted" style="font-size:13px;">${n.seller.name} · ${n.subject}</div></div>
          </div>
        </td>
        <td class="hide-mobile">${p.date}</td>
        <td class="hide-mobile">${T.inr(p.amount)}</td>
        <td class="hide-mobile"><span class="muted" style="font-size:13px;">${p.invoice}</span></td>
        <td>
          <div class="tbl-actions">
            ${!p.reviewed ? '<button class="btn btn-ghost btn-sm">Write review</button>' : ''}
            <a class="btn btn-secondary btn-sm" href="#/viewer/${n.id}">Read</a>
          </div>
        </td>
      </tr>`;
    }).join('');

    const cards = T.PURCHASES.map(p => {
      const n = T.noteById(p.noteId);
      return `<div class="card card-pad">
        <div style="display:flex;gap:12px;">
          <div style="width:48px;height:60px;border-radius:6px;overflow:hidden;flex:none;">${T.thumb(n,60).replace('border-radius: var(--r-card) var(--r-card) 0 0','border-radius:6px')}</div>
          <div style="flex:1;"><div style="font-weight:700;font-size:14px;">${n.title}</div><div class="muted" style="font-size:12px;margin-top:2px;">${p.date} · ${T.inr(p.amount)}</div><div class="muted" style="font-size:12px;">${p.invoice}</div></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <a class="btn btn-secondary btn-sm btn-block" href="#/viewer/${n.id}">Read</a>
          ${!p.reviewed ? '<button class="btn btn-ghost btn-sm">Review</button>' : ''}
        </div>
      </div>`;
    }).join('');

    return `
    <div class="page-head">
      <div><div class="crumb">Account</div><h1>My purchases</h1><p>${T.PURCHASES.length} notes in your library.</p></div>
      <div class="head-actions">
        <div class="search" style="width:220px;"><span class="s-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7"/><path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><input class="input" placeholder="Search purchases" /></div>
      </div>
    </div>

    <div class="table-wrap responsive">
      <table class="tn">
        <thead><tr><th>Note</th><th class="hide-mobile">Date</th><th class="hide-mobile">Amount</th><th class="hide-mobile">Invoice</th><th style="text-align:right;">Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="mobile-cards">${cards}</div>`;
  };

  /* ---------------- SECURE VIEWER (full screen) ---------------- */
  V.viewer = function (id) {
    const n = T.noteById(id);
    const email = 'aarav@topnotes.in';
    const marks = Array.from({ length: 40 }).map(() => `<span>${email} · TopNotes</span>`).join('');
    return `
    <div class="viewer">
      <div class="viewer-top">
        <a class="vt-close" href="#/purchases" aria-label="Close viewer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </a>
        <span class="vt-title">${n.title}</span>
        <span class="vt-protected">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7"/></svg>
          Protected content
        </span>
        <span class="vt-page"><span id="vPage">1</span> / <span id="vTotal">${n.pages}</span></span>
      </div>
      <div class="viewer-stage">
        <div class="doc-page">
          <div class="page-head-line"></div>
          <div class="page-lines"></div>
          <div class="watermark">${marks}</div>
        </div>
      </div>
      <div class="viewer-nav">
        <button id="vPrev" disabled aria-label="Previous page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span class="vn-page">Page <span id="vPage2">1</span></span>
        <button id="vNext" aria-label="Next page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
    </div>`;
  };

})(window.Views);
