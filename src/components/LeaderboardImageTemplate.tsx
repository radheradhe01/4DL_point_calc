'use client';

import Image from 'next/image';
import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';

interface LeaderboardImageTemplateProps {
  lobby: Lobby;
}

export default function LeaderboardImageTemplate({ lobby }: LeaderboardImageTemplateProps) {
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

  // Instagram portrait post dimensions: 1080x1350 (4:5 aspect ratio) for black background
  const isSquareFormat = isBlackBackground;
  const templateWidth = isSquareFormat ? '1080px' : '1420px';
  const templateHeight = isSquareFormat ? '1350px' : 'auto';
  const minHeight = isSquareFormat ? '1350px' : '1080px';

  return (
    <div
      id="leaderboard-export-template"
      style={{
        width: templateWidth,
        height: templateHeight,
        minHeight: minHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible',
        fontFamily: 'Arial, Helvetica, sans-serif',
        backgroundColor: '#000000', // Fallback background
        boxSizing: 'border-box',
      }}
    >
      {/* Background Image or Black Background - Only covers content area */}
      {(isBlackBackground || backgroundImageUrl) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: isSquareFormat ? '1350px' : '100%',
            minHeight: minHeight,
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

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: isSquareFormat ? 'auto' : '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: isSquareFormat ? '30px' : '60px',
          paddingLeft: '0',
          paddingRight: '0',
          paddingBottom: isSquareFormat ? '30px' : '0',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: isSquareFormat ? '20px' : '30px',
            width: '100%',
          }}
        >
          {/* Tournament Name */}
          <h1
            style={{
              fontSize: isSquareFormat ? '48px' : '64px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: isSquareFormat ? '12px' : '20px',
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {lobby.tournamentName || 'TOURNAMENT'}
          </h1>

          {/* Prize Money + Stage */}
          <div
            style={{
              fontSize: isSquareFormat ? '36px' : '48px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              marginBottom: isSquareFormat ? '10px' : '15px',
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {lobby.prizeMoney} {lobby.tournamentStage.toUpperCase()}
          </div>

          {/* Tagline - Hardcoded */}
          <div
            style={{
              fontSize: isSquareFormat ? '24px' : '32px',
              fontWeight: 'bold',
              color: '#FFD700',
              textTransform: 'uppercase',
              marginBottom: isSquareFormat ? '12px' : '20px',
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
              padding: isSquareFormat ? '8px 30px' : '12px 40px',
              borderRadius: '8px',
              fontSize: isSquareFormat ? '18px' : '24px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginBottom: isSquareFormat ? '20px' : '40px',
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
            top: isSquareFormat ? '30px' : '40px',
            right: isSquareFormat ? '30px' : '40px',
            zIndex: 2,
            width: isSquareFormat ? '80px' : '120px',
            height: isSquareFormat ? '80px' : '120px',
            overflow: 'hidden',
          }}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={isSquareFormat ? 80 : 120}
            height={isSquareFormat ? 80 : 120}
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
            padding: isSquareFormat ? '15px' : '20px',
            width: isSquareFormat ? 'calc(100% - 40px)' : 'fit-content',
            maxWidth: isSquareFormat ? 'calc(100% - 40px)' : '100%',
            margin: isSquareFormat ? '0 auto 20px' : '0 auto 40px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isSquareFormat 
                ? '70px 1fr 60px 80px 80px 90px 60px'
                : '80px 300px 80px 100px 100px 100px 80px',
              gap: isSquareFormat ? '8px' : '10px',
              marginBottom: isSquareFormat ? '10px' : '15px',
              padding: isSquareFormat ? '8px 6px' : '12px 10px',
              backgroundColor: '#FF6B35',
              borderRadius: '6px',
            }}
          >
            {['POS', 'TEAM NAME', 'MATCH', 'PLACE', 'FINISH', 'TOTAL', 'WINS'].map((header) => (
              <div
                key={header}
                style={{
                  color: '#FFFFFF',
                  fontSize: isSquareFormat ? '14px' : '18px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: isSquareFormat ? '6px' : '10px' }}>
            {leaderboard.map((entry) => (
              <div
                key={entry.teamId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isSquareFormat 
                    ? '70px 1fr 60px 80px 80px 90px 60px'
                    : '80px 300px 80px 100px 100px 100px 80px',
                  gap: isSquareFormat ? '8px' : '10px',
                  alignItems: 'center',
                }}
              >
                {/* Position */}
                <div
                  style={{
                    backgroundColor: '#FF6B35',
                    color: '#FFFFFF',
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '16px' : '20px',
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
                    padding: isSquareFormat ? '6px 10px' : '10px 15px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '14px' : '18px',
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
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '14px' : '18px',
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
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '14px' : '18px',
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
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '14px' : '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {entry.totalKills}
                </div>

                {/* Total */}
                <div
                  style={{
                    backgroundColor: '#FFD700',
                    color: '#000000',
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '16px' : '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {entry.totalPoints}
                </div>

                {/* Wins */}
                <div
                  style={{
                    backgroundColor: '#8B0000',
                    color: '#FFFFFF',
                    padding: isSquareFormat ? '6px' : '10px',
                    borderRadius: '6px',
                    fontSize: isSquareFormat ? '14px' : '18px',
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
            marginTop: isSquareFormat ? '20px' : '30px',
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: isSquareFormat ? '12px' : '16px',
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

