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

  // 3:4 aspect ratio (width:height) - e.g., 1500px width = 2000px height
  // This ensures consistent portrait orientation for all exports
  const templateWidth = '1500px';
  const templateHeight = '2000px';

  return (
    <div
      id="leaderboard-export-template"
      style={{
        width: templateWidth,
        height: templateHeight,
        minWidth: templateWidth, // Prevent shrinking
        minHeight: templateHeight, // Prevent shrinking
        maxWidth: templateWidth, // Prevent expanding
        maxHeight: templateHeight, // Prevent expanding
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
        flexShrink: 0, // Prevent flex parent from shrinking this
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

      {/* Leaderboard Table - Modern Glassmorphism Design */}
      <div
        id="leaderboard-table-container"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '16px',
          padding: '24px 32px',
          width: 'fit-content',
          maxWidth: 'calc(100% - 80px)',
          margin: '0 auto',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 2px rgba(255, 255, 255, 0.08)
          `,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
          {/* Table Header - Modern Gradient Design */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 300px 80px 100px 100px 100px 80px',
              gap: '12px',
              marginBottom: '16px',
              padding: '14px 12px',
              background: `linear-gradient(135deg, ${theme.headerBg} 0%, ${theme.headerBg}dd 50%, ${theme.headerBg}aa 100%)`,
              borderRadius: '10px',
              borderTop: `2px solid ${theme.headerBg}`,
              boxShadow: `
                0 4px 12px rgba(0, 0, 0, 0.4),
                0 0 8px 2px ${theme.headerBg}40,
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            {['POS', 'TEAM NAME', 'MATCH', 'PLACE', 'FINISH', 'TOTAL', 'WINS'].map((header) => (
              <div
                key={header}
                style={{
                  color: theme.headerText,
                  fontSize: '16px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  textAlign: header === 'TEAM NAME' ? 'left' : 'center',
                  letterSpacing: '0.05em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {header}
              </div>
            ))}
          </div>

          {/* Table Rows - Modern Accent-Based Design */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.teamId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 300px 80px 100px 100px 100px 80px',
                  gap: '12px',
                  alignItems: 'center',
                  backgroundColor: 'rgba(18, 18, 18, 0.7)',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: `
                    0 2px 8px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                }}
              >
                {/* Position - Accent Border */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: theme.headerText,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '20px',
                    fontWeight: '700',
                    textAlign: 'center',
                    borderLeft: `4px solid ${theme.headerBg}`,
                    boxShadow: `0 0 8px ${theme.headerBg}30`,
                    letterSpacing: '0.05em',
                  }}
                >
                  {formatPosition(entry.rank)}
                </div>

                {/* Team Name - Accent Border */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: '#FFFFFF',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderLeft: `4px solid ${theme.winsBg}`,
                    boxShadow: `0 0 8px ${theme.winsBg}20`,
                  }}
                  title={entry.teamName}
                >
                  {entry.teamName}
                </div>

                {/* Match - Neutral with subtle accent */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderLeft: '4px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {entry.matchesPlayed}
                </div>

                {/* Place (Placement Points) - Neutral */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderLeft: '4px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {entry.totalPlacementPoints}
                </div>

                {/* Finish (Kill Points) - Neutral */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderLeft: '4px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {entry.totalKills}
                </div>

                {/* Total - Highlight with Glow */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${theme.totalBg}dd 0%, ${theme.totalBg}aa 100%)`,
                    color: theme.totalFg,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '20px',
                    fontWeight: '700',
                    textAlign: 'center',
                    border: `1px solid ${theme.totalBg}`,
                    boxShadow: `
                      0 0 12px ${theme.totalBg}50,
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `,
                    letterSpacing: '0.03em',
                  }}
                >
                  {entry.totalPoints}
                </div>

                {/* Wins - Accent Border */}
                <div
                  style={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    color: theme.winsFg,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderLeft: `4px solid ${theme.winsBg}`,
                    boxShadow: `0 0 8px ${theme.winsBg}30`,
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

