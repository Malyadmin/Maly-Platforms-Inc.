import SwiftUI

struct InboxView: View {
    @StateObject private var inboxViewModel = InboxViewModel()
    @StateObject private var messagingViewModel = MessagingViewModel()
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var selectedUser: ConnectUser?
    @State private var showingUserProfile = false
    @State private var showingConnectionsList = false
    @State private var selectedConversationId: Int?
    @State private var showingChat = false
    @State private var refreshTimer: Timer?
    @State private var isViewActive = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Custom Header
                headerSection
                
                // Main content
                if inboxViewModel.showingAuthenticationRequired || !authViewModel.isAuthenticated {
                    authenticationRequiredView
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            // Connection Requests Section
                            connectionRequestsSection
                            
                            // My Connections Section
                            myConnectionsSection
                            
                            // Messages & Groups Section
                            messagesSection
                        }
                    }
                    .refreshable {
                        await refreshInboxData()
                    }
                }
            }
            .background(Color.black)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .sheet(item: $selectedUser) { user in
            UserProfileView(user: user)
        }
        .sheet(isPresented: $showingConnectionsList) {
            ConnectionsListView()
        }
        .sheet(isPresented: $showingChat) {
            if let conversationId = selectedConversationId {
                NavigationView {
                    ChatView(conversationId: conversationId)
                        .environmentObject(messagingViewModel)
                }
            }
        }
        .onAppear {
            print("📱 InboxView appeared - Auth status: \(authViewModel.isAuthenticated)")
            print("📱 TokenManager status: \(TokenManager.shared.isAuthenticated)")
            
            isViewActive = true
            if authViewModel.isAuthenticated {
                loadInboxData()
                startAutoRefresh()
            } else {
                inboxViewModel.testAuthentication()
            }
        }
        .onDisappear {
            print("📱 InboxView disappeared - stopping auto-refresh")
            isViewActive = false
            stopAutoRefresh()
        }
        .onChange(of: authViewModel.isAuthenticated) { isAuthenticated in
            print("📱 Auth state changed to: \(isAuthenticated)")
            if isAuthenticated {
                loadInboxData()
                if isViewActive {
                    startAutoRefresh()
                }
            } else {
                stopAutoRefresh()
            }
        }
    }
    
    // MARK: - Authentication Required View
    private var authenticationRequiredView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "person.badge.key")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("Authentication Required")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Please log in to view your inbox and manage connections")
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            VStack(spacing: 8) {
                Button(action: {
                    inboxViewModel.testAuthentication()
                }) {
                    Text("Test Authentication")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.clear)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.gray, lineWidth: 1)
                        )
                }
                
                Button(action: {
                    print("📱 UI: Manual refresh triggered")
                    loadInboxData()
                }) {
                    Text("Force Refresh Data")
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.clear)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.blue, lineWidth: 1)
                        )
                }
            }
            .padding(.bottom, 8)
            
            Button(action: {
                // Navigate back to login/authentication view
                // This would typically be handled by the app's navigation system
            }) {
                Text("Go to Login")
                    .font(.headline)
                    .foregroundColor(.black)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(8)
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 0) {
            // Top header with MALY
            HStack {
                Text("Inbox")
                    .font(.headline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("MALY")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .tracking(2)
                
                Spacer()
                
                // Placeholder for balance
                Text("")
                    .font(.headline)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 20)
            .padding(.top, 10)
            .padding(.bottom, 16)
        }
    }
    
    // MARK: - Connection Requests Section
    private var connectionRequestsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Connection Requests")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(inboxViewModel.pendingRequests.count)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            .onAppear {
                print("📱 UI: Connection Requests header - Count: \(inboxViewModel.pendingRequests.count)")
                print("📱 UI: Current pending requests: \(inboxViewModel.pendingRequests.map { $0.username })")
            }
            
            if inboxViewModel.pendingRequests.isEmpty {
                Text("No pending connection requests")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
                    .onAppear {
                        print("📱 UI: Showing 'No pending requests' - Array count: \(inboxViewModel.pendingRequests.count)")
                    }
            } else {
                // Show up to 3 connection requests
                ForEach(inboxViewModel.pendingRequests.prefix(3), id: \.id) { request in
                    connectionRequestItem(request: request)
                }
                .onAppear {
                    print("📱 UI: Showing \(inboxViewModel.pendingRequests.count) connection requests")
                }
                
                if inboxViewModel.pendingRequests.count > 3 {
                    Button("View All Connection Requests") {
                        // TODO: Navigate to full connection requests view
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                }
            }
        }
        .padding(.top, 24)
    }
    
    // MARK: - My Connections Section
    private var myConnectionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("My Connections")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(inboxViewModel.connectionsCount)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            
            if inboxViewModel.recentConnections.isEmpty {
                Text("No connections yet")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
            } else {
                // Show up to 3 recent connections
                ForEach(inboxViewModel.recentConnections.prefix(3), id: \.id) { connection in
                    connectionItem(connection: connection)
                }
                
                Button(action: {
                    showingConnectionsList = true
                }) {
                    HStack {
                        Text("View All Connections")
                            .foregroundColor(.blue)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.blue)
                            .font(.caption)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .padding(.top, 24)
    }
    
    // MARK: - Messages Section
    private var messagesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Messages & Groups")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(messagingViewModel.conversations.count)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            
            if messagingViewModel.conversations.isEmpty {
                Text("No conversations yet")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
            } else {
                // Show up to 5 recent conversations
                ForEach(messagingViewModel.conversations.prefix(5), id: \.id) { conversation in
                    conversationItem(conversation: conversation)
                        .onAppear {
                            print("📱 UI: Displaying conversation \(conversation.id) - '\(conversation.title)' - hasLastMessage: \(conversation.lastMessage != nil)")
                            if let lastMessage = conversation.lastMessage {
                                print("📱 UI: LastMessage content: '\(lastMessage.content)'")
                            }
                        }
                }
                
                if messagingViewModel.conversations.count > 5 {
                    Button("View All Messages") {
                        // TODO: Navigate to full messages view
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                }
            }
        }
        .padding(.top, 24)
        .padding(.bottom, 32)
    }
    
    // MARK: - Item Views
    
    private func connectionRequestItem(request: ConnectionRequest) -> some View {
        HStack(spacing: 12) {
            // Profile image
            AsyncImage(url: URL(string: request.profileImage ?? "")) { image in
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
            .frame(width: 50, height: 50)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(request.fullName?.uppercased() ?? request.username.uppercased())
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Connection request")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Action buttons
            HStack(spacing: 8) {
                Button(action: {
                    inboxViewModel.declineConnectionRequest(userId: request.id)
                }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.white)
                        .font(.caption)
                        .padding(8)
                        .background(Color.red)
                        .clipShape(Circle())
                }
                
                Button(action: {
                    inboxViewModel.acceptConnectionRequest(userId: request.id)
                }) {
                    Image(systemName: "checkmark")
                        .foregroundColor(.white)
                        .font(.caption)
                        .padding(8)
                        .background(Color.green)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
    }
    
    private func connectionItem(connection: UserConnection) -> some View {
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
                .frame(width: 50, height: 50)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(connection.fullName?.uppercased() ?? connection.username.uppercased())
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    Text("Connected")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
                    .font(.caption)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
        }
    }
    
    private func conversationItem(conversation: Conversation) -> some View {
        Button(action: {
            selectedConversationId = conversation.id
            showingChat = true
        }) {
            HStack(spacing: 12) {
                // Use profile image from last message sender if available
                if let profileImageUrl = conversation.lastMessage?.sender?.profileImage,
                   !profileImageUrl.isEmpty {
                    AsyncImage(url: URL(string: profileImageUrl)) { image in
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
                    .frame(width: 50, height: 50)
                    .clipShape(Circle())
                } else {
                    // Fallback to conversation icon based on type
                    if conversation.type == .group || conversation.type == .event {
                        Image(systemName: "person.3.fill")
                            .foregroundColor(.blue)
                            .font(.title2)
                            .frame(width: 50, height: 50)
                            .background(Color.gray.opacity(0.3))
                            .clipShape(Circle())
                    } else {
                        Image(systemName: "person.fill")
                            .foregroundColor(.white)
                            .font(.title2)
                            .frame(width: 50, height: 50)
                            .background(Color.gray.opacity(0.3))
                            .clipShape(Circle())
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(conversation.title.uppercased())
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    if let lastMessage = conversation.lastMessage {
                        Text(lastMessage.content)
                            .font(.caption)
                            .foregroundColor(.gray)
                            .lineLimit(1)
                    } else {
                        Text("No messages yet")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    if conversation.unreadCount > 0 {
                        Text("\(conversation.unreadCount)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.red)
                            .clipShape(Capsule())
                    }
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.gray)
                        .font(.caption)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
        }
    }
    
    // MARK: - Helper Methods
    private func loadInboxData() {
        print("📱 UI: Loading inbox data...")
        inboxViewModel.fetchPendingRequests { result in
            switch result {
            case .success(let requests):
                print("📱 UI: Loaded \(requests.count) pending requests successfully")
            case .failure(let error):
                print("📱 UI: Failed to load pending requests: \(error.message)")
            }
        }
        inboxViewModel.fetchRecentConnections { result in
            switch result {
            case .success(let connections):
                print("📱 UI: Loaded \(connections.count) connections successfully")
            case .failure(let error):
                print("📱 UI: Failed to load connections: \(error.message)")
            }
        }
        messagingViewModel.fetchConversations { result in
            switch result {
            case .success(let conversations):
                print("📱 UI: Loaded \(conversations.count) conversations successfully")
            case .failure(let error):
                print("📱 UI: Failed to load conversations: \(error.message)")
            }
        }
    }
    
    private func refreshInboxData() async {
        print("📱 UI: Refreshing inbox data...")
        await withCheckedContinuation { continuation in
            let group = DispatchGroup()
            
            group.enter()
            inboxViewModel.fetchPendingRequests { result in
                switch result {
                case .success(let requests):
                    print("📱 UI: Refreshed \(requests.count) pending requests")
                case .failure(let error):
                    print("📱 UI: Refresh failed for pending requests: \(error.message)")
                }
                group.leave()
            }
            
            group.enter()
            inboxViewModel.fetchRecentConnections { result in
                switch result {
                case .success(let connections):
                    print("📱 UI: Refreshed \(connections.count) connections")
                case .failure(let error):
                    print("📱 UI: Refresh failed for connections: \(error.message)")
                }
                group.leave()
            }
            
            group.enter()
            messagingViewModel.fetchConversations { result in
                switch result {
                case .success(let conversations):
                    print("📱 UI: Refreshed \(conversations.count) conversations")
                case .failure(let error):
                    print("📱 UI: Refresh failed for conversations: \(error.message)")
                }
                group.leave()
            }
            
            group.notify(queue: .main) {
                print("📱 UI: Refresh complete")
                continuation.resume()
            }
        }
    }
    
    // MARK: - Auto-Refresh Methods
    private func startAutoRefresh() {
        stopAutoRefresh() // Ensure no duplicate timers
        
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
            if isViewActive && authViewModel.isAuthenticated {
                loadInboxData()
            }
        }
        print("📱 UI: Auto-refresh started (every 4 seconds)")
    }
    
    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
        print("📱 UI: Auto-refresh stopped")
    }
}

#Preview {
    InboxView()
        .preferredColorScheme(.dark)
}