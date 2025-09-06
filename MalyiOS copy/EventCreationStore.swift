import Foundation
import SwiftUI

class EventCreationStore: ObservableObject {
    @Published var eventData = EventCreationData()
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isEventCreated = false
    @Published var createdEventId: Int?
    
    func updateEventTitle(_ title: String) {
        eventData.title = title
    }
    
    func updateEventTagline(_ tagline: String) {
        eventData.tagline = tagline
    }
    
    func updateEventSummary(_ summary: String) {
        eventData.summary = summary
    }
    
    func updateOnlineEvent(_ isOnline: Bool) {
        eventData.isOnlineEvent = isOnline
    }
    
    func updateCity(_ city: String) {
        eventData.city = city
    }
    
    func updateAddress(_ address: String) {
        eventData.addressLine1 = address
    }
    
    func updateStartDate(_ date: Date) {
        eventData.startDate = date
    }
    
    func updateEndDate(_ date: Date) {
        eventData.endDate = date
    }
    
    func updatePaidEvent(_ isPaid: Bool) {
        eventData.isPaidEvent = isPaid
    }
    
    func updatePrice(_ price: String) {
        eventData.price = price
    }
    
    func updateWhoShouldAttend(_ description: String) {
        eventData.whoShouldAttend = description
    }
    
    func updateEventPrivacy(_ privacy: String) {
        eventData.eventPrivacy = privacy
    }
    
    func updateSpotsAvailable(_ spots: String) {
        eventData.spotsAvailable = spots
    }
    
    func updateEventImage(_ imageURL: String) {
        eventData.eventImageURL = imageURL
        print("📸 Event image URL updated: \(imageURL)")
    }
    
    func updateEventImages(_ imageURLs: [String]) {
        eventData.imageURLs = imageURLs
        // Update the main event image URL to be the first image
        if let firstImageURL = imageURLs.first {
            eventData.eventImageURL = firstImageURL
        }
        print("📸 Event images updated: \(imageURLs.count) images")
    }
    
    func updateEventVideos(_ videoURLs: [String]) {
        eventData.videoURLs = videoURLs
        print("📹 Event videos updated: \(videoURLs.count) videos")
    }
    
    func createEvent(sessionId: String) async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        // Log the event data being submitted
        print("📋 Event Data Summary:")
        print("   Title: \(eventData.title)")
        print("   Date: \(eventData.startDate)")
        print("   City: \(eventData.city)")
        print("   Price: \(eventData.price)")
        print("   Paid Event: \(eventData.isPaidEvent)")
        
        do {
            let response = try await EventCreationService.shared.createEvent(
                eventData: eventData,
                sessionId: sessionId
            )
            
            await MainActor.run {
                isLoading = false
                isEventCreated = true
                createdEventId = response.id
                print("✅ Event created successfully with ID: \(response.id)")
            }
        } catch let error as APIError {
            await MainActor.run {
                isLoading = false
                errorMessage = error.message
                print("❌ Event creation failed: \(error.message)")
            }
        } catch {
            await MainActor.run {
                isLoading = false
                errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
                print("❌ Unexpected error: \(error)")
            }
        }
    }
    
    func resetEventData() {
        eventData = EventCreationData()
        isEventCreated = false
        createdEventId = nil
        errorMessage = nil
    }
}