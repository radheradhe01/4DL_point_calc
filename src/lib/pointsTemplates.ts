// Points template metadata
// Note: In production, these should be loaded dynamically or from a config file
const wildwestMeta = {
  id: 'wildwest_v1',
  name: 'Wild West',
  description: 'Red and gold tournament standings template with character art',
  width: 1500,
  height: 2000,
  rows: 12,
  cols: ['pos', 'team', 'match', 'place', 'finish', 'total', 'wins'],
  imageUrl: '/pointsTemplates/wildwest_v1/full.jpg',
  tablePosition: {
    left: 69,
    top: 704,
    width: 1140,
    height: 1026,
  },
  columnWidths: [333, 302, 176, 84, 137, 129, 80],
  rowHeight: 82,
  headerRowHeight: 50,
  textStyles: {
    header: {
      fontSize: 20,
      fontWeight: 700,
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    },
    data: {
      fontSize: 22,
      fontWeight: 600,
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    },
    goldCells: {
      fontSize: 24,
      fontWeight: 700,
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    },
    totalCell: {
      fontSize: 24,
      fontWeight: 700,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
    },
  },
  themeDefaults: {
    headerBg: '#be0d05',
    cellBg: '#7f0000',
    cellBorder: '#bfa137',
    accentGold: '#FFD700',
    textWhite: '#FFFFFF',
    textBlack: '#000000',
  },
};

export interface PointsTemplateMeta {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  rows: number;
  cols: string[];
  imageUrl: string;
  tablePosition: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  columnWidths: number[];
  rowHeight: number;
  headerRowHeight: number;
  textStyles: {
    header: {
      fontSize: number;
      fontWeight: number;
      color: string;
      fontFamily: string;
    };
    data: {
      fontSize: number;
      fontWeight: number;
      color: string;
      fontFamily: string;
    };
    goldCells: {
      fontSize: number;
      fontWeight: number;
      color: string;
      fontFamily: string;
    };
    totalCell: {
      fontSize: number;
      fontWeight: number;
      color: string;
      fontFamily: string;
    };
  };
  themeDefaults: {
    headerBg: string;
    cellBg: string;
    cellBorder: string;
    accentGold: string;
    textWhite: string;
    textBlack: string;
  };
}

export const pointsTemplates: Record<string, PointsTemplateMeta> = {
  [wildwestMeta.id]: wildwestMeta as PointsTemplateMeta,
};

export function getPointsTemplate(id: string | undefined | null): PointsTemplateMeta {
  return pointsTemplates[id || 'wildwest_v1'] || pointsTemplates['wildwest_v1'];
}

export function getAllPointsTemplates(): PointsTemplateMeta[] {
  return Object.values(pointsTemplates);
}

