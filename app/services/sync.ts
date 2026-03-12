import * as FileSystem from 'expo-file-system/legacy';
import { updatePhotoAIInfo, addPhotoToDB, updatePhotoBackendId, getPhotosByStatus } from './db';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------- CONFIG ----------------
// REPLACE WITH YOUR BACKEND IP
import getLocalIP from './ip_finder';
const BACKEND_URL = `http://${getLocalIP()}:5000`; 
const UPLOAD_ENDPOINT = `${BACKEND_URL}/upload`;
const SHARED_ENDPOINT = `${BACKEND_URL}/shared-photos`;

// 1. Get User (Read from disk)
export const getCurrentUserEmail = async () => {
  try {
    const email = await AsyncStorage.getItem('user_email');
    return email;
  } catch (e) {
    console.error("Failed to load user email", e);
    return null;
  }
};

// 2. Set User (Write to disk)
export const setCurrentUserEmail = async (email: string) => {
  try {
    await AsyncStorage.setItem('user_email', email);
    console.log(`[Auth] Saved user: ${email}`);
  } catch (e) {
    console.error("Failed to save user email", e);
  }
};

// 3. Logout (Clear disk)
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('user_email');
  } catch (e) {
    console.error("Failed to logout", e);
  }
};

/**
 * Sync pending photos to backend for AI processing
 * Flow:
 * 1. Get all 'pending' photos
 * 2. Upload each to /upload endpoint
 * 3. Backend processes and returns image_id, ai_info
 * 4. Update local DB with backend_image_id and ai_info
 * 5. Mark status as 'synced'
 */
export const syncPendingPhotos = async () => {
  try {
    const pendingPhotos = getPhotosByStatus('pending') as any[];
    console.log(`[Sync] Found ${pendingPhotos.length} pending photos to sync`);

    for (const photo of pendingPhotos) {
      try {
        console.log(`[Sync] Uploading photo ${photo.id} to backend...`);
        
        // Update status to 'processing' to indicate upload started
        updatePhotoBackendId(photo.id, '', 'processing');

        const uploadResult = await FileSystem.uploadAsync(UPLOAD_ENDPOINT, photo.local_uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        });

        if (uploadResult.status === 200) {
          const responseData = JSON.parse(uploadResult.body);
          console.log(`[Sync] Backend response for photo ${photo.id}:`, responseData);

          // Extract the backend image ID (filename) and AI info
          const backendImageId = responseData.image_id || responseData.filename;
          const aiInfo = {
            faces_found: responseData.faces_found,
            details: responseData.ai_info,
            image_url: responseData.image_url
          };

          // Update DB with mapping: local_uri -> backend_image_id
          // This creates the bridge between local and backend storage
          updatePhotoBackendId(photo.id, backendImageId, 'synced');
          updatePhotoAIInfo(photo.id, aiInfo);
          
          console.log(`[Sync] Successfully synced photo ${photo.id} with backend ID: ${backendImageId}`);
        } else {
          console.error(`[Sync] Backend returned status ${uploadResult.status} for photo ${photo.id}`);
        }
      } catch (error) {
        console.error(`[Sync] Error uploading photo ${photo.id}:`, error);
      }
    }

    console.log('[Sync] Sync cycle complete');
  } catch (e) {
    console.error('[Sync] Error in syncPendingPhotos:', e instanceof Error ? e.message : String(e));
  }
};

export const fetchSharedPhotos = async () => {
  // 4. Retrieve email dynamically every time we sync
  const currentUserEmail = await getCurrentUserEmail();

  if (!currentUserEmail) {
    console.log("[Sync] No user logged in. Skipping shared fetch.");
    return;
  }

  try {
    const response = await fetch(SHARED_ENDPOINT, {
        headers: {
            'X-User-Email': currentUserEmail 
        }
    });
    const sharedData = await response.json();

    for (const item of sharedData) {
      // (Download logic remains the same...)
      const localFilename = item.url.split('/').pop();
      const localPath = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'shared/' + localFilename;

      await FileSystem.makeDirectoryAsync(
        (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'shared/', 
        { intermediates: true }
      ).catch(()=>{});

      const downloadRes = await FileSystem.downloadAsync(item.url, localPath);

      if (downloadRes.status === 200) {
        addPhotoToDB(localPath, item.metadata, 'backend'); 
      }
    }
  } catch (e) {
    console.log("Error fetching shared photos:", e instanceof Error ? e.message : String(e));
  }
};