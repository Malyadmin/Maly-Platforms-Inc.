import Foundation
import Security

class TokenManager: ObservableObject {
    static let shared = TokenManager()
    
    private let service = "https://maly-platforms-inc-hudekholdingsll.replit.app"
    private let tokenKey = "jwt_token"
    private let userIdKey = "user_id"
    
    @Published var isAuthenticated = false
    @Published var currentUserId: Int?
    
    private init() {
        // Check if we have a stored token on init
        loadAuthenticationState()
    }
    
    // MARK: - Token Storage
    
    func storeToken(_ token: String, userId: Int) {
        // Store JWT token
        let tokenData = token.data(using: .utf8)!
        
        let tokenQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: tokenData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing token first
        SecItemDelete(tokenQuery as CFDictionary)
        
        // Add new token
        let tokenStatus = SecItemAdd(tokenQuery as CFDictionary, nil)
        
        // Store user ID
        let userIdData = String(userId).data(using: .utf8)!
        
        let userIdQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: userIdKey,
            kSecValueData as String: userIdData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing user ID first
        SecItemDelete(userIdQuery as CFDictionary)
        
        // Add new user ID
        let userIdStatus = SecItemAdd(userIdQuery as CFDictionary, nil)
        
        if tokenStatus == errSecSuccess && userIdStatus == errSecSuccess {
            DispatchQueue.main.async {
                self.isAuthenticated = true
                self.currentUserId = userId
                NotificationCenter.default.post(name: .tokenManagerStateChanged, object: nil)
            }
            print("✅ Token and user ID stored successfully")
        } else {
            print("❌ Failed to store token or user ID")
        }
    }
    
    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess,
           let data = dataTypeRef as? Data,
           let token = String(data: data, encoding: .utf8) {
            return token
        }
        
        return nil
    }
    
    func getUserId() -> Int? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: userIdKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess,
           let data = dataTypeRef as? Data,
           let userIdString = String(data: data, encoding: .utf8),
           let userId = Int(userIdString) {
            return userId
        }
        
        return nil
    }
    
    func clearToken() {
        let tokenQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey
        ]
        
        let userIdQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: userIdKey
        ]
        
        SecItemDelete(tokenQuery as CFDictionary)
        SecItemDelete(userIdQuery as CFDictionary)
        
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUserId = nil
            NotificationCenter.default.post(name: .tokenManagerStateChanged, object: nil)
        }
        
        print("🔓 Tokens cleared successfully")
    }
    
    // MARK: - Authentication State
    
    private func loadAuthenticationState() {
        if let token = getToken(), let userId = getUserId() {
            // Verify token is still valid (basic check)
            if isTokenValid(token) {
                DispatchQueue.main.async {
                    self.isAuthenticated = true
                    self.currentUserId = userId
                    NotificationCenter.default.post(name: .tokenManagerStateChanged, object: nil)
                }
                print("✅ Authentication restored from stored token")
            } else {
                clearToken()
                print("🔄 Stored token invalid, cleared")
            }
        } else {
            DispatchQueue.main.async {
                self.isAuthenticated = false
                self.currentUserId = nil
                NotificationCenter.default.post(name: .tokenManagerStateChanged, object: nil)
            }
        }
    }
    
    private func isTokenValid(_ token: String) -> Bool {
        // Basic JWT validation - check if it has three parts and not expired
        let parts = token.components(separatedBy: ".")
        guard parts.count == 3 else { return false }
        
        // Decode payload to check expiration
        guard let payloadData = Data(base64Encoded: addPadding(parts[1])),
              let payload = try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any],
              let exp = payload["exp"] as? TimeInterval else {
            return true // If we can't parse, assume valid for now
        }
        
        let expirationDate = Date(timeIntervalSince1970: exp)
        return expirationDate > Date()
    }
    
    private func addPadding(_ base64: String) -> String {
        let remainder = base64.count % 4
        if remainder > 0 {
            return base64 + String(repeating: "=", count: 4 - remainder)
        }
        return base64
    }
    
    // MARK: - Authentication Actions
    
    func login(token: String, userId: Int) {
        storeToken(token, userId: userId)
    }
    
    func logout() {
        clearToken()
    }
    
    func refreshAuthenticationState() {
        loadAuthenticationState()
    }
}