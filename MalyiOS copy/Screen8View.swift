import SwiftUI

struct Screen8View: View {
    @State private var searchText: String = ""

    var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("ADD event lineup")
                        .font(.system(size: 28, weight: .semibold))
                        .padding(.top, 80)
                        .padding(.bottom, 40)

                    // Search by name input
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(Color.gray.opacity(0.7))
                            .padding(.leading, 8)
                        TextField("Search by name", text: $searchText)
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .background(Color.clear)
                    }
                    .overlay(
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(Color.white.opacity(0.3)),
                        alignment: .bottom
                    )
                    .padding(.bottom, 24)

                    // Member List
                    VStack(spacing: 0) {
                        ForEach(0..<5) { index in // Example members
                            MemberItemView() // Reusing MemberItemView from Screen6
                                .padding(.vertical, 16)
                                .overlay(
                                    Rectangle()
                                        .frame(height: 1)
                                        .foregroundColor(Color.white.opacity(0.1)),
                                    alignment: .bottom
                                )
                        }
                    }
                    .padding(.bottom, 32)

                    // "Send invitation to join Maly" button
                    HStack {
                        Spacer()
                        Button(action: {
                            print("Send invitation to join Maly tapped")
                            // This action would typically navigate back to Screen 4
                        }) {
                            Text("Send invitation to join Maly")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(.black)
                                .padding(.vertical, 12)
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(9999) // Rounded full
                        }
                        Spacer()
                    }
                    .padding(.bottom, 100) // Space for nav bar
                }
                .padding(.horizontal, 24)
            }
            .background(Color.black)

            // Alphabet Sidebar (reused from Screen6)
            VStack(spacing: 2) {
                ForEach("ABCDEFGHIJKLMNOPQRSTUVWXYZ".map { String($0) }, id: \.self) { letter in
                    Text(letter)
                        .font(.system(size: 11))
                        .foregroundColor(Color.gray.opacity(0.6))
                }
            }
            .position(x: UIScreen.main.bounds.width - 20, y: UIScreen.main.bounds.height / 2)
        }
    }
}