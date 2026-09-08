# Engineering Console Design Update

This pass changes aesthetics only. Study data, Supabase sync, authentication, notes, cards, assignments, schedules, exports, and routes are unchanged.

## Course image slots
Replace files in `public/course-art/` and keep the filenames:

- `image_1.jpg` — ESOF 3251 Compiler & Algorithm Design
- `image_2.jpg` — ESOF 4310 Advanced Computer Networks
- `image_3.jpg` — SOCI 2755 Technology, Society & Indigenous Peoples in Canada
- `image_4.jpg` — ENGI 3336 Engineering Economics & Project Management
- `image_5.jpg` — ESOF 3255 Software Test & Quality Assurance
- `image_6.jpg` — ESOF 3350 Performance Analysis of Software
- `image_7.jpg` — ESOF 3558 Numerical Methods & Modeling
- `image_8.jpg` — ESOF 3675 Data Mining

Recommended replacement size: 1600×900 (16:9). The app uses `object-fit: cover`, so other landscape sizes work too.

## Visual direction
- Terminal / ASCII root landing page
- No logo on the landing page
- Dark engineering-console palette with electric blue, signal green and restrained yellow
- Sharper panels and data-grid styling
- Circuit/grid overlays and status-console details
- Course artwork changed to drop-in image placeholders
- App behavior and backend intentionally untouched
