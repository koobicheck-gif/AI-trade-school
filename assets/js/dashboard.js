/* ============================================================
   Trades OS — interactivity (vanilla JS, no deps)
   Four role views over one dataset:
     Student  — first-person profile & next steps
     Coach    — roster → full student profile
     Employer — graduate pool with reserve CTA
     Director — cohort analytics, partners, revenue model
   ============================================================ */

(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const cssVal = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  let currentId = STUDENTS[0].id;
  const reserved = new Set();

  /* ---------- shared tooltip ---------- */
  const tip = document.createElement("div");
  tip.id = "viz-tip";
  document.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add("show");
    const pad = 14;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + pad, top = y - h - pad;
    if (left + w > innerWidth - 8) left = x - w - pad;
    if (top < 8) top = y + pad;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.classList.remove("show"); }
  function bindTips(root) {
    root.querySelectorAll("[data-tip]").forEach((el) => {
      el.addEventListener("mousemove", (e) => showTip(el.dataset.tip, e.clientX, e.clientY));
      el.addEventListener("mouseleave", hideTip);
    });
    root.querySelectorAll("circle[data-int]").forEach((dot) => {
      dot.addEventListener("mousemove", (e) => {
        const it = INTELLIGENCES.find((x) => x.key === dot.dataset.int);
        showTip(`<b>${it.label}</b>: ${dot.dataset.val} / 100`, e.clientX, e.clientY);
      });
      dot.addEventListener("mouseleave", hideTip);
    });
  }

  function intColor(key) {
    return cssVal(INTELLIGENCES.find((i) => i.key === key).cssVar);
  }

  /* ---------- charts ---------- */
  function radarSVG(student) {
    const W = 360, H = 292;
    const cx = W / 2, cy = H / 2 + 8;
    const R = H / 2 - 44;
    const N = INTELLIGENCES.length;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];

    let rings = "";
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const pts = INTELLIGENCES.map((_, i) => pt(i, R * f).join(",")).join(" ");
      rings += `<polygon points="${pts}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    });

    let spokes = "";
    INTELLIGENCES.forEach((_, i) => {
      const [x, y] = pt(i, R);
      spokes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    });

    const valPts = INTELLIGENCES.map((it, i) => pt(i, (R * student.scores[it.key]) / 100));
    const poly = valPts.map((p) => p.join(",")).join(" ");
    const brand = cssVal("--brand");

    let dots = "", labels = "";
    INTELLIGENCES.forEach((it, i) => {
      const [vx, vy] = valPts[i];
      dots += `<circle cx="${vx}" cy="${vy}" r="4.5" fill="${brand}" stroke="var(--surface)" stroke-width="2"
        data-int="${it.key}" data-val="${student.scores[it.key]}" style="cursor:default"/>`;
      const [lx, ly] = pt(i, R + 24);
      const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
      const dy = ly > cy + 8 ? 10 : ly < cy - 8 ? 0 : 4;
      labels += `<text x="${lx}" y="${ly + dy}" text-anchor="${anchor}" class="chart-lbl">${it.label}</text>
        <text x="${lx}" y="${ly + dy + 13}" text-anchor="${anchor}" class="chart-val">${student.scores[it.key]}</text>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
        aria-label="Five-intelligence profile for ${student.name}: ${INTELLIGENCES.map((it) => `${it.label} ${student.scores[it.key]}`).join(", ")}">
      ${rings}${spokes}
      <polygon points="${poly}" fill="${brand}" fill-opacity="0.16" stroke="${brand}" stroke-width="2" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg>`;
  }

  function miniRadarSVG(student) {
    const S = 96, cx = S / 2, cy = S / 2, R = S / 2 - 6;
    const N = INTELLIGENCES.length;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))].join(",");
    const ringPts = INTELLIGENCES.map((_, i) => pt(i, R)).join(" ");
    const halfPts = INTELLIGENCES.map((_, i) => pt(i, R * 0.5)).join(" ");
    const poly = INTELLIGENCES.map((it, i) => pt(i, (R * student.scores[it.key]) / 100)).join(" ");
    const brand = cssVal("--brand");
    return `<svg viewBox="0 0 ${S} ${S}" width="82" height="82" aria-hidden="true">
      <polygon points="${ringPts}" fill="none" stroke="var(--line)" stroke-width="1"/>
      <polygon points="${halfPts}" fill="none" stroke="var(--line)" stroke-width="1"/>
      <polygon points="${poly}" fill="${brand}" fill-opacity="0.18" stroke="${brand}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
  }

  function sparkSVG(values, color) {
    const W = 64, H = 22, pad = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
      const x = pad + (i * (W - 2 * pad)) / (values.length - 1);
      const y = H - pad - ((v - min) / span) * (H - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = pts[pts.length - 1].split(",");
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="spark" aria-hidden="true">
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="${color}"/>
    </svg>`;
  }

  /* ---------- shared profile fragments ---------- */
  function barsHTML(s) {
    return INTELLIGENCES.map((it) => `
      <div class="intbar" style="--int-color:${intColor(it.key)}"
           data-tip="${it.label} intelligence: ${s.scores[it.key]} / 100 (started at ${s.trend[it.key][0]})">
        <span class="lb">${it.label}</span>
        <span class="track"><span class="fill" style="width:${s.scores[it.key]}%"></span></span>
        <span class="vals">${sparkSVG(s.trend[it.key], intColor(it.key))}<span class="val">${s.scores[it.key]}</span></span>
      </div>`).join("");
  }

  function tilesHTML(s) {
    const start = Math.round(INTELLIGENCES.reduce((a, it) => a + s.trend[it.key][0], 0) / INTELLIGENCES.length);
    const delta = overallScore(s) - start;
    return `
      <div class="tiles">
        <div class="tile"><div class="t-num">${overallScore(s)}<small> /100</small></div>
          <div class="t-lbl">Overall readiness</div><div class="t-delta">▲ ${delta} since enrollment</div></div>
        <div class="tile"><div class="t-num">${s.customerRating.toFixed(1)}<small> ★</small></div>
          <div class="t-lbl">Customer rating (sims + field)</div></div>
        <div class="tile"><div class="t-num">${s.aiCompetency}<small> /100</small></div>
          <div class="t-lbl">AI competency</div></div>
        <div class="tile"><div class="t-num">${s.attendance}<small>%</small></div>
          <div class="t-lbl">Attendance</div></div>
      </div>`;
  }

  function certsHTML(s) {
    return PTI_STEPS.map((step, i) => `
      <div class="certrow ${i < s.ptiCompleted ? "done" : ""}">
        <span class="ck">✓</span>
        <span class="cert-lbl">${step}</span>
        <span class="cert-when">${i < s.ptiCompleted ? "Complete" : "—"}</span>
      </div>`).join("");
  }

  function feedHTML(s) {
    return s.feedback.map((f) => `
      <div class="feed-item" style="--int-color:${intColor(f.area)}">
        <span class="rail"><span class="knot"></span></span>
        <div>
          <div class="fb-head"><b>${f.coach}</b> · ${f.date}</div>
          <div class="fb-body">${f.note}</div>
        </div>
      </div>`).join("");
  }

  function internshipPanel(s) {
    return s.internship ? `
      <div class="panel">
        <h3>Field internship</h3>
        <p class="panel-sub"><b>${s.internship.company}</b> — ${s.internship.role}</p>
        <p style="margin:0 0 6px;font-size:14px"><span class="pill tinted" style="--int-color:var(--int-character)">${s.internship.rating}</span></p>
        <p style="margin:0;color:var(--ink-2);font-size:14px">${s.internship.note}</p>
      </div>` : `
      <div class="panel">
        <h3>Field internship</h3>
        <p class="panel-sub">Begins in semester 3. Placement pool: 20 founding employer partners.</p>
      </div>`;
  }

  /* ---------- coach view ---------- */
  function renderRoster() {
    const el = $("#roster");
    el.innerHTML = STUDENTS.map((s) => `
      <button class="roster-item ${s.id === currentId ? "on" : ""}" data-id="${s.id}">
        <span class="avatar">${s.initials}</span>
        <span class="who">
          <span class="nm">${s.name}</span><br>
          <span class="mt">${s.track} · ${s.status}</span>
        </span>
        <span class="ov" title="Overall score">${overallScore(s)}</span>
      </button>`).join("");
    el.querySelectorAll(".roster-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentId = btn.dataset.id;
        renderRoster();
        renderProfile();
      });
    });
  }

  function renderProfile() {
    const s = STUDENTS.find((x) => x.id === currentId);
    const el = $("#profile");
    el.innerHTML = `
      <div class="profile-top">
        <span class="avatar">${s.initials}</span>
        <div>
          <h2>${s.name}</h2>
          <div class="meta">${s.track} track · ${s.cohort} · Five Voices: <b>${s.voice}</b></div>
        </div>
        <span class="status-badge ${s.graduate ? "grad" : ""}">${s.status}</span>
      </div>

      ${tilesHTML(s)}

      <div class="panelgrid">
        <div class="panel">
          <h3>Five-intelligence profile</h3>
          <p class="panel-sub">Assessed monthly by coaches, labs, and simulations.</p>
          <div>${radarSVG(s)}</div>
        </div>
        <div class="panel">
          <h3>Scores &amp; six-month trend</h3>
          <p class="panel-sub">Hover a row for details. Sparkline shows the last six assessments.</p>
          ${barsHTML(s)}
          <div style="margin-top:14px">
            <h3 style="margin-top:8px">Credentials</h3>
            <div class="pills" style="margin-top:8px">${s.badges.map((b) => `<span class="pill">${b}</span>`).join("")}</div>
          </div>
        </div>
      </div>

      <div class="panelgrid">
        <div class="panel">
          <h3>PTI certification progress</h3>
          <p class="panel-sub">${s.ptiCompleted} of ${PTI_STEPS.length} requirements complete</p>
          ${certsHTML(s)}
        </div>
        <div>
          ${internshipPanel(s)}
          <div class="panel" style="margin-top:18px">
            <h3>Coach feedback</h3>
            <p class="panel-sub">Latest entries from technical, GiANT, and field faculty.</p>
            <div class="feed">${feedHTML(s)}</div>
          </div>
        </div>
      </div>`;
    bindTips(el);
  }

  /* ---------- student view (first person) ---------- */
  function renderStudent() {
    const s = STUDENTS.find((x) => x.id === STUDENT_SELF_ID);
    const el = $("#student-view");
    const next = PTI_STEPS.slice(s.ptiCompleted, s.ptiCompleted + 2);
    const focus = INTELLIGENCES
      .map((it) => ({ it, v: s.scores[it.key] }))
      .sort((a, b) => a.v - b.v)
      .slice(0, 2);

    el.innerHTML = `
      <div class="profile" style="padding-bottom:56px">
        <div class="profile-top">
          <span class="avatar">${s.initials}</span>
          <div>
            <h2>Welcome back, ${s.name.split(" ")[0]}</h2>
            <div class="meta">${s.track} track · ${s.cohort} · Five Voices: <b>${s.voice}</b></div>
          </div>
          <span class="status-badge">${s.status}</span>
        </div>

        ${tilesHTML(s)}

        <div class="panelgrid">
          <div class="panel">
            <h3>My five-intelligence profile</h3>
            <p class="panel-sub">This is what employers see. Updated after every assessment.</p>
            <div>${radarSVG(s)}</div>
          </div>
          <div>
            <div class="panel">
              <h3>My next steps to PTI Certification</h3>
              <p class="panel-sub">${PTI_STEPS.length - s.ptiCompleted} requirements remaining</p>
              ${next.map((n) => `
                <div class="certrow"><span class="ck">✓</span><span class="cert-lbl"><b>Up next:</b> ${n}</span></div>`).join("")}
            </div>
            <div class="panel" style="margin-top:18px">
              <h3>Coach focus areas</h3>
              <p class="panel-sub">Where your coaches want your reps this month.</p>
              ${focus.map((f) => `
                <div class="intbar" style="--int-color:${intColor(f.it.key)}">
                  <span class="lb">${f.it.label}</span>
                  <span class="track"><span class="fill" style="width:${f.v}%"></span></span>
                  <span class="vals"><span class="val">${f.v}</span></span>
                </div>`).join("")}
              <p style="margin:10px 0 0;font-size:13.5px;color:var(--ink-2)">
                Your ${focus[0].it.label.toLowerCase()} score is your biggest lever right now —
                it's also the first thing employers filter on.</p>
            </div>
          </div>
        </div>

        <div class="panelgrid">
          <div class="panel">
            <h3>What my coaches are saying</h3>
            <div class="feed" style="margin-top:10px">${feedHTML(s)}</div>
          </div>
          ${internshipPanel(s)}
        </div>
      </div>`;
    bindTips(el);
  }

  /* ---------- employer view ---------- */
  function renderEmployer() {
    const track = $("#f-track").value;
    const sortBy = $("#f-sort").value;
    let pool = STUDENTS.filter((s) => s.graduate || s.status.includes("Semester 3"));
    if (track !== "all") pool = pool.filter((s) => s.track === track);
    pool.sort((a, b) => sortBy === "rating"
      ? b.customerRating - a.customerRating
      : overallScore(b) - overallScore(a));

    $("#gradgrid").innerHTML = pool.map((s) => {
      const isReserved = reserved.has(s.id);
      return `
      <div class="gradcard">
        <div class="top">
          <span class="avatar">${s.initials}</span>
          <div>
            <h3>${s.name}</h3>
            <div class="meta">${s.track} · ${s.status}${s.graduate ? " · PTI Certified" : " · graduates this term"}</div>
          </div>
        </div>
        <div class="mini">
          ${miniRadarSVG(s)}
          <div class="facts">
            <span>Overall readiness <b>${overallScore(s)} / 100</b></span>
            <span>Customer rating <b>${s.customerRating.toFixed(1)} ★</b></span>
            <span>AI competency <b>${s.aiCompetency} / 100</b></span>
            <span>Five Voices <b>${s.voice}</b></span>
          </div>
        </div>
        <button class="reserve-btn ${isReserved ? "reserved" : ""}" data-id="${s.id}" ${isReserved ? "disabled" : ""}>
          ${isReserved ? "✓ Reserved — placement team will contact you" : "Reserve this graduate"}
        </button>
      </div>`;
    }).join("");

    $("#gradgrid").querySelectorAll(".reserve-btn:not(.reserved)").forEach((btn) => {
      btn.addEventListener("click", () => { reserved.add(btn.dataset.id); renderEmployer(); });
    });
  }

  /* ---------- director view ---------- */
  function renderDirector() {
    const el = $("#director-view");
    const active = STUDENTS.filter((s) => !s.graduate);
    const grads = STUDENTS.filter((s) => s.graduate);
    const avgReadiness = Math.round(STUDENTS.reduce((a, s) => a + overallScore(s), 0) / STUDENTS.length);
    const avgByInt = INTELLIGENCES.map((it) => ({
      it,
      avg: Math.round(STUDENTS.reduce((a, s) => a + s.scores[it.key], 0) / STUDENTS.length),
    }));
    const totalReserves = EMPLOYERS.reduce((a, e) => a + e.reserves, 0) + reserved.size;
    const totalRevenue = REVENUE_MODEL.reduce((a, r) => a + r.amount, 0);
    const maxRev = Math.max(...REVENUE_MODEL.map((r) => r.amount));
    const fmtK = (k) => k >= 1000 ? "$" + (k / 1000).toFixed(2).replace(/\.?0+$/, "") + "M" : "$" + k + "k";

    const pipeline = STUDENTS.filter((s) => s.graduate || s.status.includes("Semester 3")).map((s) => {
      const placed = s.graduate;
      const state = placed ? `Placed — ${s.internship.company}` :
        (reserved.has(s.id) ? "Reserved by partner" : "In internship — available");
      return `<tr>
        <td style="color:var(--ink)"><strong>${s.name}</strong></td>
        <td>${s.track}</td>
        <td>${overallScore(s)}</td>
        <td>${s.customerRating.toFixed(1)} ★</td>
        <td>${placed ? `<span class="pill tinted" style="--int-color:var(--int-character)">${state}</span>` : `<span class="pill">${state}</span>`}</td>
      </tr>`;
    }).join("");

    const partners = EMPLOYERS.map((e) => `<tr>
      <td style="color:var(--ink)"><strong>${e.name}</strong></td>
      <td>${e.trade}</td>
      <td>${e.mentors}</td>
      <td>${e.reserves}</td>
      <td>${e.hires}</td>
      <td>${e.satisfaction.toFixed(1)} ★</td>
    </tr>`).join("");

    el.innerHTML = `
      <div class="profile" style="padding-bottom:56px">
        <div class="tiles five">
          <div class="tile"><div class="t-num">${active.length}</div><div class="t-lbl">Active students</div></div>
          <div class="tile"><div class="t-num">${grads.length}/${grads.length}</div><div class="t-lbl">Graduates placed</div><div class="t-delta">100% placement</div></div>
          <div class="tile"><div class="t-num">${EMPLOYERS.length}<small> of 20</small></div><div class="t-lbl">Founding employer partners</div></div>
          <div class="tile"><div class="t-num">${avgReadiness}<small> /100</small></div><div class="t-lbl">Avg readiness (all cohorts)</div></div>
          <div class="tile"><div class="t-num">${totalReserves}</div><div class="t-lbl">Graduate reserves pending</div></div>
        </div>

        <div class="panelgrid">
          <div class="panel">
            <h3>Cohort average by intelligence</h3>
            <p class="panel-sub">Across all ${STUDENTS.length} enrolled &amp; graduated students.</p>
            ${avgByInt.map((r) => `
              <div class="intbar" style="--int-color:${intColor(r.it.key)}"
                   data-tip="${r.it.label}: cohort average ${r.avg} / 100">
                <span class="lb">${r.it.label}</span>
                <span class="track"><span class="fill" style="width:${r.avg}%"></span></span>
                <span class="vals"><span class="val">${r.avg}</span></span>
              </div>`).join("")}
            <p style="margin:12px 0 0;font-size:13px;color:var(--ink-2)">
              Business intelligence lags by design — it ramps in semesters 2–3.
              Character leads: it's the first thing we select for.</p>
          </div>

          <div class="panel">
            <h3>Year-1 flagship revenue model <span style="font-weight:500;text-transform:none;letter-spacing:0">(assumptions)</span></h3>
            <p class="panel-sub">Total modeled: <b>${fmtK(totalRevenue)}</b>. Concept-stage figures, not results.</p>
            ${REVENUE_MODEL.map((r) => `
              <div class="intbar" style="--int-color:var(--brand);grid-template-columns:150px 1fr 80px"
                   data-tip="${r.stream}: ${fmtK(r.amount)} — ${r.note}">
                <span class="lb">${r.stream}</span>
                <span class="track"><span class="fill" style="width:${maxRev ? Math.max((r.amount / maxRev) * 100, r.amount ? 2 : 0) : 0}%"></span></span>
                <span class="vals"><span class="val">${r.amount ? fmtK(r.amount) : "Phase 3"}</span></span>
              </div>`).join("")}
            <p style="margin:12px 0 0;font-size:13px;color:var(--ink-2)">
              OS licensing carries no year-1 revenue — it's the phase-3 asset the flagship is proving.</p>
          </div>
        </div>

        <div class="panelgrid">
          <div class="panel">
            <h3>Placement pipeline</h3>
            <p class="panel-sub">Graduates and semester-3 candidates.</p>
            <div style="overflow-x:auto">
              <table class="compare" style="min-width:480px">
                <thead><tr><th>Candidate</th><th>Trade</th><th>Readiness</th><th>Cust.</th><th>Status</th></tr></thead>
                <tbody>${pipeline}</tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <h3>Founding employer partners</h3>
            <p class="panel-sub">Quarterly advisory board · mentor and hiring commitments.</p>
            <div style="overflow-x:auto">
              <table class="compare" style="min-width:520px">
                <thead><tr><th>Company</th><th>Trade</th><th>Mentors</th><th>Reserves</th><th>Hires</th><th>Partner sat.</th></tr></thead>
                <tbody>${partners}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
    bindTips(el);
  }

  /* ---------- view switching ---------- */
  const VIEWS = ["student", "coach", "employer", "director"];
  function setView(view) {
    VIEWS.forEach((v) => {
      $("#v-" + v).classList.toggle("on", v === view);
      $("#v-" + v).setAttribute("aria-selected", v === view);
      $("#" + v + "-view").classList.toggle("hidden", v !== view);
    });
    if (view === "employer") renderEmployer();
    if (view === "director") renderDirector();
    if (view === "student") renderStudent();
  }
  VIEWS.forEach((v) => $("#v-" + v).addEventListener("click", () => setView(v)));
  $("#f-track").addEventListener("change", renderEmployer);
  $("#f-sort").addEventListener("change", renderEmployer);

  renderRoster();
  renderProfile();
})();
