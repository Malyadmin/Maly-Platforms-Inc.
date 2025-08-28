import SwiftUI

struct MessagingListView: View {
    @StateObject private var messagingViewModel = MessagingViewModel()
    @State private var selectedTab: ConversationType = .direct
    @State private var showingCreateGroup = false
    @State private var selectedConversationId: Int?
    @State private var showingChat = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filter tabs
                filterTabsSection
                
                // Conversations list
                conversationsListSection
            }
            .navigationTitle("Messages")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingCreateGroup = true }) {
                        Image(systemName: "plus.message")
                    }
                }
            }
            .sheet(isPresented: $showingCreateGroup) {
                CreateGroupView()
                    .environmentObject(messagingViewModel)
            }
            .sheet(isPresented: $showingChat) {
                if let conversationId = selectedConversationId {
                    ChatView(conversationId: conversationId)
                        .environmentObject(messagingViewModel)
                }
            }
            .overlay {
                if messagingViewModel.isLoading && messagingViewModel.conversations.isEmpty {
                    ProgressView("Loading conversations...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemBackground))
                }
            }
            .overlay {
                if let errorMessage = messagingViewModel.errorMessage {
                    errorView(message: errorMessage)
                }
            }
        }
        .onAppear {
            loadConversations()
        }
    }
    
    // MARK: - Filter Tabs Section
    
    private var filterTabsSection: some View {
        HStack(spacing: 0) {
            filterTab(type: .direct, title: "Chats", icon: "person.2")
            filterTab(type: .group, title: "Groups", icon: "person.3")
        }
        .padding(.horizontal)
        .background(Color(.systemBackground))
    }
    
    private func filterTab(type: ConversationType, title: String, icon: String) -> some View {
        Button(action: {
            selectedTab = type
            messagingViewModel.filterConversations(by: type)
        }) {
            VStack(spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: icon)
                        .font(.caption)
                    
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .foregroundColor(selectedTab == type ? .blue : .secondary)
                
                Rectangle()
                    .fill(selectedTab == type ? Color.blue : Color.clear)
                    .frame(height: 2)
            }
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
    }
    
    // MARK: - Conversations List Section
    
    private var conversationsListSection: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(messagingViewModel.conversations) { conversation in
                    ConversationRow(conversation: conversation) {
                        selectedConversationId = conversation.id
                        showingChat = true
                    }
                    .padding(.horizontal)
                    
                    if conversation.id != messagingViewModel.conversations.last?.id {
                        Divider()
                            .padding(.leading, 76)
                    }
                }
            }
            .padding(.vertical, 8)
        }
        .refreshable {
            await refreshConversations()
        }
    }
    
    // MARK: - Error View
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            
            Text("Something went wrong")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Try Again") {
                messagingViewModel.errorMessage = nil
                loadConversations()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Methods
    
    private func loadConversations() {
        messagingViewModel.fetchConversations { _ in }
    }
    
    @MainActor
    private func refreshConversations() async {
        messagingViewModel.fetchConversations { _ in }
    }
}

// MARK: - Conversation Row

struct ConversationRow: View {
    let conversation: Conversation
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Avatar/Icon
                conversationAvatar
                
                // Content
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(conversation.title)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        if let lastMessage = conversation.lastMessage {
                            Text(formatDate(lastMessage.createdAt))
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    HStack {
                        if let lastMessage = conversation.lastMessage {
                            Text(lastMessage.content)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        } else {
                            Text("No messages yet")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .italic()
                        }
                        
                        Spacer()
                        
                        if conversation.unreadCount > 0 {
                            Text("\(conversation.unreadCount)")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.blue)
                                .clipShape(Capsule())
                        }
                    }
                    
                    // Additional info for groups
                    if conversation.type != .direct {
                        HStack(spacing: 4) {
                            Image(systemName: conversation.type == .event ? "calendar" : "person.3")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            if let participantCount = conversation.participantCount {
                                Text("\(participantCount) members")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
    
    private var conversationAvatar: some View {
        ZStack {
            Circle()
                .fill(conversation.type == .direct ? Color.blue : Color.green)
                .frame(width: 50, height: 50)
            
            Image(systemName: avatarIcon)
                .font(.title2)
                .foregroundColor(.white)
        }
    }
    
    private var avatarIcon: String {
        switch conversation.type {
        case .direct:
            return "person"
        case .group:
            return "person.3"
        case .event:
            return "calendar"
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        let calendar = Calendar.current
        
        if calendar.isToday(date) {
            formatter.timeStyle = .short
        } else if calendar.isYesterday(date) {
            return "Yesterday"
        } else {
            formatter.dateStyle = .short
        }
        
        return formatter.string(from: date)
    }
}

// MARK: - Placeholder Views

struct CreateGroupView: View {
    @EnvironmentObject var messagingViewModel: MessagingViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Group creation interface will be implemented here")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Create Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        // Implementation will be added
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    MessagingListView()
}