import cloudinary from '../lib/cloudinary';
import { Readable } from 'stream';

interface UploadResult {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video';
  format: string;
  bytes: number;
}

export const uploadToCloudinary = async (
  buffer: Buffer,
  filename: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: `uploads/${Date.now()}_${filename}`,
        folder: resourceType === 'image' ? 'images' : 'videos',
        transformation: resourceType === 'image' 
          ? [{ width: 1200, crop: 'scale', format: 'auto', quality: 'auto' }]
          : [{ video_codec: 'auto', quality: 'auto' }]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: resourceType,
            format: result.format,
            bytes: result.bytes
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(stream);
  });
};

export const uploadMultipleToCloudinary = async (
  files: { buffer: Buffer; originalname: string; mimetype: string }[]
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file => {
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return uploadToCloudinary(file.buffer, file.originalname, resourceType);
  });

  return Promise.all(uploadPromises);
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Delete failed: ${error}`);
  }
};