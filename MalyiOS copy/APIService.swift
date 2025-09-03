import Foundation

// MARK: - Event Data Models for API Responses
struct Event: Codable, Identifiable {
    let id: Int
    let title: String
    let description: String
    let location: String
    let address: String?
    let date: String
    let endDate: String?
    let image: String?
    let category: String
    let price: String?
    let ticketType: String
    let capacity: Int?
    let tags: [String]?
    let attendingCount: Int?
    let interestedCount: Int?
    let creatorId: Int?
    let itinerary: [ItineraryItem]?
}

class APIService: ObservableObject {
    static let shared = APIService()
    
    // Change this to your actual server URL when testing
    // For Replit: Use your repl's public URL (e.g., https://your-repl-name.your-username.repl.co/api)
    // For local: Use http://localhost:5000/api
    private let baseURL = "https://maly-platforms-inc-hudekholdingsll.replit.app/api"
    
    private var session: URLSession
    private let tokenManager = TokenManager.shared
    
    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        self.session = URLSession(configuration: config)
        
        print("🌐 APIService initialized with baseURL: \(baseURL)")
    }
    
    // MARK: - Authentication Helper Methods
    
    private func createAuthenticatedRequest(url: URL, method: String = "GET") -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication header if token exists
        if let token = tokenManager.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("🔐 Added Authorization header for \(method) \(url.path)")
        } else {
            print("⚠️ No authentication token available for \(method) \(url.path)")
        }
        
        return request
    }
    
    private func logRequest(_ request: URLRequest) {
        print("📤 \(request.httpMethod ?? "GET") \(request.url?.absoluteString ?? "unknown")")
        if let headers = request.allHTTPHeaderFields {
            for (key, value) in headers {
                if key.lowercased() == "authorization" {
                    print("   \(key): Bearer ***")
                } else {
                    print("   \(key): \(value)")
                }
            }
        }
        if let body = request.httpBody,
           let bodyString = String(data: body, encoding: .utf8) {
            print("   Body: \(bodyString)")
        }
    }
    
    private func logResponse(_ response: HTTPURLResponse, data: Data) {
        print("📥 Response: \(response.statusCode) for \(response.url?.path ?? "unknown")")
        if let responseString = String(data: data, encoding: .utf8) {
            if responseString.count > 200 {
                print("   Data: \(responseString.prefix(200))...")
            } else {
                print("   Data: \(responseString)")
            }
        }
    }
    
    private func handleAuthenticationError() {
        print("🚨 Authentication error - clearing stored token")
        tokenManager.clearToken()
    }
    
    // MARK: - Authentication Methods
    
    func register(request: RegistrationRequest) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/register")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONEncoder().encode(request)
            print("Registration request body: \(String(data: jsonData, encoding: .utf8) ?? "Unable to decode")")
            urlRequest.httpBody = jsonData
            
            let (data, response) = try await session.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("Registration response status: \(httpResponse.statusCode)")
                print("Registration response data: \(String(data: data, encoding: .utf8) ?? "Unable to decode")")
                
                if httpResponse.statusCode == 200 {
                    do {
                        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                        return authResponse
                    } catch {
                        print("JSON decode error: \(error)")
                        throw APIError(message: "Invalid response format")
                    }
                } else {
                    // Handle error response - server returns plain text for errors
                    if let errorString = String(data: data, encoding: .utf8) {
                        throw APIError(message: errorString)
                    } else {
                        throw APIError(message: "Registration failed with status \(httpResponse.statusCode)")
                    }
                }
            }
            
            throw APIError(message: "Invalid response")
        } catch let error as APIError {
            throw error
        } catch {
            print("Network error details: \(error)")
            throw APIError(message: "Network error: \(error.localizedDescription)")
        }
    }
    
    func login(request: LoginRequest) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/login")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add User-Agent header to match server expectations
        urlRequest.setValue("MalyiOS/1.0", forHTTPHeaderField: "User-Agent")
        
        do {
            let jsonData = try JSONEncoder().encode(request)
            print("🔐 Login attempt starting...")
            print("🌐 URL: \(url.absoluteString)")
            print("📤 Request body: \(String(data: jsonData, encoding: .utf8) ?? "Unable to decode")")
            urlRequest.httpBody = jsonData
            
            let (data, response) = try await session.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("📊 Login response status: \(httpResponse.statusCode)")
                print("📥 Login response data: \(String(data: data, encoding: .utf8) ?? "Unable to decode")")
                print("🍪 Response headers: \(httpResponse.allHeaderFields)")
                
                if httpResponse.statusCode == 200 {
                    do {
                        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                        print("✅ Login successful - User: \(authResponse.user?.username ?? "unknown")")
                        return authResponse
                    } catch {
                        print("❌ JSON decode error: \(error)")
                        print("Raw response: \(String(data: data, encoding: .utf8) ?? "No data")")
                        throw APIError(message: "Invalid response format")
                    }
                } else {
                    print("❌ Login failed with status \(httpResponse.statusCode)")
                    // Handle error response - server returns plain text for errors
                    if let errorString = String(data: data, encoding: .utf8) {
                        print("Error message from server: \(errorString)")
                        throw APIError(message: errorString)
                    } else {
                        throw APIError(message: "Login failed with status \(httpResponse.statusCode)")
                    }
                }
            }
            
            throw APIError(message: "Invalid response")
        } catch let error as APIError {
            print("🚨 API Error: \(error.message)")
            throw error
        } catch {
            print("🚨 Network error details: \(error)")
            throw APIError(message: "Network error: \(error.localizedDescription)")
        }
    }
    
    func logout() async throws {
        let url = URL(string: "\(baseURL)/logout")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        
        let (_, response) = try await session.data(for: urlRequest)
        
        if let httpResponse = response as? HTTPURLResponse {
            print("Logout response status: \(httpResponse.statusCode)")
            
            if httpResponse.statusCode != 200 {
                throw APIError(message: "Logout failed with status \(httpResponse.statusCode)")
            }
        }
    }
    
    func checkAuthStatus() async throws -> AuthResponse? {
        let url = URL(string: "\(baseURL)/auth/check")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        do {
            let (data, response) = try await session.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("Auth check response status: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode == 200 {
                    let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                    return authResponse
                } else {
                    // Not authenticated
                    return nil
                }
            }
            
            return nil
        } catch {
            print("Auth check error: \(error)")
            return nil
        }
    }
    
    // MARK: - Connect Methods
    
    func browseUsers(
        location: String?,
        gender: String?,
        minAge: Int?,
        maxAge: Int?,
        moods: [String]?,
        interests: [String]?,
        name: String?,
        limit: Int = 20,
        offset: Int = 0,
        completion: @escaping (Result<BrowseUsersResponse, APIError>) -> Void
    ) {
        var urlComponents = URLComponents(string: "\(baseURL)/users/browse")!
        var queryItems: [URLQueryItem] = []
        
        if let location = location { queryItems.append(URLQueryItem(name: "location", value: location)) }
        if let gender = gender { queryItems.append(URLQueryItem(name: "gender", value: gender)) }
        if let minAge = minAge { queryItems.append(URLQueryItem(name: "minAge", value: "\(minAge)")) }
        if let maxAge = maxAge { queryItems.append(URLQueryItem(name: "maxAge", value: "\(maxAge)")) }
        if let name = name { queryItems.append(URLQueryItem(name: "name", value: name)) }
        
        if let moods = moods, !moods.isEmpty {
            moods.forEach { queryItems.append(URLQueryItem(name: "moods", value: $0)) }
        }
        if let interests = interests, !interests.isEmpty {
            interests.forEach { queryItems.append(URLQueryItem(name: "interests", value: $0)) }
        }
        
        queryItems.append(URLQueryItem(name: "limit", value: "\(limit)"))
        queryItems.append(URLQueryItem(name: "offset", value: "\(offset)"))
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            completion(.failure(APIError(message: "Invalid URL")))
            return
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.timeoutInterval = 30
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        do {
                            let browseResponse = try JSONDecoder().decode(BrowseUsersResponse.self, from: data)
                            DispatchQueue.main.async {
                                completion(.success(browseResponse))
                            }
                        } catch {
                            DispatchQueue.main.async {
                                completion(.failure(APIError(message: "Failed to decode response: \(error.localizedDescription)")))
                            }
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Browse users failed"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                } else {
                    DispatchQueue.main.async {
                        completion(.failure(APIError(message: "No response received")))
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func searchUsers(query: String, completion: @escaping (Result<[ConnectUser], APIError>) -> Void) {
        guard !query.isEmpty else {
            completion(.success([]))
            return
        }
        
        var urlComponents = URLComponents(string: "\(baseURL)/users/search")!
        urlComponents.queryItems = [URLQueryItem(name: "q", value: query)]
        
        guard let url = urlComponents.url else {
            completion(.failure(APIError(message: "Invalid URL")))
            return
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        let users = try JSONDecoder().decode([ConnectUser].self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(users))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Search failed"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func sendConnectionRequest(to userId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/connections/request")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = ["targetUserId": userId]
        
        Task {
            do {
                urlRequest.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 201 {
                        DispatchQueue.main.async {
                            completion(.success(()))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Connection request failed"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func getConnectionStatus(with userId: Int, completion: @escaping (Result<ConnectionStatus, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/connections/status/\(userId)")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        // Backend returns: { "outgoing": {...}, "incoming": {...} }
                        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                        
                        // Check outgoing connection status (current user -> target user)
                        if let outgoing = json?["outgoing"] as? [String: Any],
                           let status = outgoing["status"] as? String {
                            let connectionStatus: ConnectionStatus
                            switch status {
                            case "pending":
                                connectionStatus = .pending
                            case "accepted":
                                connectionStatus = .connected
                            case "declined":
                                connectionStatus = .blocked
                            default:
                                connectionStatus = .notConnected
                            }
                            DispatchQueue.main.async {
                                completion(.success(connectionStatus))
                            }
                        } else {
                            // No outgoing connection found
                            DispatchQueue.main.async {
                                completion(.success(.notConnected))
                            }
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to get connection status"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    // MARK: - Messaging Methods
    
    func fetchConversations(completion: @escaping (Result<[Conversation], APIError>) -> Void) {
        // Get current user ID from TokenManager
        guard let userId = TokenManager.shared.getUserId() else {
            completion(.failure(APIError(message: "User not authenticated")))
            return
        }
        
        let url = URL(string: "\(baseURL)/conversations/\(userId)")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let conversations = try decoder.decode([Conversation].self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(conversations))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to fetch conversations"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func fetchMessages(for conversationId: Int, completion: @escaping (Result<[Message], APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/conversations/\(conversationId)/messages")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let messages = try decoder.decode([Message].self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(messages))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to fetch messages"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func sendMessage(to conversationId: Int, content: String, completion: @escaping (Result<Message, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/conversations/\(conversationId)/messages")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = SendMessageRequest(content: content)
        
        Task {
            do {
                let encoder = JSONEncoder()
                urlRequest.httpBody = try encoder.encode(requestBody)
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let message = try decoder.decode(Message.self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(message))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to send message"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func createOrFindDirectConversation(with otherUserId: Int, completion: @escaping (Result<Conversation, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/conversations")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = ["otherUserId": otherUserId]
        
        Task {
            do {
                urlRequest.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let conversation = try decoder.decode(Conversation.self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(conversation))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to create/find conversation"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func markMessageAsRead(messageId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/messages/\(messageId)/read")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        DispatchQueue.main.async {
                            completion(.success(()))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to mark message as read"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func markAllMessagesAsRead(in conversationId: Int, completion: @escaping (Result<Void, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/conversations/\(conversationId)/read")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        DispatchQueue.main.async {
                            completion(.success(()))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to mark messages as read"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func createGroup(name: String, description: String, memberIds: [Int], completion: @escaping (Result<Group, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/groups")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = CreateGroupRequest(name: name, description: description, memberIds: memberIds)
        
        Task {
            do {
                let encoder = JSONEncoder()
                urlRequest.httpBody = try encoder.encode(requestBody)
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 201 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let group = try decoder.decode(Group.self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(group))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to create group"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    // MARK: - Events Methods
    
    func fetchEvents() async throws -> [Event] {
        let url = URL(string: "\(baseURL)/events")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"
        
        do {
            let (data, response) = try await session.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("📅 Events fetch response status: \(httpResponse.statusCode)")
                print("📥 Events response data: \(String(data: data, encoding: .utf8) ?? "Unable to decode")")
                
                if httpResponse.statusCode == 200 {
                    let events = try JSONDecoder().decode([Event].self, from: data)
                    print("✅ Successfully fetched \(events.count) events")
                    return events
                } else {
                    if let errorString = String(data: data, encoding: .utf8) {
                        print("❌ Events fetch failed: \(errorString)")
                        throw APIError(message: errorString)
                    } else {
                        throw APIError(message: "Events fetch failed with status \(httpResponse.statusCode)")
                    }
                }
            }
            
            throw APIError(message: "Invalid response")
        } catch let error as APIError {
            print("🚨 API Error: \(error.message)")
            throw error
        } catch {
            print("🚨 Network error: \(error)")
            throw APIError(message: "Network error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Connection Management Methods
    
    func getPendingConnectionRequests(completion: @escaping (Result<[ConnectionRequest], APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/connections/pending")!
        let urlRequest = createAuthenticatedRequest(url: url, method: "GET")
        
        logRequest(urlRequest)
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    logResponse(httpResponse, data: data)
                    
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let requests = try decoder.decode([ConnectionRequest].self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(requests))
                        }
                    } else if httpResponse.statusCode == 401 {
                        handleAuthenticationError()
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: "Authentication required. Please log in again.")))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to get pending requests"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func getConnections(completion: @escaping (Result<[UserConnection], APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/connections")!
        let urlRequest = createAuthenticatedRequest(url: url, method: "GET")
        
        logRequest(urlRequest)
        
        Task {
            do {
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    logResponse(httpResponse, data: data)
                    
                    if httpResponse.statusCode == 200 {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let connections = try decoder.decode([UserConnection].self, from: data)
                        DispatchQueue.main.async {
                            completion(.success(connections))
                        }
                    } else if httpResponse.statusCode == 401 {
                        handleAuthenticationError()
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: "Authentication required. Please log in again.")))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to get connections"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
    
    func updateConnectionRequest(userId: Int, status: String, completion: @escaping (Result<Void, APIError>) -> Void) {
        let url = URL(string: "\(baseURL)/connections/\(userId)")!
        var urlRequest = createAuthenticatedRequest(url: url, method: "PUT")
        
        let requestBody = ["status": status]
        
        Task {
            do {
                urlRequest.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
                
                logRequest(urlRequest)
                
                let (data, response) = try await session.data(for: urlRequest)
                
                if let httpResponse = response as? HTTPURLResponse {
                    logResponse(httpResponse, data: data)
                    
                    if httpResponse.statusCode == 200 {
                        DispatchQueue.main.async {
                            completion(.success(()))
                        }
                    } else if httpResponse.statusCode == 401 {
                        handleAuthenticationError()
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: "Authentication required. Please log in again.")))
                        }
                    } else {
                        let errorMessage = String(data: data, encoding: .utf8) ?? "Failed to update connection request"
                        DispatchQueue.main.async {
                            completion(.failure(APIError(message: errorMessage)))
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(APIError(message: "Network error: \(error.localizedDescription)")))
                }
            }
        }
    }
}