import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../lib/prisma.js';

const avatarDirectory = new URL('../uploads/admin-avatars/', import.meta.url);
const avatarPath = fileURLToPath(avatarDirectory);
const avatarUrlPattern = /^\/uploads\/admin-avatars\/[a-f\d-]+\.(?:jpg|png|webp)$/i;
const avatarSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  title: true,
  avatarUrl: true,
  createdAt: true,
  department: { select: { id: true, name: true, code: true } },
};

async function removeStoredAvatar(avatarUrl) {
  if (!avatarUrlPattern.test(avatarUrl || '')) return;
  try {
    await unlink(path.join(avatarPath, path.basename(avatarUrl)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function getAdminProfile(req, res, next) {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: avatarSelect,
    });
    if (!profile) return res.status(404).json({ success: false, error: { message: 'Administrator profile not found.' } });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
}

export async function uploadAdminProfilePhoto(req, res, next) {
  let createdFilePath;
  try {
    const { imageData } = req.body || {};
    const match = typeof imageData === 'string'
      && imageData.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!match) {
      return res.status(422).json({ success: false, error: { message: 'Choose a valid JPEG, JPG, PNG, or WebP image.' } });
    }

    const [, requestedFormat, encoded] = match;
    const image = Buffer.from(encoded, 'base64');
    if (!image.length || image.length > 5 * 1024 * 1024) {
      return res.status(422).json({ success: false, error: { message: 'Profile photo must be 5 MB or smaller.' } });
    }

    const format = requestedFormat.toLowerCase() === 'jpg' ? 'jpeg' : requestedFormat.toLowerCase();
    const isJpeg = format === 'jpeg' && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    const isPng = format === 'png' && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = format === 'webp'
      && image.length >= 12
      && image.toString('ascii', 0, 4) === 'RIFF'
      && image.toString('ascii', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) {
      return res.status(422).json({ success: false, error: { message: 'The photo contents do not match a supported image type.' } });
    }

    const extension = isJpeg ? 'jpg' : format;
    const filename = `${randomUUID()}.${extension}`;
    await mkdir(avatarPath, { recursive: true });
    createdFilePath = path.join(avatarPath, filename);
    await writeFile(createdFilePath, image, { flag: 'wx', mode: 0o644 });

    const avatarUrl = `/uploads/admin-avatars/${filename}`;
    const profile = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: avatarSelect,
    });

    try {
      await removeStoredAvatar(req.user.avatarUrl);
    } catch {
      // A previous image cleanup failure must not undo a successfully saved photo.
    }
    return res.json({ success: true, data: profile });
  } catch (error) {
    if (createdFilePath) {
      try { await unlink(createdFilePath); } catch {}
    }
    return next(error);
  }
}
