import XCTest
@testable import MalyiOS

class ConnectViewModelTests: XCTestCase {
    var connectViewModel: ConnectViewModel!
    var mockAPIService: MockAPIService!
    
    override func setUp() {
        super.setUp()
        mockAPIService = MockAPIService()
        connectViewModel = ConnectViewModel(apiService: mockAPIService)
    }
    
    override func tearDown() {
        connectViewModel = nil
        mockAPIService = nil
        super.tearDown()
    }
    
    // MARK: - User Discovery Tests
    
    func testFetchNearbyUsers_Success() {
        // Given
        let expectedUsers = [
            ConnectUser(id: 1, username: "user1", fullName: "User One", location: "Mexico City"),
            ConnectUser(id: 2, username: "user2", fullName: "User Two", location: "Mexico City")
        ]
        mockAPIService.mockNearbyUsersResult = .success(expectedUsers)
        
        // When
        let expectation = XCTestExpectation(description: "Fetch nearby users")
        connectViewModel.fetchNearbyUsers { result in
            // Then
            switch result {
            case .success(let users):
                XCTAssertEqual(users.count, 2)
                XCTAssertEqual(users.first?.username, "user1")
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testFetchNearbyUsers_Failure() {
        // Given
        mockAPIService.mockNearbyUsersResult = .failure(APIError(message: "Network error"))
        
        // When
        let expectation = XCTestExpectation(description: "Fetch nearby users failure")
        connectViewModel.fetchNearbyUsers { result in
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
    
    func testFetchNearbyUsers_UpdatesLoadingState() {
        // Given
        mockAPIService.mockNearbyUsersResult = .success([])
        
        // When
        XCTAssertFalse(connectViewModel.isLoading)
        connectViewModel.fetchNearbyUsers { _ in }
        
        // Then
        XCTAssertTrue(connectViewModel.isLoading)
    }
    
    // MARK: - Filtering Tests
    
    func testApplyLocationFilter() {
        // Given
        let location = "Mexico City"
        
        // When
        connectViewModel.applyLocationFilter(location)
        
        // Then
        XCTAssertEqual(connectViewModel.currentLocationFilter, location)
        XCTAssertTrue(mockAPIService.browseUsersWasCalled)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.location, location)
    }
    
    func testApplyGenderFilter() {
        // Given
        let gender = "female"
        
        // When
        connectViewModel.applyGenderFilter(gender)
        
        // Then
        XCTAssertEqual(connectViewModel.currentGenderFilter, gender)
        XCTAssertTrue(mockAPIService.browseUsersWasCalled)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.gender, gender)
    }
    
    func testApplyAgeRangeFilter() {
        // Given
        let minAge = 25
        let maxAge = 35
        
        // When
        connectViewModel.applyAgeRangeFilter(minAge: minAge, maxAge: maxAge)
        
        // Then
        XCTAssertEqual(connectViewModel.currentMinAge, minAge)
        XCTAssertEqual(connectViewModel.currentMaxAge, maxAge)
        XCTAssertTrue(mockAPIService.browseUsersWasCalled)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.minAge, minAge)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.maxAge, maxAge)
    }
    
    func testApplyMoodFilters() {
        // Given
        let moods = ["Creating", "Networking", "Exploring"]
        
        // When
        connectViewModel.applyMoodFilters(moods)
        
        // Then
        XCTAssertEqual(connectViewModel.currentMoodFilters, moods)
        XCTAssertTrue(mockAPIService.browseUsersWasCalled)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.moods, moods)
    }
    
    func testApplyInterestFilters() {
        // Given
        let interests = ["Technology", "Art", "Music"]
        
        // When
        connectViewModel.applyInterestFilters(interests)
        
        // Then
        XCTAssertEqual(connectViewModel.currentInterestFilters, interests)
        XCTAssertTrue(mockAPIService.browseUsersWasCalled)
        XCTAssertEqual(mockAPIService.lastBrowseParameters?.interests, interests)
    }
    
