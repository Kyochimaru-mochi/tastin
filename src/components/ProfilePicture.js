// src/components/ProfilePicture.js などのファイルで
import { Storage } from 'aws-amplify';

// アップロード機能
async function uploadFile(file) {
  try {
    const result = await Storage.put(file.name, file, {
      contentType: file.type,
    });
    return result.key;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// ダウンロード機能
async function downloadFile(key) {
  try {
    const url = await Storage.get(key);
    return url;
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}
