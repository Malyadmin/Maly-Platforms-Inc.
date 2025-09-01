import SwiftUI

struct ConnectView: View {
    @StateObject private var connectViewModel = ConnectViewModel()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var showingSearch = false
    @State private var showingFilters = false
    @State private var showingUserProfile = false
    @State private var selectedUserId: Int?
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Header with user count and actions
                    headerSection
                    
                    // Featured user section
                    if let featuredUser = connectViewModel.featuredUser {
                        featuredUserSection(user: featuredUser)
                    }
                    
                    // Active filters display
                    if hasActiveFilters {
                        activeFiltersSection
                    }
                    
                    // Users grid
                    usersGridSection
                    
                    // Load more indicator
                    if connectViewModel.hasMoreUsers && !connectViewModel.nearbyUsers.isEmpty {
                        loadMoreSection
                    }
                }
                .padding(.horizontal)
            }
            .refreshable {
                await refreshUsers()
            }
            .navigationTitle("Connect")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        Button(action: { showingSearch = true }) {
                            Image(systemName: "magnifyingglass")
                        }
                        
                        Button(action: { showingFilters = true }) {
                            Image(systemName: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                                .foregroundColor(hasActiveFilters ? .blue : .primary)
                        }
                    }
                }
            }
            .sheet(isPresented: $showingSearch) {
                SearchView()
                    .environmentObject(connectViewModel)
            }
            .sheet(isPresented: $showingFilters) {
                FiltersView()
                    .environmentObject(connectViewModel)
            }
            .sheet(isPresented: $showingUserProfile) {
                if let userId = selectedUserId {
                    UserProfileView(userId: userId)
                }
            }
            .overlay {
                if connectViewModel.isLoading && connectViewModel.nearbyUsers.isEmpty {
                    ProgressView("Discovering people nearby...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemBackground))
                }
            }
            .overlay {
                if let errorMessage = connectViewModel.errorMessage {
                    errorView(message: errorMessage)
                }
            }
        }
        .onAppear {
            loadInitialData()
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Discover People")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text("\(connectViewModel.totalUserCount) people in your area")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
    
    // MARK: - Featured User Section
    
    private func featuredUserSection(user: ConnectUser) -> some View {
        VStack(spacing: 12) {
            HStack {
                Text("Featured")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            FeaturedUserCard(user: user) {
                selectedUserId = user.id
                showingUserProfile = true
            }
        }
    }
    
    // MARK: - Active Filters Section
    
    private var activeFiltersSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Active Filters")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Button("Clear All") {
                    connectViewModel.clearAllFilters()
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    if let location = connectViewModel.currentLocationFilter {
                        FilterChip(text: "📍 \(location)", onRemove: {
                            connectViewModel.currentLocationFilter = nil
                            connectViewModel.fetchNearbyUsers { _ in }
                        })
                    }
                    
                    if let gender = connectViewModel.currentGenderFilter {
                        FilterChip(text: "👤 \(gender.capitalized)", onRemove: {
                            connectViewModel.currentGenderFilter = nil
                            connectViewModel.fetchNearbyUsers { _ in }
                        })
                    }
                    
                    if let minAge = connectViewModel.currentMinAge, let maxAge = connectViewModel.currentMaxAge {
                        FilterChip(text: "🎂 \(minAge)-\(maxAge)", onRemove: {
                            connectViewModel.currentMinAge = nil
                            connectViewModel.currentMaxAge = nil
                            connectViewModel.fetchNearbyUsers { _ in }
                        })
                    }
                    
                    ForEach(connectViewModel.currentMoodFilters, id: \.self) { mood in
                        FilterChip(text: "😊 \(mood)", onRemove: {
                            connectViewModel.currentMoodFilters.removeAll { $0 == mood }
                            connectViewModel.fetchNearbyUsers { _ in }
                        })
                    }
                    
                    ForEach(connectViewModel.currentInterestFilters, id: \.self) { interest in
                        FilterChip(text: "🎯 \(interest)", onRemove: {
                            connectViewModel.currentInterestFilters.removeAll { $0 == interest }
                            connectViewModel.fetchNearbyUsers { _ in }
                        })
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Users Grid Section
    
    private var usersGridSection: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            ForEach(connectViewModel.nearbyUsers) { user in
                UserCard(user: user) {
                    selectedUserId = user.id
                    showingUserProfile = true
                }
                .onAppear {
                    // Load more when reaching near the end
                    if user.id == connectViewModel.nearbyUsers.suffix(5).first?.id {
                        loadMoreUsers()
                    }
                }
            }
        }
    }
    
    // MARK: - Load More Section
    
    private var loadMoreSection: some View {
        HStack {
            if connectViewModel.isLoading {
                ProgressView()
                    .scaleEffect(0.8)
                Text("Loading more...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Button("Load More") {
                    loadMoreUsers()
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding()
    }
    
    // MARK: - Error View
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            
            Text("Something went wrong")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Try Again") {
                connectViewModel.errorMessage = nil
                loadInitialData()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Computed Properties
    
    private var hasActiveFilters: Bool {
        connectViewModel.currentLocationFilter != nil ||
        connectViewModel.currentGenderFilter != nil ||
        connectViewModel.currentMinAge != nil ||
        connectViewModel.currentMaxAge != nil ||
        !connectViewModel.currentMoodFilters.isEmpty ||
        !connectViewModel.currentInterestFilters.isEmpty
    }
    
    // MARK: - Methods
    
    private func loadInitialData() {
        connectViewModel.fetchNearbyUsers { _ in }
    }
    
    private func loadMoreUsers() {
        connectViewModel.loadMoreUsers { _ in }
    }
    
    @MainActor
    private func refreshUsers() async {
        connectViewModel.fetchNearbyUsers { _ in }
    }
}

// MARK: - Supporting Views

struct FeaturedUserCard: View {
    let user: ConnectUser
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Text(String(user.fullName.prefix(1)))
                                .font(.title2)
                                .fontWeight(.semibold)
                        )
                }
                .frame(width: 60, height: 60)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(user.fullName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if let profession = user.profession {
                        Text(profession)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Text(user.location ?? "Unknown location")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(spacing: 4) {
                    Button(action: { /* Send connection request */ }) {
                        Image(systemName: "person.badge.plus")
                            .font(.title3)
                    }
                    .buttonStyle(.borderedProminent)
                    .buttonBorderShape(.circle)
                    
                    Button(action: { /* Send message */ }) {
                        Image(systemName: "message")
                            .font(.title3)
                    }
                    .buttonStyle(.bordered)
                    .buttonBorderShape(.circle)
                }
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

struct UserCard: View {
    let user: ConnectUser
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Text(String(user.fullName.prefix(1)))
                                .font(.title)
                                .fontWeight(.semibold)
                        )
                }
                .frame(height: 120)
                .clipped()
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.fullName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    
                    if let age = user.age {
                        Text("\(age) years old")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    Text(user.location ?? "Unknown location")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(8)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

struct FilterChip: View {
    let text: String
    let onRemove: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            Text(text)
                .font(.caption2)
            
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.caption2)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(8)
    }
}

// MARK: - Placeholder Views

struct SearchView: View {
    @EnvironmentObject var connectViewModel: ConnectViewModel
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Search functionality will be implemented here")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct FiltersView: View {
    @EnvironmentObject var connectViewModel: ConnectViewModel
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Filter options will be implemented here")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct UserProfileView: View {
    let userId: Int
    
    var body: some View {
        VStack {
            Text("User profile for ID: \(userId)")
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    ConnectView()
        .environmentObject(AuthenticationViewModel())
}