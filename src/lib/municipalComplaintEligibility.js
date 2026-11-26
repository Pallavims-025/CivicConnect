export function isMunicipalComplaintEligible(complaint) {
  return complaint?.status !== 'REJECTED'
    && Array.isArray(complaint?.photoLocationEvidence)
    && complaint.photoLocationEvidence.some((photo) => (
      photo?.photoType === 'INITIAL_EVIDENCE'
      && photo?.locationVerificationStatus === 'VERIFIED'
    ));
}
