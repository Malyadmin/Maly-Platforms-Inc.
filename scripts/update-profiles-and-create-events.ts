import { db } from '../db';
import { users, events } from '../db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { uploadToCloudinary } from '../server/services/cloudinaryService';
import { join } from 'path';

// Update profiles with correct vibes from the predetermined list
const profileUpdates = [
  {
    username: 'djluna',
    currentMoods: ['Party & Nightlife', 'Creative & Artsy', 'Adventure & Exploring']
  },
  {
    username: 'zara_creative',
    currentMoods: ['Fashion & Style', 'Networking & Business', 'Creative & Artsy']
  },
  {
    username: 'sophia_wellness',
    currentMoods: ['Wellness & Fitness', 'Spiritual & Intentional', 'Outdoor & Nature']
  }
];

// Event data with images
const eventsData = [
  {
    title: 'SPACIOUS - Breath Work & Spatial Audio',
    imagePath: 'attached_assets/unnamed-3_1762546259490.jpg',
    description: 'An immersive breathwork experience featuring cutting-edge spatial audio technology in the desert. Connect with your inner self surrounded by nature.',
    city: 'Mexico City',
    location: 'Rewire Lab - CDMX',
    address: 'Rewire Lab, Mexico City',
    category: 'Wellness',
    ticketType: 'free',
    price: '0',
    capacity: 50,
    availableTickets: 50,
    date: new Date('2025-01-10T19:00:00'), // This week - Friday
    tags: ['Wellness', 'Meditation', 'Sound Healing'],
    itinerary: [
      { startTime: '19:00', endTime: '19:30', description: 'Arrival and welcome circle' },
      { startTime: '19:30', endTime: '20:30', description: 'Guided breathwork session with spatial audio' },
      { startTime: '20:30', endTime: '21:00', description: 'Integration and sharing' }
    ]
  },
  {
    title: 'STAVROZ LIVE - Rocco Desentis',
    imagePath: 'attached_assets/unnamed-4_1762546259491.jpg',
    description: 'Experience the magical live performance of Stavroz, bringing their unique blend of downtempo electronica and live instrumentation. Special guest Rocco Desentis.',
    city: 'Mexico City',
    location: 'Londres 195, CDMX',
    address: 'Londres 195, Juárez, Mexico City',
    category: 'Nightlife',
    ticketType: 'rsvp',
    price: '0',
    capacity: 200,
    availableTickets: 200,
    isRsvp: true,
    requireApproval: true,
    date: new Date('2025-01-15T21:00:00'), // Next week - Wednesday
    tags: ['Music', 'Live Performance', 'Electronic'],
    itinerary: [
      { startTime: '21:00', endTime: '22:00', description: 'Doors open & welcome drinks' },
      { startTime: '22:00', endTime: '23:30', description: 'Rocco Desentis opening set' },
      { startTime: '23:30', endTime: '01:30', description: 'Stavroz Live Performance' }
    ]
  },
  {
    title: 'HAAB ART WEEK - Migrar Exhibition',
    imagePath: 'attached_assets/unnamed-5_1762546259491.jpg',
    description: 'An exclusive art week featuring contemporary Colombian artists. The "Migrar" exhibition explores themes of movement, identity, and transformation through mixed media installations. For members and guest list only.',
    city: 'Mexico City',
    location: 'Artifice Gallery - Amsterdam 255',
    address: 'Amsterdam 255, Condesa, Mexico City',
    category: 'Arts',
    ticketType: 'paid',
    price: '350',
    capacity: 100,
    availableTickets: 100,
    date: new Date('2025-02-09T15:00:00'), // Next month - Feb 9 (Friday)
    endDate: new Date('2025-02-10T22:30:00'), // Feb 10 (Saturday)
    tags: ['Art', 'Exhibition', 'Culture'],
    itinerary: [
      { startTime: '15:00', endTime: '18:00', description: 'Gallery opening & artist meet-and-greet' },
      { startTime: '18:00', endTime: '20:00', description: 'Curated talks with featured artists' },
      { startTime: '20:00', endTime: '22:30', description: 'Closing reception with live music' }
    ]
  }
];

async function updateProfilesAndCreateEvents() {
  console.log('Starting updates...\n');
  
  // Update profiles with correct vibes
  console.log('=== UPDATING PROFILES ===');
  for (const update of profileUpdates) {
    try {
      await db.update(users)
        .set({ currentMoods: update.currentMoods })
        .where(eq(users.username, update.username));
      
      console.log(`✓ Updated ${update.username} with vibes: ${update.currentMoods.join(', ')}`);
    } catch (error) {
      console.error(`Error updating ${update.username}:`, error);
    }
  }
  
  // Create events
  console.log('\n=== CREATING EVENTS ===');
  for (const event of eventsData) {
    try {
      console.log(`\nCreating event: ${event.title}...`);
      
      // Upload event image to Cloudinary
      const imagePath = join(process.cwd(), event.imagePath);
      const imageBuffer = readFileSync(imagePath);
      const filename = event.imagePath.split('/').pop() || 'event.jpg';
      
      console.log(`Uploading image...`);
      const uploadResult = await uploadToCloudinary(imageBuffer, filename, 'image');
      console.log(`Image uploaded: ${uploadResult.secure_url}`);
      
      // Get Luna's user ID (first created profile) as the creator
      const creator = await db.query.users.findFirst({
        where: eq(users.username, 'djluna')
      });
      
      if (!creator) {
        console.error('Creator not found, skipping event');
        continue;
      }
      
      // Create event in database
      const [newEvent] = await db.insert(events).values({
        title: event.title,
        description: event.description,
        city: event.city,
        location: event.location,
        address: event.address,
        date: event.date,
        endDate: event.endDate || null,
        image: uploadResult.secure_url,
        category: event.category,
        creatorId: creator.id,
        capacity: event.capacity,
        price: event.price,
        ticketType: event.ticketType as 'free' | 'paid' | 'rsvp',
        availableTickets: event.availableTickets,
        isPrivate: false,
        requireApproval: event.requireApproval || false,
        isRsvp: event.isRsvp || false,
        isBusinessEvent: false,
        tags: event.tags,
        attendingCount: 0,
        interestedCount: 0,
        itinerary: event.itinerary || []
      }).returning();
      
      console.log(`✓ Event created: ${newEvent.title} (ID: ${newEvent.id})`);
      console.log(`  Type: ${newEvent.ticketType}, Price: ${newEvent.price === '0' ? 'Free' : '$' + newEvent.price}`);
      console.log(`  Date: ${newEvent.date.toLocaleDateString()}`);
    } catch (error) {
      console.error(`Error creating event ${event.title}:`, error);
    }
  }
  
  console.log('\n✓ All updates completed successfully!');
  process.exit(0);
}

updateProfilesAndCreateEvents().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
