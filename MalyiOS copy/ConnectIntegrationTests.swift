import XCTest
import SwiftUI
@testable import MalyiOS

class ConnectIntegrationTests: XCTestCase {
    var connectViewModel: ConnectViewModel!
    var messagingViewModel: MessagingViewModel!
    var authViewModel: AuthenticationViewModel!
    var mockAPIService: MockAPIService!
    
    override func setUp() {
        super.setUp()
        mockAPIService = MockAPIService()
        connectViewModel = ConnectViewModel(apiService: mockAPIService)
        messagingViewModel = MessagingViewModel(apiService: mockAPIService)
        authViewModel = AuthenticationViewModel()
    }
    
    override func tearDown() {
        connectViewModel = nil
        messagingViewModel = nil
        authViewModel = nil
        mockAPIService = nil
        super.tearDown()
    }
    
    // MARK: - Full Connect Flow Tests
    
    func testFullConnectFlow_DiscoverToMessage() {
        let fullFlowExpectation = XCTestExpectation(description: "Full connect flow")
        
        // Step 1: User discovers nearby people
        let nearbyUsers = [
            ConnectUser(id: 1, username: "john_doe", fullName: "John Doe", location: "Mexico City"),
            ConnectUser(id: 2, username: "jane_smith", fullName: "Jane Smith", location: "Mexico City")
        ]
        mockAPIService.mockNearbyUsersResult = .success(nearbyUsers)
        
        connectViewModel.fetchNearbyUsers { result in
            // Verify discovery worked
            XCTAssertTrue(result.isSuccess)
            
            // Step 2: User sends connection request
            self.mockAPIService.mockConnectionRequestResult = .success(())
            
            self.connectViewModel.sendConnectionRequest(to: 1) { connectionResult in
                XCTAssertTrue(connectionResult.isSuccess)
                
                // Step 3: Connection is accepted and conversation is created
                let conversation = Conversation(id: 101, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0)
                self.mockAPIService.mockConversationsResult = .success([conversation])
                
                self.messagingViewModel.fetchConversations { conversationResult in
                    XCTAssertTrue(conversationResult.isSuccess)
                    XCTAssertEqual(self.messagingViewModel.conversations.count, 1)
                    
                    // Step 4: User starts messaging
                    let message = Message(id: 1, senderId: 1, conversationId: 101, content: "Hi John!", createdAt: Date(), isRead: false)
                    self.mockAPIService.mockSendMessageResult = .success(message)
                    
                    self.messagingViewModel.sendMessage(to: 101, content: "Hi John!") { messageResult in
                        XCTAssertTrue(messageResult.isSuccess)
                        
                        fullFlowExpectation.fulfill()
                    }
                }
            }
        }
        
        wait(for: [fullFlowExpectation], timeout: 5.0)
    }
    
    func testSearchAndFilterFlow() {
        let searchFilterFlowExpectation = XCTestExpectation(description: "Search and filter flow")
        
        // Step 1: Apply filters
        connectViewModel.applyLocationFilter("Mexico City")
        connectViewModel.applyGenderFilter("female")
        connectViewModel.applyMoodFilters(["Creating", "Networking"])
        
        // Step 2: Search for specific user
        let searchResults = [
            ConnectUser(id: 3, username: "maria_artist", fullName: "Maria Garcia", location: "Mexico City")
        ]
        mockAPIService.mockSearchUsersResult = .success(searchResults)
        
        connectViewModel.searchUsers(query: "Maria") { result in
            XCTAssertTrue(result.isSuccess)
            
            // Verify search worked with filters applied
            XCTAssertEqual(self.connectViewModel.currentLocationFilter, "Mexico City")
            XCTAssertEqual(self.connectViewModel.currentGenderFilter, "female")
            XCTAssertEqual(self.connectViewModel.currentMoodFilters.count, 2)
            
            searchFilterFlowExpectation.fulfill()
        }
        
        wait(for: [searchFilterFlowExpectation], timeout: 2.0)
    }
    
    func testGroupChatCreationFlow() {
        let groupChatFlowExpectation = XCTestExpectation(description: "Group chat creation flow")
        
        // Step 1: User has connections
        let connections = [
            ConnectUser(id: 1, username: "john_doe", fullName: "John Doe", location: "Mexico City"),
            ConnectUser(id: 2, username: "jane_smith", fullName: "Jane Smith", location: "Mexico City"),
            ConnectUser(id: 3, username: "bob_jones", fullName: "Bob Jones", location: "Mexico City")
        ]
        mockAPIService.mockNearbyUsersResult = .success(connections)
        
        // Step 2: Create group with selected members
        let newGroup = Group(id: 1, name: "Study Group", description: "Weekly study sessions", memberIds: [1, 2, 3], createdAt: Date())
        mockAPIService.mockCreateGroupResult = .success(newGroup)
        
        messagingViewModel.createGroup(name: "Study Group", description: "Weekly study sessions", memberIds: [1, 2, 3]) { result in
            XCTAssertTrue(result.isSuccess)
            
            if case .success(let group) = result {
                XCTAssertEqual(group.name, "Study Group")
                XCTAssertEqual(group.memberIds.count, 3)
                
                // Step 3: Group conversation should be available
                let groupConversation = Conversation(id: 201, type: .group, title: "Study Group", lastMessage: nil, unreadCount: 0)
                self.mockAPIService.mockConversationsResult = .success([groupConversation])
                
                self.messagingViewModel.fetchConversations { conversationResult in
                    XCTAssertTrue(conversationResult.isSuccess)
                    XCTAssertEqual(self.messagingViewModel.conversations.count, 1)
                    XCTAssertEqual(self.messagingViewModel.conversations.first?.type, .group)
                    
                    groupChatFlowExpectation.fulfill()
                }
            }
        }
        
        wait(for: [groupChatFlowExpectation], timeout: 3.0)
    }
    
