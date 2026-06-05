/* ============================================================
   TopNotes — sample data + small render helpers
   ============================================================ */
window.TN = (function () {

  const SUBJECT_COLORS = {
    Physics:   ['#5B4BE0', '#3B2F8F'],
    Chemistry: ['#16A34A', '#0E7A38'],
    Biology:   ['#0EA5A4', '#0A7572'],
    Maths:     ['#F5A524', '#D97706'],
    English:   ['#DC2626', '#9F1D1D'],
  };

  const NOTES = [
    { id: 'n1', title: 'Organic Chemistry — Reaction Mechanisms', subject: 'Chemistry', exam: 'NEET', cls: 'Class 12', price: 199, pages: 86, rating: 4.9, reviews: 214,
      seller: { name: 'Priya Nair', initials: 'PN', inst: 'AIIMS Delhi', air: 'AIR 312 · NEET 2024' } },
    { id: 'n2', title: 'Rotational Motion & Rigid Bodies', subject: 'Physics', exam: 'JEE', cls: 'Class 11', price: 149, pages: 54, rating: 4.8, reviews: 168,
      seller: { name: 'Rohan Mehta', initials: 'RM', inst: 'IIT Bombay', air: 'AIR 89 · JEE 2023' } },
    { id: 'n3', title: 'Calculus: Limits, Continuity & Differentiation', subject: 'Maths', exam: 'JEE', cls: 'Class 12', price: 229, pages: 112, rating: 5.0, reviews: 301,
      seller: { name: 'Ananya Rao', initials: 'AR', inst: 'IIT Madras', air: 'AIR 44 · JEE 2024' } },
    { id: 'n4', title: 'Human Physiology — Complete Notes', subject: 'Biology', exam: 'NEET', cls: 'Class 12', price: 179, pages: 96, rating: 4.7, reviews: 142,
      seller: { name: 'Kabir Shah', initials: 'KS', inst: 'JIPMER', air: 'AIR 521 · NEET 2023' } },
    { id: 'n5', title: 'Thermodynamics & Kinetic Theory', subject: 'Physics', exam: 'JEE', cls: 'Class 11', price: 159, pages: 62, rating: 4.6, reviews: 97,
      seller: { name: 'Rohan Mehta', initials: 'RM', inst: 'IIT Bombay', air: 'AIR 89 · JEE 2023' } },
    { id: 'n6', title: 'Inorganic Chemistry — Periodic Properties', subject: 'Chemistry', exam: 'Boards', cls: 'Class 11', price: 129, pages: 48, rating: 4.8, reviews: 88,
      seller: { name: 'Priya Nair', initials: 'PN', inst: 'AIIMS Delhi', air: 'AIR 312 · NEET 2024' } },
    { id: 'n7', title: 'Coordinate Geometry — Conic Sections', subject: 'Maths', exam: 'JEE', cls: 'Class 11', price: 169, pages: 70, rating: 4.9, reviews: 133,
      seller: { name: 'Ananya Rao', initials: 'AR', inst: 'IIT Madras', air: 'AIR 44 · JEE 2024' } },
    { id: 'n8', title: 'Genetics & Evolution', subject: 'Biology', exam: 'NEET', cls: 'Class 12', price: 189, pages: 78, rating: 4.7, reviews: 156,
      seller: { name: 'Kabir Shah', initials: 'KS', inst: 'JIPMER', air: 'AIR 521 · NEET 2023' } },
    { id: 'n9', title: 'Electrostatics & Current Electricity', subject: 'Physics', exam: 'JEE', cls: 'Class 12', price: 199, pages: 90, rating: 4.9, reviews: 187,
      seller: { name: 'Rohan Mehta', initials: 'RM', inst: 'IIT Bombay', air: 'AIR 89 · JEE 2023' } },
  ];

  const PURCHASES = [
    { id: 'p1', noteId: 'n1', date: '28 May 2026', amount: 199, invoice: 'TN-2026-00841', reviewed: true },
    { id: 'p2', noteId: 'n3', date: '21 May 2026', amount: 229, invoice: 'TN-2026-00792', reviewed: false },
    { id: 'p3', noteId: 'n9', date: '14 May 2026', amount: 199, invoice: 'TN-2026-00715', reviewed: false },
  ];

  const REVIEWS = [
    { name: 'Ishaan G.', initials: 'IG', stars: 5, date: '26 May 2026', text: 'Crystal-clear handwriting and every mechanism is explained with arrows. Scored 680 in NEET thanks to these.' },
    { name: 'Meera K.', initials: 'MK', stars: 5, date: '19 May 2026', text: 'Better than my coaching notes. The named reactions summary at the end is gold.' },
    { name: 'Dev P.', initials: 'DP', stars: 4, date: '11 May 2026', text: 'Really thorough. Would have liked a few more solved examples, but excellent overall.' },
  ];

  const SALES = [
    { buyer: 'Ishaan G.', initials: 'IG', note: 'Organic Chemistry — Reaction Mechanisms', amount: 199, date: 'Today, 2:14 PM' },
    { buyer: 'Meera K.', initials: 'MK', note: 'Inorganic Chemistry — Periodic Properties', amount: 129, date: 'Today, 11:02 AM' },
    { buyer: 'Dev P.', initials: 'DP', note: 'Organic Chemistry — Reaction Mechanisms', amount: 199, date: 'Yesterday, 6:48 PM' },
    { buyer: 'Sara M.', initials: 'SM', note: 'Inorganic Chemistry — Periodic Properties', amount: 129, date: 'Yesterday, 3:20 PM' },
    { buyer: 'Arjun T.', initials: 'AT', note: 'Organic Chemistry — Reaction Mechanisms', amount: 199, date: '1 Jun, 9:10 AM' },
  ];

  const SELLER_NOTES = [
    { id: 's1', title: 'Organic Chemistry — Reaction Mechanisms', subject: 'Chemistry', status: 'Active', price: 199, sales: 214, rating: 4.9 },
    { id: 's2', title: 'Inorganic Chemistry — Periodic Properties', subject: 'Chemistry', status: 'Active', price: 129, sales: 88, rating: 4.8 },
    { id: 's3', title: 'Physical Chemistry — Mole Concept', subject: 'Chemistry', status: 'Draft', price: 149, sales: 0, rating: 0 },
    { id: 's4', title: 'Chemical Bonding (old syllabus)', subject: 'Chemistry', status: 'Deleted', price: 99, sales: 41, rating: 4.5 },
  ];

  const USERS = [
    { name: 'Aarav Sharma', initials: 'AS', email: 'aarav@topnotes.in', role: 'Buyer', status: 'Active', joined: '12 Apr 2026' },
    { name: 'Priya Nair', initials: 'PN', email: 'priya@topnotes.in', role: 'Seller', status: 'Active', joined: '03 Feb 2026' },
    { name: 'Rohan Mehta', initials: 'RM', email: 'rohan@topnotes.in', role: 'Seller', status: 'Active', joined: '21 Jan 2026' },
    { name: 'Ishaan Gupta', initials: 'IG', email: 'ishaan@topnotes.in', role: 'Buyer', status: 'Active', joined: '18 May 2026' },
    { name: 'Dev Patel', initials: 'DP', email: 'dev@topnotes.in', role: 'Buyer', status: 'Suspended', joined: '09 Mar 2026' },
    { name: 'Ananya Rao', initials: 'AR', email: 'ananya@topnotes.in', role: 'Seller', status: 'Active', joined: '30 Dec 2025' },
    { name: 'Kabir Shah', initials: 'KS', email: 'kabir@topnotes.in', role: 'Seller', status: 'Active', joined: '14 Feb 2026' },
    { name: 'Meera Krishnan', initials: 'MK', email: 'meera@topnotes.in', role: 'Buyer', status: 'Active', joined: '22 May 2026' },
  ];

  const PENDING_VERIF = [
    { name: 'Vikram Iyer', initials: 'VI', inst: 'IIT Delhi', score: 92, date: '2 Jun 2026', exam: 'JEE 2024 · AIR 156' },
    { name: 'Sneha Reddy', initials: 'SR', inst: 'CMC Vellore', score: 88, date: '2 Jun 2026', exam: 'NEET 2024 · AIR 402' },
    { name: 'Aditya Bose', initials: 'AB', inst: 'IIT Kharagpur', score: 79, date: '1 Jun 2026', exam: 'JEE 2023 · AIR 611' },
    { name: 'Nisha Verma', initials: 'NV', inst: 'AIIMS Jodhpur', score: 95, date: '1 Jun 2026', exam: 'NEET 2024 · AIR 88' },
    { name: 'Karan Singh', initials: 'KS', inst: 'NIT Trichy', score: 84, date: '31 May 2026', exam: 'JEE 2023 · AIR 1204' },
  ];

  const TEST_QUESTIONS = [
    { q: 'Which of the following is the correct IUPAC name for CH₃–CH(OH)–CH₃?', subject: 'Chemistry', active: true, opts: ['Propan-1-ol', 'Propan-2-ol', 'Propan-1,2-diol', 'Acetone'], correct: 1 },
    { q: 'A body moves with constant acceleration. Its velocity–time graph is a:', subject: 'Physics', active: true, opts: ['Parabola', 'Straight line', 'Hyperbola', 'Circle'], correct: 1 },
    { q: 'The derivative of sin(x) with respect to x is:', subject: 'Maths', active: true, opts: ['cos(x)', '−cos(x)', 'sin(x)', '−sin(x)'], correct: 0 },
    { q: 'Which organelle is known as the powerhouse of the cell?', subject: 'Biology', active: false, opts: ['Ribosome', 'Nucleus', 'Mitochondria', 'Golgi body'], correct: 2 },
    { q: 'The SI unit of electric charge is the:', subject: 'Physics', active: true, opts: ['Ampere', 'Volt', 'Coulomb', 'Ohm'], correct: 2 },
  ];

  // ---------- helpers ----------
  function noteById(id) { return NOTES.find(n => n.id === id) || NOTES[0]; }

  function thumb(note, h) {
    const c = SUBJECT_COLORS[note.subject] || ['#5B4BE0', '#3B2F8F'];
    const initial = note.subject[0];
    return `<div class="thumb" style="height:${h || 168}px;background:
      repeating-linear-gradient(0deg, rgba(255,255,255,.10) 0 1px, transparent 1px 22px),
      linear-gradient(150deg, ${c[0]}, ${c[1]});">
      <span class="thumb-sub">${note.subject}</span>
      <span class="thumb-glyph">${initial}</span>
    </div>`;
  }

  function stars(rating, size) {
    const full = Math.round(rating);
    let s = '<span class="stars" style="' + (size ? `--st:${size}px` : '') + '">';
    for (let i = 1; i <= 5; i++) {
      const cls = i <= full ? '' : ' class="empty"';
      s += `<svg${cls} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.6 6.1 20.6l1.3-6.5L2.5 8.9l6.6-.8L12 2Z"/></svg>`;
    }
    return s + '</span>';
  }

  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }

  function noteCard(note) {
    return `<a class="note-card" href="#/note/${note.id}">
      ${thumb(note)}
      <div class="nc-body">
        <div class="nc-badges">
          <span class="badge badge-indigo">${note.subject}</span>
          <span class="badge badge-amber">${note.exam}</span>
        </div>
        <h3 class="nc-title">${note.title}</h3>
        <div class="nc-seller">
          <span class="avatar avatar-sm">${note.seller.initials}</span>
          <span class="nc-seller-name">${note.seller.name}</span>
          <span class="nc-verified" title="Verified topper"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 4 6v5c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6l-8-3.5Z" fill="#EEEBFB" stroke="#5B4BE0" stroke-width="1.4" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="#5B4BE0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
        <div class="nc-meta">
          ${stars(note.rating)}
          <span class="rating-text">${note.rating}</span>
          <span class="rating-count">(${note.reviews})</span>
          <span class="nc-dot">·</span>
          <span class="rating-count">${note.pages} pages</span>
        </div>
        <div class="nc-foot">
          <span class="nc-price">${inr(note.price)}</span>
          <span class="btn btn-primary btn-sm">View</span>
        </div>
      </div>
    </a>`;
  }

  return { NOTES, PURCHASES, REVIEWS, SALES, SELLER_NOTES, USERS, PENDING_VERIF, TEST_QUESTIONS,
           SUBJECT_COLORS, noteById, thumb, stars, inr, noteCard };
})();
