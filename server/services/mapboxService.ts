import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_API_KEY! });

export async function getCoordinates(location: string) {
  try {
    if (!process.env.MAPBOX_API_KEY) {
      console.warn('MAPBOX_API_KEY not found, geocoding will be skipped');
      return null;
    }

    const response = await geocodingClient.forwardGeocode({
      query: location,
      limit: 1
    }).send();

    const match = response.body.features[0];
    if (match) {
      return {
        longitude: match.center[0],
        latitude: match.center[1]
      };
    }
    return null;
  } catch (err) {
    console.error('Mapbox service error:', err);
    return null;
  }
}