    func testClearAllFilters() {
        // Given
        connectViewModel.applyLocationFilter("Mexico City")
        connectViewModel.applyGenderFilter("male")
        connectViewModel.applyMoodFilters(["Happy"])
        
        // When
        connectViewModel.clearAllFilters()
        
        // Then
        XCTAssertNil(connectViewModel.currentLocationFilter)
        XCTAssertNil(connectViewModel.currentGenderFilter)
        XCTAssertTrue(connectViewModel.currentMoodFilters.isEmpty)
        XCTAssertTrue(connectViewModel.currentInterestFilters.isEmpty)
    }
    
    // MARK: - Search Tests
    
    func testSearchUsers_Success() {
        // Given
        let searchQuery = "John"
        let expectedUsers = [
            ConnectUser(id: 1, username: "john_doe", fullName: "John Doe", location: "Mexico City")
        ]
        mockAPIService.mockSearchUsersResult = .success(expectedUsers)
        
        // When
        let expectation = XCTestExpectation(description: "Search users")
        connectViewModel.searchUsers(query: searchQuery) { result in
            // Then
            switch result {
            case .success(let users):
                XCTAssertEqual(users.count, 1)
                XCTAssertEqual(users.first?.fullName, "John Doe")
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSearchUsers_EmptyQuery() {
        // When
        let expectation = XCTestExpectation(description: "Search empty query")
        connectViewModel.searchUsers(query: "") { result in
            // Then
            switch result {
            case .success(let users):
                XCTAssertTrue(users.isEmpty)
            case .failure:
                XCTFail("Expected success with empty results")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testSearchUsers_UpdatesSearchState() {
        // Given
        mockAPIService.mockSearchUsersResult = .success([])
        
        // When
        XCTAssertFalse(connectViewModel.isSearching)
        connectViewModel.searchUsers(query: "test") { _ in }
        
        // Then
        XCTAssertTrue(connectViewModel.isSearching)
        XCTAssertEqual(connectViewModel.currentSearchQuery, "test")
    }
    
    // MARK: - Connection Management Tests
    
    func testSendConnectionRequest_Success() {
        // Given
        let userId = 123
        mockAPIService.mockConnectionRequestResult = .success(())
        
        // When
        let expectation = XCTestExpectation(description: "Send connection request")
        connectViewModel.sendConnectionRequest(to: userId) { result in
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
    
    func testGetConnectionStatus_Success() {
        // Given
        let userId = 123
        let expectedStatus = ConnectionStatus.connected
        mockAPIService.mockConnectionStatusResult = .success(expectedStatus)
        
        // When
        let expectation = XCTestExpectation(description: "Get connection status")
        connectViewModel.getConnectionStatus(with: userId) { result in
            // Then
            switch result {
            case .success(let status):
                XCTAssertEqual(status, .connected)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Pagination Tests
    
    func testLoadMoreUsers_Success() {
        // Given
        let initialUsers = [ConnectUser(id: 1, username: "user1", fullName: "User One", location: "Mexico City")]
        let moreUsers = [ConnectUser(id: 2, username: "user2", fullName: "User Two", location: "Mexico City")]
        
        connectViewModel.nearbyUsers = initialUsers
        mockAPIService.mockNearbyUsersResult = .success(moreUsers)
        
        // When
        let expectation = XCTestExpectation(description: "Load more users")
        connectViewModel.loadMoreUsers { result in
            // Then
            switch result {
            case .success:
                XCTAssertEqual(self.connectViewModel.nearbyUsers.count, 2)
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testLoadMoreUsers_NoMoreData() {
        // Given
        connectViewModel.hasMoreUsers = false
        
        // When
        let expectation = XCTestExpectation(description: "Load more users - no more data")
        connectViewModel.loadMoreUsers { result in
            // Then
            switch result {
            case .success:
                XCTAssertTrue(true) // Should succeed but not load anything
            case .failure:
                XCTFail("Expected success")
            }
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
}