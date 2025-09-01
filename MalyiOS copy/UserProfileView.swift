import SwiftUI

struct UserProfileView: View {
    let user: ConnectUser
    @Environment(\.dismiss) private var dismiss
    @State private var connectionStatus: ConnectionStatus = .notConnected
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Header with profile image
                    headerSection
                    
                    // Profile info section
                    profileInfoSection
                    
                    // Action buttons
                    actionButtonsSection
                    
                    // Bio section
                    if let bio = user.bio, !bio.isEmpty {
                        bioSection(bio: bio)
                    }
                    
                    // Interests section
                    if let interests = user.interests, !interests.isEmpty {
                        interestsSection(interests: interests)
                    }
                    
                    // Moods section
                    if let moods = user.currentMoods, !moods.isEmpty {
                        moodsSection(moods: moods)
                    }
                    
                    // Additional info section
                    additionalInfoSection
                    
                    Spacer()
                }
            }
            .background(Color.black)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Back") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Send") {
                        // TODO: Implement send message
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .overlay(
                        Text(String((user.fullName ?? user.username).prefix(1)))
                            .font(.system(size: 40, weight: .semibold))
                            .foregroundColor(.white)
                    )
            }
            .frame(width: 120, height: 120)
            .clipShape(Circle())
            
            Text("SHARE PROFILE")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
        .padding(.top, 20)
        .padding(.bottom, 30)
    }
    
    private var profileInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "person.fill")
                                .foregroundColor(.white)
                                .font(.title)
                        )
                }
                .frame(width: 60, height: 60)
                .clipShape(Rectangle())
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(user.fullName ?? user.username)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    if let moods = user.currentMoods, !moods.isEmpty {
                        Text(moods.joined(separator: " | "))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    if let location = user.location {
                        HStack {
                            Image(systemName: "location")
                                .foregroundColor(.gray)
                                .font(.caption)
                            Text(location)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                Spacer()
            }
            .padding(.horizontal, 20)
        }
    }
    
    private var actionButtonsSection: some View {
        HStack(spacing: 12) {
            Button(action: {
                // TODO: Implement connect action
                isLoading = true
                // Simulate connection request
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    connectionStatus = .pending
                    isLoading = false
                }
            }) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: connectionButtonIcon)
                    }
                    Text(connectionButtonText)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(connectionButtonColor)
                .cornerRadius(25)
            }
            .disabled(isLoading)
            
            Button(action: {
                // TODO: Implement message action
            }) {
                HStack {
                    Image(systemName: "message")
                    Text("Message")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.blue)
                .cornerRadius(25)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    private func bioSection(bio: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("About")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(bio)
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 24)
    }
    
    private func interestsSection(interests: [String]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Interests")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(interests, id: \.self) { interest in
                    Text(interest)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.gray.opacity(0.3))
                        .foregroundColor(.white)
                        .cornerRadius(15)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 24)
    }
    
    private func moodsSection(moods: [String]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Current Moods")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(moods, id: \.self) { mood in
                    Text(mood)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.3))
                        .foregroundColor(.white)
                        .cornerRadius(15)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 24)
    }
    
    private var additionalInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let profession = user.profession {
                infoRow(title: "Profession", value: profession)
            }
            
            if let age = user.age {
                infoRow(title: "Age", value: "\(age) years old")
            }
            
            if let profileType = user.profileType, profileType != "member" {
                infoRow(title: "Profile Type", value: profileType.capitalized)
            }
            
            if let businessName = user.businessName {
                infoRow(title: "Business", value: businessName)
            }
            
            if let websiteUrl = user.websiteUrl {
                infoRow(title: "Website", value: websiteUrl)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
    }
    
    private func infoRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.gray)
                .frame(width: 100, alignment: .leading)
            
            Text(value)
                .font(.subheadline)
                .foregroundColor(.white)
            
            Spacer()
        }
    }
    
    // Connection button properties
    private var connectionButtonIcon: String {
        switch connectionStatus {
        case .notConnected:
            return "plus"
        case .pending:
            return "clock"
        case .connected:
            return "checkmark"
        case .blocked:
            return "xmark"
        }
    }
    
    private var connectionButtonText: String {
        switch connectionStatus {
        case .notConnected:
            return "Connect"
        case .pending:
            return "Pending"
        case .connected:
            return "Connected"
        case .blocked:
            return "Blocked"
        }
    }
    
    private var connectionButtonColor: Color {
        switch connectionStatus {
        case .notConnected:
            return .green
        case .pending:
            return .orange
        case .connected:
            return .blue
        case .blocked:
            return .red
        }
    }
}

#Preview {
    UserProfileView(user: ConnectUser(
        id: 1,
        username: "johndoe",
        fullName: "John Doe",
        profileType: "member",
        gender: "male",
        sexualOrientation: nil,
        bio: "Love traveling and meeting new people. Always up for an adventure!",
        profileImage: nil,
        profileImages: [],
        location: "New York",
        birthLocation: nil,
        nextLocation: nil,
        interests: ["Travel", "Photography", "Fitness", "Technology"],
        currentMoods: ["Adventurous", "Social", "Creative"],
        profession: "Software Engineer",
        age: 28,
        businessName: nil,
        businessDescription: nil,
        websiteUrl: nil,
        createdAt: nil,
        lastActive: nil,
        isPremium: false,
        preferredLanguage: "en",
        referralCode: nil
    ))
}