'use client';

import Image from 'next/image';
import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';

interface LeaderboardImageTemplateProps {
  lobby: Lobby;
}

export default function LeaderboardImageTemplate({ lobby }: LeaderboardImageTemplateProps) {
  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
  
  // Get background image URL from template ID or fallback to direct URL
  // Template ID is the base filename, try common extensions
  const getBackgroundUrl = () => {
    if (!lobby.backgroundTemplate) return lobby.backgroundImageUrl;
    
    // Try common extensions
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    // For now, default to .jpg - the API will have the correct extension
    return `/backgrounds/${lobby.backgroundTemplate}.jpg`;
  };
  
  const backgroundImageUrl = getBackgroundUrl();

  // Format position with zero padding
  const formatPosition = (rank: number): string => {
    return rank.toString().padStart(2, '0');
  };

  return (
    <div
      id="leaderboard-export-template"
      style={{
        width: '1420px', // Very tight fit: table (1400px) + minimal padding (10px each side)
        minHeight: '1080px',
        position: 'relative',
        overflow: 'visible',
        fontFamily: 'Arial, Helvetica, sans-serif',
        backgroundColor: '#000000', // Fallback background
        boxSizing: 'border-box',
      }}
    >
      {/* Background Image - Only covers content area */}
      {backgroundImageUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minHeight: '1080px',
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
      )}

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '60px',
          paddingLeft: '0',
          paddingRight: '0',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
            width: '100%',
          }}
        >
          {/* Tournament Name */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FFFFFF',
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
              backgroundColor: '#FFD700',
              color: '#000000',
              padding: '12px 40px',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: '40px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            OVERALL STANDINGS
          </div>
        </div>

        {/* Logo - Top Right */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px', // Match vertical spacing
            zIndex: 2,
            width: '120px',
            height: '120px',
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

        {/* Leaderboard Table */}
        <div
          id="leaderboard-table-container"
          style={{
            backgroundColor: '#2D2D2D',
            borderRadius: '12px',
            padding: '20px',
            width: 'fit-content', // Dynamic width based on content
            maxWidth: '100%', // Prevent overflow
            margin: '0 auto 40px', // Center horizontally
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
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
              backgroundColor: '#FF6B35', // Orange background for header
              borderRadius: '6px',
            }}
          >
            {['POS', 'TEAM NAME', 'MATCH', 'PLACE', 'FINISH', 'TOTAL', 'WINS'].map((header) => (
              <div
                key={header}
                style={{
                  color: '#FFFFFF', // White text on orange background
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
                    backgroundColor: '#FF6B35',
                    color: '#FFFFFF',
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
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '300px',
                    minWidth: '200px',
                  }}
                  title={entry.teamName} // Show full name on hover
                >
                  {entry.teamName}
                </div>

                {/* Match */}
                <div
                  style={{
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
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
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
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
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
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
                    backgroundColor: '#FFD700', // Yellow background for TOTAL
                    color: '#000000', // Black text on yellow
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
                    backgroundColor: '#8B0000', // Red background for WINS (same as other data columns)
                    color: '#FFFFFF',
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

        {/* Attribution */}
        <div
          style={{
            marginTop: '30px',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '500',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          Powered By 4DL ESPORTS
        </div>
      </div>
    </div>
  );
}

