import { Lobby, LeaderboardEntry } from '@/lib/types';
import { calculateLeaderboard } from '@/lib/scoring';

/**
 * Export lobby data to CSV format
 */
export function exportLobbyToCSV(lobby: Lobby): void {
  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
  
  // CSV Header
  let csv = 'Rank,Team Name,Slot,Total Points,Booyahs,Total Kills,Placement Points\n';
  
  // Leaderboard data
  leaderboard.forEach(entry => {
    csv += `${entry.rank},${entry.teamName},${entry.slotNumber},${entry.totalPoints},${entry.booyahs},${entry.totalKills},${entry.totalPlacementPoints}\n`;
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
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Rank', 14, yPos);
  doc.text('Team Name', 30, yPos);
  doc.text('Points', 80, yPos);
  doc.text('Booyahs', 95, yPos);
  doc.text('Kills', 110, yPos);
  doc.text('Placement Pts', 125, yPos);
  yPos += 7;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  leaderboard.forEach(entry => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(entry.rank.toString(), 14, yPos);
    doc.text(entry.teamName, 30, yPos);
    doc.text(entry.totalPoints.toString(), 80, yPos);
    doc.text(entry.booyahs.toString(), 95, yPos);
    doc.text(entry.totalKills.toString(), 110, yPos);
    doc.text(entry.totalPlacementPoints.toString(), 125, yPos);
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

