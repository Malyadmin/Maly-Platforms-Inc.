import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Media Upload Refactoring Verification', () => {
  describe('Consolidated Upload Middleware', () => {
    test('should have consolidated upload middleware file', () => {
      const uploadMiddlewarePath = path.join(__dirname, '../middleware/upload.ts');
      expect(fs.existsSync(uploadMiddlewarePath)).toBe(true);
      
      const content = fs.readFileSync(uploadMiddlewarePath, 'utf8');
      expect(content).toContain('uploadImage');
      expect(content).toContain('uploadImageAndVideo');
      expect(content).toContain('image/');
      expect(content).toContain('video/');
    });

    test('should have cloudinary service implementation', () => {
      const cloudinaryServicePath = path.join(__dirname, '../services/cloudinaryService.ts');
      expect(fs.existsSync(cloudinaryServicePath)).toBe(true);
      
      const content = fs.readFileSync(cloudinaryServicePath, 'utf8');
      expect(content).toContain('uploadToCloudinary');
      expect(content).toContain('uploadMultipleToCloudinary');
      expect(content).toContain('resource_type');
    });
  });

  describe('Database Schema Updates', () => {
    test('should have updated events schema with videoUrls field', () => {
      const schemaPath = path.join(__dirname, '../../db/schema.ts');
      expect(fs.existsSync(schemaPath)).toBe(true);
      
      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(content).toContain('videoUrls');
      expect(content).toContain('jsonb("video_urls")');
    });
  });

  describe('API Endpoints Integration', () => {
    test('should have updated POST /api/events to support video uploads', () => {
      const routesPath = path.join(__dirname, '../routes.ts');
      expect(fs.existsSync(routesPath)).toBe(true);
      
      const content = fs.readFileSync(routesPath, 'utf8');
      expect(content).toContain('uploadImageAndVideo.fields');
      expect(content).toContain('videos');
      expect(content).toContain('maxCount: 5');
    });

    test('should have updated PUT /api/events/:id to support video uploads', () => {
      const routesPath = path.join(__dirname, '../routes.ts');
      const content = fs.readFileSync(routesPath, 'utf8');
      
      expect(content).toContain('uploadImageAndVideo.fields');
      expect(content).toContain('uploadMultipleToCloudinary');
    });

    test('should have cleaned up legacy multer configurations', () => {
      const routesPath = path.join(__dirname, '../routes.ts');
      const content = fs.readFileSync(routesPath, 'utf8');
      
      // Should not contain old multer setup
      expect(content).not.toContain('multer.diskStorage');
      expect(content).not.toContain('cloudinaryUpload');
    });
  });

  describe('Authentication Integration', () => {
    test('should have updated registration endpoints to use new upload middleware', () => {
      const authPath = path.join(__dirname, '../auth.ts');
      expect(fs.existsSync(authPath)).toBe(true);
      
      const content = fs.readFileSync(authPath, 'utf8');
      expect(content).toContain('uploadImage.single');
      expect(content).toContain('uploadToCloudinary');
      expect(content).not.toContain('upload.single');
    });
  });
});