import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var username = ""
    @State private var password = ""
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 15) {
                // Username/Email field
                VStack(alignment: .leading, spacing: 5) {
                    Text("Username or Email")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    TextField("Enter username or email", text: $username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
                
                // Password field
                VStack(alignment: .leading, spacing: 5) {
                    Text("Password")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    SecureField("Enter password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
            }
            
            // Login button
            Button(action: {
                authViewModel.login(username: username, password: password)
            }) {
                Text("Login")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .disabled(!isFormValid || authViewModel.isLoading)
        }
        .padding(.horizontal)
    }
    
    private var isFormValid: Bool {
        !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthenticationViewModel())
}