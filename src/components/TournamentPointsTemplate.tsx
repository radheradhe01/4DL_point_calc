'use client';

import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';
import { usePointsTemplate } from '@/context/PointsTemplateProvider';

interface TournamentPointsTemplateProps {
  lobby: Lobby;
}

export default function TournamentPointsTemplate({ lobby }: TournamentPointsTemplateProps) {
  const { template } = usePointsTemplate();
  const playingTeams = lobby.teams.slice(0, lobby.playingTeams || lobby.teams.length);
  const leaderboard = calculateLeaderboard(playingTeams, lobby.matches);

  // Format position with zero padding
  const formatPosition = (rank: number): string => {
    return rank.toString().padStart(2, '0');
  };

  // Ensure we have exactly 12 rows (fill empty rows if needed)
  const displayRows: (LeaderboardEntry | null)[] = [];
  for (let i = 0; i < template.rows; i++) {
    displayRows.push(leaderboard[i] || null);
  }

  // Get background image URL
  const getBackgroundUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${template.imageUrl}`;
    }
    return template.imageUrl;
  };

  const backgroundImageUrl = getBackgroundUrl();
  const { tablePosition, columnWidths, rowHeight, headerRowHeight, textStyles } = template;
  const gridTemplateColumns = columnWidths.map(w => `${w}px`).join(' ');

  return (
    <div
      id="tournament-points-template"
      style={{
        width: `${template.width}px`,
        height: `${template.height}px`,
        minWidth: `${template.width}px`,
        minHeight: `${template.height}px`,
        maxWidth: `${template.width}px`,
        maxHeight: `${template.height}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000000',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* Full Template Image as Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* Table Overlay - Absolute positioned grid matching template */}
      <div
        style={{
          position: 'absolute',
          left: `${tablePosition.left}px`,
          top: `${tablePosition.top}px`,
          width: `${tablePosition.width}px`,
          height: `${tablePosition.height}px`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Header Row - Empty, titles are in background image */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplateColumns,
            height: `${headerRowHeight}px`,
            marginBottom: '0px',
          }}
        >
          {/* Empty header cells - titles are part of the background image */}
          {template.cols.map((colKey, colIndex) => (
            <div
              key={`header-${colIndex}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: colIndex === 1 ? 'flex-start' : 'center',
                paddingLeft: colIndex === 1 ? '10px' : '0',
              }}
            >
              {/* No text - titles are in background */}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {displayRows.map((entry, rowIndex) => {
          return (
            <div
              key={`row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns,
                height: `${rowHeight}px`,
              }}
            >
              {/* POS - Gold cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.goldCells,
                }}
              >
                {entry ? formatPosition(entry.rank) : ''}
              </div>

              {/* TEAM NAME - Red cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: '10px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...textStyles.data,
                }}
                title={entry?.teamName || ''}
              >
                {entry?.teamName || ''}
              </div>

              {/* MATCH - Red cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.data,
                }}
              >
                {entry?.matchesPlayed || ''}
              </div>

              {/* PLACE. - Red cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.data,
                }}
              >
                {entry?.totalPlacementPoints || ''}
              </div>

              {/* FINISH - Red cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.data,
                }}
              >
                {entry?.totalKills || ''}
              </div>

              {/* TOTAL - Gold cell with black text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.totalCell,
                }}
              >
                {entry?.totalPoints || ''}
              </div>

              {/* WINS - Red cell */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...textStyles.data,
                }}
              >
                {entry?.booyahs || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
