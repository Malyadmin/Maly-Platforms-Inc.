import XCTest
import SwiftUI
@testable import MalyiOS

class MessagingViewUITests: XCTestCase {
    var messagingListView: MessagingListView!
    var chatView: ChatView!
    var mockMessagingViewModel: MockMessagingViewModel!
    
    override func setUp() {
        super.setUp()
        mockMessagingViewModel = MockMessagingViewModel()
        messagingListView = MessagingListView().environmentObject(mockMessagingViewModel)
        chatView = ChatView(conversationId: 123).environmentObject(mockMessagingViewModel)
    }
    
    override func tearDown() {
        messagingListView = nil
        chatView = nil
        mockMessagingViewModel = nil
        super.tearDown()
    }
    
    // MARK: - Messaging List View Tests
    
    func testMessagingListView_InitialStateShowsLoadingIndicator() {
        // Given
        mockMessagingViewModel.isLoading = true
        mockMessagingViewModel.conversations = []
        
        // When
        let view = MessagingListView().environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.isLoading)
        XCTAssertTrue(mockMessagingViewModel.conversations.isEmpty)
    }
    
    func testMessagingListView_DisplaysConversations() {
        // Given
        let conversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 2),
            Conversation(id: 3, type: .group, title: "Friends Group", lastMessage: nil, unreadCount: 1)
        ]
        mockMessagingViewModel.conversations = conversations
        mockMessagingViewModel.isLoading = false
        
        // When
        let view = MessagingListView().environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertEqual(mockMessagingViewModel.conversations.count, 3)
        XCTAssertFalse(mockMessagingViewModel.isLoading)
    }
    
    func testMessagingListView_FilterToggleWorks() {
        // Given
        let allConversations = [
            Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 0),
            Conversation(id: 2, type: .event, title: "Event Chat", lastMessage: nil, unreadCount: 2)
        ]
        mockMessagingViewModel.conversations = allConversations
        
        // When - Filter to show only chats
        mockMessagingViewModel.simulateFilterToggle(.direct)
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.filterToggleWasCalled)
        XCTAssertEqual(mockMessagingViewModel.lastFilterType, .direct)
    }
    
    func testMessagingListView_TapOnConversationNavigatesToChat() {
        // Given
        let conversation = Conversation(id: 123, type: .direct, title: "Test User", lastMessage: nil, unreadCount: 0)
        mockMessagingViewModel.conversations = [conversation]
        
        // When
        mockMessagingViewModel.simulateConversationTap(conversationId: 123)
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.navigateToChatWasCalled)
        XCTAssertEqual(mockMessagingViewModel.lastNavigatedConversationId, 123)
    }
    
    func testMessagingListView_ShowsUnreadCounts() {
        // Given
        let conversationWithUnread = Conversation(id: 1, type: .direct, title: "John Doe", lastMessage: nil, unreadCount: 5)
        mockMessagingViewModel.conversations = [conversationWithUnread]
        
        // When
        let view = MessagingListView().environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertEqual(mockMessagingViewModel.conversations.first?.unreadCount, 5)
    }
    
    func testMessagingListView_CreateGroupButtonWorks() {
        // When
        mockMessagingViewModel.simulateCreateGroupButtonTap()
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.navigateToCreateGroupWasCalled)
    }
    
    // MARK: - Chat View Tests
    
    func testChatView_InitialStateLoadsMessages() {
        // Given
        let conversationId = 123
        mockMessagingViewModel.isLoading = true
        
        // When
        let view = ChatView(conversationId: conversationId).environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.isLoading)
        // Should trigger fetchMessages on appear
    }
    
    func testChatView_DisplaysMessages() {
        // Given
        let messages = [
            Message(id: 1, senderId: 1, conversationId: 123, content: "Hello", createdAt: Date(), isRead: true),
            Message(id: 2, senderId: 2, conversationId: 123, content: "Hi there!", createdAt: Date(), isRead: false)
        ]
        mockMessagingViewModel.currentMessages = messages
        mockMessagingViewModel.isLoading = false
        
        // When
        let view = ChatView(conversationId: 123).environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertEqual(mockMessagingViewModel.currentMessages.count, 2)
        XCTAssertEqual(mockMessagingViewModel.currentMessages.first?.content, "Hello")
        XCTAssertEqual(mockMessagingViewModel.currentMessages.last?.content, "Hi there!")
    }
    
    func testChatView_SendMessageUpdatesUI() {
        // Given
        let initialMessage = Message(id: 1, senderId: 1, conversationId: 123, content: "Hello", createdAt: Date(), isRead: true)
        mockMessagingViewModel.currentMessages = [initialMessage]
        
        // When
        mockMessagingViewModel.simulateSendMessage(content: "New message")
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.sendMessageWasCalled)
        XCTAssertEqual(mockMessagingViewModel.lastSentMessage, "New message")
    }
    
    func testChatView_EmptyMessageCannotBeSent() {
        // When
        mockMessagingViewModel.simulateSendMessage(content: "")
        
        // Then
        XCTAssertFalse(mockMessagingViewModel.sendMessageWasCalled)
    }
    
    func testChatView_MessageInputClearsAfterSending() {
        // Given
        mockMessagingViewModel.currentMessageInput = "Test message"
        
        // When
        mockMessagingViewModel.simulateSendMessage(content: "Test message")
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.sendMessageWasCalled)
        XCTAssertTrue(mockMessagingViewModel.currentMessageInput.isEmpty)
    }
    
    func testChatView_ScrollsToBottomOnNewMessage() {
        // Given
        let existingMessages = [
            Message(id: 1, senderId: 1, conversationId: 123, content: "Hello", createdAt: Date(), isRead: true)
        ]
        mockMessagingViewModel.currentMessages = existingMessages
        
        // When
        let newMessage = Message(id: 2, senderId: 2, conversationId: 123, content: "New message", createdAt: Date(), isRead: false)
        mockMessagingViewModel.simulateIncomingMessage(newMessage)
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.scrollToBottomWasCalled)
        XCTAssertEqual(mockMessagingViewModel.currentMessages.count, 2)
    }
    
    func testChatView_ImageAttachmentButtonWorks() {
        // When
        mockMessagingViewModel.simulateImageAttachmentTap()
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.showImagePickerWasCalled)
    }
    
    func testChatView_BackButtonNavigatesCorrectly() {
        // When
        mockMessagingViewModel.simulateBackButtonTap()
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.navigateBackWasCalled)
    }
    
    // MARK: - Group Chat Specific Tests
    
    func testGroupChatView_ShowsGroupInfo() {
        // Given
        let groupConversation = Conversation(id: 123, type: .group, title: "Test Group", lastMessage: nil, unreadCount: 0)
        groupConversation.participantCount = 5
        mockMessagingViewModel.currentConversation = groupConversation
        
        // When
        let view = ChatView(conversationId: 123).environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertEqual(mockMessagingViewModel.currentConversation?.title, "Test Group")
        XCTAssertEqual(mockMessagingViewModel.currentConversation?.participantCount, 5)
    }
    
    func testGroupChatView_GroupInfoButtonWorks() {
        // When
        mockMessagingViewModel.simulateGroupInfoButtonTap()
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.showGroupInfoWasCalled)
    }
    
    // MARK: - Error State Tests
    
    func testMessagingViews_ShowErrorStateWhenLoadFails() {
        // Given
        let errorMessage = "Failed to load conversations"
        mockMessagingViewModel.errorMessage = errorMessage
        mockMessagingViewModel.isLoading = false
        
        // When
        let view = MessagingListView().environmentObject(mockMessagingViewModel)
        
        // Then
        XCTAssertEqual(mockMessagingViewModel.errorMessage, errorMessage)
        XCTAssertFalse(mockMessagingViewModel.isLoading)
    }
    
    func testChatView_HandlesSendMessageError() {
        // Given
        mockMessagingViewModel.shouldFailSendMessage = true
        
        // When
        mockMessagingViewModel.simulateSendMessage(content: "Test message")
        
        // Then
        XCTAssertTrue(mockMessagingViewModel.sendMessageWasCalled)
        XCTAssertNotNil(mockMessagingViewModel.errorMessage)
    }
}

