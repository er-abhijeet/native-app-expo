import * as FileSystem from "expo-file-system/legacy";
import getLocalIP from "./ip_finder";

// const BACKEND_URL = `http://${String(getLocalIP())}:5000`;

// ============ REGISTRATION ============
export const registerUserBackend = async (email: string, imageUri?: string | null) => {
  try {
    console.log(`Registering ${email} with backend...`);
    const ur =  getLocalIP();

    const BACKEND_URL = ur;
    
    // If no image, send just email via POST request
    if (!imageUri) {
      console.log(`${BACKEND_URL}/register`);
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        console.log("Registration successful (no image)");
        return await response.json();
      } else {
        console.error("Registration failed:");
        return null;
      }
    }

    // If image provided, use multipart upload
    const uploadResult = await FileSystem.uploadAsync(
      `${BACKEND_URL}/register`,
      imageUri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: { email: email },
      },
    );

    if (uploadResult.status === 200) {
      console.log("Registration successful");
      const response = JSON.parse(uploadResult.body);
      return response; // Returns {message, user_id, photo_id}
    } else {
      console.error("Registration failed:", uploadResult.body);
      return null;
    }
  } catch (e) {
    console.error("Registration error:", e);
    return null;
  }
};

// ============ UPDATE USER PHOTO ============
export const updateUserPhotoBackend = async (
  email: string,
  imageUri: string,
) => {
  try {
    console.log(`[API] Updating photo for ${email}...`);
    const ur =  getLocalIP();
    const BACKEND_URL = ur;

    const uploadResult = await FileSystem.uploadAsync(
      `${BACKEND_URL}/update-photo`,
      imageUri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: { email },
      },
    );

    if (uploadResult.status === 200) {
      console.log("Photo update successful");
      return JSON.parse(uploadResult.body);
    } else {
      console.error("Photo update failed:", uploadResult.body);
      return null;
    }
  } catch (e) {
    console.error("Photo update error:", e);
    return null;
  }
};

// ============ NEW: PHOTO UPLOAD TO MONGODB ============
export const uploadPhotoToBackend = async (
  imageUri: string,
  locationData: any,
  ownerEmail?: string,
) => {
  try {
    console.log("[API] Uploading photo to backend...");
    const ur =  getLocalIP();

    const BACKEND_URL = ur;

    const uploadResult = await FileSystem.uploadAsync(
      `${BACKEND_URL}/upload`,
      imageUri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: {
          location_data: JSON.stringify(locationData),
          owner_email: ownerEmail || "anonymous",
        },
      },
    );

    if (uploadResult.status === 200) {
      const responseData = JSON.parse(uploadResult.body);
      console.log("[API] Upload successful:", responseData);
      return responseData;
    } else {
      console.error("[API] Upload failed:", uploadResult.body);
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }
  } catch (e) {
    console.error("[API] Upload error:", e);
    throw e;
  }
};

// ============ NEW: FETCH ALL PHOTOS FROM MONGODB ============
export const fetchPhotosFromBackend = async (status: string = "done") => {
  try {
    console.log("[API] Fetching photos from backend...");
    const ur =  getLocalIP();
    const BACKEND_URL = ur;
    console.log(`hello ${BACKEND_URL}/photos?status=${status}`);


    const response = await fetch(`${BACKEND_URL}/photos?status=${status}`);
    
    console.log("1 ",response);
    if (response.ok) {
      const photos = await response.json();
      console.log(`[API] Fetched ${photos.length} photos`);
      return photos;
    } else {
      console.error("[API] Failed to fetch photos:", response.status);
      return [];
    }
  } catch (e) {
    console.error("[API] Fetch photos error:", e);
    return [];
  }
};

// ============ NEW: FETCH USER'S PHOTOS ============
// Fetches photos uploaded by user OR photos where user is present
export const fetchUserPhotos = async (userEmail: string, userId: string) => {
  try {
    console.log(`[API] Fetching photos for user: ${userEmail} (id: ${userId})`);
    const ur =  getLocalIP();
    const BACKEND_URL = ur;

    // Fetch all processed photos
    const response = await fetch(`${BACKEND_URL}/photos?status=done`);
    
    if (!response.ok) {
      console.error("[API] Failed to fetch photos:", response.status);
      return [];
    }

    const allPhotos = await response.json();
    
    // Filter: photos uploaded by user OR photos where user is present
    const userPhotos = allPhotos.filter((photo: any) => {
      const isOwner = photo.owner_email === userEmail;
      const isPresent = photo.persons_present && photo.persons_present.includes(userId);
      
      // Debug logging for each photo
      if (isOwner || isPresent) {
        // console.log(`[API] included photo ${photo._id}: isOwner=${isOwner}, isPresent=${isPresent}, persons_present=${JSON.stringify(photo.persons_present)}`);
      }
      
      return isOwner || isPresent;
    });

    console.log(`[API] Fetched ${userPhotos.length} / ${allPhotos.length} photos for user ${userEmail}`);
    return userPhotos;
  } catch (e) {
    console.error("[API] Fetch user photos error:", e);
    return [];
  }
};

// ============ NEW: DELETE PHOTO ============
export const deletePhotoFromBackend = async (photoId: string) => {
  try {
    console.log("[API] Deleting photo:", photoId);
    const ur =  getLocalIP();

    const BACKEND_URL = ur;

    const response = await fetch(`${BACKEND_URL}/photos/${photoId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      console.log("[API] Photo deleted successfully");
      return true;
    } else {
      console.error("[API] Failed to delete photo:", response.status);
      return false;
    }
  } catch (e) {
    console.error("[API] Delete error:", e);
    return false;
  }
};
