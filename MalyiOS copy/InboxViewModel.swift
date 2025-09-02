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
    
    private let apiService: APIService
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
    }
    
    // MARK: - Connection Requests Management
    
    func fetchPendingRequests(completion: @escaping (Result<[ConnectionRequest], APIError>) -> Void) {
        isLoading = true
        errorMessage = nil
        
        apiService.getPendingConnectionRequests { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                switch result {
                case .success(let requests):
                    self?.pendingRequests = requests
                    completion(.success(requests))
                    
                case .failure(let error):
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
                    self?.errorMessage = error.message
                }
            }
        }
    }
    
    // MARK: - Connections Management
    
    func fetchRecentConnections(completion: @escaping (Result<[UserConnection], APIError>) -> Void) {
        apiService.getConnections { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let connections):
                    self?.recentConnections = connections
                    self?.connectionsCount = connections.count
                    completion(.success(connections))
                    
                case .failure(let error):
                    self?.errorMessage = error.message
                    completion(.failure(error))
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    
    func refreshAllData() {
        fetchPendingRequests { _ in }
        fetchRecentConnections { _ in }
    }
}