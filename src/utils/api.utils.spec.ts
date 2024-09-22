import { extractCityFromPath } from './api.utils';
import { event } from '../../test/utils/api-testing';

describe('extractCityFromPath', () => {
  it('should fail without a "city" parameter', () => {
    const result = extractCityFromPath(event({}, {}));
    expect(result).toBeUndefined();
  });
  it('should fail with an empty "city" parameter', () => {
    const result = extractCityFromPath(event({ city: '' }, {}));
    expect(result).toBeUndefined();
  });
  it('should fail with a whitespace "city" parameter', () => {
    const result = extractCityFromPath(event({ city: '  \t ' }, {}));
    expect(result).toBeUndefined();
  });
  it('should pass-through valid "city" parameter', () => {
    const city = 'Miami, FL';
    const result = extractCityFromPath(event({ city }, {}));
    expect(result).toBe(city);
  });
});
