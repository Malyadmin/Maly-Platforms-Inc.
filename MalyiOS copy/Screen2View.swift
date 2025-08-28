import SwiftUI
import PhotosUI
import CommonCrypto

struct Screen2View: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @State private var selectedImages: [PhotosPickerItem] = []
    @State private var selectedVideos: [PhotosPickerItem] = []
    @State private var uploadedImageURLs: [String] = []
    @State private var uploadedVideoURLs: [String] = []
    @State private var isUploading = false
    @State private var uploadProgress: Double = 0.0
    @State private var errorMessage: String?
    @State private var showingImagePicker = false
    @State private var showingVideoPicker = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Build your event gallery")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 4)

                Text("Add high resolution photos or flyer to your event\nFirst picture will be your event flyer")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                    .padding(.bottom, 40)

                // Main Image Upload Box
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.5), style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        .frame(height: 288)
                    
                    if let firstImageURL = uploadedImageURLs.first {
                        // Display the first uploaded image
                        AsyncImage(url: URL(string: firstImageURL)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(height: 288)
                                .clipped()
                                .cornerRadius(12)
                        } placeholder: {
                            ProgressView()
                                .frame(height: 288)
                        }
                    } else {
                        VStack(spacing: 12) {
                            if isUploading {
                                ProgressView(value: uploadProgress)
                                    .progressViewStyle(LinearProgressViewStyle(tint: .white))
                                    .frame(width: 200)
                                Text("Uploading... \(Int(uploadProgress * 100))%")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.gray.opacity(0.7))
                            } else {
                                Image(systemName: "photo.on.rectangle")
                                    .font(.system(size: 64))
                                    .foregroundColor(Color.white.opacity(0.6))
                                Text("Tap to upload images and videos")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.gray.opacity(0.7))
                            }
                        }
                    }
                }
                .onTapGesture {
                    showingImagePicker = true
                }
                .padding(.bottom, 32)

                // Thumbnail Grid
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                    // Add More Thumbnail
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.white.opacity(0.3), style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
                            .aspectRatio(1, contentMode: .fit)
                        Image(systemName: "plus")
                            .font(.system(size: 24))
                            .foregroundColor(Color.white.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity)
                    .onTapGesture {
                        showingImagePicker = true
                    }

                    // Display uploaded images and videos as thumbnails
                    ForEach(Array(uploadedImageURLs.enumerated()), id: \.offset) { index, imageURL in
                        AsyncImage(url: URL(string: imageURL)) { image in
                            image
                                .resizable()
                                .aspectRatio(1, contentMode: .fill)
                                .clipped()
                                .cornerRadius(8)
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.3))
                                .aspectRatio(1, contentMode: .fit)
                        }
                        .overlay(
                            // Delete button
                            Button(action: {
                                removeImage(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                                    .background(Color.white)
                                    .clipShape(Circle())
                            }
                            .padding(4),
                            alignment: .topTrailing
                        )
                    }
                    
                    // Video thumbnails with play icon
                    ForEach(Array(uploadedVideoURLs.enumerated()), id: \.offset) { index, videoURL in
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.3))
                                .aspectRatio(1, contentMode: .fit)
                            
                            VStack {
                                Image(systemName: "play.circle.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.white)
                                Text("Video")
                                    .font(.system(size: 10))
                                    .foregroundColor(.white)
                            }
                        }
                        .overlay(
                            // Delete button
                            Button(action: {
                                removeVideo(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                                    .background(Color.white)
                                    .clipShape(Circle())
                            }
                            .padding(4),
                            alignment: .topTrailing
                        )
                    }

                    // Empty placeholders to fill the grid
                    ForEach(0..<max(0, 5 - uploadedImageURLs.count - uploadedVideoURLs.count), id: \.self) { _ in
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.white.opacity(0.3), style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
                            .aspectRatio(1, contentMode: .fit)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.bottom, 32)

                // Information List
                VStack(alignment: .leading, spacing: 8) {
                    Text("• Up to 6 pictures, multiple videos (50MB max each)")
                    Text("• Recommended: 1200x800px for images")
                    Text("• First image becomes your event cover")
                    if let errorMessage = errorMessage {
                        Text("⚠️ \(errorMessage)")
                            .foregroundColor(.red)
                    }
                }
                .font(.system(size: 14))
                .foregroundColor(Color.gray.opacity(0.7))
                .padding(.bottom, 40)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
        .photosPicker(isPresented: $showingImagePicker, 
                     selection: $selectedImages,
                     maxSelectionCount: 6,
                     matching: .any(of: [.images, .videos]))
        .onChange(of: selectedImages) { oldItems, newItems in
            Task {
                await uploadSelectedMedia(newItems)
            }
        }
        .onAppear {
            // Load existing images from eventStore if any
            if !eventStore.eventData.imageURLs.isEmpty {
                uploadedImageURLs = eventStore.eventData.imageURLs
            }
            if !eventStore.eventData.videoURLs.isEmpty {
                uploadedVideoURLs = eventStore.eventData.videoURLs
            }
        }
    }
    
    // MARK: - Helper Functions
    
    private func uploadSelectedMedia(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        
        await MainActor.run {
            isUploading = true
            uploadProgress = 0.0
            errorMessage = nil
        }
        
        do {
            for (index, item) in items.enumerated() {
                await MainActor.run {
                    uploadProgress = Double(index) / Double(items.count)
                }
                
                if let data = try await item.loadTransferable(type: Data.self) {
                    let imageURL = try await uploadToCloudinary(data: data, item: item)
                    
                    await MainActor.run {
                        if item.supportedContentTypes.contains(.image) {
                            uploadedImageURLs.append(imageURL)
                            // Update event store with all uploaded images
                            eventStore.updateEventImages(uploadedImageURLs)
                            print("📸 Added image URL: \(imageURL)")
                            print("📸 Total images now: \(uploadedImageURLs.count)")
                        } else if item.supportedContentTypes.contains(.video) {
                            uploadedVideoURLs.append(imageURL)
                            eventStore.updateEventVideos(uploadedVideoURLs)
                            print("📹 Added video URL: \(imageURL)")
                        }
                    }
                }
            }
            
            await MainActor.run {
                isUploading = false
                uploadProgress = 1.0
                selectedImages = []
                print("✅ Successfully uploaded \(items.count) media files")
                print("📸 Current uploaded image URLs: \(uploadedImageURLs)")
                print("📸 Event store image URLs: \(eventStore.eventData.imageURLs)")
                print("📸 Event store main image URL: \(eventStore.eventData.eventImageURL)")
            }
            
        } catch {
            await MainActor.run {
                isUploading = false
                errorMessage = "Upload failed: \(error.localizedDescription)"
                selectedImages = []
                print("❌ Upload error: \(error)")
            }
        }
    }
    
    private func uploadToCloudinary(data: Data, item: PhotosPickerItem) async throws -> String {
        // Cloudinary credentials
        let cloudName = "dwmolc54p"
        let apiKey = "471719932714117"
        let apiSecret = "y_YmVSpkaNDxCybGhgKp5gVH48M"
        
        // Create multipart form data
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add API key
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"api_key\"\r\n\r\n")
        body.append("\(apiKey)\r\n")
        
        // Add timestamp
        let timestamp = String(Int(Date().timeIntervalSince1970))
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n")
        body.append("\(timestamp)\r\n")
        
        // Add folder
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"folder\"\r\n\r\n")
        body.append("maly_events\r\n")
        
        // Add public_id for better organization
        let publicId = "event_\(UUID().uuidString)"
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"public_id\"\r\n\r\n")
        body.append("\(publicId)\r\n")
        
        // Create signature for authentication (alphabetical order of parameters)
        let paramsToSign = "folder=maly_events&public_id=\(publicId)&timestamp=\(timestamp)"
        let signature = sha1Hash(string: paramsToSign + apiSecret)
        
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"signature\"\r\n\r\n")
        body.append("\(signature)\r\n")
        
        // Add the actual file
        let filename = item.supportedContentTypes.contains(.video) ? "video.mp4" : "image.jpg"
        let contentType = item.supportedContentTypes.contains(.video) ? "video/mp4" : "image/jpeg"
        
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n")
        body.append("Content-Type: \(contentType)\r\n\r\n")
        body.append(data)
        body.append("\r\n")
        body.append("--\(boundary)--\r\n")
        
        request.httpBody = body
        
        print("🔄 Uploading to Cloudinary...")
        print("📝 Upload URL: https://api.cloudinary.com/v1_1/\(cloudName)/image/upload")
        print("📝 File size: \(data.count) bytes")
        
        let (responseData, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        print("📡 Response status: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode != 200 {
            if let errorResponse = String(data: responseData, encoding: .utf8) {
                print("❌ Cloudinary error response: \(errorResponse)")
            }
            throw URLError(.badServerResponse)
        }
        
        if let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any] {
            print("✅ Cloudinary response: \(json)")
            if let secureURL = json["secure_url"] as? String {
                return secureURL
            } else {
                print("❌ No secure_url found in response")
                throw URLError(.cannotParseResponse)
            }
        } else {
            print("❌ Could not parse JSON response")
            throw URLError(.cannotParseResponse)
        }
    }
    
    private func removeImage(at index: Int) {
        uploadedImageURLs.remove(at: index)
        // Update event store with the new array
        eventStore.updateEventImages(uploadedImageURLs)
        // Clear image data if removing the first image and no images remain
        if index == 0 && uploadedImageURLs.isEmpty {
            eventStore.eventData.images = []
        }
    }
    
    private func removeVideo(at index: Int) {
        uploadedVideoURLs.remove(at: index)
        // Update event store with the new array
        eventStore.updateEventVideos(uploadedVideoURLs)
    }
    
    private func sha1Hash(string: String) -> String {
        let data = Data(string.utf8)
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA1($0.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

// Extension to help with Data appending
extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
}