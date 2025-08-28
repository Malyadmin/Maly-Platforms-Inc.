import SwiftUI

class DiscoverViewModel: ObservableObject {
    @Published var events: [Event] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = APIService.shared
    
    func fetchEvents() {
        Task { @MainActor in
            isLoading = true
            errorMessage = nil
            
            do {
                let fetchedEvents = try await apiService.fetchEvents()
                self.events = fetchedEvents
                print("📱 Successfully loaded \(fetchedEvents.count) events for discover screen")
            } catch {
                self.errorMessage = error.localizedDescription
                print("❌ Error fetching events: \(error)")
            }
            
            isLoading = false
        }
    }
}

struct DiscoverView: View {
    @StateObject private var viewModel = DiscoverViewModel()
    @State private var selectedCity = "City name"
    @State private var selectedEvent: Event?
    
    // Date formatter for displaying event dates
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d, h:mm a"
        return formatter
    }()
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    headerView
                    
                    // Content
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 24) {
                            // THIS WEEK Section
                            thisWeekSection
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            print("🔍 DiscoverView appeared - fetching events...")
            viewModel.fetchEvents()
        }
        .sheet(item: $selectedEvent) { event in
            EventDetailModalView(event: event)
        }
    }
    
    private var headerView: some View {
        VStack(spacing: 16) {
            HStack {
                // Left side - City and Add filter
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text(selectedCity)
                            .font(.system(size: 18, weight: .regular))
                            .foregroundColor(.white)
                        
                        Image(systemName: "chevron.down")
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                    }
                    
                    HStack(spacing: 8) {
                        Text("Add filter")
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                        
                        Circle()
                            .stroke(Color.white, lineWidth: 1)
                            .frame(width: 24, height: 24)
                            .overlay(
                                Image(systemName: "plus")
                                    .font(.system(size: 12))
                                    .foregroundColor(.white)
                            )
                    }
                }
                
                Spacer()
                
                // Center - MÁLY logo
                Text("M Â L Y")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(.white)
                    .tracking(2)
                
                Spacer()
                
                // Right side - Search
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 16)
        }
        .padding(.top, 8)
        .padding(.bottom, 24)
    }
    
    private var thisWeekSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("THIS WEEK")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
            
            if viewModel.isLoading {
                HStack {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    Text("Loading events...")
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                }
            } else if viewModel.events.isEmpty {
                Text("No events found for this week.")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.7))
            } else {
                LazyVStack(spacing: 24) {
                    ForEach(viewModel.events.prefix(10)) { event in
                        EventCardView(event: event) {
                            selectedEvent = event
                        }
                    }
                }
            }
        }
    }
}

struct EventCardView: View {
    let event: Event
    let onTap: () -> Void
    
    // Date formatter for displaying event dates - handle multiple formats
    private let isoDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        return formatter
    }()
    
    private let simpleDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        return formatter
    }()
    
    private let displayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d, h:mm a"
        return formatter
    }()
    
    var body: some View {
        HStack(spacing: 16) {
            // Event Image
            eventImageView
            
            // Event Details
            VStack(alignment: .leading, spacing: 8) {
                Text(event.title)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(formattedDate)
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                    
                    Text(priceText)
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                    
                    Text("\(event.interestedCount ?? 0) Interested")
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                }
                
                // User Avatars (mock for now)
                HStack(spacing: 8) {
                    ForEach(0..<4, id: \.self) { _ in
                        Rectangle()
                            .fill(Color.gray.opacity(0.7))
                            .frame(width: 32, height: 32)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(.black)
                            )
                    }
                }
                
                Spacer()
            }
            
            Spacer()
        }
        .frame(height: 128)
        .contentShape(Rectangle())
        .onTapGesture {
            onTap()
        }
    }
    
    private var eventImageView: some View {
        Group {
            if let imageUrl = event.image, !imageUrl.isEmpty {
                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 128, height: 128)
                        .clipped()
                } placeholder: {
                    placeholderImageView
                }
            } else {
                placeholderImageView
            }
        }
    }
    
    private var placeholderImageView: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.7))
            .frame(width: 128, height: 128)
            .overlay(
                Text("M Â L Y")
                    .font(.system(size: 18, weight: .light))
                    .foregroundColor(.black)
                    .tracking(2)
            )
    }
    
    private var formattedDate: String {
        // Try to parse the ISO date string with multiple formats
        if let date = isoDateFormatter.date(from: event.date) {
            return displayFormatter.string(from: date)
        } else if let date = simpleDateFormatter.date(from: event.date) {
            return displayFormatter.string(from: date)
        } else {
            // Fallback - try a simpler format or just show the original
            return event.date
        }
    }
    
    private var priceText: String {
        if let price = event.price, price != "0" && !price.isEmpty {
            return "$\(price) (notes)"
        } else {
            return "$00 (notes)"
        }
    }
}

// Modal wrapper for EventDetailView
struct EventDetailModalView: View {
    let event: Event
    @Environment(\.dismiss) private var dismiss
    @StateObject private var eventStore = EventCreationStore()
    
    var body: some View {
        NavigationView {
            EventDetailView(isPresented: .constant(true))
                .environmentObject(eventStore)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Close") {
                            dismiss()
                        }
                        .foregroundColor(.white)
                    }
                }
        }
        .onAppear {
            // Convert Event to EventCreationData for display
            populateEventStore(with: event)
        }
    }
    
    private func populateEventStore(with event: Event) {
        eventStore.updateEventTitle(event.title)
        eventStore.updateEventSummary(event.description)
        eventStore.updateCity(event.location)
        
        if let imageUrl = event.image {
            eventStore.updateEventImage(imageUrl)
        }
        
        // Parse date with multiple format attempts
        let isoFormatter = DateFormatter()
        isoFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        let simpleFormatter = DateFormatter()
        simpleFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        
        if let date = isoFormatter.date(from: event.date) {
            eventStore.updateStartDate(date)
        } else if let date = simpleFormatter.date(from: event.date) {
            eventStore.updateStartDate(date)
        }
        
        if let price = event.price {
            eventStore.updatePaidEvent(price != "0" && !price.isEmpty)
            eventStore.updatePrice(price)
        }
    }
}

#Preview {
    DiscoverView()
}