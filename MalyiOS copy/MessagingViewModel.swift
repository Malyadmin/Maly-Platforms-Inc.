import Foundation
import SwiftUI

class MessagingViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var conversations: [Conversation] = []
    @Published var allConversations: [Conversation] = []
    @Published var filteredConversations: [Conversation] = []
    @Published var currentMessages: [Message] = []
    @Published var currentConversation: Conversation?
    @Published var errorMessage: String?
    @Published var currentMessageInput = ""
    @Published var shouldRefreshConversations = false
    
    private let apiService: APIService
    var currentConversationId: Int?
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - Conversations
    
    func fetchConversations(completion: @escaping (Result<[Conversation], APIError>) -> Void) {
        isLoading = true
        errorMessage = nil
        
        apiService.fetchConversations { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let conversations):
                    self?.allConversations = conversations
                    self?.conversations = conversations
                    self?.filteredConversations = conversations
                    completion(.success(conversations))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    func filterConversations(by type: ConversationType) {
        switch type {
        case .direct:
            filteredConversations = allConversations.filter { $0.type == .direct }
        case .group:
            filteredConversations = allConversations.filter { $0.type == .group || $0.type == .event }
        case .event:
            filteredConversations = allConversations.filter { $0.type == .event }
        }
        conversations = filteredConversations
    }
    
    // MARK: - Messages
    
    func fetchMessages(for conversationId: Int, completion: @escaping (Result<[Message], APIError>) -> Void) {
        isLoading = true
        currentConversationId = conversationId
        errorMessage = nil
        
        apiService.fetchMessages(for: conversationId) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let messages):
                    self?.currentMessages = messages
                    completion(.success(messages))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    func sendMessage(to conversationId: Int, content: String, completion: @escaping (Result<Message, APIError>) -> Void) {
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            completion(.failure(APIError(message: "Message content cannot be empty")))
            return
        }
        
        apiService.sendMessage(to: conversationId, content: content) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let message):
                    self?.currentMessages.append(message)
                    self?.currentMessageInput = ""
                    completion(.success(message))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    // MARK: - Real-time Updates
    
    func handleIncomingMessage(_ message: Message) {
        if let currentConversationId = currentConversationId, 
           message.conversationId == currentConversationId {
            currentMessages.append(message)
        } else {
            shouldRefreshConversations = true
        }
    }
    
    // MARK: - Message Status
    
    func markMessageAsRead(messageId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        apiService.markMessageAsRead(messageId: messageId) { result in
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
    
    func markAllMessagesAsRead(in conversationId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        apiService.markAllMessagesAsRead(in: conversationId) { result in
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
    
    // MARK: - Group Management
    
    func createGroup(name: String, description: String, memberIds: [Int], completion: @escaping (Result<Group, APIError>) -> Void) {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            completion(.failure(APIError(message: "Group name cannot be empty")))
            return
        }
        
        guard memberIds.count >= 2 else {
            completion(.failure(APIError(message: "Group must have at least 2 members")))
            return
        }
        
        apiService.createGroup(name: name, description: description, memberIds: memberIds) { result in
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
}