import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';
import { toPng } from 'html-to-image';
import React from 'react';
import { createRoot } from 'react-dom/client';
import LeaderboardImageTemplate from '@/components/LeaderboardImageTemplate';

/**
 * Export lobby data to CSV format
 */
export function exportLobbyToCSV(lobby: Lobby): void {
  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
  
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
  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
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
      .sort((a, b) => a.placement - b.placement)
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
    const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
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
    // Create a temporary container - no fixed height, let content determine it
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1420px'; // Match template width - tight fit
    container.style.overflow = 'visible'; // Allow content to expand
    document.body.appendChild(container);

    // Create React root and render template
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(LeaderboardImageTemplate, { lobby })
      );
      
      // Wait for images and content to render
      setTimeout(() => {
        const templateElement = container.querySelector('#leaderboard-export-template');
        if (templateElement) {
          // Get background image URL from template ID or direct URL
          // Template ID is the base filename, so we construct the path
          const backgroundImageUrl = lobby.backgroundTemplate 
            ? `/backgrounds/${lobby.backgroundTemplate}.jpg` // Try .jpg first
            : lobby.backgroundImageUrl;
          
          // Wait for background image to load if present
          if (backgroundImageUrl) {
            const img = new window.Image();
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

    // Helper function to find table element with multiple fallback strategies
    const findTableElement = (): HTMLElement => {
      // Try ID selector first (most reliable)
      let table = templateElement.querySelector('#leaderboard-table-container') as HTMLElement;
      if (table) return table;
      
      // Try style attribute selector
      table = templateElement.querySelector('div[style*="backgroundColor: #2D2D2D"]') as HTMLElement;
      if (table) return table;
      
      // Try finding by width attribute
      const allDivs = templateElement.querySelectorAll('div');
      for (const div of Array.from(allDivs)) {
        const style = div.getAttribute('style') || '';
        if (style.includes('width: 1400px') || style.includes('width:1400px')) {
          return div as HTMLElement;
        }
      }
      
      throw new Error('Table element not found. Template may not have rendered correctly.');
    };

    // Get the table element
    const tableElement = findTableElement();
    
    // Get bounding boxes of all key elements to find the actual content width
    const tableRect = tableElement.getBoundingClientRect();
    const templateRect = templateElement.getBoundingClientRect();
    
    // Find the rightmost edge of all content
    let rightmostEdge = tableRect.right - templateRect.left;
    
    // Check logo position
    const logoElement = templateElement.querySelector('div[style*="position: absolute"]') as HTMLElement;
    if (logoElement) {
      const logoRect = logoElement.getBoundingClientRect();
      const logoRightEdge = logoRect.right - templateRect.left;
      rightmostEdge = Math.max(rightmostEdge, logoRightEdge);
    }
    
    // Check header/button elements
    const headerElements = templateElement.querySelectorAll('h1, div[style*="OVERALL STANDINGS"]');
    for (const elem of Array.from(headerElements)) {
      const elemRect = (elem as HTMLElement).getBoundingClientRect();
      const elemRightEdge = elemRect.right - templateRect.left;
      rightmostEdge = Math.max(rightmostEdge, elemRightEdge);
    }
    
    // Check footer/attribution
    const footerElement = templateElement.querySelector('div[style*="By Pointcalc"]') as HTMLElement;
    if (footerElement) {
      const footerRect = footerElement.getBoundingClientRect();
      const footerRightEdge = footerRect.right - templateRect.left;
      rightmostEdge = Math.max(rightmostEdge, footerRightEdge);
    }
    
    // Calculate exact content width: rightmost edge + minimal padding (5px for safety)
    const contentWidth = Math.ceil(rightmostEdge + 5);
    
    // Get actual content height
    const contentHeight = Math.max(
      templateElement.scrollHeight,
      templateElement.offsetHeight,
      1080 // Minimum height
    );

    // Set exact dimensions on template element - remove all extra space
    templateElement.style.margin = '0';
    templateElement.style.padding = '0';
    templateElement.style.height = `${contentHeight}px`;
    templateElement.style.width = `${contentWidth}px`;
    templateElement.style.boxSizing = 'border-box';
    templateElement.style.overflow = 'hidden';
    templateElement.style.display = 'block';

    // Update container to match exactly
    container.style.width = `${contentWidth}px`;
    container.style.height = 'auto';
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';

    // Update background div to match exact content dimensions
    const backgroundDiv = templateElement.querySelector('div[style*="backgroundImage"]') as HTMLElement;
    if (backgroundDiv) {
      backgroundDiv.style.height = `${contentHeight}px`;
      backgroundDiv.style.width = `${contentWidth}px`;
      backgroundDiv.style.margin = '0';
      backgroundDiv.style.padding = '0';
      backgroundDiv.style.boxSizing = 'border-box';
    }

    // Remove padding from content container to eliminate extra space
    const contentContainer = templateElement.querySelector('div[style*="flexDirection: column"]') as HTMLElement;
    if (contentContainer) {
      contentContainer.style.paddingLeft = '0';
      contentContainer.style.paddingRight = '0';
      contentContainer.style.width = '100%';
      contentContainer.style.boxSizing = 'border-box';
    }

    // Wait for all dimension changes to apply
    await new Promise(resolve => setTimeout(resolve, 300));

    // Convert to PNG using html-to-image - use exact rendered dimensions
    const dataUrl = await toPng(templateElement, {
      quality: 1.0,
      pixelRatio: 2, // Higher resolution
      backgroundColor: '#000000', // Fallback background
      cacheBust: true,
      // Don't specify width/height - let it use the element's actual rendered size
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

