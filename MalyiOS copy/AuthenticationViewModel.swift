import Foundation
import SwiftUI

@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var sessionId: String?
    
    private let apiService = APIService.shared
    
    func checkAuthenticationStatus() {
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                if let authResponse = try await apiService.checkAuthStatus() {
                    isAuthenticated = authResponse.authenticated
                    currentUser = authResponse.user
                } else {
                    isAuthenticated = false
                    currentUser = nil
                }
            } catch {
                print("Error checking auth status: \(error)")
                isAuthenticated = false
                currentUser = nil
            }
        }
    }
    
    func login(username: String, password: String) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }
            
            let request = LoginRequest(username: username, password: password)
            
            do {
                let response = try await apiService.login(request: request)
                isAuthenticated = response.authenticated
                currentUser = response.user
                sessionId = response.sessionId // Store the session ID
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
            }
        }
    }
    
    func register(
        username: String,
        email: String,
        password: String,
        fullName: String,
        location: String? = nil,
        interests: [String]? = nil,
        currentMoods: [String]? = nil,
        profession: String? = nil,
        age: Int? = nil,
        gender: String? = nil,
        nextLocation: String? = nil
    ) {
        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }
            
            let request = RegistrationRequest(
                username: username,
                email: email,
                password: password,
                fullName: fullName,
                location: location,
                interests: interests,
                currentMoods: currentMoods,
                profession: profession,
                age: age,
                gender: gender,
                nextLocation: nextLocation
            )
            
            do {
                let response = try await apiService.register(request: request)
                isAuthenticated = response.authenticated
                currentUser = response.user
            } catch let error as APIError {
                errorMessage = error.message
            } catch {
                errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
            }
        }
    }
    
    func logout() {
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                try await apiService.logout()
                isAuthenticated = false
                currentUser = nil
            } catch {
                print("Logout error: \(error)")
                // Even if logout fails, clear local state
                isAuthenticated = false
                currentUser = nil
            }
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
}