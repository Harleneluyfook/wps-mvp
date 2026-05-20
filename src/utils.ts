import { BarangayData } from './types';

export const calculateWSM = (data: BarangayData[]): BarangayData[] => {
  if (data.length === 0) return [];

  // Group by disaster
  const groups: Record<string, BarangayData[]> = {};
  data.forEach(item => {
    const d = item.disaster || 'Default';
    if (!groups[d]) groups[d] = [];
    groups[d].push(item);
  });

  const results: BarangayData[] = [];

  Object.values(groups).forEach(groupData => {
    // Find range for normalization (Min-Max) within group
    const casualties = groupData.map(d => d.casualties);
    const families = groupData.map(d => d.affectedFamilies);
    const houses = groupData.map(d => d.damagedHouses);

    const maxC = Math.max(...casualties, 0);
    const minC = Math.min(...casualties, 0);
    const rangeC = maxC === minC ? 0 : maxC - minC;

    const maxF = Math.max(...families, 0);
    const minF = Math.min(...families, 0);
    const rangeF = maxF === minF ? 0 : maxF - minF;

    const maxH = Math.max(...houses, 0);
    const minH = Math.min(...houses, 0);
    const rangeH = maxH === minH ? 0 : maxH - minH;

    // Calculate normalized values and priority scores
    const processedGroup = groupData.map(item => {
      // If not assessed (no lastUpdated), set scores to 0
      if (!item.lastUpdated) {
        return {
          ...item,
          normalizedCasualties: 0,
          normalizedFamilies: 0,
          normalizedHouses: 0,
          priorityScore: 0
        };
      }

      // If max == min, normalized is 0.5 (as per provided reference logic)
      const normalizedCasualties = rangeC === 0 ? 0.5 : (item.casualties - minC) / rangeC;
      const normalizedFamiliesFixed = rangeF === 0 ? 0.5 : (item.affectedFamilies - minF) / rangeF;
      const normalizedHouses = rangeH === 0 ? 0.5 : (item.damagedHouses - minH) / rangeH;

      // Equal weights (WSM) - (Norm1 + Norm2 + Norm3) / 3
      const priorityScore = (normalizedCasualties + normalizedFamiliesFixed + normalizedHouses) / 3;

      return {
        ...item,
        normalizedCasualties,
        normalizedFamilies: normalizedFamiliesFixed,
        normalizedHouses,
        priorityScore
      };
    });

    // Rank within group
    const rankedGroup = processedGroup
      .sort((a, b) => b.priorityScore - a.priorityScore || b.casualties - a.casualties)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    
    results.push(...rankedGroup);
  });

  return results;
};

export const getUrgencyLevel = (score: number): { label: string; color: string; bg: string } => {
  if (score >= 0.7) return { label: 'Highest', color: 'text-red-600', bg: 'bg-red-50' };
  if (score >= 0.4) return { label: 'Urgent', color: 'text-orange-500', bg: 'bg-orange-50' };
  if (score >= 0.1) return { label: 'Moderate', color: 'text-blue-500', bg: 'bg-blue-50' };
  return { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-50' };
};

export const getRecommendation = (score: number): string => {
  if (score >= 0.7) return "Immediate response (within 24 hours)";
  if (score >= 0.4) return "Urgent (24–48 hours)";
  if (score >= 0.1) return "Scheduled (2–3 days)";
  return "Monitoring / delayed response";
};
