import SwiftUI

struct ConnectionsListView: View {
    @StateObject private var inboxViewModel = InboxViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var selectedUser: ConnectUser?
    @State private var showingUserProfile = false
    @State private var searchText = ""
    
    var filteredConnections: [UserConnection] {
        if searchText.isEmpty {
            return inboxViewModel.recentConnections
        } else {
            return inboxViewModel.recentConnections.filter { connection in
                connection.username.localizedCaseInsensitiveContains(searchText) ||
                (connection.fullName?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                searchBarSection
                
                // Connections list
                connectionsListSection
            }
            .background(Color.black)
            .navigationTitle("My Connections")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .sheet(item: $selectedUser) { user in
            UserProfileView(user: user, initialConnectionStatus: .connected)
        }
        .onAppear {
            loadConnections()
        }
    }
    
    // MARK: - Search Bar Section
    private var searchBarSection: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                
                TextField("Search connections", text: $searchText)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.clear)
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.gray.opacity(0.3)),
                alignment: .bottom
            )
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
    }
    
    // MARK: - Connections List Section
    private var connectionsListSection: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                // Header with count
                HStack {
                    Text("All Connections")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text("\(filteredConnections.count)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 16)
                
                // Connections list
                if filteredConnections.isEmpty {
                    emptyStateView
                } else {
                    ForEach(filteredConnections, id: \.id) { connection in
                        connectionListItem(connection: connection)
                    }
                }
            }
        }
        .refreshable {
            await refreshConnections()
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text(searchText.isEmpty ? "No connections yet" : "No connections found")
                .font(.headline)
                .foregroundColor(.white)
            
            if searchText.isEmpty {
                Text("Start connecting with people to see them here")
                    .font(.body)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            } else {
                Text("Try adjusting your search")
                    .font(.body)
                    .foregroundColor(.gray)
            }
        }
        .padding(40)
        .frame(maxWidth: .infinity)
    }
    
    private func connectionListItem(connection: UserConnection) -> some View {
        Button(action: {
            // Convert UserConnection to ConnectUser for profile view
            selectedUser = ConnectUser(
                id: connection.id,
                username: connection.username,
                fullName: connection.fullName,
                profileType: nil,
                gender: nil,
                sexualOrientation: nil,
                bio: nil,
                profileImage: connection.profileImage,
                profileImages: nil,
                location: nil,
                birthLocation: nil,
                nextLocation: nil,
                interests: nil,
                currentMoods: nil,
                profession: nil,
                age: nil,
                businessName: nil,
                businessDescription: nil,
                websiteUrl: nil,
                createdAt: nil,
                lastActive: nil,
                isPremium: nil,
                preferredLanguage: nil,
                referralCode: nil
            )
            showingUserProfile = true
        }) {
            HStack(spacing: 12) {
                // Profile image
                AsyncImage(url: URL(string: connection.profileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "person.fill")
                                .foregroundColor(.white)
                                .font(.title2)
                        )
                }
                .frame(width: 60, height: 60)
                .clipShape(Rectangle())
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(connection.fullName?.uppercased() ?? connection.username.uppercased())
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("@\(connection.username)")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    if let connectionDate = connection.connectionDate {
                        Text("Connected \(formatDate(connectionDate))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
                    .font(.caption)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .background(Color.clear)
    }
    
    // MARK: - Helper Methods
    private func loadConnections() {
        inboxViewModel.fetchRecentConnections { _ in }
    }
    
    private func refreshConnections() async {
        inboxViewModel.fetchRecentConnections { _ in }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    ConnectionsListView()
        .preferredColorScheme(.dark)
}