    func testPaginationFlow() {
        let paginationFlowExpectation = XCTestExpectation(description: "Pagination flow")
        
        // Step 1: Load initial batch of users
        let initialUsers = Array(1...20).map { i in
            ConnectUser(id: i, username: "user\(i)", fullName: "User \(i)", location: "Mexico City")
        }
        mockAPIService.mockNearbyUsersResult = .success(initialUsers)
        
        connectViewModel.fetchNearbyUsers { result in
            XCTAssertTrue(result.isSuccess)
            XCTAssertEqual(self.connectViewModel.nearbyUsers.count, 20)
            
            // Step 2: Load more users (pagination)
            let moreUsers = Array(21...40).map { i in
                ConnectUser(id: i, username: "user\(i)", fullName: "User \(i)", location: "Mexico City")
            }
            self.mockAPIService.mockNearbyUsersResult = .success(moreUsers)
            
            self.connectViewModel.loadMoreUsers { moreResult in
                XCTAssertTrue(moreResult.isSuccess)
                XCTAssertEqual(self.connectViewModel.nearbyUsers.count, 40)
                
                paginationFlowExpectation.fulfill()
            }
        }
        
        wait(for: [paginationFlowExpectation], timeout: 3.0)
    }
    
    func testRealTimeMessagingFlow() {
        let realTimeFlowExpectation = XCTestExpectation(description: "Real-time messaging flow")
        
        // Step 1: Setup conversation
        let conversation = Conversation(id: 301, type: .direct, title: "Test User", lastMessage: nil, unreadCount: 0)
        messagingViewModel.currentConversationId = 301
        
        // Step 2: Send initial message
        let sentMessage = Message(id: 1, senderId: 1, conversationId: 301, content: "Hello!", createdAt: Date(), isRead: false)
        mockAPIService.mockSendMessageResult = .success(sentMessage)
        
        messagingViewModel.sendMessage(to: 301, content: "Hello!") { result in
            XCTAssertTrue(result.isSuccess)
            XCTAssertEqual(self.messagingViewModel.currentMessages.count, 1)
            
            // Step 3: Simulate incoming message (real-time)
            let incomingMessage = Message(id: 2, senderId: 2, conversationId: 301, content: "Hi there!", createdAt: Date(), isRead: false)
            self.messagingViewModel.handleIncomingMessage(incomingMessage)
            
            XCTAssertEqual(self.messagingViewModel.currentMessages.count, 2)
            XCTAssertEqual(self.messagingViewModel.currentMessages.last?.content, "Hi there!")
            
            realTimeFlowExpectation.fulfill()
        }
        
        wait(for: [realTimeFlowExpectation], timeout: 2.0)
    }
    
    // MARK: - Error Recovery Tests
    
    func testErrorRecoveryFlow() {
        let errorRecoveryExpectation = XCTestExpectation(description: "Error recovery flow")
        
        // Step 1: Initial request fails
        mockAPIService.mockNearbyUsersResult = .failure(APIError(message: "Network error"))
        
        connectViewModel.fetchNearbyUsers { result in
            XCTAssertFalse(result.isSuccess)
            XCTAssertNotNil(self.connectViewModel.errorMessage)
            
            // Step 2: Retry succeeds
            let users = [ConnectUser(id: 1, username: "user1", fullName: "User One", location: "Mexico City")]
            self.mockAPIService.mockNearbyUsersResult = .success(users)
            
            self.connectViewModel.fetchNearbyUsers { retryResult in
                XCTAssertTrue(retryResult.isSuccess)
                XCTAssertNil(self.connectViewModel.errorMessage)
                XCTAssertEqual(self.connectViewModel.nearbyUsers.count, 1)
                
                errorRecoveryExpectation.fulfill()
            }
        }
        
        wait(for: [errorRecoveryExpectation], timeout: 3.0)
    }
    
    func testConnectionStatusFlow() {
        let connectionStatusFlowExpectation = XCTestExpectation(description: "Connection status flow")
        
        // Step 1: Check initial connection status
        mockAPIService.mockConnectionStatusResult = .success(.notConnected)
        
        connectViewModel.getConnectionStatus(with: 123) { result in
            if case .success(let status) = result {
                XCTAssertEqual(status, .notConnected)
                
                // Step 2: Send connection request
                self.mockAPIService.mockConnectionRequestResult = .success(())
                
                self.connectViewModel.sendConnectionRequest(to: 123) { requestResult in
                    XCTAssertTrue(requestResult.isSuccess)
                    
                    // Step 3: Status should change to pending
                    self.mockAPIService.mockConnectionStatusResult = .success(.pending)
                    
                    self.connectViewModel.getConnectionStatus(with: 123) { statusResult in
                        if case .success(let newStatus) = statusResult {
                            XCTAssertEqual(newStatus, .pending)
                            connectionStatusFlowExpectation.fulfill()
                        }
                    }
                }
            }
        }
        
        wait(for: [connectionStatusFlowExpectation], timeout: 3.0)
    }
}

// MARK: - Test Helper Extensions

extension Result {
    var isSuccess: Bool {
        switch self {
        case .success:
            return true
        case .failure:
            return false
        }
    }
}