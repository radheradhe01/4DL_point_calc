'use client';

import { useState, useEffect } from 'react';
import { getPointsTemplate } from '@/lib/pointsTemplates';

export default function PointsTemplatePositioningTool() {
  const template = getPointsTemplate('wildwest_v1');
  const [position, setPosition] = useState(template.tablePosition);
  const [columnWidths, setColumnWidths] = useState(template.columnWidths);
  const [rowHeight, setRowHeight] = useState(template.rowHeight);
  const [headerRowHeight, setHeaderRowHeight] = useState(template.headerRowHeight);

  // Get background image URL

  const getBackgroundUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${template.imageUrl}`;
    }
    return template.imageUrl;
  };

  const backgroundImageUrl = getBackgroundUrl();
  const gridTemplateColumns = columnWidths.map(w => `${w}px`).join(' ');

  // Sample data for preview - 12 teams
  const sampleData = [
    { rank: 1, teamName: 'TFG ESPORTS', matchesPlayed: 1, totalPlacementPoints: 8, totalKills: 23, totalPoints: 31, booyahs: 0 },
    { rank: 2, teamName: 'OLD SKOOL', matchesPlayed: 1, totalPlacementPoints: 12, totalKills: 16, totalPoints: 28, booyahs: 1 },
    { rank: 3, teamName: 'SOUL EATERS', matchesPlayed: 1, totalPlacementPoints: 9, totalKills: 14, totalPoints: 23, booyahs: 0 },
    { rank: 4, teamName: 'UK ESPORTS', matchesPlayed: 1, totalPlacementPoints: 7, totalKills: 5, totalPoints: 12, booyahs: 0 },
    { rank: 5, teamName: 'ELITE FORCE', matchesPlayed: 1, totalPlacementPoints: 6, totalKills: 4, totalPoints: 10, booyahs: 0 },
    { rank: 6, teamName: 'PARLE HARA ESPORTS', matchesPlayed: 1, totalPlacementPoints: 5, totalKills: 4, totalPoints: 9, booyahs: 0 },
    { rank: 7, teamName: 'SKILLED ESPORTS', matchesPlayed: 1, totalPlacementPoints: 4, totalKills: 3, totalPoints: 7, booyahs: 0 },
    { rank: 8, teamName: 'United Bengal Esports', matchesPlayed: 1, totalPlacementPoints: 3, totalKills: 0, totalPoints: 3, booyahs: 0 },
    { rank: 9, teamName: 'ELMAS ESPORTS', matchesPlayed: 0, totalPlacementPoints: 0, totalKills: 0, totalPoints: 0, booyahs: 0 },
    { rank: 10, teamName: 'SOUL SOCIETY', matchesPlayed: 0, totalPlacementPoints: 0, totalKills: 0, totalPoints: 0, booyahs: 0 },
    { rank: 11, teamName: 'EXO TEAM', matchesPlayed: 0, totalPlacementPoints: 0, totalKills: 0, totalPoints: 0, booyahs: 0 },
    { rank: 12, teamName: 'THE TITANS', matchesPlayed: 0, totalPlacementPoints: 0, totalKills: 0, totalPoints: 0, booyahs: 0 },
  ];

  const formatPosition = (rank: number): string => {
    return rank.toString().padStart(2, '0');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>Points Template Positioning Tool</h1>
      
      {/* Controls */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Left (X):</label>
          <input
            type="number"
            value={position.left}
            onChange={(e) => setPosition({ ...position, left: parseInt(e.target.value) || 0 })}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Top (Y):</label>
          <input
            type="number"
            value={position.top}
            onChange={(e) => setPosition({ ...position, top: parseInt(e.target.value) || 0 })}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Width:</label>
          <input
            type="number"
            value={position.width}
            onChange={(e) => setPosition({ ...position, width: parseInt(e.target.value) || 0 })}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Height:</label>
          <input
            type="number"
            value={position.height}
            onChange={(e) => setPosition({ ...position, height: parseInt(e.target.value) || 0 })}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Row Height:</label>
          <input
            type="number"
            value={rowHeight}
            onChange={(e) => setRowHeight(parseInt(e.target.value) || 80)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Header Height:</label>
          <input
            type="number"
            value={headerRowHeight}
            onChange={(e) => setHeaderRowHeight(parseInt(e.target.value) || 50)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
      </div>

      {/* Column Widths */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Column Widths:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['POS', 'TEAM NAME', 'MATCH', 'PLACE.', 'FINISH', 'TOTAL', 'WINS'].map((col, idx) => (
            <div key={idx}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>{col}:</label>
              <input
                type="number"
                value={columnWidths[idx]}
                onChange={(e) => {
                  const newWidths = [...columnWidths];
                  newWidths[idx] = parseInt(e.target.value) || 80;
                  setColumnWidths(newWidths);
                }}
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ 
        border: '2px solid #333', 
        borderRadius: '8px', 
        overflow: 'auto',
        maxWidth: '100%',
        backgroundColor: '#000'
      }}>
        <div
          style={{
            width: `${template.width}px`,
            height: `${template.height}px`,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000000',
            margin: '0 auto',
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

          {/* Overlay Grid Preview */}
          <div
            style={{
              position: 'absolute',
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              border: '2px solid rgba(0, 255, 0, 0.5)',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />

          {/* Table Overlay */}
          <div
            style={{
              position: 'absolute',
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
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

            {/* Sample Data Rows */}
            {sampleData.map((entry, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridTemplateColumns,
                  height: `${rowHeight}px`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...template.textStyles.goldCells, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {formatPosition(entry.rank)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...template.textStyles.data, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.teamName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...template.textStyles.data, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.matchesPlayed}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...template.textStyles.data, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.totalPlacementPoints}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...template.textStyles.data, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.totalKills}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...(template.textStyles.totalCell || template.textStyles.goldCells), textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.totalPoints}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...template.textStyles.data, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  {entry.booyahs}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* JSON Output */}
      <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>Copy this JSON to meta.json:</h3>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '12px'
        }}>
{JSON.stringify({
  tablePosition: position,
  columnWidths,
  rowHeight,
  headerRowHeight,
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
