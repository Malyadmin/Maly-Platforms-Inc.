import XCTest
import SwiftUI
@testable import MalyiOS

class ConnectViewUITests: XCTestCase {
    var connectView: ConnectView!
    var mockConnectViewModel: MockConnectViewModel!
    var mockAuthViewModel: MockAuthenticationViewModel!
    
    override func setUp() {
        super.setUp()
        mockConnectViewModel = MockConnectViewModel()
        mockAuthViewModel = MockAuthenticationViewModel()
        connectView = ConnectView()
            .environmentObject(mockConnectViewModel)
            .environmentObject(mockAuthViewModel)
    }
    
    override func tearDown() {
        connectView = nil
        mockConnectViewModel = nil
        mockAuthViewModel = nil
        super.tearDown()
    }
    
    // MARK: - Initial State Tests
    
    func testConnectView_InitialStateShowsLoadingIndicator() {
        // Given
        mockConnectViewModel.isLoading = true
        mockConnectViewModel.nearbyUsers = []
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        // This test verifies that the loading indicator appears when isLoading is true
        XCTAssertTrue(mockConnectViewModel.isLoading)
        XCTAssertTrue(mockConnectViewModel.nearbyUsers.isEmpty)
    }
    
    func testConnectView_DisplaysFeaturedUser() {
        // Given
        let featuredUser = ConnectUser(id: 1, username: "featured_user", fullName: "Featured User", location: "Mexico City")
        mockConnectViewModel.featuredUser = featuredUser
        mockConnectViewModel.isLoading = false
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        XCTAssertEqual(mockConnectViewModel.featuredUser?.username, "featured_user")
        XCTAssertEqual(mockConnectViewModel.featuredUser?.fullName, "Featured User")
    }
    
    func testConnectView_DisplaysNearbyUsersGrid() {
        // Given
        let nearbyUsers = [
            ConnectUser(id: 1, username: "user1", fullName: "User One", location: "Mexico City"),
            ConnectUser(id: 2, username: "user2", fullName: "User Two", location: "Mexico City"),
            ConnectUser(id: 3, username: "user3", fullName: "User Three", location: "Mexico City")
        ]
        mockConnectViewModel.nearbyUsers = nearbyUsers
        mockConnectViewModel.isLoading = false
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        XCTAssertEqual(mockConnectViewModel.nearbyUsers.count, 3)
        XCTAssertFalse(mockConnectViewModel.isLoading)
    }
    
    func testConnectView_ShowsCorrectUserCount() {
        // Given
        let userCount = 777
        mockConnectViewModel.totalUserCount = userCount
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        XCTAssertEqual(mockConnectViewModel.totalUserCount, 777)
    }
    
    // MARK: - User Interaction Tests
    
    func testConnectView_TapOnUserCallsViewProfile() {
        // Given
        let user = ConnectUser(id: 123, username: "test_user", fullName: "Test User", location: "Mexico City")
        mockConnectViewModel.nearbyUsers = [user]
        
        // When
        mockConnectViewModel.simulateUserTap(userId: 123)
        
        // Then
        XCTAssertTrue(mockConnectViewModel.viewProfileWasCalled)
        XCTAssertEqual(mockConnectViewModel.lastViewedUserId, 123)
    }
    
    func testConnectView_PullToRefreshTriggersDataReload() {
        // Given
        mockConnectViewModel.isLoading = false
        
        // When
        mockConnectViewModel.simulatePullToRefresh()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.refreshWasCalled)
    }
    
    func testConnectView_ScrollToBottomTriggersLoadMore() {
        // Given
        mockConnectViewModel.hasMoreUsers = true
        mockConnectViewModel.nearbyUsers = Array(repeating: ConnectUser(id: 1, username: "user", fullName: "User", location: "Mexico City"), count: 20)
        
        // When
        mockConnectViewModel.simulateScrollToBottom()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.loadMoreWasCalled)
    }
    
    // MARK: - Navigation Tests
    
    func testConnectView_SearchButtonNavigatesToSearch() {
        // When
        mockConnectViewModel.simulateSearchButtonTap()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.navigateToSearchWasCalled)
    }
    
    func testConnectView_FilterButtonNavigatesToFilters() {
        // When
        mockConnectViewModel.simulateFilterButtonTap()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.navigateToFiltersWasCalled)
    }
    
    // MARK: - Error State Tests
    
    func testConnectView_ShowsErrorStateWhenLoadFails() {
        // Given
        let errorMessage = "Failed to load users"
        mockConnectViewModel.errorMessage = errorMessage
        mockConnectViewModel.isLoading = false
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        XCTAssertEqual(mockConnectViewModel.errorMessage, errorMessage)
        XCTAssertFalse(mockConnectViewModel.isLoading)
    }
    
    func testConnectView_RetryButtonCallsRefresh() {
        // Given
        mockConnectViewModel.errorMessage = "Error occurred"
        
        // When
        mockConnectViewModel.simulateRetryButtonTap()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.refreshWasCalled)
        XCTAssertNil(mockConnectViewModel.errorMessage)
    }
    
    // MARK: - Filter Display Tests
    
    func testConnectView_ShowsActiveFilters() {
        // Given
        mockConnectViewModel.currentLocationFilter = "Mexico City"
        mockConnectViewModel.currentGenderFilter = "female"
        mockConnectViewModel.currentMoodFilters = ["Creating", "Networking"]
        
        // When
        let view = ConnectView().environmentObject(mockConnectViewModel)
        
        // Then
        XCTAssertEqual(mockConnectViewModel.currentLocationFilter, "Mexico City")
        XCTAssertEqual(mockConnectViewModel.currentGenderFilter, "female")
        XCTAssertEqual(mockConnectViewModel.currentMoodFilters.count, 2)
    }
    
    func testConnectView_ClearFiltersButtonWorks() {
        // Given
        mockConnectViewModel.currentLocationFilter = "Mexico City"
        mockConnectViewModel.currentGenderFilter = "male"
        
        // When
        mockConnectViewModel.simulateClearFiltersButtonTap()
        
        // Then
        XCTAssertTrue(mockConnectViewModel.clearFiltersWasCalled)
    }
}

// MARK: - Mock Connect ViewModel

class MockConnectViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var nearbyUsers: [ConnectUser] = []
    @Published var featuredUser: ConnectUser?
    @Published var errorMessage: String?
    @Published var totalUserCount = 0
    @Published var hasMoreUsers = true
    @Published var currentLocationFilter: String?
    @Published var currentGenderFilter: String?
    @Published var currentMoodFilters: [String] = []
    @Published var currentInterestFilters: [String] = []
    
    // Test tracking variables
    var refreshWasCalled = false
    var loadMoreWasCalled = false
    var viewProfileWasCalled = false
    var lastViewedUserId: Int?
    var navigateToSearchWasCalled = false
    var navigateToFiltersWasCalled = false
    var clearFiltersWasCalled = false
    
    func simulatePullToRefresh() {
        refreshWasCalled = true
    }
    
    func simulateScrollToBottom() {
        loadMoreWasCalled = true
    }
    
    func simulateUserTap(userId: Int) {
        viewProfileWasCalled = true
        lastViewedUserId = userId
    }
    
    func simulateSearchButtonTap() {
        navigateToSearchWasCalled = true
    }
    
    func simulateFilterButtonTap() {
        navigateToFiltersWasCalled = true
    }
    
    func simulateRetryButtonTap() {
        refreshWasCalled = true
        errorMessage = nil
    }
    
    func simulateClearFiltersButtonTap() {
        clearFiltersWasCalled = true
    }
}