import { useQuery } from '@tanstack/react-query';
import { CACHE_TIMES } from '../utils/constants/api';
import { summaryAPI, mpladsAPI, worksAPI, analyticsAPI, expendituresAPI } from '../services/api';
import { useFilters } from '../contexts/FilterContext';

// Ensure caller params can't accidentally force invalid combinations.
// Strip only house: 'Both Houses' (backend treats this literally and finds none).
// Preserve explicit 'Lok Sabha' / 'Rajya Sabha' overrides.
const sanitize = (params) => {
  if (!params) return {};
  const rest = { ...params };
  if (rest.house === 'Both Houses') delete rest.house;
  return rest;
};

// Summary hooks
export const useOverview = () => {
  const { filters } = useFilters();
  const houseParam = filters.house || 'Lok Sabha';
  const bothTerms = false; // no explicit override here
  const baseParams = {
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['summary', 'overview', baseParams.ls_term || 'none', houseParam],
    queryFn: () => summaryAPI.getOverview(baseParams),
    staleTime: CACHE_TIMES.SUMMARY,
  });
};

export const useStateSummary = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['summary', 'states', merged],
    queryFn: () => summaryAPI.getStateSummary(merged),
    staleTime: CACHE_TIMES.SUMMARY,
  });
};

export const useMPSummary = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['summary', 'mps', merged],
    queryFn: () => summaryAPI.getMPSummary(merged),
    staleTime: CACHE_TIMES.SUMMARY,
    keepPreviousData: true, // preserve current results while fetching new ones
    placeholderData: (prev) => prev,
  });
};

export const useConstituencySummary = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['summary', 'constituencies', merged],
    queryFn: () => summaryAPI.getConstituencySummary(merged),
    staleTime: CACHE_TIMES.SUMMARY,
    enabled: !!merged?.state,
  });
};

// MPLADS hooks
export const useMPDetails = (mpId) => {
  const { filters } = useFilters();
  const baseParams = (filters.house === 'Lok Sabha' || !filters.house)
    ? { ls_term: Number(filters.lsTerm || 18) }
    : {};
  return useQuery({
    queryKey: ['mplads', 'mp', mpId, baseParams.ls_term],
    queryFn: () => mpladsAPI.getMPDetails(mpId, baseParams),
    staleTime: CACHE_TIMES.MP_DETAILS,
    enabled: !!mpId,
  });
};

export const useMPWorks = (mpId, params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['mplads', 'mp', mpId, 'works', merged],
    queryFn: () => mpladsAPI.getMPWorks(mpId, merged),
    staleTime: CACHE_TIMES.WORKS,
    enabled: !!mpId,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
};

export const useSearchMPs = (query) => {
  const { filters } = useFilters();
  const houseParam = filters.house || 'Lok Sabha';
  const baseParams = {
    ...(houseParam !== 'Both Houses' ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['mplads', 'search', query, baseParams],
    queryFn: () => {
      if (!query || query.length < 2) {
        return Promise.resolve({ success: true, data: [] });
      }
      return mpladsAPI.searchMPs(query, baseParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!query && query.length >= 2,
  });
};

export const useSectorData = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['mplads', 'sectors', merged],
    queryFn: () => mpladsAPI.getSectorWiseData(merged),
    staleTime: CACHE_TIMES.ANALYTICS,
  });
};

export const useTrends = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['mplads', 'trends', merged],
    queryFn: () => mpladsAPI.getYearWiseTrends(merged),
    staleTime: CACHE_TIMES.ANALYTICS,
  });
};

// Works hooks
export const useCompletedWorks = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['works', 'completed', merged],
    queryFn: () => worksAPI.getCompletedWorks(merged),
    staleTime: CACHE_TIMES.WORKS,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
};

export const useRecommendedWorks = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['works', 'recommended', merged],
    queryFn: () => worksAPI.getRecommendedWorks(merged),
    staleTime: CACHE_TIMES.WORKS,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
};

export const useWorkCategories = () => {
  return useQuery({
    queryKey: ['works', 'categories'],
    queryFn: worksAPI.getWorkCategories,
    staleTime: CACHE_TIMES.SUMMARY,
  });
};

// Analytics hooks
export const useAnalyticsTrends = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['analytics', 'trends', merged],
    queryFn: () => analyticsAPI.getTrends(merged),
    staleTime: CACHE_TIMES.ANALYTICS,
  });
};

export const useTopPerformers = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['analytics', 'top-performers', merged],
    queryFn: () => analyticsAPI.getTopPerformers(merged),
    staleTime: CACHE_TIMES.ANALYTICS,
  });
};

export const usePerformanceDistribution = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['analytics', 'performance-distribution', merged],
    queryFn: () => analyticsAPI.getPerformanceDistribution(merged),
    staleTime: CACHE_TIMES.ANALYTICS,
  });
};

// Expenditure hooks
export const useExpenditures = (params) => {
  const { filters } = useFilters();
  const houseParam = (params && params.house) || filters.house || 'Lok Sabha';
  const sanitized = sanitize(params);
  const bothTerms = sanitized.ls_term === 'both';
  const merged = {
    ...sanitized,
    ...(houseParam && houseParam !== 'Both Houses' && !bothTerms ? { house: houseParam } : {}),
    ...(houseParam === 'Lok Sabha' && !bothTerms ? { ls_term: Number(filters.lsTerm || 18) } : {}),
  };
  return useQuery({
    queryKey: ['expenditures', merged],
    queryFn: () => expendituresAPI.getExpenditures(merged),
    staleTime: CACHE_TIMES.EXPENDITURE,
  });
};

export const useExpenditureCategories = () => {
  return useQuery({
    queryKey: ['expenditures', 'categories'],
    queryFn: expendituresAPI.getExpenditureCategories,
    staleTime: CACHE_TIMES.SUMMARY,
  });
};
