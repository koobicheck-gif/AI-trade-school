# Professional Trades Academy — Proof of Concept

A working prototype of a category-defining idea: **an academy — and an operating system — for developing modern trades professionals**, built around five intelligences (Technical, Human, Digital, Business, Character), an employer-first model, GiANT's human-development IP, and a proprietary **Professional Trades Intelligence (PTI) Certification**.

> Working name. Alternatives under consideration: Trades Intelligence Academy, Modern Trades Institute. All students, companies, scores, and metrics in the demo are **fictional**.

## What's here

| File | What it is |
|---|---|
| `index.html` | VC-facing pitch landing page: the category thesis, the CareerTech flank, the five intelligences, the moat, the business model, the roadmap |
| `program.html` | The program: three-semester curriculum, teaching-hospital faculty model, "company headquarters" campus, credential stack |
| `employers.html` | The contractor pitch: profitable-on-day-one graduates, the Founding 20 partner model, how reserving a graduate works |
| `dashboard.html` | **Trades OS** — the interactive product demo with four role views: Student, Coach, Employer, and Director |
| `docs/concept.md` | The full concept document, consolidated from the founding memos |
| `assets/` | Shared design system (CSS), demo dataset, and dashboard logic — vanilla JS, zero dependencies |

## Running it

It's a pure static site — no build step.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or open `index.html` directly in a browser, or host on GitHub Pages.

## The Trades OS demo

Four seats over one dataset (`assets/js/data.js`):

- **Student** — first-person profile: five-intelligence radar, next PTI requirements, coach focus areas, feedback, internship.
- **Coach** — full roster with per-student profiles: monthly score trends, credentials, PTI progress, feedback timeline.
- **Employer** — the graduate pool: filter by trade, sort by readiness or customer rating, and reserve a graduate.
- **Director** — the academy at a glance: cohort analytics by intelligence, placement pipeline, founding-partner scorecards, and the year-1 revenue model.

Light and dark themes follow the system preference.
