import SwiftUI

struct Screen7View: View {
    @State private var searchText: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Create from previous event or draft")
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
                        .foregroundColor(Color.white.opacity(0.5)),
                    alignment: .bottom
                )
                .padding(.bottom, 32)

                // Drafts Section
                VStack(alignment: .leading, spacing: 0) {
                    Text("Drafts")
                        .font(.system(size: 18, weight: .medium))
                        .padding(.bottom, 16)

                    ForEach(0..<2) { _ in // Example draft cards
                        EventListCardView()
                            .padding(.bottom, 16)
                    }
                }
                .padding(.bottom, 40)

                // Previous events Section
                VStack(alignment: .leading, spacing: 0) {
                    Text("Previous events")
                        .font(.system(size: 18, weight: .medium))
                        .padding(.bottom, 16)

                    ForEach(0..<2) { _ in // Example previous event cards
                        EventListCardView()
                            .padding(.bottom, 16)
                    }
                }
                .padding(.bottom, 40)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .background(Color.black)
    }
}

// MARK: - Event List Card Sub-component
struct EventListCardView: View {
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.white.opacity(0.1))
                Text("MALY")
                    .font(.system(size: 12, weight: .semibold))
                    .kerning(0.5)
                    .foregroundColor(.white)
            }
            .frame(width: 64, height: 64)

            VStack(alignment: .leading) {
                Text("Event Title")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                Text("Day, Month. Date & Time")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                Text("$00 (notes)")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                Text("00 Interested")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}