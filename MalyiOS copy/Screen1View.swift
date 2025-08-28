import SwiftUI

struct Screen1View: View {
    @EnvironmentObject var eventStore: EventCreationStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Create your event")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 4)

                Text("Promote or share remarkable experiences")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                    .padding(.bottom, 40)

                HStack {
                    Text("Let's get started!")
                        .font(.system(size: 18, weight: .medium))
                    Spacer()
                    // "Create from Previous" button. Navigation handled by ContentView.
                    Text("Create from Previous")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color.yellow)
                        .onTapGesture {
                            // This action would typically trigger navigation via a binding
                            // to ContentView's currentScreenIndex, but for now it's a placeholder.
                            print("Create from Previous tapped - would navigate to Screen7")
                            // You'd typically pass a binding or an action closure from ContentView
                            // to handle this navigation. For this structure, it's illustrative.
                        }
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16))
                        .foregroundColor(Color.gray.opacity(0.7))
                }
                .padding(.bottom, 24)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Event Title")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Concise and engaging", text: Binding(
                        get: { eventStore.eventData.title },
                        set: { eventStore.updateEventTitle($0) }
                    ))
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Event Tagline (optional)")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Short and catchy", text: Binding(
                        get: { eventStore.eventData.tagline },
                        set: { eventStore.updateEventTagline($0) }
                    ))
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Event Summary / Invitation")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextEditor(text: Binding(
                        get: { eventStore.eventData.summary },
                        set: { eventStore.updateEventSummary($0) }
                    ))
                        .frame(minHeight: 128)
                        .background(Color.clear)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                        )
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                        .overlay(
                            Text(eventStore.eventData.summary.isEmpty ? "A brief overview of your event. Use ChatGPT or similar if you need assistance." : "")
                                .font(.system(size: 14))
                                .foregroundColor(Color.white.opacity(0.5))
                                .padding(.top, 16)
                                .padding(.leading, 12)
                                .allowsHitTesting(false)
                            , alignment: .topLeading
                        )
                }
                .padding(.bottom, 32)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
    }
}

// MARK: - Custom TextField Style
struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.vertical, 12)
            .foregroundColor(.white)
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(Color.white.opacity(0.3)),
                alignment: .bottom
            )
    }
}