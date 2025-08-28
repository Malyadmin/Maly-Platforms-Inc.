import SwiftUI

struct NavigationBarView: View {
    @Binding var selectedTab: Int

    var body: some View {
        HStack(spacing: 0) {
            TabButton(imageName: "globe", title: "discover", isSelected: selectedTab == 0) {
                selectedTab = 0
            }
            TabButton(imageName: "person.2", title: "connect", isSelected: selectedTab == 1) {
                selectedTab = 1
            }
            TabButton(imageName: "plus", title: "create", isSelected: selectedTab == 2, isCentral: true) {
                selectedTab = 2
            }
            TabButton(imageName: "star", title: "events", isSelected: selectedTab == 3) {
                selectedTab = 3
            }
            TabButton(imageName: "person.crop.circle", title: "profile", isSelected: selectedTab == 4) {
                selectedTab = 4
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color.black)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color.gray.opacity(0.2)),
            alignment: .top
        )
    }
}

// MARK: - Tab Button Sub-component
struct TabButton: View {
    let imageName: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    var isCentral: Bool = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: isCentral ? 0 : 4) {
                if isCentral {
                    Image(systemName: imageName)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.black)
                        .padding(12)
                        .background(
                            Circle()
                                .fill(Color.white)
                                .shadow(color: Color.white.opacity(0.3), radius: 10, x: 0, y: 4)
                        )
                        .offset(y: -28)
                } else {
                    Image(systemName: imageName)
                        .font(.system(size: 20))
                        .foregroundColor(isSelected ? .white : .white.opacity(0.6))
                }
                Text(title)
                    .font(.system(size: 10))
                    .foregroundColor(isSelected ? .white : .white.opacity(0.6))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, isCentral ? 0 : 8)
        }
    }
}