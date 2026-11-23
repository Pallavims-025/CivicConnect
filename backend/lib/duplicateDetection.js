const DEFAULT_WEIGHTS = {
  title: 0.2,
  description: 0.22,
  category: 0.08,
  address: 0.08,
  location: 0.22,
  date: 0.08,
  photographs: 0.12,
};

function boundedNumber(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function textTokens(value) {
  return new Set(String(value || '').toLocaleLowerCase().normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter((token) => token.length > 1));
}

function textSimilarity(first, second) {
  const a = textTokens(first);
  const b = textTokens(second);
  if (!a.size || !b.size) return null;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = radians(bLat - aLat);
  const lngDelta = radians(bLng - aLng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(lngDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hammingDistance(first, second) {
  if (!/^[a-f\d]{16}$/i.test(first || '') || !/^[a-f\d]{16}$/i.test(second || '')) return null;
  let bits = BigInt(`0x${first}`) ^ BigInt(`0x${second}`);
  let count = 0;
  while (bits) {
    count += Number(bits & 1n);
    bits >>= 1n;
  }
  return count;
}

function photoSimilarity(newPhotos, existingPhotos) {
  let best = null;
  for (const newPhoto of newPhotos) {
    for (const existingPhoto of existingPhotos) {
      const distance = hammingDistance(newPhoto.perceptualHash, existingPhoto.perceptualHash);
      if (distance !== null) best = Math.max(best ?? 0, 1 - distance / 64);
    }
  }
  return best;
}

export function compareComplaints(incoming, existing, radiusMeters, dateWindowDays) {
  const scores = {
    title: textSimilarity(incoming.title, existing.title),
    description: textSimilarity(incoming.description, existing.description),
    category: incoming.categoryId === existing.categoryId ? 1 : 0,
    address: textSimilarity(incoming.address, existing.address),
    location: null,
    date: null,
    photographs: photoSimilarity(incoming.photos, existing.photos),
  };

  let locationDistanceMeters = null;
  if ([incoming.latitude, incoming.longitude, existing.latitude, existing.longitude].every(Number.isFinite)) {
    locationDistanceMeters = distanceMeters(incoming.latitude, incoming.longitude, existing.latitude, existing.longitude);
    scores.location = Math.max(0, 1 - locationDistanceMeters / radiusMeters);
  }

  const dateDifferenceDays = Math.abs(new Date(incoming.createdAt).getTime() - new Date(existing.createdAt).getTime()) / 86400000;
  scores.date = Number.isFinite(dateDifferenceDays) ? Math.max(0, 1 - dateDifferenceDays / dateWindowDays) : null;

  let availableWeight = 0;
  let weightedScore = 0;
  for (const [name, score] of Object.entries(scores)) {
    if (score === null) continue;
    availableWeight += DEFAULT_WEIGHTS[name];
    weightedScore += score * DEFAULT_WEIGHTS[name];
  }
  const similarityScore = availableWeight ? weightedScore / availableWeight : 0;
  const possibleThreshold = boundedNumber(process.env.DUPLICATE_POSSIBLE_THRESHOLD, 0.55, 0.3, 0.9);
  const likelyThreshold = boundedNumber(process.env.DUPLICATE_LIKELY_THRESHOLD, 0.82, possibleThreshold + 0.01, 0.98);
  const classification = similarityScore >= likelyThreshold
    ? 'LIKELY_DUPLICATE'
    : similarityScore >= possibleThreshold ? 'POSSIBLE_DUPLICATE' : 'NEW';

  return {
    similarityScore: Number(similarityScore.toFixed(4)),
    classification,
    comparison: {
      attributeScores: Object.fromEntries(Object.entries(scores).map(([name, score]) => [name, score === null ? null : Number(score.toFixed(4))])),
      locationDistanceMeters: locationDistanceMeters === null ? null : Number(locationDistanceMeters.toFixed(1)),
      dateDifferenceDays: Number.isFinite(dateDifferenceDays) ? Number(dateDifferenceDays.toFixed(1)) : null,
      thresholds: { possible: possibleThreshold, likely: likelyThreshold, radiusMeters, dateWindowDays },
    },
  };
}

export async function findDuplicateCandidates(prisma, complaint) {
  const dateWindowDays = boundedNumber(process.env.DUPLICATE_DATE_WINDOW_DAYS, 45, 1, 365);
  const radiusMeters = boundedNumber(process.env.DUPLICATE_RADIUS_METERS, 300, 25, 5000);
  const records = await prisma.complaint.findMany({
    where: { createdAt: { gte: new Date(Date.now() - dateWindowDays * 86400000) } },
    select: {
      id: true,
      complaintCode: true,
      title: true,
      description: true,
      categoryId: true,
      address: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      photos: { select: { perceptualHash: true } },
    },
  });

  return records.map((record) => ({
    matchedComplaintId: record.id,
    matchedComplaintCode: record.complaintCode || record.id,
    record,
    ...compareComplaints({ ...complaint, createdAt: new Date() }, record, radiusMeters, dateWindowDays),
  }))
    .filter((candidate) => candidate.classification !== 'NEW')
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 5);
}

export async function refreshDuplicateCandidates(prisma) {
  const dateWindowDays = boundedNumber(process.env.DUPLICATE_DATE_WINDOW_DAYS, 45, 1, 365);
  const radiusMeters = boundedNumber(process.env.DUPLICATE_RADIUS_METERS, 300, 25, 5000);
  const possibleThreshold = boundedNumber(process.env.DUPLICATE_POSSIBLE_THRESHOLD, 0.55, 0.3, 0.9);
  const records = await prisma.complaint.findMany({
    where: { createdAt: { gte: new Date(Date.now() - dateWindowDays * 86400000) } },
    select: {
      id: true, complaintCode: true, title: true, description: true, categoryId: true,
      address: true, latitude: true, longitude: true, createdAt: true, duplicateOfId: true,
      photos: { select: { perceptualHash: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  for (let i = 0; i < records.length - 1; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const older = records[i];
      const newer = records[j];
      if (newer.duplicateOfId || older.duplicateOfId) continue;
      const result = compareComplaints(newer, older, radiusMeters, dateWindowDays);
      if (result.similarityScore < possibleThreshold) continue;
      const prior = await prisma.duplicateComplaintMatch.findUnique({
        where: { complaintId_matchedComplaintId: { complaintId: newer.id, matchedComplaintId: older.id } },
        select: { id: true, decision: true },
      });
      if (prior) {
        if (prior.decision === 'PENDING' || prior.decision === 'KEEP_REVIEWING') {
          await prisma.duplicateComplaintMatch.update({ where: { id: prior.id }, data: {
            similarityScore: result.similarityScore, classification: result.classification, comparison: result.comparison,
          } });
        }
        continue;
      }
      await prisma.duplicateComplaintMatch.create({ data: {
        complaintId: newer.id, matchedComplaintId: older.id,
        similarityScore: result.similarityScore, classification: result.classification, comparison: result.comparison,
      } });
    }
  }
}
