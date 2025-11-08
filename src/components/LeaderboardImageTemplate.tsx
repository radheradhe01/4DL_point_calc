'use client';

import Image from 'next/image';
import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';
import { useTheme } from '@/context/ThemeProvider';

interface LeaderboardImageTemplateProps {
  lobby: Lobby;
}

export default function LeaderboardImageTemplate({ lobby }: LeaderboardImageTemplateProps) {
  const { theme } = useTheme();
  const playingTeams = lobby.teams.slice(0, lobby.playingTeams || lobby.teams.length);
  const leaderboard = calculateLeaderboard(playingTeams, lobby.matches);
  
  // Get background image URL from template ID or fallback to direct URL
  // Handle black template specially (no image, just CSS background)
  const isBlackBackground = lobby.backgroundTemplate === 'black';
  
  const getBackgroundUrl = () => {
    if (isBlackBackground) return undefined;
    if (!lobby.backgroundTemplate) return lobby.backgroundImageUrl;
    
    // Use absolute URL for Vercel deployment compatibility
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/backgrounds/${lobby.backgroundTemplate}.jpg`;
    }
    return `/backgrounds/${lobby.backgroundTemplate}.jpg`;
  };
  
  const backgroundImageUrl = getBackgroundUrl();

  // Format position with zero padding
  const formatPosition = (rank: number): string => {
    return rank.toString().padStart(2, '0');
  };

  // 7:10 aspect ratio (height:width) - e.g., 1400px width = 2000px height
  // This ensures consistent portrait orientation for all exports
  const templateWidth = '1400px';
  const templateHeight = '2000px';

  return (
    <div
      id="leaderboard-export-template"
      style={{
        width: templateWidth,
        height: templateHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Distributes header, table, footer evenly
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
        backgroundColor: '#000000', // Fallback background
        boxSizing: 'border-box',
        padding: '60px 40px', // Safe padding zones
      }}
    >
      {/* Background Image or Black Background */}
      {(isBlackBackground || backgroundImageUrl) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            ...(isBlackBackground
              ? { backgroundColor: '#000000' }
              : {
                  backgroundImage: `url(${backgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }),
            zIndex: 0,
          }}
        />
      )}

      {/* Header Section - Flexbox will position at top */}
      <header
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {/* Logo - Positioned in header, aligned right */}
        <div
          style={{
            alignSelf: 'flex-end',
            width: '120px',
            height: '120px',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={120}
            style={{
              objectFit: 'contain',
              display: 'block',
              margin: 0,
              padding: 0,
            }}
          />
        </div>

        {/* Tournament Name */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: theme.headerText,
            textTransform: 'uppercase',
            margin: 0,
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          {lobby.tournamentName || 'TOURNAMENT'}
        </h1>

        {/* Prize Money + Stage */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '15px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          {lobby.prizeMoney} {lobby.tournamentStage.toUpperCase()}
        </div>

        {/* Tagline - Hardcoded */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFD700',
            textTransform: 'uppercase',
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          4 DYNAMIC LORDS
        </div>

        {/* Standings Banner */}
        <div
          style={{
            backgroundColor: theme.totalBg,
            color: theme.totalFg,
            padding: '12px 40px',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          OVERALL STANDINGS
        </div>
      </header>

      {/* Leaderboard Table - Flexbox will position in middle */}
      <div
        id="leaderboard-table-container"
        style={{
          backgroundColor: '#2D2D2D',
          borderRadius: '12px',
          padding: '20px',
          width: 'fit-content',
          maxWidth: 'calc(100% - 80px)', // Responsive to padding
          margin: '0 auto',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 300px 80px 100px 100px 100px 80px',
              gap: '10px',
              marginBottom: '15px',
              padding: '12px 10px',
              backgroundColor: theme.headerBg,
              borderRadius: '6px',
            }}
          >
            {['POS', 'TEAM NAME', 'MATCH', 'PLACE', 'FINISH', 'TOTAL', 'WINS'].map((header) => (
              <div
                key={header}
                style={{
                  color: theme.headerText,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  textAlign: header === 'TEAM NAME' ? 'left' : 'center',
                }}
              >
                {header}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaderboard.map((entry) => (
              <div
                key={entry.teamId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 300px 80px 100px 100px 100px 80px',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                {/* Position */}
                <div
                  style={{
                    backgroundColor: theme.headerBg,
                    color: theme.headerText,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {formatPosition(entry.rank)}
                </div>

                {/* Team Name */}
                <div
                  style={{
                    backgroundColor: theme.winsBg,
                    color: theme.winsFg,
                    padding: '10px 15px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={entry.teamName}
                >
                  {entry.teamName}
                </div>

                {/* Match */}
                <div
                  style={{
                    backgroundColor: theme.winsBg,
                    color: theme.winsFg,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {entry.matchesPlayed}
                </div>

                {/* Place (Placement Points) */}
                <div
                  style={{
                    backgroundColor: theme.winsBg,
                    color: theme.winsFg,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {entry.totalPlacementPoints}
                </div>

                {/* Finish (Kill Points) */}
                <div
                  style={{
                    backgroundColor: theme.winsBg,
                    color: theme.winsFg,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {entry.totalKills}
                </div>

                {/* Total */}
                <div
                  style={{
                    backgroundColor: theme.totalBg,
                    color: theme.totalFg,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {entry.totalPoints}
                </div>

                {/* Wins */}
                <div
                  style={{
                    backgroundColor: theme.winsBg,
                    color: theme.winsFg,
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {entry.booyahs}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Footer Section - Flexbox will position at bottom */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: '500',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          flexShrink: 0,
        }}
      >
        Powered By 4DL ESPORTS
      </footer>
    </div>
  );
}

