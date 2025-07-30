import multer from "multer";

// File type validation functions
const createImageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const createVideoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const createImageAndVideoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

// Flexible upload middleware factory
export const createUploadMiddleware = (options: {
  fileTypes: 'image' | 'video' | 'both';
  maxFileSize?: number;
  maxFiles?: number;
}) => {
  const { fileTypes, maxFileSize = 10 * 1024 * 1024, maxFiles = 10 } = options;
  
  let fileFilter: multer.Options['fileFilter'];
  
  switch (fileTypes) {
    case 'image':
      fileFilter = createImageFilter;
      break;
    case 'video':
      fileFilter = createVideoFilter;
      break;
    case 'both':
      fileFilter = createImageAndVideoFilter;
      break;
    default:
      fileFilter = createImageFilter;
  }
  
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter
  });
};

// Pre-configured middleware instances
export const uploadImage = createUploadMiddleware({ fileTypes: 'image', maxFileSize: 5 * 1024 * 1024 });
export const uploadVideo = createUploadMiddleware({ fileTypes: 'video', maxFileSize: 50 * 1024 * 1024 });
export const uploadImageAndVideo = createUploadMiddleware({ fileTypes: 'both', maxFileSize: 50 * 1024 * 1024 });

// Legacy export for backward compatibility
export const upload = uploadImage;