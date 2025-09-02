import Foundation
import SwiftUI

// MARK: - Connection Request Model
struct ConnectionRequest: Codable, Identifiable {
    let id: Int
    let username: String
    let fullName: String?
    let profileImage: String?
    let requestDate: Date?
    let status: String
    
    enum CodingKeys: String, CodingKey {
        case id, username, status
        case fullName = "fullName"
        case profileImage = "profileImage"
        case requestDate = "requestDate"
    }
}

// MARK: - User Connection Model
struct UserConnection: Codable, Identifiable {
    let id: Int
    let username: String
    let fullName: String?
    let profileImage: String?
    let connectionDate: Date?
    let connectionType: String
    
    enum CodingKeys: String, CodingKey {
        case id, username
        case fullName = "fullName"
        case profileImage = "profileImage"
        case connectionDate = "connectionDate"
        case connectionType = "connectionType"
    }
}

class InboxViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var pendingRequests: [ConnectionRequest] = []
    @Published var recentConnections: [UserConnection] = []
    @Published var connectionsCount = 0
    @Published var errorMessage: String?
    @Published var showingAuthenticationRequired = false
    
    private let apiService: APIService
    private let tokenManager = TokenManager.shared
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
        
        // Listen for authentication state changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(authenticationStateChanged),
            name: .tokenManagerStateChanged,
            object: nil
        )
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    @objc private func authenticationStateChanged() {
        DispatchQueue.main.async {
            if self.tokenManager.isAuthenticated {
                self.showingAuthenticationRequired = false
                self.refreshAllData()
            } else {
                self.clearData()
                self.showingAuthenticationRequired = true
            }
        }
    }
    
    private func clearData() {
        pendingRequests = []
        recentConnections = []
        connectionsCount = 0
        errorMessage = nil
    }
    
    // MARK: - Connection Requests Management
    
    func fetchPendingRequests(completion: @escaping (Result<[ConnectionRequest], APIError>) -> Void) {
        guard tokenManager.isAuthenticated else {
            showingAuthenticationRequired = true
            completion(.failure(APIError(message: "Authentication required")))
            return
        }
        
        isLoading = true
        errorMessage = nil
        showingAuthenticationRequired = false
        
        apiService.getPendingConnectionRequests { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let requests):
                    self?.pendingRequests = requests
                    completion(.success(requests))
                    
                case .failure(let error):
                    if error.message.contains("Authentication required") {
                        self?.showingAuthenticationRequired = true
                    }
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    func acceptConnectionRequest(userId: Int) {
        updateConnectionRequest(userId: userId, status: "accepted")
    }
    
    func declineConnectionRequest(userId: Int) {
        updateConnectionRequest(userId: userId, status: "declined")
    }
    
    private func updateConnectionRequest(userId: Int, status: String) {
        guard tokenManager.isAuthenticated else {
            showingAuthenticationRequired = true
            return
        }
        
        apiService.updateConnectionRequest(userId: userId, status: status) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    // Remove the request from pending list
                    self?.pendingRequests.removeAll { $0.id == userId }
                    
                    // If accepted, refresh connections list
                    if status == "accepted" {
                        self?.fetchRecentConnections { _ in }
                    }
                    
                case .failure(let error):
                    if error.message.contains("Authentication required") {
                        self?.showingAuthenticationRequired = true
                    }
                    self?.errorMessage = error.message
                }
            }
        }
    }
    
    // MARK: - Connections Management
    
    func fetchRecentConnections(completion: @escaping (Result<[UserConnection], APIError>) -> Void) {
        guard tokenManager.isAuthenticated else {
            showingAuthenticationRequired = true
            completion(.failure(APIError(message: "Authentication required")))
            return
        }
        
        showingAuthenticationRequired = false
        
        apiService.getConnections { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let connections):
                    self?.recentConnections = connections
                    self?.connectionsCount = connections.count
                    completion(.success(connections))
                    
                case .failure(let error):
                    if error.message.contains("Authentication required") {
                        self?.showingAuthenticationRequired = true
                    }
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    
    func testAuthentication() {
        print("🔐 Testing authentication state:")
        print("Token Manager authenticated: \(tokenManager.isAuthenticated)")
        print("Current token exists: \(tokenManager.currentToken != nil)")
        
        if tokenManager.isAuthenticated {
            print("✅ Authentication successful, testing API call...")
            fetchPendingRequests { result in
                switch result {
                case .success(let requests):
                    print("✅ API call successful, received \(requests.count) pending requests")
                case .failure(let error):
                    print("❌ API call failed: \(error.message)")
                }
            }
        } else {
            print("❌ Not authenticated")
        }
    }
    
    func refreshAllData() {
        fetchPendingRequests { _ in }
        fetchRecentConnections { _ in }
    }
}