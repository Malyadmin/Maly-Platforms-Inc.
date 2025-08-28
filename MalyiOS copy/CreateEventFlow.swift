import SwiftUI

struct CreateEventFlow: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @StateObject private var eventStore = EventCreationStore()
    
    // State to control which screen is currently visible.
    @State private var currentScreenIndex: Int = 0

    // Array of screen views with event store passed to each
    private func getScreens() -> [AnyView] {
        return [
            AnyView(Screen1View().environmentObject(eventStore)),
            AnyView(Screen2View().environmentObject(eventStore)),
            AnyView(Screen3View().environmentObject(eventStore)),
            AnyView(Screen4View().environmentObject(eventStore)),
            AnyView(Screen5View().environmentObject(eventStore)),
            AnyView(Screen6View().environmentObject(eventStore)), // Event Published Successfully
            AnyView(Screen7View().environmentObject(eventStore)), // Create from previous event or draft
            AnyView(Screen8View().environmentObject(eventStore)), // Add event Lineup
            AnyView(Screen9View().environmentObject(eventStore))  // Target Audience
        ]
    }

    var body: some View {
        // Using a ZStack to layer the header, current screen, and navigation bar.
        // This mimics the fixed positioning of the web layout.
        VStack(spacing: 0) {
            // Header View - Fixed at top
            HeaderView(
                currentScreenIndex: $currentScreenIndex,
                totalScreens: getScreens().count,
                eventStore: eventStore,
                sessionId: authViewModel.sessionId ?? "no_session"
            )
            .frame(maxWidth: .infinity)
            .background(Color.black)
            
            // The current active screen view - Takes remaining space
            getScreens()[currentScreenIndex]
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black)
            
            // Navigation Bar View - Fixed at bottom (only show for non-event creation screens)
            if currentScreenIndex != 5 { // Don't show nav bar on preview screen
                NavigationBarView(selectedTab: .constant(2)) // Keep Create tab selected
                    .frame(maxWidth: .infinity)
                    .background(Color.black)
            }
        }
        .statusBar(hidden: false) // Ensure status bar is visible
    }
}

// MARK: - Preview Provider
struct CreateEventFlow_Previews: PreviewProvider {
    static var previews: some View {
        CreateEventFlow()
    }
}