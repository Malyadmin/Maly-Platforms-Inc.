import Foundation

// MARK: - Connect User Model (Extended from base User)
struct ConnectUser: Codable, Identifiable {
    let id: Int
    let username: String
    let fullName: String?
    let profileType: String?
    let gender: String?
    let sexualOrientation: String?
    let bio: String?
    let profileImage: String?
    let profileImages: [String]?
    let location: String?
    let birthLocation: String?
    let nextLocation: String?
    let interests: [String]?
    let currentMoods: [String]?
    let profession: String?
    let age: Int?
    let businessName: String?
    let businessDescription: String?
    let websiteUrl: String?
    let createdAt: String?
    let lastActive: String?
    let isPremium: Bool?
    let preferredLanguage: String?
    let referralCode: String?
    
    // Note: email is explicitly excluded by backend for security
    // All fields match exactly what the backend /api/users/browse returns
}

// MARK: - Connection Status
enum ConnectionStatus: String, Codable, CaseIterable {
    case notConnected = "not_connected"
    case pending = "pending"
    case connected = "connected"
    case blocked = "blocked"
}

// MARK: - Conversation Models
enum ConversationType: String, Codable {
    case direct = "direct"
    case group = "group"
    case event = "event"
}

struct Conversation: Codable, Identifiable {
    let id: Int
    let type: ConversationType
    let title: String
    let lastMessage: Message?
    let unreadCount: Int
    let eventId: Int?
    let participantCount: Int?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, type, title, unreadCount, createdAt
        // Remove mappings since API sends camelCase matching property names
        case lastMessage, eventId, participantCount
    }
}

// MARK: - Message Model
struct Message: Codable, Identifiable {
    let id: Int
    let senderId: Int
    let receiverId: Int?
    let conversationId: Int
    let content: String
    let createdAt: Date
    let isRead: Bool
    let sender: MessageUser?
    let receiver: MessageUser?
    
    enum CodingKeys: String, CodingKey {
        case id, content, createdAt, sender, receiver
        case senderId = "sender_id"
        case receiverId = "receiver_id"
        case conversationId = "conversation_id"
        case isRead = "is_read"
    }
}

struct MessageUser: Codable {
    let id: Int
    let username: String?
    let fullName: String?
    let profileImage: String?
    
    enum CodingKeys: String, CodingKey {
        case id, username
        case fullName = "fullName"  // Server sends camelCase, not snake_case
        case profileImage = "profileImage"  // Server sends camelCase, not snake_case
    }
}

// MARK: - Group Model
struct Group: Codable, Identifiable {
    let id: Int
    let name: String
    let description: String
    let image: String?
    let creatorId: Int
    let memberIds: [Int]
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, image, createdAt
        case creatorId = "creator_id"
        case memberIds = "member_ids"
    }
}

// MARK: - API Request/Response Models

struct BrowseUsersResponse: Codable {
    let users: [ConnectUser]
    let pagination: Pagination
}

struct Pagination: Codable {
    let limit: Int
    let offset: Int
    let total: Int
    let hasMore: Bool
    
    // No CodingKeys needed - backend returns camelCase which matches Swift properties
}

struct ConnectionStatusResponse: Codable {
    let status: ConnectionStatus
}

struct SendMessageRequest: Codable {
    let content: String
}

struct CreateGroupRequest: Codable {
    let name: String
    let description: String
    let memberIds: [Int]
    
    enum CodingKeys: String, CodingKey {
        case name, description
        case memberIds = "member_ids"
    }
}

// MARK: - Search Parameters
struct BrowseUsersParameters {
    let location: String?
    let gender: String?
    let minAge: Int?
    let maxAge: Int?
    let moods: [String]?
    let interests: [String]?
    let name: String?
    let limit: Int
    let offset: Int
}