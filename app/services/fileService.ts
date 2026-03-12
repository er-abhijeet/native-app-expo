import * as FileSystem from 'expo-file-system/legacy';

// Fallback to cache if document directory is missing
const IMG_DIR = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'photos/';

// Ensure directory exists
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMG_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMG_DIR, { intermediates: true });
  }
};

export const saveImageToAppStorage = async (tempUri: string) => {
  await ensureDirExists();
  
  const filename = tempUri.split('/').pop();
  const newPath = IMG_DIR + filename;
  
  await FileSystem.moveAsync({
    from: tempUri,
    to: newPath
  });
  
  return newPath;
};