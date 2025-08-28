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
    
    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        self.session = URLSession(configuration: config)
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
}