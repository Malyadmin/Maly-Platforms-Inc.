import { db } from '../db';
import { users } from '../db/schema';
import { readFileSync } from 'fs';
import { uploadToCloudinary } from '../server/services/cloudinaryService';
import { join } from 'path';

const hashedPassword = 'ee79976c9380d5e337fc1c095ece8c8f22f91f306ceeb161fa51fecede2c4ba1';

const profilesData = [
  {
    username: 'djluna',
    email: 'djluna@maly.app',
    fullName: 'Luna Martinez',
    imagePath: 'attached_assets/unnamed_1762546093373.png',
    profileType: 'member',
    gender: 'female',
    bio: 'Music is my life. I spin tracks that move souls and create vibes that bring people together.',
    profession: 'DJ & Music Producer',
    age: 28,
    location: 'Mexico City',
    birthLocation: 'Barcelona',
    livedLocation: 'Ibiza, Berlin, Amsterdam',
    nextLocation: 'Tokyo',
    phoneNumber: '+52 555 1234 567',
    intention: 'social, networking',
    interests: ['Electronic Music', 'Nightlife', 'Music Production', 'Travel', 'Art'],
    currentMoods: ['Energetic', 'Creative', 'Social'],
    preferredLanguage: 'en'
  },
  {
    username: 'zara_creative',
    email: 'zara@maly.app',
    fullName: 'Zara Thompson',
    imagePath: 'attached_assets/unnamed_1762546098531.jpg',
    profileType: 'member',
    gender: 'female',
    bio: 'Fashion designer and creative director. I believe in expressing yourself through style and art.',
    profession: 'Fashion Designer',
    age: 26,
    location: 'New York',
    birthLocation: 'London',
    livedLocation: 'Paris, Milan',
    nextLocation: 'Los Angeles',
    phoneNumber: '+1 212 555 9876',
    intention: 'networking, friends',
    interests: ['Fashion', 'Photography', 'Art', 'Design', 'Culture'],
    currentMoods: ['Inspired', 'Focused', 'Adventurous'],
    preferredLanguage: 'en'
  },
  {
    username: 'sophia_wellness',
    email: 'sophia@maly.app',
    fullName: 'Sophia Chen',
    imagePath: 'attached_assets/unnamed-2_1762546102729.jpg',
    profileType: 'member',
    gender: 'female',
    bio: 'Yoga instructor and wellness coach helping people find balance and inner peace.',
    profession: 'Wellness Coach',
    age: 30,
    location: 'San Francisco',
    birthLocation: 'Singapore',
    livedLocation: 'Bali, Hong Kong',
    nextLocation: 'Costa Rica',
    phoneNumber: '+1 415 555 3210',
    intention: 'friends, social',
    interests: ['Yoga', 'Meditation', 'Health', 'Nature', 'Mindfulness'],
    currentMoods: ['Peaceful', 'Balanced', 'Open'],
    preferredLanguage: 'en'
  }
];

async function createProfiles() {
  console.log('Starting profile creation...');
  
  for (const profile of profilesData) {
    try {
      console.log(`\nCreating profile for ${profile.username}...`);
      
      // Read the image file
      const imagePath = join(process.cwd(), profile.imagePath);
      const imageBuffer = readFileSync(imagePath);
      const filename = profile.imagePath.split('/').pop() || 'image.jpg';
      
      // Upload to Cloudinary
      console.log(`Uploading image for ${profile.username}...`);
      const uploadResult = await uploadToCloudinary(imageBuffer, filename, 'image');
      console.log(`Image uploaded: ${uploadResult.secure_url}`);
      
      // Create user in database
      console.log(`Inserting user ${profile.username} into database...`);
      const [newUser] = await db.insert(users).values({
        username: profile.username,
        email: profile.email,
        password: hashedPassword,
        fullName: profile.fullName,
        profileImage: uploadResult.secure_url,
        profileType: profile.profileType,
        gender: profile.gender,
        bio: profile.bio,
        profession: profile.profession,
        age: profile.age,
        location: profile.location,
        birthLocation: profile.birthLocation,
        livedLocation: profile.livedLocation,
        nextLocation: profile.nextLocation,
        phoneNumber: profile.phoneNumber,
        intention: profile.intention,
        interests: profile.interests,
        currentMoods: profile.currentMoods,
        preferredLanguage: profile.preferredLanguage,
        isPremium: false,
        isAdmin: false
      }).returning();
      
      console.log(`✓ Profile created for ${profile.username} (ID: ${newUser.id})`);
    } catch (error) {
      console.error(`Error creating profile for ${profile.username}:`, error);
    }
  }
  
  console.log('\n✓ All profiles created successfully!');
  process.exit(0);
}

createProfiles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
