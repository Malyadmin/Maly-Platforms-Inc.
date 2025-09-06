import SwiftUI

struct Screen3View: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @State private var agendaItemTime: Date = Date()
    @State private var agendaItemDescription: String = ""
    @State private var eventVisibility: String = "Select one"
    @State private var addActivitySchedule: Bool = false
    @State private var additionalInfo: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Fill in event details")
                    .font(.system(size: 28, weight: .semibold))
                    .padding(.top, 80)
                    .padding(.bottom, 40)

                CustomCheckbox(isOn: Binding(
                    get: { eventStore.eventData.isOnlineEvent },
                    set: { eventStore.updateOnlineEvent($0) }
                ), label: "This is an online event")
                    .padding(.bottom, 24)
                    .onChange(of: eventStore.eventData.isOnlineEvent) { oldValue, newValue in
                        // No direct UI changes here, handled by conditional views below
                    }

                // Online Event Specific Fields
                if eventStore.eventData.isOnlineEvent {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Where should this event be visible?")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray.opacity(0.8))
                        Picker("Select one", selection: $eventVisibility) {
                            Text("Select one").tag("Select one")
                            Text("Public").tag("public")
                            Text("Private").tag("private")
                        }
                        .pickerStyle(.menu) // Dropdown style
                        .accentColor(.white)
                        .background(
                            Rectangle()
                                .frame(height: 1)
                                .foregroundColor(Color.white.opacity(0.3)),
                            alignment: .bottom
                        )
                    }
                    .padding(.bottom, 32)
                }

                // Physical Event Specific Fields
                if !eventStore.eventData.isOnlineEvent {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("City")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray.opacity(0.8))
                        TextField("Type city name", text: Binding(
                            get: { eventStore.eventData.city },
                            set: { eventStore.updateCity($0) }
                        ))
                            .textFieldStyle(CustomTextFieldStyle())
                    }
                    .padding(.bottom, 32)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Address Line 1")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray.opacity(0.8))
                        TextField("Neighborhood, Address, Number", text: Binding(
                            get: { eventStore.eventData.addressLine1 },
                            set: { eventStore.updateAddress($0) }
                        ))
                            .textFieldStyle(CustomTextFieldStyle())
                    }
                    .padding(.bottom, 32)
                    
                    // Map Preview for Location
                    if !eventStore.eventData.city.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Location Preview")
                                .font(.system(size: 14))
                                .foregroundColor(Color.gray.opacity(0.8))
                            
                            CityMapView(cityName: eventStore.eventData.city)
                                .frame(height: 180)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                                )
                        }
                        .padding(.bottom, 32)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Additional Information")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    TextEditor(text: $additionalInfo)
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
                            Text(additionalInfo.isEmpty ? "Reference and relevant instructions for meeting, getting there, parking etc. If applicable." : "")
                                .font(.system(size: 14))
                                .foregroundColor(Color.white.opacity(0.5))
                                .padding(.top, 16)
                                .padding(.leading, 12)
                                .allowsHitTesting(false)
                            , alignment: .topLeading
                        )
                }
                .padding(.bottom, 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Start Date")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    DatePicker(
                        "",
                        selection: Binding(
                            get: { eventStore.eventData.startDate },
                            set: { eventStore.updateStartDate($0) }
                        ),
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

                VStack(alignment: .leading, spacing: 8) {
                    Text("End Date")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray.opacity(0.8))
                    DatePicker(
                        "",
                        selection: Binding(
                            get: { eventStore.eventData.endDate },
                            set: { eventStore.updateEndDate($0) }
                        ),
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

                CustomCheckbox(isOn: $addActivitySchedule, label: "Add activity schedule")
                    .padding(.bottom, 24)
                    .onChange(of: addActivitySchedule) { oldValue, newValue in
                        // No direct UI changes here, handled by conditional views below
                    }

                // Activity Schedule Fields (Conditional)
                if addActivitySchedule {
                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Agenda Item 1")
                                .font(.system(size: 14))
                                .foregroundColor(Color.gray.opacity(0.8))
                            DatePicker(
                                "",
                                selection: $agendaItemTime,
                                displayedComponents: [.hourAndMinute]
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

                        VStack(alignment: .leading, spacing: 8) {
                            TextEditor(text: $agendaItemDescription)
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
                                    Text(agendaItemDescription.isEmpty ? "Description of your event activity" : "")
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
                                print("Add another agenda item tapped")
                            }) {
                                Text("Add another")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(Color.yellow)
                            }
                            Spacer()
                        }
                        .padding(.bottom, 32)
                    }
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
    }
}