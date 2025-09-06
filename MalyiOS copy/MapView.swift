import SwiftUI
import MapKit

struct EventLocation: Identifiable {
    let id = UUID()
    let latitude: Double
    let longitude: Double
    let title: String
    let subtitle: String?
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var region: MKCoordinateRegion {
        MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
    }
}

struct EventMapView: View {
    let eventLocation: EventLocation
    @State private var region: MKCoordinateRegion
    
    init(eventLocation: EventLocation) {
        self.eventLocation = eventLocation
        self._region = State(initialValue: eventLocation.region)
    }
    
    var body: some View {
        Map(coordinateRegion: $region, annotationItems: [eventLocation]) { location in
            MapAnnotation(coordinate: location.coordinate) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.red)
                    .font(.title2)
            }
        }
    }
}

struct CityMapView: View {
    let cityName: String
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194), // Default to SF
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            Map(coordinateRegion: $region)
                .opacity(isLoading ? 0.6 : 1.0)
            
            if isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
                    .scaleEffect(1.2)
            }
        }
        .onAppear {
            geocodeCity()
        }
        .onChange(of: cityName) { oldValue, newValue in
            geocodeCity()
        }
    }
    
    private func geocodeCity() {
        guard !cityName.isEmpty else {
            isLoading = false
            return
        }
        
        isLoading = true
        let geocoder = CLGeocoder()
        
        geocoder.geocodeAddressString(cityName) { placemarks, error in
            DispatchQueue.main.async {
                if let placemark = placemarks?.first,
                   let location = placemark.location {
                    
                    region = MKCoordinateRegion(
                        center: location.coordinate,
                        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
                    )
                }
                isLoading = false
            }
        }
    }
}

// Commented out until Event model structure is confirmed
/*
extension Event {
    var eventLocation: EventLocation? {
        // Handle both string and double types for coordinates
        let lat: Double?
        let lon: Double?
        
        if let latString = self.latitude as? String,
           let lonString = self.longitude as? String {
            lat = Double(latString)
            lon = Double(lonString)
        } else if let latDouble = self.latitude as? Double,
                  let lonDouble = self.longitude as? Double {
            lat = latDouble
            lon = lonDouble
        } else {
            lat = nil
            lon = nil
        }
        
        guard let eventLatitude = lat,
              let eventLongitude = lon else {
            return nil
        }
        
        return EventLocation(
            latitude: eventLatitude,
            longitude: eventLongitude,
            title: title,
            subtitle: location
        )
    }
}
*/

#Preview {
    VStack {
        EventMapView(eventLocation: EventLocation(
            latitude: 37.7749,
            longitude: -122.4194,
            title: "Sample Event",
            subtitle: "San Francisco"
        ))
        .frame(height: 200)
        
        CityMapView(cityName: "San Francisco")
        .frame(height: 200)
    }
}