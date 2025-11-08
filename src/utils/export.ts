import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';
import { toPng } from 'html-to-image';
import React from 'react';
import { createRoot } from 'react-dom/client';
import LeaderboardImageTemplate from '@/components/LeaderboardImageTemplate';
import { ThemeProvider } from '@/context/ThemeProvider';

/**
 * Export lobby data to CSV format
 */
export function exportLobbyToCSV(lobby: Lobby): void {
  const playingTeams = lobby.teams.slice(0, lobby.playingTeams || lobby.teams.length);
  const leaderboard = calculateLeaderboard(playingTeams, lobby.matches);
  
  // CSV Header - New column order: Rank (Pos), Team Name, Match, Placement points, Kill points, Total points, Wins
  let csv = 'Rank (Pos),Team Name,Match,Placement points,Kill points,Total points,Wins\n';
  
  // Leaderboard data
  leaderboard.forEach(entry => {
    csv += `${entry.rank},${entry.teamName},${entry.matchesPlayed},${entry.totalPlacementPoints},${entry.totalKills},${entry.totalPoints},${entry.booyahs}\n`;
  });
  
  // Add match details
  csv += '\n\nMatch Details\n';
  csv += 'Match,Team Name,Placement,Kills,Points\n';
  
  lobby.matches.forEach(match => {
    match.results.forEach(result => {
      const team = lobby.teams.find(t => t.id === result.teamId);
      csv += `${match.matchNumber},${team?.name || 'Unknown'},${result.placement},${result.kills},${result.points}\n`;
    });
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${lobby.name}_${lobby.date}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export lobby leaderboard to PDF
 */
export async function exportLobbyToPDF(lobby: Lobby): Promise<void> {
  // Dynamic import for client-side only
  const { default: jsPDF } = await import('jspdf');
  const playingTeams = lobby.teams.slice(0, lobby.playingTeams || lobby.teams.length);
  const leaderboard = calculateLeaderboard(playingTeams, lobby.matches);
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(lobby.name, 14, 20);
  doc.setFontSize(12);
  doc.text(`Date: ${lobby.date}`, 14, 30);
  doc.text(`Status: ${lobby.status}`, 14, 36);
  
  // Leaderboard table
  let yPos = 50;
  doc.setFontSize(14);
  doc.text('Final Leaderboard', 14, yPos);
  yPos += 10;
  
  // Table headers - New column order: Rank (Pos), Team Name, Match, Placement points, Kill points, Total points, Wins
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Rank (Pos)', 14, yPos);
  doc.text('Team Name', 30, yPos);
  doc.text('Match', 70, yPos);
  doc.text('Placement', 80, yPos);
  doc.text('Kill', 95, yPos);
  doc.text('Total', 105, yPos);
  doc.text('Wins', 115, yPos);
  yPos += 7;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  leaderboard.forEach(entry => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      // Redraw headers on new page
      doc.setFont('helvetica', 'bold');
      doc.text('Rank (Pos)', 14, yPos);
      doc.text('Team Name', 30, yPos);
      doc.text('Match', 70, yPos);
      doc.text('Placement', 80, yPos);
      doc.text('Kill', 95, yPos);
      doc.text('Total', 105, yPos);
      doc.text('Wins', 115, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
    }
    doc.text(entry.rank.toString(), 14, yPos);
    doc.text(entry.teamName.substring(0, 12), 30, yPos); // Truncate long names
    doc.text(entry.matchesPlayed.toString(), 70, yPos);
    doc.text(entry.totalPlacementPoints.toString(), 80, yPos);
    doc.text(entry.totalKills.toString(), 95, yPos);
    doc.text(entry.totalPoints.toString(), 105, yPos);
    doc.text(entry.booyahs.toString(), 115, yPos);
    yPos += 7;
  });
  
  // Match details
  yPos += 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(14);
  doc.text('Match Details', 14, yPos);
  yPos += 10;
  
  lobby.matches.forEach(match => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Match ${match.matchNumber}`, 14, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    match.results
      .sort((a, b) => {
        const aPlacement = a.placement ?? 999;
        const bPlacement = b.placement ?? 999;
        return aPlacement - bPlacement;
      })
      .forEach(result => {
        const team = lobby.teams.find(t => t.id === result.teamId);
        doc.text(`${result.placement}. ${team?.name || 'Unknown'} - ${result.kills} kills - ${result.points} pts`, 20, yPos);
        yPos += 6;
      });
    yPos += 5;
  });
  
  // Save PDF
  doc.save(`${lobby.name}_${lobby.date}.pdf`);
}

/**
 * Export daily summary (all lobbies for a date) to CSV
 */
export function exportDailySummary(lobbies: Lobby[], date: string): void {
  let csv = `Daily Tournament Summary - ${date}\n\n`;
  
  lobbies.forEach(lobby => {
    const lobbyPlayingTeams = lobby.teams.slice(0, lobby.playingTeams || lobby.teams.length);
    const leaderboard = calculateLeaderboard(lobbyPlayingTeams, lobby.matches);
    const winner = leaderboard[0];
    
    csv += `${lobby.name}\n`;
    csv += `Winner: ${winner?.teamName || 'N/A'} (${winner?.totalPoints || 0} pts, ${winner?.booyahs || 0} Booyahs)\n`;
    csv += `Status: ${lobby.status}\n`;
    csv += `Matches Completed: ${lobby.matches.length}/6\n\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Daily_Summary_${date}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export leaderboard as PNG image with tournament branding
 */
export async function exportLeaderboardAsImage(lobby: Lobby): Promise<void> {
  try {
    // 3:4 aspect ratio (width:height) - e.g., 1500px width = 2000px height
    const templateWidth = 1500;
    const templateHeight = 2000;
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${templateWidth}px`;
    container.style.height = `${templateHeight}px`;
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    // Create React root and render template
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(
          ThemeProvider,
          { templateId: lobby.backgroundTemplate },
          React.createElement(LeaderboardImageTemplate, { lobby })
        )
      );
      
      // Wait for images and content to render
      setTimeout(() => {
        const templateElement = container.querySelector('#leaderboard-export-template');
        if (templateElement) {
          // Get background image URL from template ID or direct URL
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
          
          // Wait for background image to load if present (not for black background)
          if (backgroundImageUrl && !isBlackBackground) {
            const img: HTMLImageElement = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              setTimeout(resolve, 800); // Extra time for full rendering
            };
            img.onerror = () => {
              setTimeout(resolve, 800); // Continue even if image fails
            };
            img.src = backgroundImageUrl;
          } else {
            setTimeout(resolve, 800);
          }
        } else {
          setTimeout(resolve, 1000);
        }
      }, 200);
    });

    // Find the template element
    const templateElement = container.querySelector('#leaderboard-export-template') as HTMLElement;
    
    if (!templateElement) {
      throw new Error('Template element not found');
    }

    // Wait for layout to fully settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // CRITICAL: Force exact 3:4 dimensions - prevent content from shrinking
    // Use minWidth/minHeight to ensure element never shrinks below target size
    templateElement.style.width = `${templateWidth}px`;
    templateElement.style.height = `${templateHeight}px`;
    templateElement.style.minWidth = `${templateWidth}px`;
    templateElement.style.minHeight = `${templateHeight}px`;
    templateElement.style.maxWidth = `${templateWidth}px`;
    templateElement.style.maxHeight = `${templateHeight}px`;
    templateElement.style.margin = '0';
    templateElement.style.padding = '60px 40px'; // Explicit padding to match component
    templateElement.style.boxSizing = 'border-box';
    templateElement.style.overflow = 'visible'; // Allow content to be visible
    templateElement.style.display = 'flex';
    templateElement.style.flexDirection = 'column';
    templateElement.style.justifyContent = 'space-between';
    templateElement.style.alignItems = 'center';
    templateElement.style.flexShrink = '0'; // Prevent flex shrinking

    // Update container to match exactly
    container.style.width = `${templateWidth}px`;
    container.style.height = `${templateHeight}px`;
    container.style.minWidth = `${templateWidth}px`;
    container.style.minHeight = `${templateHeight}px`;
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.overflow = 'visible'; // Changed from hidden to visible
    container.style.boxSizing = 'border-box';

    // Update background div to match exact dimensions
    const backgroundDiv = templateElement.querySelector('div[style*="backgroundImage"], div[style*="backgroundColor: #000000"]') as HTMLElement;
    if (backgroundDiv) {
      backgroundDiv.style.width = `${templateWidth}px`;
      backgroundDiv.style.height = `${templateHeight}px`;
      backgroundDiv.style.minWidth = `${templateWidth}px`;
      backgroundDiv.style.minHeight = `${templateHeight}px`;
      backgroundDiv.style.margin = '0';
      backgroundDiv.style.padding = '0';
      backgroundDiv.style.boxSizing = 'border-box';
      backgroundDiv.style.position = 'absolute';
      backgroundDiv.style.top = '0';
      backgroundDiv.style.left = '0';
    }

    // Ensure all flex children don't shrink
    const flexChildren = templateElement.querySelectorAll('header, footer, #leaderboard-table-container');
    flexChildren.forEach((child) => {
      (child as HTMLElement).style.flexShrink = '0';
    });

    // Wait for all dimension changes to apply and force reflow
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force a reflow to ensure dimensions are applied
    void templateElement.offsetHeight;

    // Convert to PNG - let html-to-image read the actual computed dimensions
    // But explicitly set width/height to ensure correct output
    const dataUrl = await toPng(templateElement, {
      quality: 1.0,
      pixelRatio: 2, // Higher resolution
      backgroundColor: '#000000', // Fallback background
      cacheBust: true,
      width: templateWidth,
      height: templateHeight,
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${lobby.tournamentName || lobby.name}_${lobby.date}.png`;
    link.href = dataUrl;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error exporting leaderboard as image:', error);
    throw new Error('Failed to export image. Please try again.');
  }
}

