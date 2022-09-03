import fs from 'fs';

export async function isFileExistsAtAbsolutePath(absoluteFilePath: string) {
  if (!absoluteFilePath.startsWith('/')) {
    throw new Error('Expects absolute path to be given');
  }
  try {
    const stats = await fs.promises.stat(absoluteFilePath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}