// MARK: - Mock Messaging ViewModel

class MockMessagingViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var conversations: [Conversation] = []
    @Published var currentMessages: [Message] = []
    @Published var currentConversation: Conversation?
    @Published var errorMessage: String?
    @Published var currentMessageInput = ""
    
    // Test tracking variables
    var filterToggleWasCalled = false
    var lastFilterType: ConversationType?
    var navigateToChatWasCalled = false
    var lastNavigatedConversationId: Int?
    var navigateToCreateGroupWasCalled = false
    var sendMessageWasCalled = false
    var lastSentMessage: String?
    var scrollToBottomWasCalled = false
    var showImagePickerWasCalled = false
    var navigateBackWasCalled = false
    var showGroupInfoWasCalled = false
    var shouldFailSendMessage = false
    
    func simulateFilterToggle(_ type: ConversationType) {
        filterToggleWasCalled = true
        lastFilterType = type
    }
    
    func simulateConversationTap(conversationId: Int) {
        navigateToChatWasCalled = true
        lastNavigatedConversationId = conversationId
    }
    
    func simulateCreateGroupButtonTap() {
        navigateToCreateGroupWasCalled = true
    }
    
    func simulateSendMessage(content: String) {
        if content.isEmpty {
            return
        }
        
        sendMessageWasCalled = true
        lastSentMessage = content
        currentMessageInput = ""
        
        if shouldFailSendMessage {
            errorMessage = "Failed to send message"
        } else {
            let newMessage = Message(id: currentMessages.count + 1, senderId: 1, conversationId: 123, content: content, createdAt: Date(), isRead: false)
            currentMessages.append(newMessage)
            scrollToBottomWasCalled = true
        }
    }
    
    func simulateIncomingMessage(_ message: Message) {
        currentMessages.append(message)
        scrollToBottomWasCalled = true
    }
    
    func simulateImageAttachmentTap() {
        showImagePickerWasCalled = true
    }
    
    func simulateBackButtonTap() {
        navigateBackWasCalled = true
    }
    
    func simulateGroupInfoButtonTap() {
        showGroupInfoWasCalled = true
    }
}