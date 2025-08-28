import SwiftUI

struct RegistrationView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    
    // Required fields
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    
    // Optional fields
    @State private var location = ""
    @State private var profession = ""
    @State private var ageText = ""
    @State private var gender = ""
    @State private var nextLocation = ""
    
    // Arrays for interests and moods
    @State private var selectedInterests: [String] = []
    @State private var selectedMoods: [String] = []
    
    // Common interests and moods (based on your app)
    let availableInterests = [
        "Digital Marketing", "Software Development", "Remote Work", "Travel", "Photography",
        "Fashion", "Social Media", "Technology", "Art", "Music", "Sports", "Business"
    ]
    
    let availableMoods = [
        "Creating", "Networking", "Teaching", "Learning", "Exploring", "Socializing",
        "Working", "Relaxing", "Partying", "Adventurous"
    ]
    
    let genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Required Fields Section
                VStack(alignment: .leading, spacing: 15) {
                    Text("Required Information")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Username")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Choose a username", text: $username)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Email")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Enter your email", text: $email)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .keyboardType(.emailAddress)
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Password")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        SecureField("Create a password", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Full Name")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Enter your full name", text: $fullName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                }
                .padding(.horizontal)
                
                Divider()
                
                // Optional Fields Section
                VStack(alignment: .leading, spacing: 15) {
                    Text("Optional Information")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Current Location")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("City, Country", text: $location)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Profession")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("What do you do?", text: $profession)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Age")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Enter your age", text: $ageText)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.numberPad)
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Gender")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Picker("Gender", selection: $gender) {
                            Text("Select Gender").tag("")
                            ForEach(genderOptions, id: \.self) { option in
                                Text(option).tag(option)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Next Location")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Where are you going next?", text: $nextLocation)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                }
                .padding(.horizontal)
                
                // Interests Section
                VStack(alignment: .leading, spacing: 10) {
                    Text("Interests")
                        .font(.headline)
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    LazyVGrid(columns: [
                        GridItem(.adaptive(minimum: 100))
                    ], spacing: 10) {
                        ForEach(availableInterests, id: \.self) { interest in
                            Button(action: {
                                if selectedInterests.contains(interest) {
                                    selectedInterests.removeAll { $0 == interest }
                                } else {
                                    selectedInterests.append(interest)
                                }
                            }) {
                                Text(interest)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(selectedInterests.contains(interest) ? Color.blue : Color.gray.opacity(0.2))
                                    .foregroundColor(selectedInterests.contains(interest) ? .white : .primary)
                                    .cornerRadius(15)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                .padding(.horizontal)
                
                // Current Moods Section
                VStack(alignment: .leading, spacing: 10) {
                    Text("Current Vibes")
                        .font(.headline)
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    LazyVGrid(columns: [
                        GridItem(.adaptive(minimum: 100))
                    ], spacing: 10) {
                        ForEach(availableMoods, id: \.self) { mood in
                            Button(action: {
                                if selectedMoods.contains(mood) {
                                    selectedMoods.removeAll { $0 == mood }
                                } else {
                                    selectedMoods.append(mood)
                                }
                            }) {
                                Text(mood)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(selectedMoods.contains(mood) ? Color.purple : Color.gray.opacity(0.2))
                                    .foregroundColor(selectedMoods.contains(mood) ? .white : .primary)
                                    .cornerRadius(15)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                .padding(.horizontal)
                
                // Register button
                Button(action: {
                    registerUser()
                }) {
                    Text("Create Account")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isFormValid ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .disabled(!isFormValid || authViewModel.isLoading)
                .padding(.horizontal)
                .padding(.top, 20)
            }
            .padding(.vertical)
        }
    }
    
    private var isFormValid: Bool {
        !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !password.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        password.count >= 6 &&
        username.count >= 3 &&
        email.contains("@") && email.contains(".")
    }
    
    private func registerUser() {
        let age = Int(ageText.trimmingCharacters(in: .whitespacesAndNewlines))
        
        authViewModel.register(
            username: username.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password,
            fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
            location: location.isEmpty ? nil : location.trimmingCharacters(in: .whitespacesAndNewlines),
            interests: selectedInterests.isEmpty ? nil : selectedInterests,
            currentMoods: selectedMoods.isEmpty ? nil : selectedMoods,
            profession: profession.isEmpty ? nil : profession.trimmingCharacters(in: .whitespacesAndNewlines),
            age: age,
            gender: gender.isEmpty ? nil : gender,
            nextLocation: nextLocation.isEmpty ? nil : nextLocation.trimmingCharacters(in: .whitespacesAndNewlines)
        )
    }
}

#Preview {
    RegistrationView()
        .environmentObject(AuthenticationViewModel())
}