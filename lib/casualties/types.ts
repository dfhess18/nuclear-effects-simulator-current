export interface PopulationSource {
  /**
   * Returns the population density in people per km² at the given location.
   * Swap this implementation for Census block-group data in v2.
   */
  getDensityAt(lat: number, lng: number): number;
}

export interface CasualtyEstimate {
  fatalities: number;
  injuriesBlast: number;
  injuriesBurns: number;
  injuriesRadiation: number;
  affectedAreaKm2: number;
  narrative: string;
}
