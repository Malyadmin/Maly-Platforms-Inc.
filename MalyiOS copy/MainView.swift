import SwiftUI

struct MainView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var selectedTab = 2 // Default to Create tab
    @StateObject private var eventStore = EventCreationStore()
    @StateObject private var inboxViewModel = InboxViewModel() // For preloading connections
    
    // State to control which screen is currently visible in create flow
    @State private var currentScreenIndex: Int = 0
    
    // Array of screen views for create flow
    private func getCreateScreens() -> [AnyView] {
        return [
            AnyView(Screen1View().environmentObject(eventStore)),
            AnyView(Screen2View().environmentObject(eventStore)),
            AnyView(Screen3View().environmentObject(eventStore)),
            AnyView(Screen4View().environmentObject(eventStore)),
            AnyView(Screen5View().environmentObject(eventStore)),
            AnyView(Screen6View().environmentObject(eventStore)), // Event Published Successfully
            AnyView(Screen7View().environmentObject(eventStore)), // Create from previous event or draft
            AnyView(Screen8View().environmentObject(eventStore)), // Add event Lineup
            AnyView(Screen9View().environmentObject(eventStore))  // Target Audience
        ]
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Main content area
            switch selectedTab {
            case 0: // Discover
                DiscoverView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case 1: // Connect
                ConnectView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case 2: // Create (Default)
                createFlowView
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case 3: // Inbox
                InboxView()
                    .environmentObject(authViewModel)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case 4: // Profile
                ProfileTabView(authViewModel: authViewModel)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            default:
                createFlowView
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            
            // Bottom Navigation Bar
            NavigationBarView(selectedTab: $selectedTab)
                .frame(maxWidth: .infinity)
                .background(Color.black)
        }
        .statusBar(hidden: false)
        .onAppear {
            // Preload connections when app opens for better UX
            preloadConnections()
        }
        .onChange(of: authViewModel.isAuthenticated) { isAuthenticated in
            if isAuthenticated {
                // Preload connections when user authenticates
                preloadConnections()
            }
        }
    }
    
    // MARK: - Helper Methods
    private func preloadConnections() {
        guard authViewModel.isAuthenticated else { return }
        
        print("🔄 Preloading connections for better UX...")
        
        // Preload recent connections
        inboxViewModel.fetchRecentConnections { result in
            switch result {
            case .success(let connections):
                print("✅ Successfully preloaded \(connections.count) connections")
            case .failure(let error):
                print("❌ Failed to preload connections: \(error.message)")
            }
        }
        
        // Also preload connection requests
        inboxViewModel.fetchConnectionRequests { result in
            switch result {
            case .success(let requests):
                print("✅ Successfully preloaded \(requests.count) connection requests")
            case .failure(let error):
                print("❌ Failed to preload connection requests: \(error.message)")
            }
        }
    }
    
    // Create flow view that mimics CreateEventFlow structure
    private var createFlowView: some View {
        VStack(spacing: 0) {
            // Header View for create flow
            if currentScreenIndex != 5 { // Don't show header on preview screen
                HeaderView(
                    currentScreenIndex: $currentScreenIndex,
                    totalScreens: getCreateScreens().count,
                    eventStore: eventStore,
                    sessionId: authViewModel.sessionId ?? "no_session"
                )
                .frame(maxWidth: .infinity)
                .background(Color.black)
            }
            
            // The current active screen view
            getCreateScreens()[currentScreenIndex]
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black)
        }
    }
}

// MARK: - Coming Soon View
struct ComingSoonView: View {
    let tabName: String
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "hammer.circle")
                .font(.system(size: 80))
                .foregroundColor(.gray)
            
            Text("Coming Soon")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("\(tabName) features will be available soon!")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}


// MARK: - Profile Tab View  
struct ProfileTabView: View {
    let authViewModel: AuthenticationViewModel
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                Text("Profile")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top, 20)
                
                // User info display
                if let user = authViewModel.currentUser {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Your Information")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            VStack(alignment: .leading, spacing: 8) {
                                ProfileRow(title: "Username", value: user.username)
                                ProfileRow(title: "Email", value: user.email)
                                
                                if let fullName = user.fullName {
                                    ProfileRow(title: "Full Name", value: fullName)
                                }
                                
                                if let location = user.location {
                                    ProfileRow(title: "Location", value: location)
                                }
                                
                                if let profession = user.profession {
                                    ProfileRow(title: "Profession", value: profession)
                                }
                                
                                if let age = user.age {
                                    ProfileRow(title: "Age", value: "\(age)")
                                }
                                
                                if let gender = user.gender {
                                    ProfileRow(title: "Gender", value: gender)
                                }
                                
                                if let interests = user.interests, !interests.isEmpty {
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text("Interests:")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        
                                        LazyVGrid(columns: [
                                            GridItem(.adaptive(minimum: 80))
                                        ], spacing: 5) {
                                            ForEach(interests, id: \.self) { interest in
                                                Text(interest)
                                                    .font(.caption)
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(Color.blue.opacity(0.2))
                                                    .cornerRadius(10)
                                            }
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                
                                if let moods = user.currentMoods, !moods.isEmpty {
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text("Current Vibes:")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        
                                        LazyVGrid(columns: [
                                            GridItem(.adaptive(minimum: 80))
                                        ], spacing: 5) {
                                            ForEach(moods, id: \.self) { mood in
                                                Text(mood)
                                                    .font(.caption)
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(Color.purple.opacity(0.2))
                                                    .cornerRadius(10)
                                            }
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                        .padding(.horizontal)
                    }
                }
                
                Spacer()
                
                // Logout button
                Button(action: {
                    authViewModel.logout()
                }) {
                    Text("Logout")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .disabled(authViewModel.isLoading)
                .padding(.horizontal)
                .padding(.bottom, 20)
            }
            .navigationBarHidden(true)
        }
    }
}

struct ProfileRow: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title + ":")
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.body)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    MainView()
        .environmentObject(AuthenticationViewModel())
}