import SwiftUI

struct HeaderView: View {
    @Binding var currentScreenIndex: Int
    let totalScreens: Int
    @ObservedObject var eventStore: EventCreationStore
    let sessionId: String

    var body: some View {
        HStack {
            // Back Button
            Button(action: {
                if currentScreenIndex > 0 {
                    currentScreenIndex -= 1
                }
            }) {
                HStack {
                    Image(systemName: "chevron.left") // SF Symbol for back arrow
                        .font(.system(size: 16, weight: .semibold))
                    Text("Back")
                        .font(.system(size: 14, weight: .medium))
                }
                .foregroundColor(.white.opacity(0.8))
            }
            .opacity(currentScreenIndex == 0 ? 0 : 1) // Hide back button on the first screen.
            .disabled(currentScreenIndex == 0) // Disable interaction when hidden

            Spacer() // Pushes content to the sides

            // MALY Logo - Always centered
            Text("MALY")
                .font(.custom("Inter", size: 20)) // Using custom font if available
                .fontWeight(.semibold)
                .kerning(2.0) // letter-spacing: 0.1em
                .foregroundColor(.white)
                .overlay(
                    // Underline effect
                    Rectangle()
                        .frame(width: 40, height: 2) // Approximate width for underline
                        .foregroundColor(.white)
                        .offset(y: 15) // Position under the text
                    , alignment: .bottom
                )

            Spacer() // Pushes content to the sides

            // Right-side buttons (Next/Publish/Finish/Choose/Add Groups)
            Group {
                if currentScreenIndex == 8 { // Screen 9 (Target Audience) - Index 8
                    Button(action: {
                        // Action for Publish button on screen 9 - ALWAYS go to preview
                        print("🚀 Publish from Screen 9! Going to preview...")
                        currentScreenIndex = 5 // Go to Screen 6 (Event Published)
                        
                        // Try to create event in background
                        Task {
                            await eventStore.createEvent(sessionId: sessionId)
                        }
                    }) {
                        Text("Publish")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                } else if currentScreenIndex == 7 { // Screen 8 (Add event Lineup) - Index 7
                    Button(action: {
                        // Action for Publish button on screen 8 - ALWAYS go to preview
                        print("🚀 Publish from Screen 8! Going to preview...")
                        currentScreenIndex = 5 // Go to Screen 6 (Event Published)
                        
                        // Try to create event in background
                        Task {
                            await eventStore.createEvent(sessionId: sessionId)
                        }
                    }) {
                        Text("Publish")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                } else if currentScreenIndex == 5 { // Screen 6 (Event Published) - Index 5
                    Button(action: {
                        // Action for Finish button on screen 6
                        print("✅ Finished! Resetting to start...")
                        currentScreenIndex = 0 // Go back to Screen 1
                    }) {
                        Text("Finish")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                } else if currentScreenIndex == 4 { // Screen 5 (Set pricing and audience) - Index 4
                    Button(action: {
                        // Action for Publish button - ALWAYS go to preview screen
                        print("🚀 Publish button clicked! Going to preview screen...")
                        
                        // Always show preview screen immediately
                        currentScreenIndex = 5 // Go to Screen 6 (Event Published) - Index 5
                        
                        // Try to create event in background but don't wait for it
                        Task {
                            await eventStore.createEvent(sessionId: sessionId)
                        }
                    }) {
                        if eventStore.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.7)
                        } else {
                            Text("Publish")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                    .disabled(eventStore.isLoading)
                } else if currentScreenIndex == 6 { // Screen 7 (Create from previous) - Index 6
                    Button(action: {
                        // Action for Publish button on screen 7 - ALWAYS go to preview
                        print("🚀 Publish from Screen 7! Going to preview...")
                        currentScreenIndex = 5 // Go to Screen 6 (Event Published)
                        
                        // Try to create event in background
                        Task {
                            await eventStore.createEvent(sessionId: sessionId)
                        }
                    }) {
                        Text("Publish")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                } else { // All other screens (1, 2, 3, 4) show Next button
                    Button(action: {
                        if currentScreenIndex < 4 { // Only go up to Screen 5 (index 4)
                            currentScreenIndex += 1
                        }
                    }) {
                        Text("Next")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
        }
        .padding(.horizontal, 24) // px-6
        .padding(.vertical, 10) // py-5
        .frame(height: 60) // Fixed height for header
        .background(Color.black)
    }
}