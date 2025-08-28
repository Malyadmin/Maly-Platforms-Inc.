import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthenticationViewModel()
    
    var body: some View {
        NavigationView {
            Group {
                if authViewModel.isAuthenticated {
                    MainView()
                        .environmentObject(authViewModel)
                } else {
                    AuthenticationView()
                        .environmentObject(authViewModel)
                }
            }
        }
        .onAppear {
            authViewModel.checkAuthenticationStatus()
        }
    }
}

#Preview {
    ContentView()
}