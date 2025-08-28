import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let fullName: String?
    let profileImage: String?
    let location: String?
    let interests: [String]?
    let currentMoods: [String]?
    let profession: String?
    let age: Int?
    let gender: String?
    let nextLocation: String?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, username, email, location, interests, profession, age, gender, createdAt, updatedAt
        case fullName = "full_name"
        case profileImage = "profile_image"
        case currentMoods = "current_moods"
        case nextLocation = "next_location"
    }
}

// MARK: - Registration Request
struct RegistrationRequest: Codable {
    let username: String
    let email: String
    let password: String
    let fullName: String
    let location: String?
    let interests: [String]?
    let currentMoods: [String]?
    let profession: String?
    let age: Int?
    let gender: String?
    let nextLocation: String?
    
    enum CodingKeys: String, CodingKey {
        case username, email, password, location, interests, profession, age, gender
        case fullName = "fullName"
        case currentMoods = "currentMoods"
        case nextLocation = "nextLocation"
    }
}

// MARK: - Login Request
struct LoginRequest: Codable {
    let username: String
    let password: String
}

// MARK: - Authentication Response
struct AuthResponse: Codable {
    let user: User?
    let authenticated: Bool
    let sessionId: String?
}

// MARK: - API Error Response
struct APIError: Codable, Error {
    let message: String
    
    init(message: String) {
        self.message = message
    }
}