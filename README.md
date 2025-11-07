# 4DL Point Calculator - Free Fire Tournament Manager

A comprehensive Next.js web application for managing Free Fire tournaments with multiple lobbies, real-time leaderboards, and automated scoring.

## Features

### Multi-Lobby Architecture
- Create and manage multiple tournament lobbies simultaneously
- Each lobby operates independently with 12 teams and 6 matches
- Track multiple lobbies per day with separate leaderboards

### Tournament Management
- **Lobby Creation**: Set up lobbies with custom names, dates, and 12 team slots
- **Match Entry**: Streamlined form for entering match results (placement + kills)
- **Real-time Scoring**: Automatic point calculation and leaderboard updates
- **Match History**: View all completed matches with detailed results

### Scoring System
- **Placement Points**: 1st=12, 2nd=9, 3rd=8, 4th=7, 5th=6, 6th=5, 7th=4, 8th=3, 9th=2, 10th=1, 11th-12th=0
- **Kill Points**: 1 point per kill
- **Tie-breakers**: Booyahs → Total Kills → Placement Points

### Leaderboard
- Real-time rankings with automatic tie-breaker resolution
- Visual indicators for top 3 teams (🥇🥈🥉)
- Complete statistics: Total Points, Booyahs, Total Kills, Placement Points

### Export Functionality
- **CSV Export**: Export individual lobby results or daily summaries
- **PDF Export**: Generate formatted PDF reports with leaderboard and match details
- **Daily Summary**: Export all lobbies for a specific date

### Data Persistence
- **Supabase Database**: All data is stored in Supabase PostgreSQL database
- Auto-save on data entry
- Real-time data synchronization across devices
- Persistent storage with automatic backups

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon public key

2. **Run Database Schema**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL script to create all tables and policies

3. **Configure Environment Variables**
   - Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage Guide

### Creating a Lobby

1. Click "Create New Lobby" on the dashboard
2. Enter lobby name (e.g., "Morning Session")
3. Select the tournament date
4. Add 12 team names (one per slot)
5. Optionally add host notes
6. Click "Create Lobby"

### Entering Match Results

1. Navigate to a lobby from the dashboard
2. For each match (1-6), enter:
   - **Placement**: Select placement (1-12) for each team
   - **Kills**: Enter kill count for each team
3. Points are calculated automatically (Placement Points + Kills)
4. Click "Save Match" to record results
5. Leaderboard updates automatically after each match

### Viewing Results

- **Leaderboard**: See current rankings with all statistics
- **Match History**: Review all completed matches with detailed results
- **Export**: Download CSV or PDF reports

### Managing Multiple Lobbies

- Create multiple lobbies for the same day
- Each lobby tracks independently
- Filter lobbies by date on the dashboard
- Export daily summaries for all lobbies

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **jsPDF** - PDF generation

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard (lobby list)
│   ├── lobby/
│   │   ├── new/page.tsx            # Create new lobby
│   │   └── [id]/page.tsx           # Lobby detail view
│   └── globals.css
├── components/
│   ├── LobbyCard.tsx               # Lobby card for dashboard
│   ├── MatchEntry.tsx              # Match result entry form
│   ├── Leaderboard.tsx             # Leaderboard table
│   └── MatchHistory.tsx            # Match history display
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── storage.ts                  # Supabase database utilities
│   ├── supabase.ts                 # Supabase client configuration
│   └── scoring.ts                  # Point calculation logic
└── utils/
    └── export.ts                   # CSV/PDF export functions
```

## Scoring Rules

### Placement Points
- 1st Place: 12 points
- 2nd Place: 9 points
- 3rd Place: 8 points
- 4th Place: 7 points
- 5th Place: 6 points
- 6th Place: 5 points
- 7th Place: 4 points
- 8th Place: 3 points
- 9th Place: 2 points
- 10th Place: 1 point
- 11th-12th Place: 0 points

### Kill Points
- 1 point per kill

### Tie-breakers (in order)
1. Total Points
2. Number of Booyahs (1st place finishes)
3. Total Kills
4. Total Placement Points

## Database Schema

The application uses the following Supabase tables:
- `lobbies` - Tournament lobby information
- `teams` - Team details for each lobby
- `matches` - Match records
- `match_results` - Individual team results per match

See `supabase-schema.sql` for the complete schema definition.

## Notes

- All data is stored in Supabase PostgreSQL database
- Data persists across devices and sessions
- Export important data regularly for backup
- Each lobby requires exactly 12 teams
- Each match requires all 12 placements to be unique (1-12)
- Row Level Security (RLS) is enabled with public access policies
