import XCTest
@testable import MalyiOS

class APIServiceConnectTests: XCTestCase {
    var apiService: APIService!
    var mockSession: MockURLSession!
    
    override func setUp() {
        super.setUp()
        mockSession = MockURLSession()
        apiService = APIService(session: mockSession)
    }
    
    override func tearDown() {
        apiService = nil
        mockSession = nil
        super.tearDown()
    }
    
    // MARK: - User Browse Tests
    
    func testBrowseUsers_Success() {
        // Given
        let expectedUsers = [
            ConnectUser(id: 1, username: "user1", fullName: "User One", location: "Mexico City"),
            ConnectUser(id: 2, username: "user2", fullName: "User Two", location: "Mexico City")
        ]
        let responseData = try! JSONEncoder().encode(BrowseUsersResponse(users: expectedUsers, pagination: Pagination(limit: 20, offset: 0, total: 2, hasMore: false)))
        mockSession.mockData = responseData
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Browse users")
        apiService.browseUsers(location: "Mexico City", gender: nil, minAge: nil, maxAge: nil, moods: nil, interests: nil, name: nil, limit: 20, offset: 0) { result in
            // Then
            switch result {
            case .success(let response):
                XCTAssertEqual(response.users.count, 2)
                XCTAssertEqual(response.users.first?.username, "user1")
                XCTAssertEqual(response.pagination.total, 2)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testBrowseUsers_WithFilters() {
        // Given
        let filters = BrowseUsersParameters(
            location: "Mexico City",
            gender: "female",
            minAge: 25,
            maxAge: 35,
            moods: ["Creating", "Networking"],
            interests: ["Technology", "Art"],
            name: "Maria",
            limit: 10,
            offset: 0
        )
        
        mockSession.mockData = try! JSONEncoder().encode(BrowseUsersResponse(users: [], pagination: Pagination(limit: 10, offset: 0, total: 0, hasMore: false)))
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Browse users with filters")
        apiService.browseUsers(
            location: filters.location,
            gender: filters.gender,
            minAge: filters.minAge,
            maxAge: filters.maxAge,
            moods: filters.moods,
            interests: filters.interests,
            name: filters.name,
            limit: filters.limit,
            offset: filters.offset
        ) { result in
            // Then
            switch result {
            case .success(let response):
                // Verify the request was made with correct parameters
                XCTAssertNotNil(self.mockSession.lastRequest)
                let url = self.mockSession.lastRequest!.url!
                XCTAssertTrue(url.query?.contains("location=Mexico%20City") ?? false)
                XCTAssertTrue(url.query?.contains("gender=female") ?? false)
                XCTAssertTrue(url.query?.contains("minAge=25") ?? false)
                XCTAssertTrue(url.query?.contains("maxAge=35") ?? false)
                XCTAssertTrue(url.query?.contains("name=Maria") ?? false)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testBrowseUsers_NetworkError() {
        // Given
        mockSession.mockError = NSError(domain: "NetworkError", code: -1009, userInfo: [NSLocalizedDescriptionKey: "No internet connection"])
        
        // When
        let expectation = XCTestExpectation(description: "Browse users network error")
        apiService.browseUsers(location: nil, gender: nil, minAge: nil, maxAge: nil, moods: nil, interests: nil, name: nil, limit: 20, offset: 0) { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Network error: No internet connection")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testBrowseUsers_ServerError() {
        // Given
        mockSession.mockData = "Server Error".data(using: .utf8)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 500, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Browse users server error")
        apiService.browseUsers(location: nil, gender: nil, minAge: nil, maxAge: nil, moods: nil, interests: nil, name: nil, limit: 20, offset: 0) { result in
            // Then
            switch result {
            case .success:
                XCTFail("Expected failure")
            case .failure(let error):
                XCTAssertEqual(error.message, "Server Error")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Connection Management Tests
    
    func testSendConnectionRequest_Success() {
        // Given
        let userId = 123
        mockSession.mockData = "Connection request sent".data(using: .utf8)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Send connection request")
        apiService.sendConnectionRequest(to: userId) { result in
            // Then
            switch result {
            case .success:
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "POST")
                XCTAssertTrue(self.mockSession.lastRequest?.url?.path.contains("/connections/follow") ?? false)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testGetConnectionStatus_Success() {
        // Given
        let userId = 123
        let status = ConnectionStatus.connected
        mockSession.mockData = try! JSONEncoder().encode(ConnectionStatusResponse(status: status))
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Get connection status")
        apiService.getConnectionStatus(with: userId) { result in
            // Then
            switch result {
            case .success(let connectionStatus):
                XCTAssertEqual(connectionStatus, .connected)
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "GET")
                XCTAssertTrue(self.mockSession.lastRequest?.url?.path.contains("/connections/status/123") ?? false)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Conversations Tests
    
    func testFetchConversations_Success() {
        // Given
        let conversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 2)
        ]
        mockSession.mockData = try! JSONEncoder().encode(conversations)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Fetch conversations")
        apiService.fetchConversations { result in
            // Then
            switch result {
            case .success(let fetchedConversations):
                XCTAssertEqual(fetchedConversations.count, 2)
                XCTAssertEqual(fetchedConversations.first?.type, .direct)
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "GET")
                XCTAssertTrue(self.mockSession.lastRequest?.url?.path.contains("/conversations") ?? false)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Messages Tests
    
    func testFetchMessages_Success() {
        // Given
        let conversationId = 123
        let messages = [
            Message(id: 1, senderId: 1, conversationId: conversationId, content: "Hello", createdAt: Date(), isRead: true),
            Message(id: 2, senderId: 2, conversationId: conversationId, content: "Hi there!", createdAt: Date(), isRead: false)
        ]
        mockSession.mockData = try! JSONEncoder().encode(messages)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Fetch messages")
        apiService.fetchMessages(for: conversationId) { result in
            // Then
            switch result {
            case .success(let fetchedMessages):
                XCTAssertEqual(fetchedMessages.count, 2)
                XCTAssertEqual(fetchedMessages.first?.content, "Hello")
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "GET")
                XCTAssertTrue(self.mockSession.lastRequest?.url?.path.contains("/conversations/123/messages") ?? false)
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
        let newMessage = Message(id: 3, senderId: 1, conversationId: conversationId, content: messageContent, createdAt: Date(), isRead: false)
        mockSession.mockData = try! JSONEncoder().encode(newMessage)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 200, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Send message")
        apiService.sendMessage(to: conversationId, content: messageContent) { result in
            // Then
            switch result {
            case .success(let sentMessage):
                XCTAssertEqual(sentMessage.content, messageContent)
                XCTAssertEqual(sentMessage.conversationId, conversationId)
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "POST")
                XCTAssertTrue(self.mockSession.lastRequest?.url?.path.contains("/conversations/123/messages") ?? false)
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
        let newGroup = Group(id: 1, name: groupName, description: groupDescription, memberIds: memberIds, createdAt: Date())
        mockSession.mockData = try! JSONEncoder().encode(newGroup)
        mockSession.mockResponse = HTTPURLResponse(url: URL(string: "https://example.com")!, statusCode: 201, httpVersion: nil, headerFields: nil)
        
        // When
        let expectation = XCTestExpectation(description: "Create group")
        apiService.createGroup(name: groupName, description: groupDescription, memberIds: memberIds) { result in
            // Then
            switch result {
            case .success(let createdGroup):
                XCTAssertEqual(createdGroup.name, groupName)
                XCTAssertEqual(createdGroup.description, groupDescription)
                XCTAssertEqual(createdGroup.memberIds, memberIds)
                XCTAssertEqual(self.mockSession.lastRequest?.httpMethod, "POST")
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
}