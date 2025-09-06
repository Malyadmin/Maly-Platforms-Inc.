import SwiftUI

struct AuthenticationView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var isLoginMode = true
    
    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 10) {
                Text("Maly")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text("Connect with people in your city")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 50)
            
            Spacer()
            
            // Toggle between Login and Registration
            Picker("Mode", selection: $isLoginMode) {
                Text("Login").tag(true)
                Text("Register").tag(false)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            
            // Content
            if isLoginMode {
                LoginView()
                    .environmentObject(authViewModel)
            } else {
                RegistrationView()
                    .environmentObject(authViewModel)
            }
            
            Spacer()
            
            // Error message
            if let errorMessage = authViewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                    .onTapGesture {
                        authViewModel.clearError()
                    }
            }
        }
        .padding()
        .disabled(authViewModel.isLoading)
        .overlay(
            Group {
                if authViewModel.isLoading {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    
                    ProgressView("Loading...")
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.5)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(10)
                }
            }
        )
    }
}

#Preview {
    AuthenticationView()
        .environmentObject(AuthenticationViewModel())
}