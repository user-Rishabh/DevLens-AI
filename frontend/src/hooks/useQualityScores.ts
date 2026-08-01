import { useState } from 'react';
import { QualityScoreSummary } from '../components/QualityScoreCard';
import { API_BASE_URL } from '../lib/apiClient';

export function useQualityScores() {
  const [qualitySummary, setQualitySummary] = useState<QualityScoreSummary | null>(null);
  const [qualityScoresMap, setQualityScoresMap] = useState<Record<string, number>>({});
  const [loadingQuality, setLoadingQuality] = useState<boolean>(false);

  const fetchQualityScores = async (currentRepoId: string, force: boolean = false) => {
    if (!currentRepoId) return;
    setLoadingQuality(true);
    try {
      const url = force
        ? `${API_BASE_URL}/api/repos/${currentRepoId}/quality-scores/compute?force_recompute=true`
        : `${API_BASE_URL}/api/repos/${currentRepoId}/quality-scores`;
      const method = force ? 'POST' : 'GET';
      const response = await fetch(url, { method });
      if (response.ok) {
        const data = await response.json();
        setQualitySummary(data);
        if (data.scores && Array.isArray(data.scores)) {
          const map: Record<string, number> = {};
          data.scores.forEach((item: any) => {
            map[item.file_path] = item.composite_score;
          });
          setQualityScoresMap(map);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quality scores:', err);
    } finally {
      setLoadingQuality(false);
    }
  };

  const resetQualityScores = () => {
    setQualitySummary(null);
    setQualityScoresMap({});
  };

  return {
    qualitySummary,
    qualityScoresMap,
    loadingQuality,
    fetchQualityScores,
    resetQualityScores,
  };
}
