import SwiftUI

struct Screen5View: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @State private var deadline = Date()
    @State private var selectedPrivacy = "Public"
    private let privacyOptions = ["Public", "Private", "RSVP"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Set pricing and audience")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 40)

                Text("How to RSVP")
                    .font(.system(size: 20, weight: .medium))
                    .padding(.bottom, 16)

                CustomCheckbox(
                    isOn: Binding(
                        get: { eventStore.eventData.isPaidEvent },
                        set: { eventStore.updatePaidEvent($0) }
                    ),
                    label: "This is a Paid Event",
                    subtext: "If applicable, provide pricing"
                )
                .padding(.bottom, 24)
                .onChange(of: eventStore.eventData.isPaidEvent) { oldValue, newValue in
                    // No direct UI changes here, handled by conditional views below
                }

                // Price Input (Conditional)
                if eventStore.eventData.isPaidEvent {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Price")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray.opacity(0.8))
                        TextField("USD", text: Binding(
                            get: { eventStore.eventData.price },
                            set: { eventStore.updatePrice($0) }
                        ))
                            .textFieldStyle(CustomTextFieldStyle())
                        Button(action: {
                            print("Apply conditional pricing or promo codes tapped")
                        }) {
                            Text("Apply conditional pricing or promo codes")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(Color.yellow)
                        }
                        .padding(.top, 8)
                    }
                    .padding(.bottom, 32)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Deadline")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    DatePicker(
                        "",
                        selection: $deadline,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .labelsHidden()
                    .datePickerStyle(.compact)
                    .colorScheme(.dark)
                    .accentColor(.white)
                    .padding(.vertical, 4)
                    .overlay(
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(Color.white.opacity(0.3)),
                        alignment: .bottom
                    )
                }
                .padding(.bottom, 32)

                // Privacy Settings
                VStack(alignment: .leading, spacing: 8) {
                    Text("Event Privacy")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    
                    Menu {
                        ForEach(privacyOptions, id: \.self) { option in
                            Button(action: {
                                selectedPrivacy = option
                                eventStore.updateEventPrivacy(option)
                            }) {
                                HStack {
                                    Text(option)
                                    if selectedPrivacy == option {
                                        Spacer()
                                        Image(systemName: "checkmark")
                                            .foregroundColor(.yellow)
                                    }
                                }
                            }
                        }
                    } label: {
                        HStack {
                            Text(selectedPrivacy)
                                .foregroundColor(.white)
                            Spacer()
                            Image(systemName: "chevron.down")
                                .foregroundColor(.white.opacity(0.6))
                                .font(.system(size: 12))
                        }
                        .padding(.vertical, 12)
                        .padding(.horizontal, 16)
                        .background(Color.clear)
                        .overlay(
                            Rectangle()
                                .frame(height: 1)
                                .foregroundColor(Color.white.opacity(0.3)),
                            alignment: .bottom
                        )
                    }
                    
                    // Privacy description
                    Text(getPrivacyDescription(for: selectedPrivacy))
                        .font(.system(size: 12))
                        .foregroundColor(.gray.opacity(0.7))
                        .padding(.top, 4)
                }
                .padding(.bottom, 32)

                Text("Who Should Attend")
                    .font(.system(size: 20, weight: .medium))
                    .padding(.bottom, 16)

                VStack(alignment: .leading, spacing: 8) {
                    TextEditor(text: Binding(
                        get: { eventStore.eventData.whoShouldAttend },
                        set: { eventStore.updateWhoShouldAttend($0) }
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
                            Text(eventStore.eventData.whoShouldAttend.isEmpty ? "Specify spots and the target audience or who the event is for." : "")
                                .font(.system(size: 14))
                                .foregroundColor(Color.white.opacity(0.5))
                                .padding(.top, 16)
                                .padding(.leading, 12)
                                .allowsHitTesting(false)
                            , alignment: .topLeading
                        )
                }
                .padding(.bottom, 32)

                HStack {
                    Spacer()
                    Button(action: {
                        print("Add Groups button tapped - would navigate to Screen9")
                        // This action would typically trigger navigation via a binding
                        // to ContentView's currentScreenIndex.
                    }) {
                        Text("Add Groups")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color.yellow)
                    }
                    Spacer()
                }
                .padding(.bottom, 32)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
        .onAppear {
            // Initialize privacy setting from eventStore
            selectedPrivacy = eventStore.eventData.eventPrivacy
        }
    }
    
    private func getPrivacyDescription(for privacy: String) -> String {
        switch privacy {
        case "Public":
            return "Anyone can find and join this event"
        case "Private":
            return "Only people you invite can see and join this event"
        case "RSVP":
            return "People can request to join, but you must approve them"
        default:
            return ""
        }
    }
}