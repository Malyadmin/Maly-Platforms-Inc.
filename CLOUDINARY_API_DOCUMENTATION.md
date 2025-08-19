# Cloudinary Integration API Documentation

## Overview

This documentation covers the Cloudinary integration within the Maly platform for handling image and video uploads for events, profiles, and other media assets. This guide is specifically designed for iOS developers who need to integrate with the Maly backend APIs that utilize Cloudinary for media storage and processing.

## Environment Setup

### Required Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here  
CLOUDINARY_API_SECRET=your_api_secret_here
```

These credentials are required for all Cloudinary operations. Without proper configuration, file uploads will fail.

## Service Architecture

### Core Service: `cloudinaryService.ts`

The platform uses Cloudinary's Upload API to store and transform images and videos with automatic optimization and delivery via CDN.

#### Core Functions

##### `uploadToCloudinary(buffer, filename, resourceType)`

**Purpose**: Uploads a single file (image or video) to Cloudinary with automatic optimization.

**Parameters**:
- `buffer` (Buffer): File data as a Buffer
- `filename` (string): Original filename for reference
- `resourceType` ('image' | 'video'): Type of media being uploaded

**Returns**:
```typescript
Promise<{
  public_id: string,      // Cloudinary public ID for management
  secure_url: string,     // HTTPS URL for accessing the file
  resource_type: string,  // 'image' or 'video'
  format: string,         // File format (e.g., 'jpg', 'mp4')
  bytes: number          // File size in bytes
}>
```

**Automatic Transformations**:
- **Images**: Resized to max 1200x800px, auto-format, auto-quality
- **Videos**: Auto video codec selection, auto-quality optimization

##### `uploadMultipleToCloudinary(files)`

**Purpose**: Uploads multiple files concurrently to Cloudinary.

**Parameters**:
```typescript
files: Array<{
  buffer: Buffer,
  originalname: string,
  mimetype: string
}>
```

**Returns**: `Promise<UploadResult[]>` - Array of upload results

##### `deleteFromCloudinary(publicId)`

**Purpose**: Removes a file from Cloudinary storage.

**Parameters**:
- `publicId` (string): The Cloudinary public ID of the file to delete

## File Upload Middleware

### Upload Configuration

The platform uses Multer for handling multipart/form-data with the following configurations:

#### Pre-configured Middleware

```typescript
// Image uploads only (max 5MB)
uploadImage: maxFileSize = 5MB, accepts image/* only

// Video uploads only (max 50MB) 
uploadVideo: maxFileSize = 50MB, accepts video/* only

// Combined image/video uploads (max 50MB)
uploadImageAndVideo: maxFileSize = 50MB, accepts both image/* and video/*
```

#### File Type Validation

- **Image MIME Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, etc.
- **Video MIME Types**: `video/mp4`, `video/quicktime`, `video/x-msvideo`, etc.
- **Rejected Types**: All other file types will return a `400 Bad Request` error

#### File Size Limits

- **Profile Images**: 5MB maximum
- **Event Images**: 50MB maximum  
- **Event Videos**: 50MB maximum
- **Multiple Files**: Up to 10 files per request

## API Endpoints

### 1. Event Image and Video Upload

**Endpoint**: `POST /api/events`

**Content-Type**: `multipart/form-data`

**Authentication**: Required (Bearer token or session-based)

#### Request Format

**Form Fields**:
```
image: File (optional) - Single event cover image
videos: File[] (optional) - Multiple promotional videos
title: string (required)
description: string (required)
city: string (required)
location: string (required)
date: string (required)
category: string (required)
... other event fields
```

#### Example Request (cURL)

```bash
curl -X POST https://api.maly.io/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Tech Meetup Downtown" \
  -F "description=Join us for networking and tech talks" \
  -F "city=San Francisco" \
  -F "location=SOMA District" \
  -F "date=2024-03-15T19:00:00Z" \
  -F "category=Technology" \
  -F "image=@event_cover.jpg" \
  -F "videos=@promo_video1.mp4" \
  -F "videos=@promo_video2.mp4"
```

#### Response Format

**Success (201 Created)**:
```json
{
  "success": true,
  "message": "Event published successfully",
  "event": {
    "id": 123,
    "title": "Tech Meetup Downtown",
    "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/images/uploads/1234567890_event_cover.jpg",
    "videoUrls": [
      "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/videos/uploads/1234567890_promo_video1.mp4",
      "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/videos/uploads/1234567890_promo_video2.mp4"
    ],
    "date": "2024-03-15T19:00:00.000Z",
    "createdAt": "2024-01-20T10:30:00.000Z"
    // ... other event fields
  }
}
```

### 2. Event Media Update

**Endpoint**: `PUT /api/events/:id`

**Content-Type**: `multipart/form-data`

**Authentication**: Required (must be event creator)

#### Update Behavior

- **Image Replacement**: New image replaces existing cover image
- **Video Addition**: New videos are appended to existing video array
- **No Deletion**: Use separate DELETE endpoint to remove existing media

#### Example Request

```bash
curl -X PUT https://api.maly.io/api/events/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@new_cover.jpg" \
  -F "videos=@additional_video.mp4"
```

#### Response Format

```json
{
  "message": "Event updated successfully",
  "event": {
    "id": 123,
    "image": "https://res.cloudinary.com/your-cloud/image/upload/.../new_cover.jpg",
    "videoUrls": [
      "https://res.cloudinary.com/your-cloud/video/upload/.../original_video.mp4",
      "https://res.cloudinary.com/your-cloud/video/upload/.../additional_video.mp4"
    ]
    // ... other updated fields
  }
}
```

### 3. Profile Image Upload

**Endpoint**: `POST /api/auth/register`

**Content-Type**: `multipart/form-data`

**Authentication**: Not required (registration endpoint)

#### Request Format

```bash
curl -X POST https://api.maly.io/api/auth/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "password=securepassword" \
  -F "profileImage=@profile_photo.jpg"
```

#### Response Format

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 456,
    "username": "johndoe",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profiles/johndoe/profile_photo.jpg",
    "createdAt": "2024-01-20T10:30:00.000Z"
    // ... other user fields
  }
}
```

## Media Asset Management

### Folder Structure in Cloudinary

```
cloudinary-account/
├── images/
│   ├── uploads/           # Event cover images
│   └── profiles/          # User profile images
│       └── {username}/    # User-specific folders
└── videos/
    └── uploads/           # Event promotional videos
```

### File Naming Convention

**Format**: `{timestamp}_{original_filename}`

**Examples**:
- `1642684200000_event_cover.jpg`
- `1642684200000_promo_video.mp4`
- `profiles/johndoe/1642684200000_profile.jpg`

### URL Structure

**Pattern**: `https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{folder}/uploads/{public_id}.{format}`

**Examples**:
- Images: `https://res.cloudinary.com/maly/image/upload/v1642684200/images/uploads/1642684200000_cover.jpg`
- Videos: `https://res.cloudinary.com/maly/video/upload/v1642684200/videos/uploads/1642684200000_promo.mp4`

## iOS Integration Guidelines

### 1. Multipart Form Data Creation

**Swift Example (URLSession)**:
```swift
func uploadEventWithMedia(
    eventData: EventCreateRequest,
    coverImage: UIImage?,
    videos: [URL]
) async throws -> EventResponse {
    
    let boundary = UUID().uuidString
    var request = URLRequest(url: URL(string: "https://api.maly.io/api/events")!)
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    var body = Data()
    
    // Add text fields
    body.append("--\(boundary)\r\n")
    body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n")
    body.append("\(eventData.title)\r\n")
    
    // Add other required fields...
    
    // Add cover image if provided
    if let coverImage = coverImage,
       let imageData = coverImage.jpegData(compressionQuality: 0.8) {
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"cover.jpg\"\r\n")
        body.append("Content-Type: image/jpeg\r\n\r\n")
        body.append(imageData)
        body.append("\r\n")
    }
    
    // Add videos if provided
    for (index, videoURL) in videos.enumerated() {
        let videoData = try Data(contentsOf: videoURL)
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"videos\"; filename=\"video\(index).mp4\"\r\n")
        body.append("Content-Type: video/mp4\r\n\r\n")
        body.append(videoData)
        body.append("\r\n")
    }
    
    body.append("--\(boundary)--\r\n")
    request.httpBody = body
    
    let (data, response) = try await URLSession.shared.data(for: request)
    // Handle response...
}
```

### 2. File Validation Before Upload

**Swift Implementation**:
```swift
struct MediaValidator {
    static let maxImageSize: Int = 5 * 1024 * 1024      // 5MB
    static let maxVideoSize: Int = 50 * 1024 * 1024     // 50MB
    static let maxVideosPerEvent = 5
    
    static func validateImage(_ image: UIImage) -> ValidationResult {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            return .invalid("Unable to process image")
        }
        
        if imageData.count > maxImageSize {
            return .invalid("Image size exceeds 5MB limit")
        }
        
        return .valid
    }
    
    static func validateVideo(at url: URL) -> ValidationResult {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              let fileSize = attributes[.size] as? Int else {
            return .invalid("Unable to read video file")
        }
        
        if fileSize > maxVideoSize {
            return .invalid("Video size exceeds 50MB limit")
        }
        
        return .valid
    }
}

enum ValidationResult {
    case valid
    case invalid(String)
}
```

### 3. Progress Tracking for Uploads

**Swift Example with Progress**:
```swift
func uploadWithProgress(
    request: URLRequest,
    data: Data,
    progressHandler: @escaping (Double) -> Void
) async throws -> (Data, URLResponse) {
    
    return try await withCheckedThrowingContinuation { continuation in
        let task = URLSession.shared.uploadTask(with: request, from: data) { data, response, error in
            if let error = error {
                continuation.resume(throwing: error)
            } else if let data = data, let response = response {
                continuation.resume(returning: (data, response))
            }
        }
        
        // Monitor upload progress
        let observation = task.progress.observe(\.fractionCompleted) { progress, _ in
            DispatchQueue.main.async {
                progressHandler(progress.fractionCompleted)
            }
        }
        
        task.resume()
    }
}
```

### 4. Error Handling for Media Uploads

**Common Error Scenarios**:

```swift
enum MediaUploadError: LocalizedError {
    case fileTooLarge(String)
    case unsupportedFileType(String)
    case networkError(String)
    case serverError(String)
    case authenticationRequired
    
    var errorDescription: String? {
        switch self {
        case .fileTooLarge(let message):
            return "File too large: \(message)"
        case .unsupportedFileType(let type):
            return "Unsupported file type: \(type)"
        case .networkError(let message):
            return "Network error: \(message)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .authenticationRequired:
            return "Authentication required for file upload"
        }
    }
}

// Error handling in upload function
func handleUploadResponse(_ data: Data, _ response: URLResponse) throws -> EventResponse {
    guard let httpResponse = response as? HTTPURLResponse else {
        throw MediaUploadError.networkError("Invalid response")
    }
    
    switch httpResponse.statusCode {
    case 200...299:
        return try JSONDecoder().decode(EventResponse.self, from: data)
    case 400:
        throw MediaUploadError.unsupportedFileType("Invalid file format or size")
    case 401:
        throw MediaUploadError.authenticationRequired
    case 413:
        throw MediaUploadError.fileTooLarge("File exceeds size limits")
    default:
        throw MediaUploadError.serverError("HTTP \(httpResponse.statusCode)")
    }
}
```

## Data Types and Models

### Upload Result Model

```swift
struct CloudinaryUploadResult: Codable {
    let publicId: String
    let secureUrl: String
    let resourceType: ResourceType
    let format: String
    let bytes: Int
    
    enum ResourceType: String, Codable {
        case image = "image"
        case video = "video"
    }
    
    private enum CodingKeys: String, CodingKey {
        case publicId = "public_id"
        case secureUrl = "secure_url"
        case resourceType = "resource_type"
        case format, bytes
    }
}
```

### Event Response Model

```swift
struct EventResponse: Codable {
    let success: Bool
    let message: String
    let event: EventDetail
}

struct EventDetail: Codable {
    let id: Int
    let title: String
    let description: String
    let image: String?              // Single cover image URL
    let videoUrls: [String]         // Array of video URLs
    let date: Date
    let city: String
    let location: String
    let category: String
    let createdAt: Date
    // ... other event properties
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | iOS Handling |
|-------------|---------|--------------|
| 200/201 | Success | Parse response data |
| 400 | Bad Request | Show validation error message |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission denied message |
| 413 | Payload Too Large | Show file size error |
| 415 | Unsupported Media Type | Show file type error |
| 500 | Server Error | Show generic error message |

### Common Error Responses

**File Too Large (413)**:
```json
{
  "error": "File too large",
  "details": "Maximum file size is 50MB for videos, 5MB for images"
}
```

**Unsupported File Type (415)**:
```json
{
  "error": "Unsupported file type",
  "details": "Only image and video files are allowed"
}
```

**Authentication Required (401)**:
```json
{
  "error": "Authentication required",
  "details": "Please log in to upload files"
}
```

## Performance Optimization

### Image Compression

**iOS Implementation**:
```swift
extension UIImage {
    func compressedData(maxSizeKB: Int) -> Data? {
        var compression: CGFloat = 1.0
        var imageData = self.jpegData(compressionQuality: compression)
        
        while let data = imageData, data.count > maxSizeKB * 1024 && compression > 0.1 {
            compression -= 0.1
            imageData = self.jpegData(compressionQuality: compression)
        }
        
        return imageData
    }
}
```

### Video Compression

**Recommended Settings**:
- **Resolution**: 1080p maximum for upload
- **Format**: H.264 MP4 for best compatibility
- **Bitrate**: 2-5 Mbps for good quality/size balance

### Background Uploads

**iOS Implementation**:
```swift
class MediaUploadManager {
    func scheduleBackgroundUpload(eventData: EventCreateRequest, mediaItems: [MediaItem]) {
        let identifier = "com.maly.media-upload-\(UUID().uuidString)"
        
        let configuration = URLSessionConfiguration.background(withIdentifier: identifier)
        let session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        
        // Create upload task
        let task = session.uploadTask(with: createRequest(eventData, mediaItems))
        task.resume()
    }
}
```

## Security Considerations

### File Type Validation

- **Client-Side**: Pre-validate file types and sizes before upload
- **Server-Side**: Server performs additional validation regardless of client checks
- **MIME Type**: Server validates actual file content, not just extension

### Authentication

- **Required**: All media upload endpoints require authentication
- **Token**: Use Bearer token or session-based authentication
- **Permissions**: Users can only upload media for their own events/profile

### Content Policy

- **Moderation**: Consider implementing content moderation for uploaded media
- **Storage Limits**: Monitor user storage quotas if applicable
- **Backup**: Cloudinary provides automatic backup and redundancy

## Testing

### Unit Tests for iOS

```swift
class MediaUploadTests: XCTestCase {
    func testImageValidation() {
        let validImage = UIImage(systemName: "photo")!
        let result = MediaValidator.validateImage(validImage)
        
        XCTAssertEqual(result, .valid)
    }
    
    func testOversizedImageRejection() {
        // Create large image for testing
        let largeImage = createLargeTestImage(sizeKB: 6000) // Over 5MB limit
        let result = MediaValidator.validateImage(largeImage)
        
        switch result {
        case .invalid(let message):
            XCTAssertTrue(message.contains("size exceeds"))
        case .valid:
            XCTFail("Should reject oversized image")
        }
    }
}
```

### Integration Testing

**Test Scenarios**:
1. **Successful Upload**: Valid image and video upload
2. **File Size Rejection**: Files exceeding size limits
3. **File Type Rejection**: Unsupported file formats
4. **Authentication Failure**: Upload without proper auth
5. **Network Interruption**: Handle upload failures gracefully

### Mock Server for Development

```swift
protocol MediaUploadService {
    func uploadEvent(_ data: EventCreateRequest) async throws -> EventResponse
}

class MockMediaUploadService: MediaUploadService {
    func uploadEvent(_ data: EventCreateRequest) async throws -> EventResponse {
        // Simulate network delay
        try await Task.sleep(nanoseconds: 2_000_000_000)
        
        return EventResponse(
            success: true,
            message: "Event uploaded successfully",
            event: EventDetail(
                id: 123,
                title: data.title,
                image: "https://mock.cloudinary.com/image/upload/mock_image.jpg",
                videoUrls: ["https://mock.cloudinary.com/video/upload/mock_video.mp4"],
                // ... other mock data
            )
        )
    }
}
```

## Troubleshooting

### Common Issues

1. **Large File Upload Failures**
   - **Solution**: Implement compression before upload
   - **Prevention**: Validate file sizes client-side

2. **Slow Upload Performance**
   - **Solution**: Implement background uploads
   - **Solution**: Show progress indicators to users

3. **Authentication Errors**
   - **Solution**: Refresh auth tokens before upload
   - **Solution**: Handle 401 responses with re-authentication

4. **Network Timeout**
   - **Solution**: Implement retry logic with exponential backoff
   - **Solution**: Use URLSession background configuration

### Debug Information

Enable debug logging for upload operations:

```swift
#if DEBUG
    print("Upload Progress: \(progress.fractionCompleted * 100)%")
    print("Upload Speed: \(bytesPerSecond) bytes/sec")
    print("Time Remaining: \(estimatedTimeRemaining) seconds")
#endif
```

---

*Last Updated: August 19, 2025*
*Version: 1.0*
*Compatible with: Maly Backend API v2.x*