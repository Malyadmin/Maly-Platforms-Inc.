import SwiftUI

struct EventDetailView: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @Binding var isPresented: Bool
    
    // Date formatters
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d, yyyy"
        return formatter
    }()
    
    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }()
    
    // Helper computed properties for map integration
    private var hasLocationData: Bool {
        !eventStore.eventData.city.isEmpty || !eventStore.eventData.addressLine1.isEmpty
    }
    
    private func createEventLocation() -> EventLocation? {
        // For now, we'll use geocoding for the address or city
        // In a real app, you'd have latitude/longitude from the backend
        guard hasLocationData else { return nil }
        
        // Default coordinates for demo - in production these would come from the backend
        return EventLocation(
            latitude: 37.7749,  // San Francisco default
            longitude: -122.4194,
            title: eventStore.eventData.title.isEmpty ? "Event Location" : eventStore.eventData.title,
            subtitle: eventStore.eventData.addressLine1.isEmpty ? eventStore.eventData.city : eventStore.eventData.addressLine1
        )
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Event Image
                    if !eventStore.eventData.eventImageURL.isEmpty {
                        AsyncImage(url: URL(string: eventStore.eventData.eventImageURL)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(height: 200)
                                .clipped()
                                .cornerRadius(12)
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 200)
                                .overlay(
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                )
                        }
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white.opacity(0.1))
                                .frame(height: 200)
                            
                            Text("MALY")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 16) {
                        // Title and Basic Info
                        VStack(alignment: .leading, spacing: 8) {
                            Text(eventStore.eventData.title.isEmpty ? "Untitled Event" : eventStore.eventData.title)
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.white)
                            
                            if !eventStore.eventData.tagline.isEmpty {
                                Text(eventStore.eventData.tagline)
                                    .font(.system(size: 18, weight: .medium))
                                    .foregroundColor(.gray)
                            }
                        }
                        
                        // Date and Time
                        VStack(alignment: .leading, spacing: 4) {
                            Label {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(dateFormatter.string(from: eventStore.eventData.startDate))
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.white)
                                    
                                    HStack {
                                        Text(timeFormatter.string(from: eventStore.eventData.startDate))
                                        Text("- \(timeFormatter.string(from: eventStore.eventData.endDate))")
                                    }
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                                }
                            } icon: {
                                Image(systemName: "calendar")
                                    .foregroundColor(.white)
                            }
                        }
                        
                        // Location
                        if !eventStore.eventData.city.isEmpty || !eventStore.eventData.addressLine1.isEmpty {
                            Label {
                                VStack(alignment: .leading, spacing: 2) {
                                    if !eventStore.eventData.city.isEmpty {
                                        Text(eventStore.eventData.city)
                                            .font(.system(size: 16, weight: .medium))
                                            .foregroundColor(.white)
                                    }
                                    if !eventStore.eventData.addressLine1.isEmpty {
                                        Text(eventStore.eventData.addressLine1)
                                            .font(.system(size: 14))
                                            .foregroundColor(.gray)
                                    }
                                }
                            } icon: {
                                Image(systemName: "location")
                                    .foregroundColor(.white)
                            }
                            
                            // Map View for Location
                            if hasLocationData {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Event Location")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.gray)
                                    
                                    if let eventLocation = createEventLocation() {
                                        EventMapView(eventLocation: eventLocation)
                                            .frame(height: 200)
                                            .cornerRadius(12)
                                    } else {
                                        CityMapView(cityName: eventStore.eventData.city)
                                            .frame(height: 200)
                                            .cornerRadius(12)
                                    }
                                }
                                .padding(.top, 8)
                            }
                        }
                        
                        // Price
                        if eventStore.eventData.isPaidEvent {
                            Label {
                                Text("$\(eventStore.eventData.price)")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                            } icon: {
                                Image(systemName: "dollarsign.circle")
                                    .foregroundColor(.white)
                            }
                        } else {
                            Label {
                                Text("Free Event")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                            } icon: {
                                Image(systemName: "heart")
                                    .foregroundColor(.white)
                            }
                        }
                        
                        // Spots Available
                        if !eventStore.eventData.spotsAvailable.isEmpty {
                            Label {
                                Text("\(eventStore.eventData.spotsAvailable) spots available")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.white)
                            } icon: {
                                Image(systemName: "person.3")
                                    .foregroundColor(.white)
                            }
                        }
                        
                        // Description/Summary
                        if !eventStore.eventData.summary.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("About")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(.white)
                                
                                Text(eventStore.eventData.summary)
                                    .font(.system(size: 16))
                                    .foregroundColor(.gray)
                                    .lineLimit(nil)
                            }
                        }
                        
                        // Who Should Attend
                        if !eventStore.eventData.whoShouldAttend.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Who Should Attend")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(.white)
                                
                                Text(eventStore.eventData.whoShouldAttend)
                                    .font(.system(size: 16))
                                    .foregroundColor(.gray)
                                    .lineLimit(nil)
                            }
                        }
                        
                        // Event Type
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Event Details")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.white)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Image(systemName: eventStore.eventData.isOnlineEvent ? "wifi" : "location.circle")
                                        .foregroundColor(.white)
                                    Text(eventStore.eventData.isOnlineEvent ? "Online Event" : "In-Person Event")
                                        .font(.system(size: 16))
                                        .foregroundColor(.gray)
                                }
                                
                                if eventStore.eventData.isPaidEvent {
                                    HStack {
                                        Image(systemName: "creditcard")
                                            .foregroundColor(.white)
                                        Text("Paid Event")
                                            .font(.system(size: 16))
                                            .foregroundColor(.gray)
                                    }
                                }
                                
                                // Event visibility and access
                                if eventStore.eventData.invitationOnly {
                                    HStack {
                                        Image(systemName: "envelope")
                                            .foregroundColor(.white)
                                        Text("Invitation Only")
                                            .font(.system(size: 16))
                                            .foregroundColor(.gray)
                                    }
                                }
                                
                                if eventStore.eventData.requireApproval {
                                    HStack {
                                        Image(systemName: "checkmark.shield")
                                            .foregroundColor(.white)
                                        Text("Requires Approval")
                                            .font(.system(size: 16))
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                        }
                        
                        // RSVP Section (only for RSVP events)
                        if eventStore.eventData.eventPrivacy == "RSVP" {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("RSVP Requests")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(.white)
                                
                                // RSVP Stats
                                HStack(spacing: 20) {
                                    VStack {
                                        Text("8")
                                            .font(.system(size: 24, weight: .bold))
                                            .foregroundColor(.yellow)
                                        Text("Pending")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    
                                    VStack {
                                        Text("12")
                                            .font(.system(size: 24, weight: .bold))
                                            .foregroundColor(.green)
                                        Text("Approved")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    
                                    VStack {
                                        Text("3")
                                            .font(.system(size: 24, weight: .bold))
                                            .foregroundColor(.red)
                                        Text("Declined")
                                            .font(.system(size: 12))
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                }
                                .padding(.bottom, 16)
                                
                                // RSVP List
                                VStack(spacing: 12) {
                                    ForEach(mockRSVPRequests, id: \.id) { request in
                                        RSVPRequestRow(request: request)
                                    }
                                }
                                
                                // View All Button
                                Button(action: {
                                    print("View All RSVP Requests tapped")
                                }) {
                                    HStack {
                                        Text("View All Requests")
                                            .font(.system(size: 16, weight: .medium))
                                            .foregroundColor(.yellow)
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 14))
                                            .foregroundColor(.yellow)
                                    }
                                }
                                .padding(.top, 8)
                            }
                        }
                        
                        // Additional Images (if any)
                        if eventStore.eventData.imageURLs.count > 1 {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("More Photos")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(.white)
                                
                                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                                    ForEach(Array(eventStore.eventData.imageURLs.dropFirst().enumerated()), id: \.offset) { index, imageURL in
                                        AsyncImage(url: URL(string: imageURL)) { image in
                                            image
                                                .resizable()
                                                .aspectRatio(1, contentMode: .fill)
                                                .clipped()
                                                .cornerRadius(8)
                                        } placeholder: {
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(Color.gray.opacity(0.3))
                                                .aspectRatio(1, contentMode: .fit)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.bottom, 20)
            }
            .background(Color.black)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        isPresented = false
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Share") {
                        // Add share functionality here
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

// RSVP Request Data Structure
struct RSVPRequest {
    let id = UUID()
    let userName: String
    let userImage: String
    let requestMessage: String
    let timeAgo: String
    let status: RSVPStatus
}

enum RSVPStatus {
    case pending
    case approved
    case declined
}

// Mock RSVP Data
let mockRSVPRequests: [RSVPRequest] = [
    RSVPRequest(
        userName: "Sarah Chen",
        userImage: "person.crop.circle.fill",
        requestMessage: "Hi! I'm really interested in attending this event. I work in UX design and would love to learn more about the topic.",
        timeAgo: "2 hours ago",
        status: .pending
    ),
    RSVPRequest(
        userName: "Mike Johnson",
        userImage: "person.crop.circle.fill",
        requestMessage: "Looking forward to this! I've been following similar events.",
        timeAgo: "5 hours ago",
        status: .pending
    ),
    RSVPRequest(
        userName: "Anna Rodriguez",
        userImage: "person.crop.circle.fill",
        requestMessage: "This looks amazing! Hope to be there.",
        timeAgo: "1 day ago",
        status: .approved
    )
]

// RSVP Request Row Component
struct RSVPRequestRow: View {
    let request: RSVPRequest
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                // User Avatar
                Image(systemName: request.userImage)
                    .font(.system(size: 24))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(Color.gray.opacity(0.3))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    // User Name and Time
                    HStack {
                        Text(request.userName)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                        Spacer()
                        Text(request.timeAgo)
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    
                    // Request Message
                    Text(request.requestMessage)
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                Spacer()
            }
            
            // Action Buttons (only for pending requests)
            if request.status == .pending {
                HStack(spacing: 12) {
                    Spacer()
                    
                    Button(action: {
                        print("Declined RSVP for \(request.userName)")
                    }) {
                        Text("Decline")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.red)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(20)
                    }
                    
                    Button(action: {
                        print("Approved RSVP for \(request.userName)")
                    }) {
                        Text("Approve")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.yellow)
                            .cornerRadius(20)
                    }
                }
            } else {
                // Status indicator for approved/declined
                HStack {
                    Spacer()
                    Text(request.status == .approved ? "Approved" : "Declined")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(request.status == .approved ? .green : .red)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background((request.status == .approved ? Color.green : Color.red).opacity(0.1))
                        .cornerRadius(12)
                }
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}