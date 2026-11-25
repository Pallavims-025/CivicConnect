export const VERIFIED_COMPLAINT_WHERE = {
  photos: { some: { locationVerificationStatus: 'VERIFIED' } },
};

export const VERIFIED_WORK_ORDER_WHERE = {
  complaint: VERIFIED_COMPLAINT_WHERE,
};

export function hasVerifiedComplaintPhoto(complaint) {
  const photos = Array.isArray(complaint?.photos) ? complaint.photos : complaint?.photoLocationEvidence;
  return Array.isArray(photos)
    && photos.some((photo) => photo?.locationVerificationStatus === 'VERIFIED');
}

export function citizenOwnsComplaint(complaint, userId) {
  return Boolean(complaint?.userId && userId && complaint.userId === userId);
}

export function canCitizenRetryPhotoVerification(complaint, userId) {
  return citizenOwnsComplaint(complaint, userId) && !hasVerifiedComplaintPhoto(complaint);
}

export function assertComplaintHasVerifiedPhoto(complaint) {
  if (!hasVerifiedComplaintPhoto(complaint)) {
    throw Object.assign(new Error('A complaint needs a backend-verified photograph before municipal review or assignment.'), { status: 409 });
  }
}
