import { HttpException, HttpStatus } from '@nestjs/common';
import { GeocodeCoordinates } from '../types';

export function extractCoordinates(
  latitude: number | GeocodeCoordinates,
  longitude?: number,
): GeocodeCoordinates {
  if (typeof latitude === 'object') {
    return latitude;
  }
  if (longitude === undefined) {
    throw new HttpException(
      'Missing longitude from lat/long pair',
      HttpStatus.BAD_REQUEST,
    );
  }
  return {
    name: '',
    lat: latitude,
    long: longitude,
  };
}
