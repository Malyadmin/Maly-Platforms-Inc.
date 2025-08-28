import SwiftUI

struct Screen4View: View {
    @State private var addEventLineup: Bool = false
    @State private var dressCode: Bool = false
    @State private var dressCodeDetails: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Event Specifics (Optional)")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 40)

                CustomCheckbox(
                    isOn: $addEventLineup,
                    label: "Add an Event Lineup",
                    subtext: "If applicable, tag a maly profile for each participant"
                )
                .padding(.bottom, 24)
                .onChange(of: addEventLineup) { oldValue, newValue in
                    // No direct UI changes here, handled by conditional views below
                }

                // Event Lineup Avatars (Conditional)
                if addEventLineup {
                    HStack(spacing: 8) {
                        ForEach(0..<4) { _ in
                            ZStack {
                                Circle()
                                    .fill(Color.white.opacity(0.1))
                                Image(systemName: "person.fill")
                                    .font(.system(size: 18))
                                    .foregroundColor(Color.white.opacity(0.6))
                            }
                            .frame(width: 40, height: 40)
                        }
                    }
                    .padding(.top, 16)
                    .padding(.bottom, 16)

                    HStack {
                        Spacer()
                        Button(action: {
                            print("Add or edit members tapped - would navigate to Screen8")
                            // This action would typically trigger navigation via a binding
                            // to ContentView's currentScreenIndex.
                        }) {
                            Text("Add or edit members")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(Color.yellow)
                        }
                        Spacer()
                    }
                    .padding(.bottom, 32)
                }

                CustomCheckbox(
                    isOn: $dressCode,
                    label: "Dress Code",
                    subtext: "If applicable, provide specific requirements or suggested attire."
                )
                .padding(.bottom, 24)
                .onChange(of: dressCode) { oldValue, newValue in
                    // No direct UI changes here, handled by conditional views below
                }

                // Dress Code Input (Conditional)
                if dressCode {
                    VStack(alignment: .leading, spacing: 8) {
                        TextEditor(text: $dressCodeDetails)
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
                                Text(dressCodeDetails.isEmpty ? "Dress Code" : "")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.white.opacity(0.5))
                                    .padding(.top, 16)
                                    .padding(.leading, 12)
                                    .allowsHitTesting(false)
                                , alignment: .topLeading
                            )
                    }
                    .padding(.bottom, 32)
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
    }
}