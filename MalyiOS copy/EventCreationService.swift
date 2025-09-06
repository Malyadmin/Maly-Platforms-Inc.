import Foundation

struct EventCreationData {
    var title: String = ""
    var tagline: String = ""
    var summary: String = ""
    var images: [Data] = []
    var eventImageURL: String = "" // First uploaded image URL
    var imageURLs: [String] = [] // All uploaded image URLs
    var videoURLs: [String] = [] // All uploaded video URLs
    var isOnlineEvent: Bool = false
    var eventVisibility: String = "Select one"
    var city: String = ""
    var addressLine1: String = ""
    var additionalInfo: String = ""
    var startDate: Date = Date()
    var endDate: Date = Date()
    var addActivitySchedule: Bool = false
    var agendaItems: [AgendaItem] = []
    var addEventLineup: Bool = false
    var dressCode: Bool = false
    var dressCodeDetails: String = ""
    var isPaidEvent: Bool = false
    var price: String = ""
    var deadline: Date = Date()
    var eventPrivacy: String = "Public"
    var whoShouldAttend: String = ""
    var spotsAvailable: String = ""
    var promotionOnly: Bool = false
    var contactsOnly: Bool = false
    var invitationOnly: Bool = false
    var requireApproval: Bool = false
    var genderExclusive: String = "Select gender"
    var ageExclusive: String = ""
    var moodSpecific: String = ""
    var interestsSpecific: String = ""
}

struct AgendaItem {
    var time: Date
    var description: String
}

struct EventCreationRequest: Codable {
    let title: String
    let description: String
    let city: String
    let location: String
    let address: String?
    let date: String
    let endDate: String
    let category: String
    let price: String?
    let ticketType: String
    let capacity: Int?
    let tags: [String]
    let itinerary: [ItineraryItem]?
    let image: String? // Main event image URL
}

struct ItineraryItem: Codable {
    let startTime: String
    let endTime: String
    let description: String
}

struct EventCreationResponse: Codable {
    let id: Int
    let title: String
    let description: String
    let location: String
    let address: String?
    let latitude: String?
    let longitude: String?
    let date: String
    let creatorId: Int
    let message: String
}

class EventCreationService {
    static let shared = EventCreationService()
    private let baseURL = "https://maly-platforms-inc-hudekholdingsll.replit.app"
    
    private init() {}
    
    func createEvent(eventData: EventCreationData, sessionId: String) async throws -> EventCreationResponse {
        guard let url = URL(string: "\(baseURL)/api/events") else {
            throw APIError(message: "Invalid URL")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(sessionId, forHTTPHeaderField: "x-session-id")
        
        // Convert event data to API format
        let eventRequest = convertToAPIFormat(eventData: eventData)
        
        do {
            let jsonData = try JSONEncoder().encode(eventRequest)
            request.httpBody = jsonData
            
            print("🎪 Creating event...")
            print("🌐 URL: \(url.absoluteString)")
            print("📤 Request body: \(String(data: jsonData, encoding: .utf8) ?? "Unable to decode")")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("📊 Event creation response status: \(httpResponse.statusCode)")
                print("📥 Event creation response data: \(String(data: data, encoding: .utf8) ?? "Unable to decode")")
                
                if httpResponse.statusCode == 201 {
                    let creationResponse = try JSONDecoder().decode(EventCreationResponse.self, from: data)
                    print("✅ Event created successfully - ID: \(creationResponse.id)")
                    return creationResponse
                } else {
                    if let errorString = String(data: data, encoding: .utf8) {
                        print("❌ Event creation failed: \(errorString)")
                        throw APIError(message: errorString)
                    } else {
                        throw APIError(message: "Event creation failed with status \(httpResponse.statusCode)")
                    }
                }
            }
            
            throw APIError(message: "Invalid response")
        } catch let error as APIError {
            print("🚨 API Error: \(error.message)")
            throw error
        } catch {
            print("🚨 Network error: \(error)")
            throw APIError(message: "Network error: \(error.localizedDescription)")
        }
    }
    
    private func convertToAPIFormat(eventData: EventCreationData) -> EventCreationRequest {
        let dateFormatter = ISO8601DateFormatter()
        
        // Create itinerary from agenda items
        let itinerary = eventData.agendaItems.map { item in
            let timeFormatter = DateFormatter()
            timeFormatter.dateFormat = "HH:mm"
            return ItineraryItem(
                startTime: timeFormatter.string(from: item.time),
                endTime: timeFormatter.string(from: item.time.addingTimeInterval(3600)), // Add 1 hour
                description: item.description
            )
        }
        
        // Determine ticket type and price
        let ticketType = eventData.isPaidEvent ? "paid" : "free"
        let price = eventData.isPaidEvent ? eventData.price : "0"
        
        // Create tags from various fields
        var tags: [String] = []
        if !eventData.moodSpecific.isEmpty {
            tags.append(contentsOf: eventData.moodSpecific.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) })
        }
        if !eventData.interestsSpecific.isEmpty {
            tags.append(contentsOf: eventData.interestsSpecific.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) })
        }
        
        // Ensure location field is populated with specific venue information
        let location = eventData.isOnlineEvent ? "Online" : (!eventData.addressLine1.isEmpty ? eventData.addressLine1 : eventData.city)
        
        // Set capacity from spots available
        let capacity = Int(eventData.spotsAvailable) ?? 100
        
        return EventCreationRequest(
            title: eventData.title,
            description: eventData.summary,
            city: eventData.city, // Required field in database
            location: location,
            address: eventData.isOnlineEvent ? nil : eventData.addressLine1,
            date: dateFormatter.string(from: eventData.startDate),
            endDate: dateFormatter.string(from: eventData.endDate),
            category: "Community", // Default category, can be made configurable
            price: price,
            ticketType: ticketType,
            capacity: capacity,
            tags: tags,
            itinerary: itinerary.isEmpty ? nil : itinerary,
            image: eventData.eventImageURL.isEmpty ? nil : eventData.eventImageURL
        )
    }
}