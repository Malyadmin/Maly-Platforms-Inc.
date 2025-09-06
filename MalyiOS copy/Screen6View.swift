import SwiftUI

struct Screen6View: View {
    @EnvironmentObject var eventStore: EventCreationStore
    @State private var searchText: String = ""
    @State private var showingEventDetail: Bool = false
    
    // Move the formatters outside the body
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter
    }()
    
    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }()
    
    var body: some View {
        ZStack(alignment: .bottom) { // Use ZStack for the fixed bottom bar
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Event Published Successfully!")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.top, 60)
                        .padding(.bottom, 32)

                    // Event Summary Card - Show actual event data matching the design (Tappable)
                    Button(action: {
                        showingEventDetail = true
                    }) {
                        HStack(spacing: 16) {
                        // Event image - show uploaded image or MALY placeholder
                        if !eventStore.eventData.eventImageURL.isEmpty {
                            AsyncImage(url: URL(string: eventStore.eventData.eventImageURL)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 80, height: 80)
                                    .clipped()
                                    .cornerRadius(8)
                            } placeholder: {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.white.opacity(0.9))
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                    )
                            }
                        } else {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.white.opacity(0.9))
                                    .frame(width: 80, height: 80)
                                
                                Text("MALY")
                                    .font(.system(size: 12, weight: .semibold))
                                    .kerning(1.5)
                                    .foregroundColor(.black)
                            }
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            // Event Title
                            Text(eventStore.eventData.title.isEmpty ? "Event Title" : eventStore.eventData.title)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.white)
                            
                            // Format date and time to match design: "Day, Month Date & Time"
                            Text("\(dateFormatter.string(from: eventStore.eventData.startDate)) & \(timeFormatter.string(from: eventStore.eventData.startDate))")
                                .font(.system(size: 14))
                                .foregroundColor(Color.gray.opacity(0.7))
                            
                            // Price display matching design format
                            if eventStore.eventData.isPaidEvent && !eventStore.eventData.price.isEmpty {
                                Text("$\(eventStore.eventData.price) (notes)")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.gray.opacity(0.7))
                            } else {
                                Text("$00 (notes)")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.gray.opacity(0.7))
                            }
                            
                            Text("00 Interested")
                                .font(.system(size: 14))
                                .foregroundColor(Color.gray.opacity(0.7))
                        }
                        Spacer()
                        
                        // Add a subtle indicator that it's tappable
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray.opacity(0.5))
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.bottom, 32)

                    Text("Select people to invite")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.bottom, 24)

                    // Search by name input
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(Color.gray.opacity(0.7))
                            .font(.system(size: 16))
                        TextField("Search by name", text: $searchText)
                            .foregroundColor(.white)
                            .font(.system(size: 16))
                            .padding(.vertical, 12)
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
                        ForEach(0..<6) { index in // Show 6 members like in the design
                            MemberItemView()
                                .padding(.vertical, 16)
                                .overlay(
                                    // Separator line
                                    Rectangle()
                                        .frame(height: 1)
                                        .foregroundColor(Color.white.opacity(0.1))
                                        .padding(.horizontal, 24),
                                    alignment: .bottom
                                )
                        }
                    }
                    .padding(.bottom, 100) // Space for the fixed bottom bar
                }
                .padding(.horizontal, 24)
            }
            .background(Color.black)

            // Alphabet Sidebar
            VStack(spacing: 2) {
                ForEach("ABCDEFGHIJKLMNOPQRSTUVWXYZ".map { String($0) }, id: \.self) { letter in
                    Text(letter)
                        .font(.system(size: 11))
                        .foregroundColor(Color.gray.opacity(0.6))
                }
            }
            .position(x: UIScreen.main.bounds.width - 20, y: UIScreen.main.bounds.height / 2) // Fixed position

            // Share Outside of Maly Bar
            ShareOutsideMalyBar()
                .padding(.bottom, 70) // Adjust to be above the main nav bar
        }
        .sheet(isPresented: $showingEventDetail) {
            EventDetailView(isPresented: $showingEventDetail)
                .environmentObject(eventStore)
        }
    }
}

// MARK: - Member Item Sub-component
struct MemberItemView: View {
    @State private var isChecked: Bool = false

    var body: some View {
        HStack(spacing: 16) {
            // Profile picture placeholder matching the design
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.white.opacity(0.9))
                    .frame(width: 56, height: 56)
                
                Image(systemName: "person.fill")
                    .font(.system(size: 24))
                    .foregroundColor(Color.black.opacity(0.6))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("MEMBER NAME")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                
                Text("Mood 1 | Mood 2 | Mood 3")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                
                HStack(spacing: 4) {
                    Image(systemName: "location")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray.opacity(0.7))
                    Text("City Name")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray.opacity(0.7))
                }
            }
            
            Spacer()
            
            // Custom checkbox that matches the design exactly
            Button(action: {
                isChecked.toggle()
            }) {
                ZStack {
                    RoundedRectangle(cornerRadius: 3)
                        .stroke(Color.white.opacity(0.6), lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                        .background(isChecked ? Color.white : Color.clear)
                        .cornerRadius(3)
                    
                    if isChecked {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.black)
                    }
                }
            }
        }
    }
}

// MARK: - Share Outside Maly Bar Sub-component
struct ShareOutsideMalyBar: View {
    var body: some View {
        HStack {
            Text("Share outside of maly")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.white)
            Spacer()
            Image(systemName: "chevron.up")
                .font(.system(size: 20))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(16) // Rounded top corners
        .shadow(color: Color.black.opacity(0.3), radius: 10, x: 0, y: -5) // Shadow for lift
    }
}