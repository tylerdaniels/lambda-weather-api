export interface GeocodeCoordinates {
  name: string;
  lat: number;
  long: number;
}

export interface GeocodeService {
  geocode(location: string): Promise<GeocodeCoordinates>;
}
