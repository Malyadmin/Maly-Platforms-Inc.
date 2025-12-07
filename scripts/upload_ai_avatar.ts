import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';

cloudinary.config({
  secure: true,
});

async function uploadAIAvatar() {
  try {
    const imagePath = path.join(process.cwd(), 'attached_assets/Image_12-7-25_at_4.20_PM_1765146502135.jpeg');
    
    console.log('Uploading AI agent avatar to Cloudinary...');
    console.log('Image path:', imagePath);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: 'maly_ai_agent_avatar',
      folder: 'avatars',
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'center' }
      ]
    });
    
    console.log('\n=== Upload Successful! ===');
    console.log('Public ID:', result.public_id);
    console.log('Secure URL:', result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

uploadAIAvatar();
