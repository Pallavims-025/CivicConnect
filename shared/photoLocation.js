export const DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES = 500;

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

function exactDistanceBetweenCoordinates(first, second) {
  if (!validCoordinates(first?.latitude, first?.longitude)
    || !validCoordinates(second?.latitude, second?.longitude)) return null;

  const radians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDifference = radians(second.latitude - first.latitude);
  const longitudeDifference = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDifference / 2) ** 2;
  const distance = 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, haversine)));
  return distance;
}

export function distanceBetweenCoordinates(first, second) {
  const distance = exactDistanceBetweenCoordinates(first, second);
  return distance === null ? null : Math.round(distance * 10) / 10;
}

export function verifyPhotoLocation(photo, complaint, thresholdMetres = DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES) {
  const exactDistance = exactDistanceBetweenCoordinates(photo, complaint);
  if (exactDistance === null) return { status: 'COMPLAINT_LOCATION_NOT_AVAILABLE', distanceMetres: null };
  const threshold = Number.isFinite(thresholdMetres) && thresholdMetres >= 0
    ? thresholdMetres
    : DEFAULT_PHOTO_LOCATION_THRESHOLD_METRES;
  return {
    status: exactDistance <= threshold + 1e-9 ? 'VERIFIED' : 'REJECTED_LOCATION_MISMATCH',
    distanceMetres: Math.round(exactDistance * 10) / 10,
  };
}
