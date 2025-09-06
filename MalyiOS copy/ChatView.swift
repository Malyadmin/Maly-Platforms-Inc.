import SwiftUI

struct ChatView: View {
    let conversationId: Int?
    let conversation: Conversation?
    @StateObject private var messagingViewModel = MessagingViewModel()
    
    // Primary initializer with conversationId (for existing functionality)
    init(conversationId: Int) {
        self.conversationId = conversationId
        self.conversation = nil
    }
    
    // Secondary initializer with conversation object (for new direct messaging)
    init(conversation: Conversation) {
        self.conversationId = conversation.id
        self.conversation = conversation
    }
    @State private var messageInput = ""
    @State private var showingImagePicker = false
    @State private var showingGroupInfo = false
    @Environment(\.dismiss) private var dismiss
    
    private var chatTitle: String {
        if let conversation = conversation {
            if conversation.type == .direct {
                return conversation.title ?? "Direct Message"
            } else {
                return conversation.title ?? "Chat"
            }
        }
        return messagingViewModel.currentConversation?.title ?? "Chat"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            messagesListSection
            
            // Message input
            messageInputSection
        }
        .navigationTitle(chatTitle)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                if messagingViewModel.currentConversation?.type != .direct {
                    Button(action: { showingGroupInfo = true }) {
                        Image(systemName: "info.circle")
                    }
                }
            }
        }
        .sheet(isPresented: $showingGroupInfo) {
            GroupInfoView(conversation: messagingViewModel.currentConversation)
        }
        .overlay {
            if messagingViewModel.isLoading && messagingViewModel.currentMessages.isEmpty {
                ProgressView("Loading messages...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemBackground))
            }
        }
        .onAppear {
            loadMessages()
        }
    }
    
    // MARK: - Messages List Section
    
    private var messagesListSection: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(messagingViewModel.currentMessages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                }
                .padding()
            }
            .onChange(of: messagingViewModel.currentMessages.count) {
                // Scroll to bottom when new message arrives
                if let lastMessage = messagingViewModel.currentMessages.last {
                    withAnimation(.easeOut(duration: 0.3)) {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
    }
    
    // MARK: - Message Input Section
    
    private var messageInputSection: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack(spacing: 12) {
                // Attachment button
                Button(action: { showingImagePicker = true }) {
                    Image(systemName: "paperclip")
                        .font(.title3)
                        .foregroundColor(.blue)
                }
                
                // Message input field
                TextField("Type a message...", text: $messageInput, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...5)
                
                // Send button
                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(messageInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .gray : .blue)
                }
                .disabled(messageInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
        .background(Color(.systemBackground))
    }
    
    // MARK: - Methods
    
    private func loadMessages() {
        guard let conversationId = conversationId else { return }
        
        // Set the current conversation in the messaging view model if we have it
        if let conversation = conversation {
            messagingViewModel.currentConversation = conversation
        }
        
        messagingViewModel.fetchMessages(for: conversationId) { _ in }
    }
    
    private func sendMessage() {
        guard let conversationId = conversationId else { return }
        
        let content = messageInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }
        
        messageInput = ""
        
        messagingViewModel.sendMessage(to: conversationId, content: content) { result in
            switch result {
            case .success:
                // Message handled by view model
                break
            case .failure(let error):
                // Handle error - could show an alert
                print("Failed to send message: \(error.message)")
            }
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: Message
    @State private var currentUserId: Int? = nil
    
    var body: some View {
        HStack {
            if isFromCurrentUser {
                Spacer(minLength: 60)
                messageBubbleContent
                    .background(Color.blue)
                    .foregroundColor(.white)
            } else {
                messageBubbleContent
                    .background(Color(.systemGray5))
                    .foregroundColor(.primary)
                Spacer(minLength: 60)
            }
        }
        .onAppear {
            // Get the current user ID from TokenManager
            currentUserId = TokenManager.shared.getUserId()
        }
    }
    
    private var messageBubbleContent: some View {
        VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 4) {
            // Sender name - show "Me" for current user, sender name for others
            if isFromCurrentUser {
                Text("Me")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            } else if let sender = message.sender {
                Text(sender.fullName ?? sender.username ?? "Unknown User")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            }
            
            // Message content
            Text(message.content)
                .font(.subheadline)
                .multilineTextAlignment(isFromCurrentUser ? .trailing : .leading)
            
            // Timestamp
            Text(formatTimestamp(message.createdAt))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
    
    private var isFromCurrentUser: Bool {
        guard let currentUserId = currentUserId else { return false }
        return message.senderId == currentUserId
    }
    
    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Group Info View

struct GroupInfoView: View {
    let conversation: Conversation?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                if let conversation = conversation {
                    VStack(spacing: 16) {
                        // Group avatar
                        Circle()
                            .fill(Color.green)
                            .frame(width: 80, height: 80)
                            .overlay(
                                Image(systemName: conversation.type == .event ? "calendar" : "person.3")
                                    .font(.title)
                                    .foregroundColor(.white)
                            )
                        
                        // Group name and info
                        Text(conversation.title)
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        if let participantCount = conversation.participantCount {
                            Text("\(participantCount) members")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding()
                } else {
                    Text("Group information not available")
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Group Info")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        ChatView(conversationId: 1)
            .environmentObject(MessagingViewModel())
    }
}