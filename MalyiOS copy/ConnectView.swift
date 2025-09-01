import SwiftUI

struct ConnectView: View {
    @StateObject private var connectViewModel = ConnectViewModel()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var showingSearch = false
    @State private var showingFilters = false
    @State private var selectedUser: ConnectUser?
    @State private var showingUserProfile = false
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Custom Header
                headerSection
                
                // Content based on search state
                if showingSearch {
                    searchView
                } else {
                    mainContentView
                }
            }
            .background(Color.black)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .sheet(item: $selectedUser) { user in
            UserProfileView(user: user)
        }
        .onAppear {
            loadInitialData()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 0) {
            // Top header with MALY and search icon
            HStack {
                if showingSearch {
                    Button("Back") {
                        showingSearch = false
                        searchText = ""
                    }
                    .foregroundColor(.white)
                } else {
                    Button("City name") {
                        // TODO: Implement city selector
                    }
                    .foregroundColor(.white)
                    .overlay(
                        Image(systemName: "chevron.down")
                            .foregroundColor(.white)
                            .font(.caption)
                            .offset(x: 45)
                    )
                }
                
                Spacer()
                
                Text("MALY")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .tracking(2)
                
                Spacer()
                
                Button(action: {
                    showingSearch.toggle()
                }) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.white)
                        .font(.title2)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 10)
            .padding(.bottom, 16)
            
            // Search bar (only when searching)
            if showingSearch {
                searchBarSection
            }
        }
    }
    
    private var searchBarSection: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                
                TextField("Search for a specific member", text: $searchText)
                    .foregroundColor(.white)
                    .onChange(of: searchText) {
                        // TODO: Implement search functionality
                    }
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
    
    // MARK: - Main Content
    private var mainContentView: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                // Like-vibe section header
                likeVibeSection
                
                // Featured large profile
                if let featuredUser = connectViewModel.nearbyUsers.first {
                    featuredProfileSection(user: featuredUser)
                }
                
                // People with common interests section
                commonInterestsSection
                
                // Other members section  
                otherMembersSection
            }
        }
        .refreshable {
            await refreshUsers()
        }
    }
    
    private var searchView: some View {
        VStack(alignment: .leading, spacing: 0) {
            if searchText.isEmpty {
                // Empty search state
                Spacer()
            } else {
                // Search results
                searchResultsSection
            }
        }
    }
    
    private var likeVibeSection: some View {
        HStack {
            Text("Like-vibe people near you")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
            
            Spacer()
            
            Text("\(connectViewModel.nearbyUsers.count)")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
    
    private func featuredProfileSection(user: ConnectUser) -> some View {
        VStack(spacing: 0) {
            // Large profile card
            Button(action: {
                selectedUser = user
                showingUserProfile = true
            }) {
                VStack(spacing: 0) {
                    // Profile image
                    AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .overlay(
                                Image(systemName: "person.fill")
                                    .foregroundColor(.black)
                                    .font(.system(size: 60))
                            )
                    }
                    .frame(height: 250)
                    .clipped()
                    
                    // Profile info overlay
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(user.fullName?.uppercased() ?? user.username.uppercased())
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                if let moods = user.currentMoods, !moods.isEmpty {
                                    Text(moods.prefix(3).joined(separator: " | "))
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                        .lineLimit(1)
                                }
                                
                                if let location = user.location {
                                    HStack {
                                        Image(systemName: "location")
                                            .foregroundColor(.gray)
                                            .font(.caption2)
                                        Text(location)
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing, spacing: 2) {
                                Text(user.fullName?.uppercased() ?? user.username.uppercased())
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                if let moods = user.currentMoods, !moods.isEmpty {
                                    Text(moods.prefix(3).joined(separator: " | "))
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                        .lineLimit(1)
                                }
                                
                                HStack {
                                    Image(systemName: "location")
                                        .foregroundColor(.gray)
                                        .font(.caption2)
                                    Text("City Name")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                    }
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.clear, Color.black.opacity(0.8)]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
            }
            .padding(.horizontal, 20)
        }
    }
    
    private var commonInterestsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("People near you with common interests")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(min(connectViewModel.nearbyUsers.count, 3))")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            
            // List of users
            ForEach(connectViewModel.nearbyUsers.prefix(3), id: \.id) { user in
                userListItem(user: user)
            }
        }
        .padding(.top, 24)
    }
    
    private var otherMembersSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Other members near you")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(max(connectViewModel.totalUserCount - 3, 0))")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            
            // 3x4 Grid of users
            let gridUsers = Array(connectViewModel.nearbyUsers.dropFirst(3))
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(gridUsers.prefix(12), id: \.id) { user in
                    gridUserItem(user: user)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.top, 24)
    }
    
    private func userListItem(user: ConnectUser) -> some View {
        Button(action: {
            selectedUser = user
            showingUserProfile = true
        }) {
            HStack(spacing: 12) {
                // Profile image
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
                                .font(.title2)
                        )
                }
                .frame(width: 60, height: 60)
                .clipShape(Rectangle())
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(user.fullName?.uppercased() ?? user.username.uppercased())
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    if let moods = user.currentMoods, !moods.isEmpty {
                        Text(moods.prefix(3).joined(separator: " | "))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .lineLimit(1)
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
            .padding(.vertical, 8)
        }
    }
    
    private func gridUserItem(user: ConnectUser) -> some View {
        Button(action: {
            selectedUser = user
            showingUserProfile = true
        }) {
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
            .frame(height: 80)
            .clipShape(Rectangle())
            .cornerRadius(8)
        }
    }
    
    private var searchResultsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Maly members")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(connectViewModel.nearbyUsers.count)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
            
            // Search results list
            ForEach(connectViewModel.nearbyUsers.prefix(5), id: \.id) { user in
                searchResultItem(user: user)
            }
        }
        .padding(.top, 20)
    }
    
    private func searchResultItem(user: ConnectUser) -> some View {
        Button(action: {
            selectedUser = user
            showingUserProfile = true
        }) {
            HStack(spacing: 12) {
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
                                .font(.title2)
                        )
                }
                .frame(width: 60, height: 60)
                .clipShape(Rectangle())
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(user.fullName?.uppercased() ?? user.username.uppercased())
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    if let moods = user.currentMoods, !moods.isEmpty {
                        Text(moods.prefix(3).joined(separator: " | "))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .lineLimit(1)
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
            .padding(.vertical, 8)
        }
    }
    
    // MARK: - Helper Methods
    private func loadInitialData() {
        connectViewModel.fetchNearbyUsers { _ in }
    }
    
    private func refreshUsers() async {
        connectViewModel.fetchNearbyUsers { _ in }
    }
}

// MARK: - Preview
#Preview {
    ConnectView()
        .environmentObject(AuthenticationViewModel())
        .preferredColorScheme(.dark)
}