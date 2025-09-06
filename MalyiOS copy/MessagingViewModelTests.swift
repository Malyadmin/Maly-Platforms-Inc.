import XCTest
@testable import MalyiOS

class MessagingViewModelTests: XCTestCase {
    var messagingViewModel: MessagingViewModel!
    var mockAPIService: MockAPIService!
    
    override func setUp() {
        super.setUp()
        mockAPIService = MockAPIService()
        messagingViewModel = MessagingViewModel(apiService: mockAPIService)
    }
    
    override func tearDown() {
        messagingViewModel = nil
        mockAPIService = nil
        super.tearDown()
    }
    
    // MARK: - Conversations Tests
    
    func testFetchConversations_Success() {
        // Given
        let expectedConversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 2)
        ]
        mockAPIService.mockConversationsResult = .success(expectedConversations)
        
        // When
        let expectation = XCTestExpectation(description: "Fetch conversations")
        messagingViewModel.fetchConversations { result in
            // Then
            switch result {
            case .success(let conversations):
                XCTAssertEqual(conversations.count, 2)
                XCTAssertEqual(conversations.first?.type, .direct)
                XCTAssertEqual(conversations.last?.type, .event)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testFetchConversations_Failure() {
        // Given
        mockAPIService.mockConversationsResult = .failure(APIError(message: "Network error"))
        
        // When
        let expectation = XCTestExpectation(description: "Fetch conversations failure")
        messagingViewModel.fetchConversations { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Network error")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testFetchConversations_UpdatesLoadingState() {
        // Given
        mockAPIService.mockConversationsResult = .success([])
        
        // When
        XCTAssertFalse(messagingViewModel.isLoading)
        messagingViewModel.fetchConversations { _ in }
        
        // Then
        XCTAssertTrue(messagingViewModel.isLoading)
    }
    
    func testFilterConversationsByType_DirectOnly() {
        // Given
        let conversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 0),
            Conversation(id: 3, type: .direct, title: "Jane Smith", lastMessage: nil, unreadCount: 0)
        ]
        messagingViewModel.allConversations = conversations
        
        // When
        messagingViewModel.filterConversations(by: .direct)
        
        // Then
        XCTAssertEqual(messagingViewModel.filteredConversations.count, 2)
        XCTAssertTrue(messagingViewModel.filteredConversations.allSatisfy { $0.type == .direct })
    }
    
    func testFilterConversationsByType_GroupsOnly() {
        // Given
        let conversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 0),
            Conversation(id: 3, type: .group, title: "Friends Group", lastMessage: nil, unreadCount: 0)
        ]
        messagingViewModel.allConversations = conversations
        
        // When
        messagingViewModel.filterConversations(by: .group)
        
        // Then
        XCTAssertEqual(messagingViewModel.filteredConversations.count, 2)
        XCTAssertTrue(messagingViewModel.filteredConversations.allSatisfy { $0.type == .group || $0.type == .event })
    }
    
    // MARK: - Messages Tests
    
    func testFetchMessages_Success() {
        // Given
        let conversationId = 123
        let expectedMessages = [
            Message(id: 1, senderId: 1, conversationId: conversationId, content: "Hello", createdAt: Date(), isRead: true),
            Message(id: 2, senderId: 2, conversationId: conversationId, content: "Hi there!", createdAt: Date(), isRead: false)
        ]
        mockAPIService.mockMessagesResult = .success(expectedMessages)
        
        // When
        let expectation = XCTestExpectation(description: "Fetch messages")
        messagingViewModel.fetchMessages(for: conversationId) { result in
            // Then
            switch result {
            case .success(let messages):
                XCTAssertEqual(messages.count, 2)
                XCTAssertEqual(messages.first?.content, "Hello")
                XCTAssertEqual(messages.last?.content, "Hi there!")
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSendMessage_Success() {
        // Given
        let conversationId = 123
        let messageContent = "Test message"
        let expectedMessage = Message(id: 3, senderId: 1, conversationId: conversationId, content: messageContent, createdAt: Date(), isRead: false)
        mockAPIService.mockSendMessageResult = .success(expectedMessage)
        
        // When
        let expectation = XCTestExpectation(description: "Send message")
        messagingViewModel.sendMessage(to: conversationId, content: messageContent) { result in
            // Then
            switch result {
            case .success(let message):
                XCTAssertEqual(message.content, messageContent)
                XCTAssertEqual(message.conversationId, conversationId)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSendMessage_EmptyContent() {
        // When
        let expectation = XCTestExpectation(description: "Send empty message")
        messagingViewModel.sendMessage(to: 123, content: "") { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Message content cannot be empty")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSendMessage_UpdatesMessagesArray() {
        // Given
        let conversationId = 123
        let initialMessages = [
            Message(id: 1, senderId: 1, conversationId: conversationId, content: "Hello", createdAt: Date(), isRead: true)
        ]
        let newMessage = Message(id: 2, senderId: 1, conversationId: conversationId, content: "World", createdAt: Date(), isRead: false)
        
        messagingViewModel.currentMessages = initialMessages
        mockAPIService.mockSendMessageResult = .success(newMessage)
        
        // When
        let expectation = XCTestExpectation(description: "Send message updates array")
        messagingViewModel.sendMessage(to: conversationId, content: "World") { result in
            // Then
            switch result {
            case .success:
                XCTAssertEqual(self.messagingViewModel.currentMessages.count, 2)
                XCTAssertEqual(self.messagingViewModel.currentMessages.last?.content, "World")
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Group Management Tests
    
    func testCreateGroup_Success() {
        // Given
        let groupName = "Test Group"
        let groupDescription = "A test group"
        let memberIds = [1, 2, 3]
        let expectedGroup = Group(id: 1, name: groupName, description: groupDescription, memberIds: memberIds, createdAt: Date())
        mockAPIService.mockCreateGroupResult = .success(expectedGroup)
        
        // When
        let expectation = XCTestExpectation(description: "Create group")
        messagingViewModel.createGroup(name: groupName, description: groupDescription, memberIds: memberIds) { result in
            // Then
            switch result {
            case .success(let group):
                XCTAssertEqual(group.name, groupName)
                XCTAssertEqual(group.description, groupDescription)
                XCTAssertEqual(group.memberIds, memberIds)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testCreateGroup_EmptyName() {
        // When
        let expectation = XCTestExpectation(description: "Create group with empty name")
        messagingViewModel.createGroup(name: "", description: "Test", memberIds: [1, 2]) { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Group name cannot be empty")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testCreateGroup_InsufficientMembers() {
        // When
        let expectation = XCTestExpectation(description: "Create group with insufficient members")
        messagingViewModel.createGroup(name: "Test", description: "Test", memberIds: [1]) { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Group must have at least 2 members")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Real-time Updates Tests
    
    func testHandleIncomingMessage() {
        // Given
        let conversationId = 123
        let newMessage = Message(id: 4, senderId: 2, conversationId: conversationId, content: "New message", createdAt: Date(), isRead: false)
        messagingViewModel.currentConversationId = conversationId
        
        // When
        messagingViewModel.handleIncomingMessage(newMessage)
        
        // Then
        XCTAssertEqual(messagingViewModel.currentMessages.count, 1)
        XCTAssertEqual(messagingViewModel.currentMessages.first?.content, "New message")
    }
    
    func testHandleIncomingMessage_DifferentConversation() {
        // Given
        let currentConversationId = 123
        let otherConversationId = 456
        let newMessage = Message(id: 4, senderId: 2, conversationId: otherConversationId, content: "New message", createdAt: Date(), isRead: false)
        messagingViewModel.currentConversationId = currentConversationId
        
        // When
        messagingViewModel.handleIncomingMessage(newMessage)
        
        // Then
        XCTAssertEqual(messagingViewModel.currentMessages.count, 0)
        // Should update unread count for the other conversation
        XCTAssertTrue(messagingViewModel.shouldRefreshConversations)
    }
    
    // MARK: - Message Status Tests
    
    func testMarkMessageAsRead_Success() {
        // Given
        let messageId = 123
        mockAPIService.mockMarkMessageReadResult = .success(())
        
        // When
        let expectation = XCTestExpectation(description: "Mark message as read")
        messagingViewModel.markMessageAsRead(messageId: messageId) { result in
            // Then
            switch result {
            case .success:
                XCTAssertTrue(true)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testMarkAllMessagesAsRead_Success() {
        // Given
        let conversationId = 123
        mockAPIService.mockMarkAllMessagesReadResult = .success(())
        
        // When
        let expectation = XCTestExpectation(description: "Mark all messages as read")
        messagingViewModel.markAllMessagesAsRead(in: conversationId) { result in
            // Then
            switch result {
            case .success:
                XCTAssertTrue(true)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
}