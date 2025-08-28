import Foundation
@testable import MalyiOS

// MARK: - Mock API Service

class MockAPIService {
    // User Discovery
    var mockNearbyUsersResult: Result<[ConnectUser], APIError>?
    var mockSearchUsersResult: Result<[ConnectUser], APIError>?
    var browseUsersWasCalled = false
    var lastBrowseParameters: BrowseUsersParameters?
    
    // Connection Management
    var mockConnectionRequestResult: Result<Void, APIError>?
    var mockConnectionStatusResult: Result<ConnectionStatus, APIError>?
    
    // Conversations
    var mockConversationsResult: Result<[Conversation], APIError>?
    
    // Messages
    var mockMessagesResult: Result<[Message], APIError>?
    var mockSendMessageResult: Result<Message, APIError>?
    var mockMarkMessageReadResult: Result<Void, APIError>?
    var mockMarkAllMessagesReadResult: Result<Void, APIError>?
    
    // Groups
    var mockCreateGroupResult: Result<Group, APIError>?
    
    func browseUsers(
        location: String?,
        gender: String?,
        minAge: Int?,
        maxAge: Int?,
        moods: [String]?,
        interests: [String]?,
        name: String?,
        limit: Int,
        offset: Int,
        completion: @escaping (Result<BrowseUsersResponse, APIError>) -> Void
    ) {
        browseUsersWasCalled = true
        lastBrowseParameters = BrowseUsersParameters(
            location: location,
            gender: gender,
            minAge: minAge,
            maxAge: maxAge,
            moods: moods,
            interests: interests,
            name: name,
            limit: limit,
            offset: offset
        )
        
        if let result = mockNearbyUsersResult {
            let response = BrowseUsersResponse(
                users: try! result.get(),
                pagination: Pagination(limit: limit, offset: offset, total: try! result.get().count, hasMore: false)
            )
            completion(.success(response))
        }
    }
    
    func searchUsers(query: String, completion: @escaping (Result<[ConnectUser], APIError>) -> Void) {
        if let result = mockSearchUsersResult {
            completion(result)
        }
    }
    
    func sendConnectionRequest(to userId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        if let result = mockConnectionRequestResult {
            completion(result)
        }
    }
    
    func getConnectionStatus(with userId: Int, completion: @escaping (Result<ConnectionStatus, APIError>) -> Void) {
        if let result = mockConnectionStatusResult {
            completion(result)
        }
    }
    
    func fetchConversations(completion: @escaping (Result<[Conversation], APIError>) -> Void) {
        if let result = mockConversationsResult {
            completion(result)
        }
    }
    
    func fetchMessages(for conversationId: Int, completion: @escaping (Result<[Message], APIError>) -> Void) {
        if let result = mockMessagesResult {
            completion(result)
        }
    }
    
    func sendMessage(to conversationId: Int, content: String, completion: @escaping (Result<Message, APIError>) -> Void) {
        if let result = mockSendMessageResult {
            completion(result)
        }
    }
    
    func markMessageAsRead(messageId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        if let result = mockMarkMessageReadResult {
            completion(result)
        }
    }
    
    func markAllMessagesAsRead(in conversationId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        if let result = mockMarkAllMessagesReadResult {
            completion(result)
        }
    }
    
    func createGroup(name: String, description: String, memberIds: [Int], completion: @escaping (Result<Group, APIError>) -> Void) {
        if let result = mockCreateGroupResult {
            completion(result)
        }
    }
}

// MARK: - Mock URL Session

class MockURLSession {
    var mockData: Data?
    var mockResponse: URLResponse?
    var mockError: Error?
    var lastRequest: URLRequest?
    
    func dataTask(with request: URLRequest, completionHandler: @escaping (Data?, URLResponse?, Error?) -> Void) -> URLSessionDataTask {
        lastRequest = request
        return MockURLSessionDataTask {
            completionHandler(self.mockData, self.mockResponse, self.mockError)
        }
    }
}

class MockURLSessionDataTask: URLSessionDataTask {
    private let closure: () -> Void
    
    init(closure: @escaping () -> Void) {
        self.closure = closure
    }
    
    override func resume() {
        closure()
    }
}

// MARK: - Test Data Structures

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

struct BrowseUsersResponse: Codable {
    let users: [ConnectUser]
    let pagination: Pagination
}

struct Pagination: Codable {
    let limit: Int
    let offset: Int
    let total: Int
    let hasMore: Bool
}

struct ConnectionStatusResponse: Codable {
    let status: ConnectionStatus
}

// MARK: - Model Extensions for Testing

extension ConnectUser {
    init(id: Int, username: String, fullName: String, location: String) {
        self.id = id
        self.username = username
        self.fullName = fullName
        self.location = location
        self.email = ""
        self.profileImage = nil
        self.profileImages = []
        self.birthLocation = nil
        self.nextLocation = nil
        self.interests = []
        self.currentMoods = []
        self.profession = nil
        self.age = nil
        self.gender = nil
        self.sexualOrientation = nil
        self.bio = nil
        self.profileType = "member"
        self.businessName = nil
        self.businessDescription = nil
        self.websiteUrl = nil
        self.createdAt = Date()
        self.lastActive = nil
        self.isPremium = false
        self.preferredLanguage = "en"
        self.referralCode = nil
    }
}

extension Conversation {
    init(id: Int, type: ConversationType, title: String, lastMessage: Message?, unreadCount: Int) {
        self.id = id
        self.type = type
        self.title = title
        self.lastMessage = lastMessage
        self.unreadCount = unreadCount
        self.eventId = nil
        self.participantCount = nil
        self.createdAt = Date()
    }
}

extension Message {
    init(id: Int, senderId: Int, conversationId: Int, content: String, createdAt: Date, isRead: Bool) {
        self.id = id
        self.senderId = senderId
        self.conversationId = conversationId
        self.content = content
        self.createdAt = createdAt
        self.isRead = isRead
        self.receiverId = nil
        self.sender = nil
        self.receiver = nil
    }
}

extension Group {
    init(id: Int, name: String, description: String, memberIds: [Int], createdAt: Date) {
        self.id = id
        self.name = name
        self.description = description
        self.memberIds = memberIds
        self.createdAt = createdAt
        self.image = nil
        self.creatorId = memberIds.first ?? 0
    }
}

// MARK: - Enums for Testing

enum ConnectionStatus: String, Codable {
    case notConnected = "not_connected"
    case pending = "pending"
    case connected = "connected"
    case blocked = "blocked"
}

enum ConversationType: String, Codable {
    case direct = "direct"
    case group = "group"
    case event = "event"
}