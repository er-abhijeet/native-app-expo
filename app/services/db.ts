import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('gallery_db.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_uri TEXT NOT NULL,
      backend_image_id TEXT,           -- Maps to backend image filename/uuid
      location_data TEXT,              -- JSON string of location
      ai_info TEXT,                    -- JSON string from backend
      status TEXT DEFAULT 'pending',   -- 'pending', 'processing', 'synced', 'shared'
      source TEXT DEFAULT 'camera',    -- 'camera' or 'backend'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const addPhotoToDB = (uri: string, location: any, source = 'camera') => {
  const result = db.runSync(
    'INSERT INTO photos (local_uri, location_data, source, status) VALUES (?, ?, ?, ?)',
    [uri, JSON.stringify(location), source, source === 'camera' ? 'pending' : 'synced']
  );
  return result.lastInsertRowId;
};

export const getGalleryPhotos = () => {
  return db.getAllSync('SELECT * FROM photos ORDER BY id DESC');
};

export const deletePhotoFromDB = (id: number) => {
  db.runSync('DELETE FROM photos WHERE id = ?', [id]);
};

// Function to update AI info after backend response
export const updatePhotoAIInfo = (id: number, aiInfo: any) => {
  db.runSync('UPDATE photos SET ai_info = ?, status = "synced" WHERE id = ?', [JSON.stringify(aiInfo), id]);
};

// Function to update backend image ID and status after upload
export const updatePhotoBackendId = (id: number, backendImageId: string, status = 'processing') => {
  db.runSync(
    'UPDATE photos SET backend_image_id = ?, status = ? WHERE id = ?',
    [backendImageId, status, id]
  );
};

// Get photos by status for syncing
export const getPhotosByStatus = (status: string) => {
  return db.getAllSync('SELECT * FROM photos WHERE status = ? ORDER BY created_at ASC', [status]);
};