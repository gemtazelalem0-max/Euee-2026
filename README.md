# Euee-2026

A premium, modern exam-taking application built with vanilla HTML, CSS, and JavaScript, connected directly to a Supabase backend database.

## Features
- **Dynamic Question Loading**: Fetches questions directly from the Supabase `questions` database table.
- **Modern UI**: Clean cards, beautiful layout, interactive option selection blocks, and visual animations.
- **Score Visualizer**: Elegant SVG circular progress chart on submission showing your accuracy percentage.
- **Review Breakdown**: Detailed review showing your selection, the correct answer, and indicators (correct check or incorrect cross).
- **Auto-save Scores**: Submits results (`student_name`, `score`, and `total`) directly to a `results` table in Supabase.

## Getting Started
1. Run the database setup script in the Supabase SQL editor (refer to the setup guide).
2. Insert your Supabase URL and Anon Key at the top of `app.js`.
3. Open `index.html` in your browser.
