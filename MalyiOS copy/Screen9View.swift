import SwiftUI

struct Screen9View: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @State private var promotionOnly: Bool = false
    @State private var contactsOnly: Bool = false
    @State private var invitationOnly: Bool = false
    @State private var requireApproval: Bool = false
    @State private var genderExclusive: String = "Select gender"
    @State private var ageExclusive: String = ""
    @State private var moodSpecific: String = ""
    @State private var interestsSpecific: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Target Audience")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 40)

                Text("Who should attend")
                    .font(.system(size: 20, weight: .medium))
                    .padding(.bottom, 16)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Spots available")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Currently: 00 spots available", text: Binding(
                        get: { eventStore.eventData.spotsAvailable },
                        set: { eventStore.updateSpotsAvailable($0) }
                    ))
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                CustomCheckbox(isOn: $promotionOnly, label: "Promotion Only")
                    .padding(.bottom, 16)
                CustomCheckbox(isOn: $contactsOnly, label: "Contacts Only")
                    .padding(.bottom, 16)
                CustomCheckbox(isOn: $invitationOnly, label: "Invitation Only")
                    .padding(.bottom, 16)
                CustomCheckbox(isOn: $requireApproval, label: "Require Approval")
                    .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Gender Exclusive")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    Picker("Select gender", selection: $genderExclusive) {
                        Text("Select gender").tag("Select gender")
                        Text("Male").tag("male")
                        Text("Female").tag("female")
                        Text("Other").tag("other")
                    }
                    .pickerStyle(.menu)
                    .accentColor(.white)
                    .background(
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(Color.white.opacity(0.3)),
                        alignment: .bottom
                    )
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Age Exclusive")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Add age range", text: $ageExclusive)
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Mood Specific")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Add moods", text: $moodSpecific)
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Interests Specific")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextField("Add interests", text: $interestsSpecific)
                        .textFieldStyle(CustomTextFieldStyle())
                }
                .padding(.bottom, 32)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
    }
}