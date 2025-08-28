import Foundation
import SwiftUI

class ConnectViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isSearching = false
    @Published var nearbyUsers: [ConnectUser] = []
    @Published var searchResults: [ConnectUser] = []
    @Published var featuredUser: ConnectUser?
    @Published var errorMessage: String?
    @Published var totalUserCount = 0
    @Published var hasMoreUsers = true
    @Published var currentSearchQuery = ""
    
    // Filter states
    @Published var currentLocationFilter: String?
    @Published var currentGenderFilter: String?
    @Published var currentMinAge: Int?
    @Published var currentMaxAge: Int?
    @Published var currentMoodFilters: [String] = []
    @Published var currentInterestFilters: [String] = []
    
    private let apiService: APIService
    private var currentOffset = 0
    private let pageSize = 20
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - User Discovery
    
    func fetchNearbyUsers(completion: @escaping (Result<[ConnectUser], APIError>) -> Void) {
        isLoading = true
        errorMessage = nil
        currentOffset = 0
        
        apiService.browseUsers(
            location: currentLocationFilter,
            gender: currentGenderFilter,
            minAge: currentMinAge,
            maxAge: currentMaxAge,
            moods: currentMoodFilters.isEmpty ? nil : currentMoodFilters,
            interests: currentInterestFilters.isEmpty ? nil : currentInterestFilters,
            name: nil,
            limit: pageSize,
            offset: currentOffset
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let response):
                    self?.nearbyUsers = response.users
                    self?.totalUserCount = response.pagination.total
                    self?.hasMoreUsers = response.pagination.hasMore
                    self?.currentOffset = response.pagination.offset + response.pagination.limit
                    
                    // Set featured user as first user if available
                    self?.featuredUser = response.users.first
                    
                    completion(.success(response.users))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    func loadMoreUsers(completion: @escaping (Result<Void, APIError>) -> Void) {
        guard hasMoreUsers && !isLoading else {
            completion(.success(()))
            return
        }
        
        isLoading = true
        
        apiService.browseUsers(
            location: currentLocationFilter,
            gender: currentGenderFilter,
            minAge: currentMinAge,
            maxAge: currentMaxAge,
            moods: currentMoodFilters.isEmpty ? nil : currentMoodFilters,
            interests: currentInterestFilters.isEmpty ? nil : currentInterestFilters,
            name: nil,
            limit: pageSize,
            offset: currentOffset
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let response):
                    self?.nearbyUsers.append(contentsOf: response.users)
                    self?.hasMoreUsers = response.pagination.hasMore
                    self?.currentOffset = response.pagination.offset + response.pagination.limit
                    completion(.success(()))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    // MARK: - Search
    
    func searchUsers(query: String, completion: @escaping (Result<[ConnectUser], APIError>) -> Void) {
        guard !query.isEmpty else {
            completion(.success([]))
            return
        }
        
        isSearching = true
        currentSearchQuery = query
        errorMessage = nil
        
        apiService.searchUsers(query: query) { [weak self] result in
            DispatchQueue.main.async {
                self?.isSearching = false
                
                switch result {
                case .success(let users):
                    self?.searchResults = users
                    completion(.success(users))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    // MARK: - Filtering
    
    func applyLocationFilter(_ location: String) {
        currentLocationFilter = location
        refreshUsers()
    }
    
    func applyGenderFilter(_ gender: String) {
        currentGenderFilter = gender
        refreshUsers()
    }
    
    func applyAgeRangeFilter(minAge: Int, maxAge: Int) {
        currentMinAge = minAge
        currentMaxAge = maxAge
        refreshUsers()
    }
    
    func applyMoodFilters(_ moods: [String]) {
        currentMoodFilters = moods
        refreshUsers()
    }
    
    func applyInterestFilters(_ interests: [String]) {
        currentInterestFilters = interests
        refreshUsers()
    }
    
    func clearAllFilters() {
        currentLocationFilter = nil
        currentGenderFilter = nil
        currentMinAge = nil
        currentMaxAge = nil
        currentMoodFilters = []
        currentInterestFilters = []
        refreshUsers()
    }
    
    private func refreshUsers() {
        fetchNearbyUsers { _ in }
    }
    
    // MARK: - Connections
    
    func sendConnectionRequest(to userId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        apiService.sendConnectionRequest(to: userId) { result in
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
    
    func getConnectionStatus(with userId: Int, completion: @escaping (Result<ConnectionStatus, APIError>) -> Void) {
        apiService.getConnectionStatus(with: userId) { result in
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
}