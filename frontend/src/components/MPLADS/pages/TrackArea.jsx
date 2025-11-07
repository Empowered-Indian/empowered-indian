import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiMap, FiSearch, FiFilter } from 'react-icons/fi';
import { worksAPI } from '../../../services/api/works';
import { CACHE_TIMES } from '../../../utils/constants/api';
import ProjectListing from '../components/Projects/ProjectListing';
import './TrackArea.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TrackArea = () => {
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedState, setSelectedState] = useState('');
  // Fetch constituencies
  const { data: constituenciesData } = useQuery({
    queryKey: ['constituencies', selectedState],
    queryFn: () => worksAPI.getConstituencies({ state: selectedState }),
    staleTime: CACHE_TIMES.WORKS,
  });

  const constituencies = constituenciesData?.data?.constituencies || [];
  const states = constituenciesData?.data?.states || [];

  const handleReset = () => {
    setSelectedConstituency('');
    setSelectedState('');
  };

  // Create a stable unique key for each constituency option
  const makeOptionKey = (c, s) => `${c}|||${s}`;
  const selectedKey = selectedConstituency && selectedState
    ? makeOptionKey(selectedConstituency, selectedState)
    : '';

  return (
    <div className="page-container">
      <div className="track-area-header">
        <div className="header-icon">
          <FiMap size={48} />
        </div>
        <h1>Find Projects in My Constituency</h1>
        <p>Search and explore MPLADS projects in your area using constituency-based filtering</p>
      </div>

      {/* Search Form */}
      <div className="search-form">
        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="state">State (Optional)</Label>
            <Select
              value={selectedState || "all-states"}
              onValueChange={(value) => setSelectedState(value === "all-states" ? "" : value)}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-states">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="form-group">
            <Label htmlFor="constituency">Constituency *</Label>
            <Select
              value={selectedKey}
              onValueChange={(value) => {
                if (!value) {
                  setSelectedConstituency('');
                  return;
                }
                const [cons, state] = value.split('|||');
                setSelectedConstituency(cons);
                // Always set state from the selected option to disambiguate duplicates
                setSelectedState(state || '');
              }}
              required
            >
              <SelectTrigger id="constituency">
                <SelectValue placeholder="Select Constituency" />
              </SelectTrigger>
              <SelectContent>
                {constituencies.map((item) => (
                  <SelectItem
                    key={`${item.constituency}-${item.state}`}
                    value={makeOptionKey(item.constituency, item.state)}
                  >
                    {item.constituency} ({item.state})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="form-actions">
          <Button type="button" onClick={handleReset} className="btn-secondary" variant="outline">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Placeholder when no constituency selected */}
      {!selectedConstituency && (
        <div className="placeholder-section">
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <FiSearch size={64} />
            </div>
            <h3>Select Your Constituency</h3>
            <p>Choose your constituency from the dropdown above to discover all MPLADS projects in your area.</p>
            <div className="features-list">
              <div className="feature-item">
                <FiFilter size={20} />
                <span>Filter by cost range and project type</span>
              </div>
              <div className="feature-item">
                <FiMap size={20} />
                <span>View completed, recommended, and work-in-progress projects</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {selectedConstituency && (
        <div className="results-section">
          <h2>Projects in {selectedConstituency}</h2>
          <ProjectListing 
            key={`${selectedConstituency}|||${selectedState}`} // Force remount when constituency or state changes
            constituency={selectedConstituency}
            stateName={selectedState}
            showFiltersDefault={true}
            className="track-area-projects"
          />
        </div>
      )}
    </div>
  );
};

export default TrackArea;
