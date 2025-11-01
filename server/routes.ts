import express, { Request, Response, Express, NextFunction } from 'express';
import { createServer, Server } from 'http';
import path from 'path';
import { setupAuth } from './auth';
import { handleChatMessage } from './chat';
import { findMatches } from './services/matchingService';
import { translateMessage } from './services/translationService';
import { getEventImage } from './services/eventsService';
import { getCoordinates } from './services/mapboxService';
import { WebSocketServer, WebSocket } from 'ws';
import { sendMessage, getConversations, getMessages, markMessageAsRead, markAllMessagesAsRead, getOrCreateEventGroupChat, addUserToEventGroupChat, sendMessageToConversation, getConversationMessages, getOrCreateDirectConversation, markConversationAsRead } from './services/messagingService';
import { db } from "../db";
import { userCities, users, events, userConnections, eventParticipants, payments, subscriptions, ticketTiers } from "../db/schema";
import { eq, ne, gte, lte, and, or, desc, inArray } from "drizzle-orm";
import { stripe } from './lib/stripe';
import Stripe from 'stripe';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { isNotNull } from "drizzle-orm";
import { recordSubscriptionPayment, getUserPaymentHistory, getSubscriptionWithPayments, getPaymentStats } from "./lib/payments";
import { sql } from 'drizzle-orm';
// Import premium router and AI router
import premiumRouter from './premium';
import aiRouter from './ai';
// Import Stripe Connect functions
import { 
  createConnectAccount, 
  createAccountLink, 
  getAccountStatus, 
  handleConnectWebhook, 
  validateEventCreatorForPayment, 
  calculateApplicationFee,
  verifyAccount 
} from './stripeConnect';
// Import object storage utilities
import { uploadToObjectStorage } from './lib/objectStorage';
// Import consolidated upload middleware
import { uploadImage, uploadImageAndVideo } from './middleware/upload';
// Import cloudinary service
import { uploadToCloudinary, uploadMultipleToCloudinary } from './services/cloudinaryService';
// Import referral service
import { generateReferralCode, recordReferral, buildShareUrl, getShareMessage } from './services/referralService';
// Import JWT authentication middleware
import { verifyToken, verifyTokenOptional } from './middleware/jwtAuth';
// Import admin authentication middleware
import { requireAdmin } from './middleware/adminAuth';
// Import validation schemas
import { createEventSchema, updateEventSchema, createMessageSchema, paginationSchema, userBrowseSchema, makeAdminSchema, ticketTierSchema } from './validation/schemas';

const categories = [
  "Retail",
  "Fashion",
  "Social",
  "Cultural",
  "Sports",
  "Dining",
  "Festivals",
  "Professional"
];

// Update the MOCK_USERS object in routes.ts to use the new profile image
const MOCK_USERS = {
  "Mexico City": [
    {
      id: 1009,
      username: "lucahudek",
      fullName: "Luca Hudek",
      age: 32,
      gender: "male",
      profession: "Digital Nomad Platform Creator",
      location: "Mexico City",
      bio: "Creator and digital nomad connecting professionals globally through intelligent communication tools and AI-powered city exploration.",
      interests: ["Digital Marketing", "Software Development", "Remote Work", "Travel", "Photography"],
      currentMoods: ["Creating", "Networking", "Teaching"],
      profileImage: "/attached_assets/Screenshot 2025-03-04 at 11.21.13 PM.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventsHosting: [1013],
      featuredEvent: {
        id: 1013,
        title: "Octo Designer Sunglasses Pop-Up Launch Party",
        role: "Host & Brand Strategist"
      }
    },
    {
      id: 1010,
      username: "maria_design",
      fullName: "Maria Torres",
      profileImage: "/attached_assets/profile-image-1.jpg"
    },
    {
      id: 1011,
      username: "james_photo",
      fullName: "James Chen",
      profileImage: "/attached_assets/profile-image-2.jpg"
    },
    {
      id: 1012,
      username: "sara_creative",
      fullName: "Sara Johnson",
      profileImage: "/attached_assets/profile-image-3.jpg"
    },
    {
      id: 1013,
      username: "david_tech",
      fullName: "David Kim",
      profileImage: "/attached_assets/profile-image-4.jpg"
    }
  ]
};

// Update events to include prices
const newEvents = {
  "Mexico City": [
    {
      id: 1013,
      title: "Octo Designer Sunglasses Pop-Up Launch Party",
      description: "Join us for an exclusive launch party celebrating Octo's latest collection of designer sunglasses. Experience the perfect fusion of style and sophistication in an intimate setting. Meet the designers behind the brand, enjoy curated cocktails, and be among the first to preview and purchase from this cutting-edge collection.\n\nSpecial features include:\n• First access to limited edition pieces\n• Live DJ sets\n• Signature cocktails\n• Professional styling sessions\n• Photo opportunities\n• Exclusive launch day discounts",
      date: new Date(2025, 2, 20, 19, 0),
      location: "Mexico City",
      category: "Retail",
      image: "/attached_assets/Screenshot 2025-03-04 at 10.37.43 PM.png",
      capacity: 100,
      price: "75",
      createdAt: new Date(),
      interestedCount: 42,
      attendingCount: 15,
      tags: ["Retail", "Fashion", "Launch Party", "Luxury"],
      creatorId: 1009,
      creatorName: "Alexander Reeves",
      creatorImage: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png",
      attendingUsers: [
        {
          id: 1010,
          name: "Maria Torres",
          image: "/attached_assets/profile-image-1.jpg"
        },
        {
          id: 1011,
          name: "James Chen",
          image: "/attached_assets/profile-image-2.jpg"
        },
        {
          id: 1012,
          name: "Sara Johnson",
          image: "/attached_assets/profile-image-3.jpg"
        }
      ],
      interestedUsers: [
        {
          id: 1013,
          name: "David Kim",
          image: "/attached_assets/profile-image-4.jpg"
        },
        {
          id: 1014,
          name: "Lisa Park",
          image: "/attached_assets/profile-image-5.jpg"
        }
      ]
    },
    {
      id: 1012,
      title: "Pargot Restaurant Couples Food & Wine Pairing",
      description: "Experience an intimate evening of culinary excellence at Pargot Restaurant. This exclusive couples' event features a meticulously crafted six-course tasting menu paired with premium wines from around the world. Each dish is artfully prepared with locally-sourced ingredients and edible flowers, creating a feast for both the eyes and palate. Our expert sommelier will guide you through each pairing, explaining the unique characteristics that make each combination extraordinary.\n\nPerfect for date night or special celebrations, this intimate dining experience is limited to 12 couples to ensure personalized attention and an unforgettable evening.",
      date: new Date(2025, 2, 15, 19, 30),
      location: "Mexico City",
      category: "Dining",
      image: "/attached_assets/Screenshot 2025-03-04 at 10.35.46 PM.png",
      capacity: 24,
      price: "195",
      createdAt: new Date(),
      interestedCount: 18,
      attendingCount: 6,
      tags: ["Food & Wine", "Date Night", "Fine Dining", "Couples"],
      creatorId: 1010,
      creatorName: "Maria Torres",
      creatorImage: "/attached_assets/profile-image-1.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" }
      ],
      interestedUsers: [
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" }
      ]
    },
    {
      id: 1001,
      title: "Blanco Yoga Beachside Retreat",
      description: "Experience tranquility at our exclusive beachside yoga retreat in Blanco. Join us for a transformative session combining traditional yoga practices with panoramic ocean views. Perfect for all skill levels, this retreat offers a unique blend of mindfulness and natural beauty.",
      date: new Date(),
      location: "Mexico City",
      category: "Sports",
      image: "/attached_assets/7358939e-2913-4b8f-a310-769736b37cba.jpg",
      capacity: 20,
      price: "595",
      createdAt: new Date(),
      interestedCount: 28,
      attendingCount: 10,
      interestedUsers: [
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" }
      ],
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" }
      ],
      tags: ["Yoga", "Retreat", "Wellness", "Beach"]
    },
    {
      id: 1002,
      title: "Contemporary Mexican Art Exhibition",
      description: "Explore the vibrant world of contemporary Mexican artists at this exclusive gallery exhibition. Features works from emerging local talents.",
      date: new Date(),
      location: "Mexico City",
      category: "Cultural",
      image: "/attached_assets/art-gallery-event-stockcake.jpg",
      capacity: 50,
      price: "10",
      createdAt: new Date(),
      interestedCount: 25,
      attendingCount: 12,
      tags: ["Art", "Culture", "Exhibition"],
      creatorId: 1012,
      creatorName: "Sara Johnson",
      creatorImage: "/attached_assets/profile-image-3.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" }
      ],
      interestedUsers: [
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" }
      ]
    },
    {
      id: 1004,
      title: "Intimate Expat Rooftop Dinner Experience",
      description: "Join us for an intimate dinner featuring seasonal ingredients and spectacular city views. Includes wine pairing and chef's introduction.",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: "Mexico City",
      category: "Social",
      image: "/attached_assets/images-2.jpg",
      capacity: 30,
      price: "55",
      createdAt: new Date(),
      interestedCount: 42,
      attendingCount: 18,
      tags: ["Dinner", "Rooftop", "Social", "Expats"],
      creatorId: 1011,
      creatorName: "James Chen",
      creatorImage: "/attached_assets/profile-image-2.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" },
        { id: 1024, name: "Ashley Green", image: "/attached_assets/profile-image-15.jpg" },
        { id: 1025, name: "William White", image: "/attached_assets/profile-image-16.jpg" },
        { id: 1026, name: "Amanda Black", image: "/attached_assets/profile-image-17.jpg" },
        { id: 1027, name: "Brian Brown", image: "/attached_assets/profile-image-18.jpg" }
      ],
      interestedUsers: [
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" }
      ]
    },
    {
      id: 1005,
      title: "Desierto de los Leones Hiking Adventure",
      description: "Explore the historic Desierto de los Leones National Park on this guided hiking tour. Perfect for nature enthusiasts and photography lovers.",
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      location: "Mexico City",
      category: "Sports",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop&q=80",
      capacity: 15,
      price: "45",
      createdAt: new Date(),
      interestedCount: 19,
      attendingCount: 8,
      tags: ["Hiking", "Nature", "Outdoors"],
      creatorId: 1013,
      creatorName: "David Kim",
      creatorImage: "/attached_assets/profile-image-4.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" }
      ],
      interestedUsers: [
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" }
      ]
    },
    {
      id: 1006,
      title: "Nocturnal Rhythms: Adam Ten & Carlita",
      description: "Experience an unforgettable night of melodic house and techno with internationally acclaimed artists Adam Ten and Carlita. Set in an exclusive venue with state-of-the-art sound system and immersive lighting design.",
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      location: "Mexico City",
      category: "Social",
      image: "/attached_assets/32440f72b6e2c1d310393fbfd13df870b2fffccb.webp",
      capacity: 400,
      price: "75",
      createdAt: new Date(),
      interestedCount: 289,
      attendingCount: 150,
      tags: ["Music", "Techno", "House", "Nightlife"],
      creatorId: 1014,
      creatorName: "Lisa Park",
      creatorImage: "/attached_assets/profile-image-5.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" },
        { id: 1024, name: "Ashley Green", image: "/attached_assets/profile-image-15.jpg" },
        { id: 1025, name: "William White", image: "/attached_assets/profile-image-16.jpg" },
        { id: 1026, name: "Amanda Black", image: "/attached_assets/profile-image-17.jpg" },
        { id: 1027, name: "Brian Brown", image: "/attached_assets/profile-image-18.jpg" },
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" },
        { id: 1029, name: "Christopher Black", image: "/attached_assets/profile-image-20.jpg" },
        { id: 1030, name: "Angela White", image: "/attached_assets/profile-image-21.jpg" },
        { id: 1031, name: "David Lee", image: "/attached_assets/profile-image-22.jpg" },
        { id: 1032, name: "Jessica Green", image: "/attached_assets/profile-image-23.jpg" },
        { id: 1033, name: "William Brown", image: "/attached_assets/profile-image-24.jpg" },
        { id: 1034, name: "Amanda Jones", image: "/attached_assets/profile-image-25.jpg" },
        { id: 1035, name: "Brian White", image: "/attached_assets/profile-image-26.jpg" },
        { id: 1036, name: "Sarah Black", image: "/attached_assets/profile-image-27.jpg" },
        { id: 1037, name: "Christopher Green", image: "/attached_assets/profile-image-28.jpg" },
        { id: 1038, name: "Angela Brown", image: "/attached_assets/profile-image-29.jpg" },
        { id: 1039, name: "David White", image: "/attached_assets/profile-image-30.jpg" },
        { id: 1040, name: "Jessica Lee", image: "/attached_assets/profile-image-31.jpg" },
        { id: 1041, name: "William Black", image: "/attached_assets/profile-image-32.jpg" },
        { id: 1042, name: "Amanda Green", image: "/attached_assets/profile-image-33.jpg" },
        { id: 1043, name: "Brian Jones", image: "/attached_assets/profile-image-34.jpg" },
        { id: 1044, name: "Sarah Brown", image: "/attached_assets/profile-image-35.jpg" },
        { id: 1045, name: "Christopher White", image: "/attached_assets/profile-image-36.jpg" },
        { id: 1046, name: "Angela Lee", image: "/attached_assets/profile-image-37.jpg" },
        { id: 1047, name: "David Black", image: "/attached_assets/profile-image-38.jpg" },
        { id: 1048, name: "Jessica Jones", image: "/attached_assets/profile-image-39.jpg" },
        { id: 1049, name: "William Green", image: "/attached_assets/profile-image-40.jpg" },
        { id: 1050, name: "Amanda Brown", image: "/attached_assets/profile-image-41.jpg" }
      ],
      interestedUsers: [
        { id: 1051, name: "Robert White", image: "/attached_assets/profile-image-42.jpg" }
      ]
    },
    {
      id: 1007,
      title: "Zona Maco: Ancient Balloon Ride + Downtiempo DJs",
      description: "Experience the magic of ancient Mexico with hot air balloon rides over the pyramids and hacienda decompression. A unique cultural fundraiser featuring performances by Anastascia, Britta Arnold, Jose Noventa, and more. Join us for this extraordinary blend of adventure and culture.",
      date: new Date(2025, 1, 9),
      location: "Mexico City",
      category: "Cultural",
      image: "/attached_assets/b077eac1-ce55-495c-93ce-ba6dbfe5178f.jpg",
      capacity: 200,
      price: "150",
      createdAt: new Date(),
      interestedCount: 156,
      attendingCount: 75,
      tags: ["Nightlife", "Music", "Cultural", "Excursion"],
      creatorId: 1015,
      creatorName: "John Smith",
      creatorImage: "/attached_assets/profile-image-6.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" },
        { id: 1024, name: "Ashley Green", image: "/attached_assets/profile-image-15.jpg" },
        { id: 1025, name: "William White", image: "/attached_assets/profile-image-16.jpg" },
        { id: 1026, name: "Amanda Black", image: "/attached_assets/profile-image-17.jpg" },
        { id: 1027, name: "Brian Brown", image: "/attached_assets/profile-image-18.jpg" },
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" },
        { id: 1029, name: "Christopher Black", image: "/attached_assets/profile-image-20.jpg" },
        { id: 1030, name: "Angela White", image: "/attached_assets/profile-image-21.jpg" },
        { id: 1031, name: "David Lee", image: "/attached_assets/profile-image-22.jpg" },
        { id: 1032, name: "Jessica Green", image: "/attached_assets/profile-image-23.jpg" },
        { id: 1033, name: "William Brown", image: "/attached_assets/profile-image-24.jpg" },
        { id: 1034, name: "Amanda Jones", image: "/attached_assets/profile-image-25.jpg" },
        { id: 1035, name: "Brian White", image: "/attached_assets/profile-image-26.jpg" },
        { id: 1036, name: "Sarah Black", image: "/attached_assets/profile-image-27.jpg" },
        { id: 1037, name: "Christopher Green", image: "/attached_assets/profile-image-28.jpg" },
        { id: 1038, name: "Angela Brown", image: "/attached_assets/profile-image-29.jpg" },
        { id: 1039, name: "David White", image: "/attached_assets/profile-image-30.jpg" },
        { id: 1040, name: "Jessica Lee", image: "/attached_assets/profile-image-31.jpg" },
        { id: 1041, name: "William Black", image: "/attached_assets/profile-image-32.jpg" },
        { id: 1042, name: "Amanda Green", image: "/attached_assets/profile-image-33.jpg" },
        { id: 1043, name: "Brian Jones", image: "/attached_assets/profile-image-34.jpg" },
        { id: 1044, name: "Sarah Brown", image: "/attached_assets/profile-image-35.jpg" },
        { id: 1045, name: "Christopher White", image: "/attached_assets/profile-image-36.jpg" },
        { id: 1046, name: "Angela Lee", image: "/attached_assets/profile-image-37.jpg" },
        { id: 1047, name: "David Black", image: "/attached_assets/profile-image-38.jpg" },
        { id: 1048, name: "Jessica Jones", image: "/attached_assets/profile-image-39.jpg" },
        { id: 1049, name: "William Green", image: "/attached_assets/profile-image-40.jpg" },
        { id: 1050, name: "Amanda Brown", image: "/attached_assets/profile-image-41.jpg" },
        { id: 1051, name: "Robert White", image: "/attached_assets/profile-image-42.jpg" },
        { id: 1052, name: "Ashley Black", image: "/attached_assets/profile-image-43.jpg" },
        { id: 1053, name: "William Jones", image: "/attached_assets/profile-image-44.jpg" },
        { id: 1054, name: "Amanda White", image: "/attached_assets/profile-image-45.jpg" },
        { id: 1055, name: "Brian Lee", image: "/attached_assets/profile-image-46.jpg" },
        { id: 1056, name: "Sarah Jones", image: "/attached_assets/profile-image-47.jpg" },
        { id: 1057, name: "Christopher Brown", image: "/attached_assets/profile-image-48.jpg" },
        { id: 1058, name: "Angela Green", image: "/attached_assets/profile-image-49.jpg" },
        { id: 1059, name: "David Jones", image: "/attached_assets/profile-image-50.jpg" },
        { id: 1060, name: "Jessica Black", image: "/attached_assets/profile-image-51.jpg" }
      ],
      interestedUsers: [
        { id: 1061, name: "Robert Green", image: "/attached_assets/profile-image-52.jpg" }
      ]
    },
    {
      id: 1008,
      title: "Zona MACO: Giggling Artweek",
      description: "Join us for a vibrant celebration of contemporary art in Mexico City. This exclusive artweek event brings together local and international artists for an unforgettable showcase of creativity and expression.",
      date: new Date(2025, 1, 8),
      location: "Mexico City",
      category: "Cultural",
      image: "/attached_assets/3a3e6886-307d-4eaf-b670-ad1662be61db.jpg",
      capacity: 150,
      price: "85",
      createdAt: new Date(),
      interestedCount: 92,
      attendingCount: 46,
      tags: ["Nightlife", "Cultural", "Art", "Excursion"],
      creatorId: 1016,
      creatorName: "Jane Doe",
      creatorImage: "/attached_assets/profile-image-7.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" },
        { id: 1024, name: "Ashley Green", image: "/attached_assets/profile-image-15.jpg" },
        { id: 1025, name: "William White", image: "/attached_assets/profile-image-16.jpg" },
        { id: 1026, name: "Amanda Black", image: "/attached_assets/profile-image-17.jpg" },
        { id: 1027, name: "Brian Brown", image: "/attached_assets/profile-image-18.jpg" },
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" },
        { id: 1029, name: "Christopher Black", image: "/attached_assets/profile-image-20.jpg" },
        { id: 1030, name: "Angela White", image: "/attached_assets/profile-image-21.jpg" },
        { id: 1031, name: "David Lee", image: "/attached_assets/profile-image-22.jpg" },
        { id: 1032, name: "Jessica Green", image: "/attached_assets/profile-image-23.jpg" },
        { id: 1033, name: "William Brown", image: "/attached_assets/profile-image-24.jpg" },
        { id: 1034, name: "Amanda Jones", image: "/attached_assets/profile-image-25.jpg" },
        { id: 1035, name: "Brian White", image: "/attached_assets/profile-image-26.jpg" },
        { id: 1036, name: "Sarah Black", image: "/attached_assets/profile-image-27.jpg" },
        { id: 1037, name: "Christopher Green", image: "/attached_assets/profile-image-28.jpg" },
        { id: 1038, name: "Angela Brown", image: "/attached_assets/profile-image-29.jpg" },
        { id: 1039, name: "David White", image: "/attached_assets/profile-image-30.jpg" },
        { id: 1040, name: "Jessica Lee", image: "/attached_assets/profile-image-31.jpg" },
        { id: 1041, name: "William Black", image: "/attached_assets/profile-image-32.jpg" },
        { id: 1042, name: "Amanda Green", image: "/attached_assets/profile-image-33.jpg" },
        { id: 1043, name: "Brian Jones", image: "/attached_assets/profile-image-34.jpg" },
        { id: 1044, name: "Sarah Brown", image: "/attached_assets/profile-image-35.jpg" },
        { id: 1045, name: "Christopher White", image: "/attached_assets/profile-image-36.jpg" },
        { id: 1046, name: "Angela Lee", image: "/attached_assets/profile-image-37.jpg" },
        { id: 1047, name: "David Black", image: "/attached_assets/profile-image-38.jpg" },
        { id: 1048, name: "Jessica Jones", image: "/attached_assets/profile-image-39.jpg" },
        { id: 1049, name: "William Green", image: "/attached_assets/profile-image-40.jpg" },
        { id: 1050, name: "Amanda Brown", image: "/attached_assets/profile-image-41.jpg" }
      ],
      interestedUsers: [
        { id: 1061, name: "Robert Green", image: "/attached_assets/profile-image-52.jpg" },
        { id: 1062, name: "Ashley Jones", image: "/attached_assets/profile-image-53.jpg" }
      ]
    },
    {
      id: 1009,
      title: "Surreal Festival",
      description: "Experience a surreal journey in the breathtaking Valle de Bravo. A two-day immersive festival that blends art, music, and nature in a unique mountain setting. Get your full pass now and be part of this extraordinary event that pushes the boundaries of reality and imagination.",
      date: new Date(2025, 4, 2),
      location: "Mexico City",
      category: "Festivals",
      image: "/attached_assets/Screenshot 2025-03-06 at 11.00.33 AM.png",
      capacity: 500,
      price: "200",
      createdAt: new Date(),
      interestedCount: 324,
      attendingCount: 162,
      tags: ["Music", "Art", "Nature"],
      creatorId: 1017,
      creatorName: "Peter Jones",
      creatorImage: "/attached_assets/profile-image-8.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1019, name: "Mike Davis", image: "/attached_assets/profile-image-10.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" },
        { id: 1024, name: "Ashley Green", image: "/attached_assets/profile-image-15.jpg" },
        { id: 1025, name: "William White", image: "/attached_assets/profile-image-16.jpg" },
        { id: 1026, name: "Amanda Black", image: "/attached_assets/profile-image-17.jpg" },
        { id: 1027, name: "Brian Brown", image: "/attached_assets/profile-image-18.jpg" },
        { id: 1028, name: "Sarah White", image: "/attached_assets/profile-image-19.jpg" },
        { id: 1029, name: "Christopher Black", image: "/attached_assets/profile-image-20.jpg" },
        { id: 1030, name: "Angela White", image: "/attached_assets/profile-image-21.jpg" },
        { id: 1031, name: "David Lee", image: "/attached_assets/profile-image-22.jpg" },
        { id: 1032, name: "Jessica Green", image: "/attached_assets/profile-image-23.jpg" },
        { id: 1033, name: "William Brown", image: "/attached_assets/profile-image-24.jpg" },
        { id: 1034, name: "Amanda Jones", image: "/attached_assets/profile-image-25.jpg" },
        { id: 1035, name: "Brian White", image: "/attached_assets/profile-image-26.jpg" },
        { id: 1036, name: "Sarah Black", image: "/attached_assets/profile-image-27.jpg" },
        { id: 1037, name: "Christopher Green", image: "/attached_assets/profile-image-28.jpg" },
        { id: 1038, name: "Angela Brown", image: "/attached_assets/profile-image-29.jpg" },
        { id: 1039, name: "David White", image: "/attached_assets/profile-image-30.jpg" },
        { id: 1040, name: "Jessica Lee", image: "/attached_assets/profile-image-31.jpg" },
        { id: 1041, name: "William Black", image: "/attached_assets/profile-image-32.jpg" },
        { id: 1042, name: "Amanda Green", image: "/attached_assets/profile-image-33.jpg" },
        { id: 1043, name: "Brian Jones", image: "/attached_assets/profile-image-34.jpg" },
        { id: 1044, name: "Sarah Brown", image: "/attached_assets/profile-image-35.jpg" },
        { id: 1045, name: "Christopher White", image: "/attached_assets/profile-image-36.jpg" },
        { id: 1046, name: "Angela Lee", image: "/attached_assets/profile-image-37.jpg" },
        { id: 1047, name: "David Black", image: "/attached_assets/profile-image-38.jpg" },
        { id: 1048, name: "Jessica Jones", image: "/attached_assets/profile-image-39.jpg" },
        { id: 1049, name: "William Green", image: "/attached_assets/profile-image-40.jpg" },
        { id: 1050, name: "Amanda Brown", image: "/attached_assets/profile-image-41.jpg" },
        { id: 1051, name: "Robert White", image: "/attached_assets/profile-image-42.jpg" },
        { id: 1052, name: "Ashley Black", image: "/attached_assets/profile-image-43.jpg" },
        { id: 1053, name: "William Jones", image: "/attached_assets/profile-image-44.jpg" },
        { id: 1054, name: "Amanda White", image: "/attached_assets/profile-image-45.jpg" },
        { id: 1055, name: "Brian Lee", image: "/attached_assets/profile-image-46.jpg" },
        { id: 1056, name: "Sarah Jones", image: "/attached_assets/profile-image-47.jpg" },
        { id: 1057, name: "Christopher Brown", image: "/attached_assets/profile-image-48.jpg" },
        { id: 1058, name: "Angela Green", image: "/attached_assets/profile-image-49.jpg" },
        { id: 1059, name: "David Jones", image: "/attached_assets/profile-image-50.jpg" },
        { id: 1060, name: "Jessica Black", image: "/attached_assets/profile-image-51.jpg" },
        { id: 1061, name: "Robert Green", image: "/attached_assets/profile-image-52.jpg" },
        { id: 1062, name: "Ashley Jones", image: "/attached_assets/profile-image-53.jpg" },
        { id: 1063, name: "William Brown", image: "/attached_assets/profile-image-54.jpg" },
        { id: 1064, name: "Amanda Lee", image: "/attached_assets/profile-image-55.jpg" },
        { id: 1065, name: "Brian Black", image: "/attached_assets/profile-image-56.jpg" },
        { id: 1066, name: "Sarah Green", image: "/attached_assets/profile-image-57.jpg" },
        { id: 1067, name: "Christopher Jones", image: "/attached_assets/profile-image-58.jpg" },
        { id: 1068, name: "Angela Brown", image: "/attached_assets/profile-image-59.jpg" },
        { id: 1069, name: "David Green", image: "/attached_assets/profile-image-60.jpg" },
        { id: 1070, name: "Jessica Jones", image: "/attached_assets/profile-image-61.jpg" },
        { id: 1071, name: "William White", image: "/attached_assets/profile-image-62.jpg" },
        { id: 1072, name: "Amanda Black", image: "/attached_assets/profile-image-63.jpg" },
        { id: 1073, name: "Brian Lee", image: "/attached_assets/profile-image-64.jpg" },
        { id: 1074, name: "Sarah Jones", image: "/attached_assets/profile-image-65.jpg" },
        { id: 1075, name: "Christopher Brown", image: "/attached_assets/profile-image-66.jpg" },
        { id: 1076, name: "Angela Green", image: "/attached_assets/profile-image-67.jpg" },
        { id: 1077, name: "David Jones", image: "/attached_assets/profile-image-68.jpg" },
        { id: 1078, name: "Jessica Black", image: "/attached_assets/profile-image-69.jpg" },
        { id: 1079, name: "Robert Green", image: "/attached_assets/profile-image-70.jpg" },
        { id: 1080, name: "Ashley Jones", image: "/attached_assets/profile-image-71.jpg" }
      ],
      interestedUsers: [
        { id: 1081, name: "Robert Brown", image: "/attached_assets/profile-image-72.jpg" }
      ]
    },
    {
      id: 1010,
      title: "Oaxacan Cooking Class with Chef Colibri",
      description: "Join Chef Colibri for an intimate Oaxacan cooking masterclass where you'll learn the secrets of traditional Mexican cuisine. Master the art of making authentic mole, handmade tortillas, and other regional specialties. This hands-on experience includes a shared dining experience of your creations paired with selected Mexican wines.",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: "Mexico City",
      category: "Cultural",
      image: "/attached_assets/1670001512622.webp",
      capacity: 12,
      price: "60",
      createdAt: new Date(),
      interestedCount: 42,
      attendingCount: 10,
      tags: ["Cooking", "Culture", "Food & Wine"],
      creatorId: 1018,
      creatorName: "Susan Brown",
      creatorImage: "/attached_assets/profile-image-9.jpg",
      attendingUsers: [
        { id: 1009, name: "Alexander Reeves", image: "/attached_assets/Screenshot 2024-03-06 at 12.19.10 PM.png" },
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1011, name: "James Chen", image: "/attached_assets/profile-image-2.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1013, name: "David Kim", image: "/attached_assets/profile-image-4.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1015, name: "John Smith", image: "/attached_assets/profile-image-6.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1017, name: "Peter Jones", image: "/attached_assets/profile-image-8.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" }
      ],
      interestedUsers: [
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" }
      ]
    },
    {
      id: 1011,
      title: "Female Padel Meetup Mexico City",
      description: "Join fellow female padel enthusiasts for an exciting meetup at our premium courts. Whether you're a beginner or experienced player, come enjoy a day of padel, socializing, and making new connections. Equipment rental available on site.",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      location: "Mexico City",
      category: "Sports",
      image: "/attached_assets/d3b6f0d009480e788baf989059d03ccf_grande.webp",
      capacity: 25,
      price: "35",
      createdAt: new Date(),
      interestedCount: 18,
      attendingCount: 7,
      tags: ["Sports", "Outdoors", "Social"],
      creatorId: 1019,
      creatorName: "Mike Davis",
      creatorImage: "/attached_assets/profile-image-10.jpg",
      attendingUsers: [
        { id: 1010, name: "Maria Torres", image: "/attached_assets/profile-image-1.jpg" },
        { id: 1012, name: "Sara Johnson", image: "/attached_assets/profile-image-3.jpg" },
        { id: 1014, name: "Lisa Park", image: "/attached_assets/profile-image-5.jpg" },
        { id: 1016, name: "Jane Doe", image: "/attached_assets/profile-image-7.jpg" },
        { id: 1018, name: "Susan Brown", image: "/attached_assets/profile-image-9.jpg" },
        { id: 1020, name: "Emily Wilson", image: "/attached_assets/profile-image-11.jpg" },
        { id: 1022, name: "Jessica Brown", image: "/attached_assets/profile-image-13.jpg" }
      ],
      interestedUsers: [
        { id: 1021, name: "Kevin Garcia", image: "/attached_assets/profile-image-12.jpg" },
        { id: 1023, name: "Robert Lee", image: "/attached_assets/profile-image-14.jpg" }
      ]
    }
  ]
};

// Add attending and interested users to all events
Object.values(newEvents).forEach(cityEvents => {
  cityEvents.forEach(event => {
    if (!event.attendingUsers) {
      event.attendingUsers = [
        {
          id: 1010,
          name: "Maria Torres",
          image: "/attached_assets/profile-image-1.jpg"
        },
        {
          id: 1011,
          name: "James Chen",
          image: "/attached_assets/profile-image-2.jpg"
        }
      ];
    }
    if (!event.interestedUsers) {
      event.interestedUsers = [
        {
          id: 1012,
          name: "Sara Johnson",
          image: "/attached_assets/profile-image-3.jpg"
        }
      ];
    }
    if (!event.attendingCount) {
      event.attendingCount = event.attendingUsers.length;
    }
  });
});

const DIGITAL_NOMAD_CITIES = ["Mexico City"];

// Update the MOCK_EVENTS object to include the new events
export const MOCK_EVENTS = DIGITAL_NOMAD_CITIES.reduce((acc, city) => {
  acc[city] = city === "Mexico City"
    ? [...(acc[city] || []), ...newEvents[city]]
    : (acc[city] || []);
  return acc;
}, {} as Record<string, any[]>);

// Directory creation is now handled by consolidated upload middleware

// Type definitions
interface User {
  id: number;
  username: string;
  fullName: string;
  age?: number;
  gender?: string;
  profession?: string;
  location?: string;
  bio?: string;
  interests?: string[];
  currentMoods?: string[];
  profileImage: string;
  createdAt?: string;
  updatedAt?: string;
  eventsHosting?: number[];
  featuredEvent?: {
    id: number;
    title: string;
    role: string;
  };
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  image: string;
  image_url?: string | null;
  capacity: number;
  price: number;
  createdAt: Date;
  interestedCount: number;
  attendingCount: number;
  tags: string[];
  creatorId: number;
  creatorName: string;
  creatorImage: string;
  attendingUsers: Array<{
    id: number;
    name: string;
    image: string;
  }>;
  interestedUsers: Array<{
    id: number;
    name: string;
    image: string;
  }>;
}

// Express app setup
const app = express();
app.use(express.json());

// Add multer error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: "File too large; maximum size is 10 MB" });
  }
  next(err);
});

// Add your routes here
app.get('/api/events/:city', (req: Request, res: Response) => {
  const city = req.params.city;
  const cityEvents = newEvents[city as keyof typeof newEvents] || [];
  res.json(cityEvents);
});

app.get('/api/users/:city', (req: Request, res: Response) => {
  const city = req.params.city;
  const cityUsers = MOCK_USERS[city as keyof typeof MOCK_USERS] || [];
  res.json(cityUsers);
});


// Middleware to check if user is authenticated
// Import centralized authentication functions instead of duplicated local implementations
import { isAuthenticated, checkAuthentication, requireAuth } from './middleware/auth.middleware';

// Import centralized authentication middleware instead of defining local version
// This removes the conflicting manual session database queries
// const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
//   // Use centralized authentication from middleware instead
//   return await checkAuthentication(req, res, next);
// };

export function registerRoutes(app: Express): { app: Express; httpServer: Server } {
  console.log('[ROUTE DEBUG] Starting route registration...');
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  app.use('/uploads', express.static('uploads')); // Serve uploaded files (fallback if object storage fails)

  setupAuth(app);

  // FIXED: Register conversation endpoint directly in setupAuth to ensure it works
  // This is a temporary fix - the root issue is that routes outside setupAuth don't work
  // The conversation route will be added to auth.ts where it properly functions
  
  // Mount premium router at /api/premium
  app.use('/api/premium', premiumRouter);
  
  // Mount AI router at /api/ai
  app.use('/api/ai', aiRouter);
  
  // Stripe Connect routes for event host payouts
  app.post('/api/stripe/connect/create-account', checkAuthentication, createConnectAccount);
  app.post('/api/stripe/connect/create-account-link', checkAuthentication, createAccountLink);
  app.get('/api/stripe/connect/account-status', checkAuthentication, getAccountStatus);
  app.post('/api/stripe/connect/verify-account', checkAuthentication, verifyAccount);
  app.post('/api/webhooks/stripe/connect', express.raw({ type: 'application/json' }), handleConnectWebhook);

  // Referral endpoints
  // Get user's referral code
  app.get('/api/referral/code', requireAuth, async (req, res) => {
    try {
      const user = req.user as { id: number };
      const referralCode = await generateReferralCode(user.id);
      
      return res.status(200).json({ 
        success: true, 
        referralCode 
      });
    } catch (error) {
      console.error("Error generating referral code:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to generate referral code" 
      });
    }
  });

  // Get share link for content
  app.get('/api/referral/share-link', requireAuth, async (req, res) => {
    try {
      const user = req.user as { id: number };
      const contentType = req.query.type as 'event' | 'profile' | 'invite';
      const contentId = req.query.id as string;
      
      if (!contentType) {
        return res.status(400).json({ success: false, error: "Content type is required" });
      }
      
      const referralCode = await generateReferralCode(user.id);
      const shareUrl = buildShareUrl(contentType, contentId, referralCode);
      
      return res.status(200).json({ 
        success: true, 
        shareUrl,
        referralCode
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to generate share link" 
      });
    }
  });

  // Record when a user signs up from a referral link
  app.post('/api/referral/record', requireAuth, async (req, res) => {
    try {
      const { referralCode } = req.body;
      const user = req.user as { id: number };
      
      if (!referralCode) {
        return res.status(400).json({ success: false, error: "Referral code is required" });
      }
      
      const result = await recordReferral(referralCode, user.id);
      
      return res.status(200).json({ 
        success: result
      });
    } catch (error) {
      console.error("Error recording referral:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to record referral" 
      });
    }
  });
  
  // Profile image upload endpoint
  app.post("/api/upload-profile-image", requireAuth, uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Type assertion to access user property safely
      const user = req.user as { id: number; username?: string };
      const userId = user.id;
      let imageUrl = '';

      try {
        const username = user.username || 'user';
        const result = await uploadToCloudinary(
          req.file.buffer, 
          req.file.originalname, 
          'image'
        );
        imageUrl = result.secure_url;
        console.log(`Uploaded profile image to Cloudinary: ${imageUrl}`);
      } catch (cloudinaryError) {
        console.error("Error uploading to Cloudinary:", cloudinaryError);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      }

      // No longer updating the user profile automatically
      // Instead, just return the URL for the client to use later
      // This allows clients to stage/preview the image before saving profile
      
      // Get current user data without updating
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      return res.json({ 
        success: true, 
        message: "Profile image uploaded and staged (not saved to profile yet)",
        profileImage: imageUrl,
        user: currentUser
      });
    } 
    catch (error) {
      console.error("Profile image upload error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to upload profile image" 
      });
    }
  });

  // Multiple profile images upload endpoint
  app.post("/api/upload-profile-images", requireAuth, uploadImage.array('images', 6), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No image files provided" });
      }

      // Type assertion to access user property safely
      const user = req.user as { id: number; username?: string };
      const userId = user.id;
      const uploadedUrls: string[] = [];

      try {
        const username = user.username || 'user';
        
        // Upload each image to Cloudinary
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const result = await uploadToCloudinary(
            file.buffer, 
            file.originalname, 
            'image'
          );
          uploadedUrls.push(result.secure_url);
          console.log(`Uploaded profile image ${i + 1} to Cloudinary: ${result.secure_url}`);
        }
      } catch (cloudinaryError) {
        console.error("Error uploading to Cloudinary:", cloudinaryError);
        return res.status(500).json({ error: "Failed to upload images to Cloudinary" });
      }

      // Get current user data without updating
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      return res.json({ 
        success: true, 
        message: `${uploadedUrls.length} profile images uploaded and staged (not saved to profile yet)`,
        profileImages: uploadedUrls,
        user: currentUser
      });
    } 
    catch (error) {
      console.error("Profile images upload error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to upload profile images" 
      });
    }
  });

  // API endpoint for city suggestions
  app.post("/api/suggest-city", async (req: Request, res: Response) => {
    try {
      const { city, email, reason } = req.body;

      if (!city || !email) {
        return res.status(400).json({ 
          success: false, 
          message: "City name and email are required" 
        });
      }

      console.log(`City suggestion received: ${city}, Email: ${email}, Reason: ${reason || 'Not provided'}`);

      // Save the suggestion to the database using the userCities table
      // We set isActive to false so these suggestions won't be displayed in the UI
      try {
        await db.insert(userCities).values({
          city,
          userId: null, // No user associated (anonymous suggestion)
          email,
          reason: reason || null,
          isActive: false, // Mark as inactive - won't be shown in the UI
          createdAt: new Date()
        });
      } catch (dbError) {
        console.error("Database error saving suggestion:", dbError);
        // Continue even if DB save fails - we already logged the suggestion
      }

      return res.status(200).json({
        success: true,
        message: "Thank you for your suggestion! We'll notify you when we add support for this city."
      });
    } catch (error) {
      console.error("Error saving city suggestion:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while submitting your suggestion."
      });
    }
  });

  app.post("/api/chat", handleChatMessage);

  app.get("/api/users/browse", async (req, res) => {
    try {
      // Validate and parse query parameters
      const validationResult = userBrowseSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid query parameters', 
          details: validationResult.error.errors 
        });
      }
      
      const { location: city, gender, minAge, maxAge, moods, interests, name, limit, offset } = validationResult.data;
      
      // Comprehensive debug logging to see all query parameters
      console.log("Full request query object:", req.query);

      // Normalize moods parameter from validation
      const normalizedMoods = Array.isArray(moods) ? moods : (moods ? [moods] : undefined);
      const normalizedInterests = Array.isArray(interests) ? interests : (interests ? [interests] : undefined);
      
      // Get current user ID for filtering (public endpoint, optional authentication)
      let currentUserId: number | undefined = undefined;
      
      // Try to get from query parameter if provided
      if (req.query.currentUserId) {
        try {
          currentUserId = parseInt(req.query.currentUserId as string, 10);
          console.log("User browse: Using currentUserId from query:", currentUserId);
        } catch (e) {
          console.warn("Invalid currentUserId in query:", req.query.currentUserId);
        }
      }
      
      // More detailed logging for debugging
      console.log(`User browse request received with city=${city}`);
      console.log(`Mood filters: ${moods ? (Array.isArray(moods) ? moods.join(', ') : moods) : 'none'}`);
      
      // Build where conditions array
      const whereConditions = [];
      
      // Always exclude the current user from results if available
      if (currentUserId && !isNaN(currentUserId)) {
        whereConditions.push(ne(users.id, currentUserId));
      }

      // Apply filters to query
      if (city && city !== 'all') {
        whereConditions.push(eq(users.location, city as string));
      }

      if (gender && gender !== 'all') {
        whereConditions.push(eq(users.gender, gender));
      }

      if (minAge !== undefined) {
        whereConditions.push(gte(users.age, minAge));
      }

      if (maxAge !== undefined) {
        whereConditions.push(lte(users.age, maxAge));
      }
      
      // Apply mood filters using PostgreSQL's array overlap operator
      if (normalizedMoods && normalizedMoods.length > 0) {
        console.log(`Applying mood filters at database level: ${normalizedMoods.join(', ')}`);
        const jsonMoodArray = JSON.stringify(normalizedMoods);
        whereConditions.push(sql`${users.currentMoods}::jsonb && ${jsonMoodArray}::jsonb`);
      }
      
      // Database query to get real users (exclude sensitive fields)
      let query = db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileType: users.profileType,
        gender: users.gender,
        sexualOrientation: users.sexualOrientation,
        bio: users.bio,
        profileImage: users.profileImage,
        profileImages: users.profileImages,
        location: users.location,
        birthLocation: users.birthLocation,
        nextLocation: users.nextLocation,
        interests: users.interests,
        currentMoods: users.currentMoods,
        profession: users.profession,
        age: users.age,
        businessName: users.businessName,
        businessDescription: users.businessDescription,
        websiteUrl: users.websiteUrl,
        createdAt: users.createdAt,
        lastActive: users.lastActive,
        isPremium: users.isPremium,
        preferredLanguage: users.preferredLanguage,
        referralCode: users.referralCode
        // Explicitly exclude: password, email, isAdmin, referredBy
      }).from(users);
      
      // Apply all where conditions at once
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      // Add ordering and pagination to the query
      query = query.orderBy(desc(users.createdAt));
      query = query.limit(limit).offset(offset);

      // Get users with pagination
      let dbUsers = await query;
      console.log(`Query returned ${dbUsers.length} users (limit: ${limit}, offset: ${offset})`);

      // Additional filtering that's harder to do at database level
      if (normalizedInterests && normalizedInterests.length > 0) {
        dbUsers = dbUsers.filter(user => 
          user.interests && normalizedInterests.some(interest => 
            user.interests?.includes(interest)
          )
        );
      }

      if (name) {
        const lowercaseName = name.toLowerCase();
        dbUsers = dbUsers.filter(user =>
          (user.fullName && user.fullName.toLowerCase().includes(lowercaseName)) ||
          (user.username && user.username.toLowerCase().includes(lowercaseName))
        );
      }

      // Get total count for pagination metadata (simplified for performance)
      const totalQuery = db.select({ count: sql`count(*)` }).from(users);
      const [{ count: totalCount }] = await totalQuery;

      console.log(`Found ${dbUsers.length} users, total: ${totalCount}`);

      res.json({
        users: dbUsers,
        pagination: {
          limit,
          offset,
          total: Number(totalCount),
          hasMore: offset + dbUsers.length < Number(totalCount)
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const currentUser = req.user;

      // If username is undefined/null and user is logged in, return current user
      if ((!username || username === 'undefined') && currentUser) {
        console.log("Returning current user profile:", currentUser.username);
        return res.json(currentUser);
      }

      // If username is provided, get from database
      const dbUser = await db.select()
        .from(users)
        .where(eq(users.username, username || ''))
        .limit(1);

      if (dbUser && dbUser.length > 0) {
        console.log("Found real user in database:", dbUser[0].username);
        return res.json(dbUser[0]);
      }

      // If not found in DB, fallback to mock data while we're developing
      const mockUser = Object.values(MOCK_USERS)
        .flat()
        .find(u => u.username === username);

      if (!mockUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await findMatches(req.user as any);
      res.json(matches);
    } catch (error) {
      console.error("Error finding matches:", error);
      res.status(500).json({ error: "Failed to find matches" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const { location } = req.query;
      const currentUserId = req.user?.id;

      console.log("Fetching events with params:", { location, currentUserId });

      // Query events from the database with creator information
      let query = db.select({
        id: events.id,
        title: events.title,
        description: events.description,
        city: events.city,
        location: events.location,
        address: events.address,
        latitude: events.latitude,
        longitude: events.longitude,
        date: events.date,
        endDate: events.endDate,
        image: events.image,
        videoUrls: events.videoUrls,
        category: events.category,
        creatorId: events.creatorId,
        capacity: events.capacity,
        price: events.price,
        ticketType: events.ticketType,
        availableTickets: events.availableTickets,
        tags: events.tags,
        isPrivate: events.isPrivate,
        isRsvp: events.isRsvp,
        requireApproval: events.requireApproval,
        isBusinessEvent: events.isBusinessEvent,
        timeFrame: events.timeFrame,
        stripeProductId: events.stripeProductId,
        stripePriceId: events.stripePriceId,
        itinerary: events.itinerary,
        createdAt: events.createdAt,
        attendingCount: events.attendingCount,
        interestedCount: events.interestedCount,
        // Include creator information with explicit aliases
        creatorUserId: users.id,
        creatorUsername: users.username,
        creatorFullName: users.fullName,
        creatorProfileImage: users.profileImage
      })
      .from(events)
      .leftJoin(users, eq(events.creatorId, users.id));

      // Apply location filter if provided and not 'all'
      if (location && location !== 'all' && location !== '') {
        console.log(`Filtering events by location: ${location}`);
        query = query.where(eq(events.location, location as string));
      } else {
        console.log("No location filter applied, showing all events");
      }

      // Get all events that match the criteria
      let dbEvents = await query;
      console.log(`Found ${dbEvents.length} events in database before filtering`);

      // Fetch ticket tiers for all events
      const eventIds = dbEvents.map(e => e.id);
      let allTicketTiers: any[] = [];
      if (eventIds.length > 0) {
        allTicketTiers = await db.select()
          .from(ticketTiers)
          .where(inArray(ticketTiers.eventId, eventIds));
      }

      // Map events to include properly structured creator objects and ticket tiers
      const eventsWithCreators = dbEvents.map(event => {
        const { creatorUserId, creatorUsername, creatorFullName, creatorProfileImage, ...eventData } = event;
        
        // Get ticket tiers for this event
        const eventTicketTiers = allTicketTiers.filter(tier => tier.eventId === event.id);
        
        return {
          ...eventData,
          creator: creatorUserId ? {
            id: creatorUserId,
            username: creatorUsername,
            fullName: creatorFullName,
            profileImage: creatorProfileImage
          } : null,
          ticketTiers: eventTicketTiers
        };
      });

      console.log(`Found ${eventsWithCreators.length} events to display`);

      // Sort events by date (most recent first)
      eventsWithCreators.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (most recent first)
      });

      // Check if we found any events
      if (eventsWithCreators.length === 0) {
        console.log("No events found in database, using mock data temporarily");
        // Return empty array instead of falling back to mock data
        return res.json([]);
      }

      console.log(`Returning ${eventsWithCreators.length} events from database`);
      return res.json(eventsWithCreators);
    } catch (error) {
      console.error("Error fetching events:", error);
      let message = "Failed to fetch events";
      if (error instanceof Error) {
          message = error.message;
      }
      res.status(500).json({ 
        error: message
      });
    }
  });

  // RSVP Management Endpoints - Must come before parameterized routes
  // GET /api/events/applications - Fetch all pending applications across all events for current user
  app.get('/api/events/applications', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as any;

      if (!currentUser || !currentUser.id) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = parseInt(currentUser.id);
      if (isNaN(userId)) {
        return res.status(401).json({ error: "Invalid user ID" });
      }

      // Fetch all pending applications for events created by the current user
      const userEvents = await db.select({ id: events.id })
        .from(events)
        .where(eq(events.creatorId, userId));

      const eventIds = userEvents.map(e => e.id);

      if (eventIds.length === 0) {
        return res.json({
          applications: [],
          totalPending: 0
        });
      }

      // Get pending applications for these events
      const pendingApplications = await db.select()
        .from(eventParticipants)
        .where(
          and(
            inArray(eventParticipants.eventId, eventIds),
            inArray(eventParticipants.status, ['pending_approval', 'pending_access'])
          )
        )
        .orderBy(desc(eventParticipants.createdAt));

      // Get additional details for each application
      const applications = [];
      for (const app of pendingApplications) {
        const userResult = await db.select().from(users).where(eq(users.id, app.userId));
        const eventResult = await db.select().from(events).where(eq(events.id, app.eventId));
        const user = userResult[0];
        const event = eventResult[0];
        
        applications.push({
          id: app.id,
          eventId: app.eventId,
          userId: app.userId,
          status: app.status,
          ticketQuantity: app.ticketQuantity,
          purchaseDate: app.purchaseDate,
          createdAt: app.createdAt,
          username: user?.username,
          fullName: user?.fullName,
          profileImage: user?.profileImage,
          email: user?.email,
          bio: user?.bio,
          location: user?.location,
          eventTitle: event?.title,
          eventImage: event?.image
        });
      }

      return res.json({
        applications,
        totalPending: applications.length
      });
    } catch (error) {
      console.error("Error fetching all applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get a specific event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);
      
      // Validate eventId
      if (isNaN(eventId) || eventId > Number.MAX_SAFE_INTEGER) {
        return res.status(400).json({ error: "Invalid event ID format" });
      }
      
      const currentUserId = req.user?.id;

      // Try to get event from the database
      const dbEvent = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (dbEvent && dbEvent.length > 0) {
        const event = dbEvent[0];
        
        // Get both attending and interested participants for this event
        const eventParticipantsList = await db.select({
          userId: eventParticipants.userId,
          status: eventParticipants.status
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));

        // Get ticket tiers for this event
        const eventTicketTiers = await db.select()
          .from(ticketTiers)
          .where(eq(ticketTiers.eventId, eventId));

        // Recalculate ticket type based on ticket tiers
        let calculatedTicketType = event.ticketType; // Default to existing value
        if (eventTicketTiers && eventTicketTiers.length > 0) {
          const hasFreeTiers = eventTicketTiers.some(tier => parseFloat(tier.price) === 0);
          const hasPaidTiers = eventTicketTiers.some(tier => parseFloat(tier.price) > 0);
          
          if (hasPaidTiers && hasFreeTiers) {
            calculatedTicketType = 'paid'; // Mixed tiers, consider as paid
          } else if (hasPaidTiers) {
            calculatedTicketType = 'paid';
          } else {
            calculatedTicketType = 'free';
          }
        }
        
        // Create separate lists for attending and interested users
        const attendingUserIds = eventParticipantsList
          .filter(p => p.status === 'attending' && p.userId !== null)
          .map(p => p.userId!)
          .filter((id): id is number => id !== null);
        
        const interestedUserIds = eventParticipantsList
          .filter(p => p.status === 'interested' && p.userId !== null)
          .map(p => p.userId!)
          .filter((id): id is number => id !== null);
          
        // Fetch user details for all participants in a single batch query
        let attendingUsers: { id: number; name: string; username: string; image: string }[] = [];
        let interestedUsers: { id: number; name: string; username: string; image: string }[] = [];
        
        // Combine all user IDs for batch fetching (filter out any remaining nulls)
        const allUserIds = [...attendingUserIds, ...interestedUserIds].filter((id): id is number => id !== null);
        
        if (allUserIds.length > 0) {
          // Single batch query to fetch all user data
          const allUsersData = await db.select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            profileImage: users.profileImage
          })
          .from(users)
          .where(inArray(users.id, allUserIds));
          
          // Create lookup map for efficient access
          const userDataMap = new Map(allUsersData.map(user => [user.id, user]));
          
          // Build attending users array
          attendingUsers = attendingUserIds.map(userId => {
            const user = userDataMap.get(userId);
            return user ? {
              id: user.id,
              name: user.fullName || user.username,
              username: user.username,
              image: user.profileImage || '/default-avatar.png'
            } : null;
          }).filter(Boolean) as { id: number; name: string; username: string; image: string }[];
          
          // Build interested users array
          interestedUsers = interestedUserIds.map(userId => {
            const user = userDataMap.get(userId);
            return user ? {
              id: user.id,
              name: user.fullName || user.username,
              username: user.username,
              image: user.profileImage || '/default-avatar.png'
            } : null;
          }).filter(Boolean) as { id: number; name: string; username: string; image: string }[];
        }

        // If we have a creatorId, fetch the creator information
        if (event.creatorId) {
          try {
            // Get creator details
            const creatorQuery = await db.select({
              id: users.id,
              username: users.username,
              fullName: users.fullName,
              profileImage: users.profileImage
            })
            .from(users)
            .where(eq(users.id, event.creatorId))
            .limit(1);

            if (creatorQuery && creatorQuery.length > 0) {
              // Add creator details and participants to the event object
              const creator = creatorQuery[0];
              const eventWithDetails = {
                ...event,
                ticketType: calculatedTicketType, // Use calculated ticket type

                // Transform snake_case to camelCase for frontend compatibility
                isPrivate: event.isPrivate,
                requireApproval: event.requireApproval,
                // Keep flat properties for backward compatibility
                creatorName: creator.fullName || creator.username,
                creatorImage: creator.profileImage,
                creatorUsername: creator.username,
                // Add nested creator object for consistency with events list API
                creator: {
                  id: creator.id,
                  username: creator.username,
                  fullName: creator.fullName,
                  profileImage: creator.profileImage
                },
                attendingUsers,
                interestedUsers,
                ticketTiers: eventTicketTiers
              };
              
              console.log(`Found event in database with creator: ${event.title}, creator: ${creator.username}`);
              return res.json(eventWithDetails);
            }
          } catch (creatorError) {
            console.error("Error fetching creator details:", creatorError);
            // Continue without creator details
          }
        }

        // Add participants to the event object even if we don't have creator details
        const eventWithParticipants = {
          ...event,
          ticketType: calculatedTicketType, // Use calculated ticket type
          // Transform snake_case to camelCase for frontend compatibility
          isPrivate: event.isPrivate,
          requireApproval: event.requireApproval,
          attendingUsers,
          interestedUsers,
          ticketTiers: eventTicketTiers
        };
        
        console.log("Found event in database:", event.title);
        return res.json(eventWithParticipants);
      }

      // If not found in database, fall back to mock data during development
      const allEvents = Object.values(MOCK_EVENTS).flat();
      const mockEvent = allEvents.find(e => e.id === eventId);

      if (!mockEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(mockEvent);
    } catch (error) {
      console.error("Error fetching event:", error);
      let message = "Failed to fetch event";
      if (error instanceof Error) {
          message = error.message;
      }
      res.status(500).json({ error: message });
    }
  });

  // Update an existing event
  app.put("/api/events/:id", uploadImageAndVideo.fields([
    { name: 'image', maxCount: 1 },
    { name: 'videos', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);
      
      // Authenticate the user
      let currentUser = null;

      // Method 1: Check if user is authenticated via passport
      if (req.isAuthenticated() && req.user) {
        currentUser = req.user;
        console.log("User authenticated via passport for event update:", currentUser.username);
      }
      
      // Method 2: Check X-User-ID header
      if (!currentUser) {
        const headerUserId = req.headers['x-user-id'] as string;
        
        if (headerUserId) {
          console.log("Trying to authenticate via User-ID header for event update:", headerUserId);
          
          try {
            const userId = parseInt(headerUserId);
            const [user] = await db.select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);
              
            if (user) {
              currentUser = user;
              console.log("User authenticated via User-ID header for event update:", user.username);
            }
          } catch (err) {
            console.error("Error checking user by header ID:", err);
          }
        }
      }

      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify this event exists and the user is the creator
      const [existingEvent] = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (existingEvent.creatorId !== currentUser.id) {
        return res.status(403).json({ error: "You can only edit your own events" });
      }

      // Process form data
      const {
        title,
        description,
        location,
        date,
        price,
        isPrivate,
        tags,
        itinerary,
        category
      } = req.body;

      // Create the update object
      const updateData: any = {
        title,
        description,
        location,
        address: req.body.address || '',  // Add the address field
        date: new Date(date),
        // Include category field with a default value to avoid NOT NULL constraint violation
        category: category || 'Other',
        updatedAt: new Date(),
      };

      // Add optional fields if they exist
      if (price !== undefined) {
        updateData.price = typeof price === 'string' ? parseFloat(price) : price;
      }

      if (isPrivate !== undefined) {
        updateData.isPrivate = isPrivate === 'true' || isPrivate === true;
      }

      if (tags) {
        try {
          updateData.tags = JSON.parse(tags);
        } catch (e) {
          console.error("Error parsing tags:", e);
        }
      }

      if (itinerary) {
        try {
          updateData.itinerary = JSON.parse(itinerary);
        } catch (e) {
          console.error("Error parsing itinerary:", e);
        }
      }


      // Handle new image and video uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process new image upload
      if (files && files.image && files.image[0]) {
        try {
          const imageFile = files.image[0];
          const result = await uploadToCloudinary(imageFile.buffer, imageFile.originalname, 'image');
          updateData.image = result.secure_url;
          console.log(`Updated event image: ${result.secure_url}`);
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
        }
      }
      
      // Process new video uploads (append to existing videos if any)
      if (files && files.videos && files.videos.length > 0) {
        try {
          const videoFiles = files.videos.map(file => ({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype
          }));
          
          const uploadResults = await uploadMultipleToCloudinary(videoFiles);
          const newVideoUrls = uploadResults.map(result => result.secure_url);
          
          // Merge with existing videos if any
          const existingVideos = existingEvent.videoUrls || [];
          updateData.videoUrls = [...existingVideos, ...newVideoUrls];
          console.log(`Updated event videos: ${newVideoUrls.length} new videos added`);
        } catch (error) {
          console.error("Error uploading videos to Cloudinary:", error);
        }
      }

      // Get coordinates from Mapbox geocoding service if location changed
      if (location || req.body.address) {
        const locationQuery = req.body.address || location || '';
        if (locationQuery) {
          console.log(`Geocoding updated location: ${locationQuery}`);
          const coordinates = await getCoordinates(locationQuery);
          if (coordinates) {
            console.log(`Geocoding successful: lat=${coordinates.latitude}, lng=${coordinates.longitude}`);
            updateData.latitude = coordinates.latitude;
            updateData.longitude = coordinates.longitude;
          } else {
            console.log('Geocoding failed or returned no results');
          }
        }
      }

      // Update the event in the database
      await db.update(events)
        .set(updateData)
        .where(eq(events.id, eventId));

      // Fetch the updated event
      const [updatedEvent] = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      res.status(200).json({ 
        message: "Event updated successfully", 
        event: updatedEvent 
      });
    } catch (error) {
      console.error("Error updating event:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: message });
    }
  });

  // Create a new event
  app.post("/api/events", isAuthenticated, uploadImageAndVideo.fields([
    { name: 'image', maxCount: 1 },
    { name: 'videos', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const currentUser = req.user as any;

      console.log("Event creation request received from user:", currentUser.username);
      console.log("Form data:", req.body);
      console.log("File:", req.file);

      // Parse ticketTiers from the request body
      let parsedTicketTiers = [];
      try {
        if (req.body.ticketTiers) {
          parsedTicketTiers = Array.isArray(req.body.ticketTiers) 
            ? req.body.ticketTiers 
            : JSON.parse(req.body.ticketTiers);
        }
      } catch (e) {
        console.warn("Failed to parse ticketTiers JSON:", e);
        return res.status(400).json({
          error: 'Invalid ticket tiers format',
          details: 'Ticket tiers must be a valid JSON array'
        });
      }

      // Validate input data with Zod schema
      const validationResult = createEventSchema.safeParse({
        ...req.body,
        date: req.body.date || new Date().toISOString(),
        ticketTiers: parsedTicketTiers,
        capacity: req.body.capacity ? parseInt(req.body.capacity) : undefined,
        itinerary: req.body.itinerary ? JSON.parse(req.body.itinerary) : undefined,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : undefined
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid event data',
          details: validationResult.error.errors
        });
      }
      
      const validatedData = validationResult.data;

      // Parse the incoming form data with proper validation
      let tags = [];
      try {
        if (req.body.tags) {
          tags = JSON.parse(req.body.tags);
        }
      } catch (e) {
        console.warn("Failed to parse tags JSON:", e);
        // Default to empty array if parsing fails
      }
      
      // Parse itinerary data if provided
      let itinerary = [];
      try {
        if (req.body.itinerary) {
          itinerary = JSON.parse(req.body.itinerary);
          console.log("Parsed itinerary data:", itinerary);
        }
      } catch (e) {
        console.warn("Failed to parse itinerary JSON:", e);
        // Default to empty array if parsing fails
      }

      // Get validated ticket tiers from the validation result
      const validatedTicketTiers = validationResult.data.ticketTiers;

      // Process image and video uploads to Cloudinary
      let imageUrl = '';
      let videoUrls: string[] = [];
      
      // Handle uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process image upload
      if (files && files.image && files.image[0]) {
        try {
          const imageFile = files.image[0];
          const result = await uploadToCloudinary(imageFile.buffer, imageFile.originalname, 'image');
          imageUrl = result.secure_url;
          console.log(`Uploaded event image to Cloudinary: ${imageUrl}`);
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          imageUrl = getEventImage(req.body.category || 'Social');
        }
      } else {
        imageUrl = getEventImage(req.body.category || 'Social');
      }
      
      // Process video uploads
      if (files && files.videos && files.videos.length > 0) {
        try {
          const videoFiles = files.videos.map(file => ({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype
          }));
          
          const uploadResults = await uploadMultipleToCloudinary(videoFiles);
          videoUrls = uploadResults.map(result => result.secure_url);
          console.log(`Uploaded ${videoUrls.length} videos to Cloudinary`);
        } catch (error) {
          console.error("Error uploading videos to Cloudinary:", error);
          // Continue without videos if upload fails
        }
      }

      // Get coordinates from Mapbox geocoding service
      let coordinates = null;
      const locationQuery = req.body.address || req.body.location || '';
      if (locationQuery) {
        console.log(`Geocoding location: ${locationQuery}`);
        coordinates = await getCoordinates(locationQuery);
        if (coordinates) {
          console.log(`Geocoding successful: lat=${coordinates.latitude}, lng=${coordinates.longitude}`);
        } else {
          console.log('Geocoding failed or returned no results');
        }
      }

      // Determine ticket type based on ticket tiers
      const hasFreeTiers = validatedTicketTiers.some(tier => tier.price === 0);
      const hasPaidTiers = validatedTicketTiers.some(tier => tier.price > 0);
      let ticketType = 'free';
      if (hasPaidTiers && hasFreeTiers) {
        ticketType = 'paid'; // Mixed tiers, consider as paid
      } else if (hasPaidTiers) {
        ticketType = 'paid';
      }

      // Create event data object with all required fields from schema
      const eventData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        address: req.body.address || '', // Add the new address field
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        city: req.body.city || 'Unknown',
        category: req.body.category || 'Other', // Add default category value
        ticketType: ticketType,
        capacity: parseInt(req.body.capacity || '10'),
        price: '0', // Keep for backward compatibility, will be replaced by tiers
        date: new Date(req.body.date || new Date()),
        tags: tags,
        image: imageUrl,

        videoUrls: videoUrls, // Add video URLs array

        creatorId: currentUser.id,
        isPrivate: req.body.eventPrivacy === 'private',
        requireApproval: req.body.eventPrivacy === 'rsvp' || req.body.eventPrivacy === 'private', // Set requireApproval to true for RSVP or private events
        isRsvp: req.body.eventPrivacy === 'rsvp', // Set isRsvp to true for RSVP events
        createdAt: new Date(),
        isBusinessEvent: req.body.organizerType === 'business',
        timeFrame: req.body.timeFrame || '',
        itinerary: itinerary, // Add the parsed itinerary data
        stripeProductId: null,
        stripePriceId: null
      };

      console.log(`Creating new event:`, eventData.title);

      // Insert the event into the database first
      const result = await db.insert(events).values(eventData).returning();

      if (!result || !result.length) {
        throw new Error("Database operation did not return an event ID");
      }

      const createdEvent = result[0];
      const eventId = createdEvent.id; // Capture the event ID explicitly
      console.log(`Event successfully saved to database with ID: ${eventId}`);

      // Create Stripe Products and Prices for each ticket tier
      const stripeTiers = [];
      
      for (let i = 0; i < validatedTicketTiers.length; i++) {
        const tier = validatedTicketTiers[i];
        try {
          let stripeProductId = null;
          let stripePriceId = null;

          // Only create Stripe products/prices for paid tiers
          if (tier.price > 0) {
            console.log(`Creating Stripe Product for tier: ${tier.name}`);
            
            // Create Stripe Product
            const stripeProduct = await stripe.products.create({
              name: `${eventData.title} - ${tier.name}`,
              description: tier.description || `${tier.name} ticket for ${eventData.title}`,
              metadata: {
                eventId: eventId.toString(),
                tierName: tier.name
              }
            });
            stripeProductId = stripeProduct.id;

            // Create Stripe Price
            const stripePrice = await stripe.prices.create({
              currency: 'usd',
              unit_amount: Math.round(tier.price * 100), // Convert to cents
              product: stripeProductId,
              metadata: {
                eventId: eventId.toString(),
                tierName: tier.name
              }
            });
            stripePriceId = stripePrice.id;

            console.log(`Created Stripe Product ${stripeProductId} and Price ${stripePriceId} for tier ${tier.name}`);
          }

          // Store Stripe data for this tier
          stripeTiers.push({
            productId: stripeProductId,
            priceId: stripePriceId
          });

        } catch (error) {
          console.error(`Error creating Stripe data for tier ${tier.name}:`, error);
          // Still add empty Stripe data for this tier
          stripeTiers.push({
            productId: null,
            priceId: null
          });
        }
      }

      // CRUCIAL FIX: Prepare the tiers for insertion using the captured eventId
      const tiersToInsert = parsedTicketTiers.map((tier, index) => ({
        eventId: eventId, // Use camelCase to match schema property names
        name: tier.name,
        description: tier.description || null,
        price: tier.price,
        quantity: tier.quantity || null,
        stripeProductId: stripeTiers[index].productId,
        stripePriceId: stripeTiers[index].priceId,
        isActive: true,
        createdAt: new Date()
      }));

      // Add debug log to verify the data before the final step
      console.log('DEBUG: Tiers prepared for insertion:', tiersToInsert);

      console.log(`Inserting ${tiersToInsert.length} ticket tiers into database`);
      const createdTiers = await db.insert(ticketTiers).values(tiersToInsert).returning();
      console.log(`Successfully created ${createdTiers.length} ticket tiers in database`);

      return res.status(201).json({
        success: true,
        message: "Event published successfully with ticket tiers",
        event: createdEvent,
        ticketTiers: createdTiers
      });
    } catch (error) {
      console.error("Error creating event:", error);
      const message = error instanceof Error ? error.message : "Unknown database error";
      res.status(500).json({ 
        error: "Failed to create event", 
        details: message 
      });
    }
  });

  // Duplicate endpoint removed - using the one with proper authentication middleware below

  app.post("/api/events/:eventId/participate", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "You must be logged in to participate in events" });
      }

      if (!['attending', 'interested', 'not_attending'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'attending', 'interested', or 'not_attending'" });
      }

      // Get the event
      const event = await db.select().from(events).where(eq(events.id, parseInt(eventId))).limit(1);

      if (!event.length) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user already has a participation record
      const existingParticipation = await db.select()
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, parseInt(eventId)),
            eq(eventParticipants.userId, userId)
          )
        )
        .limit(1);

      let result;

      if (existingParticipation.length > 0) {
        const oldStatus = existingParticipation[0].status;

        // Update the existing record
        if (status === 'not_attending') {
          // If changing to not attending, delete the record instead
          await db.delete(eventParticipants)
            .where(
              and(
                eq(eventParticipants.eventId, parseInt(eventId)),
                eq(eventParticipants.userId, userId)
              )
            );

          result = { status: 'not_attending', message: "Participation removed" };
        } else {
          // Update the status
          result = await db.update(eventParticipants)
            .set({ status })
            .where(
              and(
                eq(eventParticipants.eventId, parseInt(eventId)),
                eq(eventParticipants.userId, userId)
              )
            )
            .returning();
        }

        // Update count on the event
        if (oldStatus !== status) {
          // Decrement the old status count if it was 'attending' or 'interested'
          if (oldStatus === 'attending') {
            await db.update(events)
              .set({ attendingCount: Math.max(0, (event[0].attendingCount || 0) - 1) })
              .where(eq(events.id, parseInt(eventId)));
          } else if (oldStatus === 'interested') {
            await db.update(events)
              .set({ interestedCount: Math.max(0, (event[0].interestedCount || 0) - 1) })
              .where(eq(events.id, parseInt(eventId)));
          }

          // Increment the new status count if it's 'attending' or 'interested'
          if (status === 'attending') {
            await db.update(events)
              .set({ attendingCount: (event[0].attendingCount || 0) + 1 })
              .where(eq(events.id, parseInt(eventId)));
          } else if (status === 'interested') {
            await db.update(events)
              .set({ interestedCount: (event[0].interestedCount || 0) + 1 })
              .where(eq(events.id, parseInt(eventId)));
          }
        }
      } else if (status !== 'not_attending') {
        // Create a new participation record if the status is not 'not_attending'
        result = await db.insert(eventParticipants)
          .values({
            eventId: parseInt(eventId),
            userId,
            status,
            ticketQuantity: 1,
          })
          .returning();

        // Increment the appropriate count
        if (status === 'attending') {
          await db.update(events)
            .set({ attendingCount: (event[0].attendingCount || 0) + 1 })
            .where(eq(events.id, parseInt(eventId)));
        } else if (status === 'interested') {
          await db.update(events)
            .set({ interestedCount: (event[0].interestedCount || 0) + 1 })
            .where(eq(events.id, parseInt(eventId)));
        }
      } else {
        // If status is 'not_attending' and no record exists, nothing to do
        result = { status: 'not_attending', message: "User was not participating in this event" };
      }

      // Get the updated event
      const updatedEvent = await db.select().from(events).where(eq(events.id, parseInt(eventId))).limit(1);

      res.json({
        participation: result,
        event: updatedEvent[0]
      });
    } catch (error) {
      console.error("Error updating participation:", error);
      res.status(500).json({ error: "Failed to update participation" });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields: text and targetLanguage"
        });
      }

      const translation = await translateMessage(text, targetLanguage);
      res.json({ translation });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({
        error: "Failed to translate message"
      });
    }
  });

  // New conversation-based messaging endpoint
  app.post('/api/conversations/:conversationId/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      const senderId = (req.user as any).id;
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({ 
          error: 'Message content is required' 
        });
      }
      
      // Log request for debugging
      console.log(`Sending message from user ${senderId} to conversation ${conversationId}: ${content.substring(0, 20)}...`);
      
      const message = await sendMessageToConversation({ 
        senderId, 
        conversationId: parseInt(conversationId), 
        content 
      });
      
      // Log success for debugging
      console.log(`Successfully sent message from user ${senderId} to conversation ${conversationId}`);
      
      res.json(message);
    } catch (error) {
      console.error('Error sending conversation message:', error);
      
      if (error instanceof Error && error.message.includes('not a participant')) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Legacy direct messaging endpoint - MIGRATED to conversation-based system
  app.post('/api/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const { senderId, receiverId, content } = req.body;
      const authenticatedUserId = (req.user as any).id;
      
      // Security check: ensure senderId matches authenticated user
      if (senderId !== authenticatedUserId) {
        return res.status(403).json({ 
          error: 'You can only send messages as yourself' 
        });
      }
      
      // Validate required fields
      if (!receiverId || !content) {
        return res.status(400).json({ 
          error: 'Receiver ID and content are required' 
        });
      }
      
      // MIGRATION: Use conversation-based system instead of direct messages
      console.log(`LEGACY ENDPOINT: Converting direct message to conversation-based system`);
      console.log(`Creating/finding conversation between users ${senderId} and ${receiverId}`);
      
      // Step 1: Create or find conversation between the users
      const conversation = await getOrCreateDirectConversation(senderId, receiverId);
      
      // Step 2: Send message to the conversation
      const message = await sendMessageToConversation({
        senderId,
        conversationId: conversation.id,
        content
      });
      
      console.log(`Successfully migrated legacy message to conversation ${conversation.id}`);
      
      res.json(message);
    } catch (error) {
      console.error('Error sending message via legacy endpoint:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/conversations/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req.user as any).id;
      
      // Ensure user can only access their own conversations
      if (parseInt(userId) !== currentUserId) {
        return res.status(403).json({ error: 'Access denied - can only view your own conversations' });
      }
      
      console.log(`Fetching conversations for user ${userId}`);
      const conversations = await getConversations(parseInt(userId));
      console.log(`Successfully fetched ${conversations.length} conversations for user ${userId}`);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);

      // Return appropriate error status for connection-related errors
      if (error instanceof Error && error.message.includes('No user connections found')) {
        return res.status(200).json([]); // Return empty array instead of error for no connections
      }

      res.status(500).json({ error: 'Failed to get conversations' });
    }
  });

  // Get messages for a specific conversation
  app.get('/api/conversations/:conversationId/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.user as any).id;
      
      console.log(`Fetching messages for conversation ${conversationId} by user ${userId}`);
      
      const messages = await getConversationMessages(parseInt(conversationId), userId);
      
      console.log(`Successfully fetched ${messages.length} messages for conversation ${conversationId}`);
      
      res.json(messages);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      
      if (error instanceof Error && error.message.includes('not a participant')) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to get conversation messages' });
    }
  });


  app.get('/api/messages/:userId/:otherId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, otherId } = req.params;
      const authenticatedUserId = (req.user as any).id;
      
      // Security check: ensure user can only access their own messages
      if (parseInt(userId) !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied - can only view your own messages' });
      }
      
      // MIGRATION: Use conversation-based system instead of direct message queries
      console.log(`LEGACY ENDPOINT: Converting message query to conversation-based system`);
      console.log(`Finding conversation between users ${userId} and ${otherId}`);
      
      // Step 1: Find or create conversation between the users
      const conversation = await getOrCreateDirectConversation(parseInt(userId), parseInt(otherId));
      
      // Step 2: Get messages from the conversation
      const messages = await getConversationMessages(conversation.id, parseInt(userId));
      
      console.log(`Successfully migrated legacy message query - found ${messages.length} messages in conversation ${conversation.id}`);
      
      res.json(messages);
    } catch (error) {
      console.error('Error getting messages via legacy endpoint:', error);
      res.json([]);
    }
  });

  app.post('/api/messages/:messageId/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      
      // LEGACY ENDPOINT: Still functional for individual message marking
      console.log(`LEGACY ENDPOINT: Marking individual message ${messageId} as read`);
      
      const message = await markMessageAsRead(parseInt(messageId));
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  app.post('/api/messages/read-all/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const authenticatedUserId = (req.user as any).id;
      
      // Security check: ensure user can only mark their own messages as read
      if (parseInt(userId) !== authenticatedUserId) {
        return res.status(403).json({ error: 'Access denied - can only mark your own messages as read' });
      }
      
      // LEGACY ENDPOINT: Still using old approach for backward compatibility
      console.log(`LEGACY ENDPOINT: Marking all messages as read for user ${userId}`);
      console.log(`RECOMMENDATION: Use conversation-based read endpoints instead`);
      
      const messages = await markAllMessagesAsRead(parseInt(userId));
      res.json(messages);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      res.status(500).json({ error: 'Failed to mark all messages as read' });
    }
  });

  // NEW: Conversation-based read endpoint
  app.post('/api/conversations/:conversationId/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.user as any).id;
      
      console.log(`Marking conversation ${conversationId} as read for user ${userId}`);
      
      const result = await markConversationAsRead(parseInt(conversationId), userId);
      
      console.log(`Successfully marked conversation ${conversationId} as read for user ${userId}`);
      
      res.json({ success: true, conversationId: parseInt(conversationId), userId });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      
      if (error instanceof Error && error.message.includes('not a participant')) {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/chat'
  });

  // Store active connections and their ping states
  const activeConnections = new Map<number, {
    ws: WebSocket;
    isAlive: boolean;
    pingTimeout?: NodeJS.Timeout;
  }>();

  // Ping interval (30 seconds)
  const PING_INTERVAL = 30000;
  const CONNECTION_TIMEOUT = 35000;

  function heartbeat(userId: number) {
    if (activeConnections.has(userId)) {
      const connection = activeConnections.get(userId)!;
      connection.isAlive = true;

      // Reset ping timeout
      if (connection.pingTimeout) {
        clearTimeout(connection.pingTimeout);
      }

      connection.pingTimeout = setTimeout(() => {
        console.log(`Connection timeout for user ${userId}`);
        connection.ws.terminate();
        activeConnections.delete(userId);
      }, CONNECTION_TIMEOUT);
    }
  }

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log(`WebSocket connection received, waiting for user identification`);
    
    // We'll wait for the client to send a message with the user ID
    let userId: number | null = null;
    let msgCount = 0; // Track number of messages for debugging
    
    // Set a timeout to close the connection if no user ID is provided
    const userIdTimeout = setTimeout(() => {
      if (!userId) {
        console.log('No user ID provided, closing connection');
        ws.send(JSON.stringify({
          type: 'error',
          message: 'No user ID provided'
        }));
        ws.close(1000, 'No user ID provided');
      }
    }, 10000); // 10 seconds timeout
    
    // Handle the first message to get the user ID
    const messageHandler = async (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        
        // If userId is already set, this is a regular message
        if (userId) return;
        
        // Check if this is a connection message with userId
        if (data.type === 'connect' && data.userId) {
          userId = parseInt(data.userId, 10);
          clearTimeout(userIdTimeout);
          console.log(`WebSocket connection established for user ${userId}`);
          
          // Store the connection
          activeConnections.set(userId, { ws, isAlive: true });
          
          // Send a welcome message to confirm successful connection
          ws.send(JSON.stringify({
            type: 'connected',
            message: `Connected as user ${userId}`
          }));
          
          // Initial heartbeat
          heartbeat(userId);
          
          // Setup regular message handling
          ws.on('message', handleRegularMessages);
          
          // Remove the initial message handler 
          ws.removeListener('message', messageHandler);
          
          // Handle connection errors
          ws.on('error', (error) => {
            console.error(`WebSocket error for user ${userId}:`, error);
          });
          
          // Send a ping every 30 seconds to keep connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.ping(); // Use ws.ping() instead of sending a custom ping message
              if (userId) heartbeat(userId);
            } else {
              clearInterval(pingInterval);
            }
          }, PING_INTERVAL);
          
          // Handle disconnection
          ws.on('close', () => {
            console.log(`WebSocket connection closed for user ${userId}`);
            if (userId) activeConnections.delete(userId);
            clearInterval(pingInterval);
          });
          
          // Handle pong
          ws.on('pong', () => {
            console.log(`Pong received from user ${userId}`);
            if (userId) heartbeat(userId);
          });
          
          return;
        } else {
          console.log('Invalid connection message, waiting for proper userId');
        }
      } catch (error) {
        console.error('Error processing connection message:', error);
      }
    };
    
    // Handle regular messages after connection is established
    const handleRegularMessages = async (message: any) => {
      try {
        msgCount++;
        const data = JSON.parse(message.toString());
        if (!userId) return; // Safety check
        
        // Update the heartbeat
        if (userId) heartbeat(userId);
        
        console.log(`WebSocket message #${msgCount} received from user ${userId}:`, JSON.stringify(data));
        
        // Check for ping message
        if (data.type === 'ping') {
          console.log(`Ping received from user ${userId}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          return;
        }
        
        // Validate message structure - support both old and new formats
        const hasOldFormat = data.senderId && data.receiverId && data.content;
        const hasNewFormat = data.senderId && data.conversationId && data.content;
        
        if (!hasOldFormat && !hasNewFormat) {
          console.error('Invalid message format:', data);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format. Required fields: senderId + (receiverId OR conversationId) + content'
          }));
          return;
        }
        
        try {
          let conversationId = data.conversationId;
          
          // If using old format, find or create conversation
          if (hasOldFormat && !hasNewFormat) {
            console.log(`Legacy WebSocket message format detected, converting receiverId ${data.receiverId} to conversation`);
            const conversation = await getOrCreateDirectConversation(data.senderId, data.receiverId);
            conversationId = conversation.id;
            console.log(`Created/found conversation ${conversationId} for users ${data.senderId} and ${data.receiverId}`);
          }
          
          // Store the message in the database using conversation-based system
          const newMessage = await sendMessageToConversation({
            senderId: data.senderId,
            conversationId: conversationId,
            content: data.content
          });
          
          // Validate that we got a proper message object back
          if (!newMessage || !newMessage.id) {
            throw new Error("Failed to create message - database returned invalid data");
          }
          
          console.log(`Message stored in database:`, JSON.stringify(newMessage));
          
          // TODO: Broadcast to conversation participants (for now, frontend polling handles real-time updates)
          console.log(`Message saved to conversation ${data.conversationId}, participants will see it through polling`);
          
          // Send confirmation back to sender
          console.log(`Sending confirmation to sender ${data.senderId}`);
          ws.send(JSON.stringify({
            type: 'confirmation',
            message: newMessage
          }));
        } catch (error) {
          // If error is "Users must be connected", send a better error message
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          ws.send(JSON.stringify({
            type: 'error',
            message: errorMessage
          }));
          console.error('Error sending message via WebSocket:', errorMessage);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'An error occurred'
        }));
      }
    };

    // Add a message handler to parse the first message
    ws.on('message', messageHandler);
    
    // Set up an error handler for the connection initialization phase
    ws.on('error', (error) => {
      console.error('WebSocket connection error during initialization:', error);
    });

  });

  // Add authentication check endpoint that specifically looks for the session ID from various sources
// Auth check endpoint is now defined in server/auth.ts to avoid duplicate routes

  // Add endpoint to get user by session ID - simplified to use passport auth only
  app.get('/api/user-by-session', async (req: Request, res: Response) => {
    try {
      // Use passport authentication only (no manual session queries)
      if (req.isAuthenticated() && req.user) {
        console.log("User authenticated via passport:", (req.user as any).username);
        
        // Sanitize user object to remove sensitive info (like password)
        const { password, ...userWithoutPassword } = req.user as any;
        
        return res.json({
          ...userWithoutPassword,
          authenticated: true
        });
      }
      
      // Authentication failed
      console.log("User not authenticated in user-by-session request");
      
      // Check if the request wants HTML (browser) vs API (JSON) response
      const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
      
      // For browser requests, redirect to login page
      if (acceptsHtml) {
        console.log("Redirecting unauthenticated user to login page");
        return res.redirect('/login');
      }
      
      // For API requests, return JSON
      return res.status(401).json({
        error: "Authentication required",
        authenticated: false
      });
    } catch (error) {
      console.error("Error in user-by-session endpoint:", error);
      
      // Check if the request wants HTML (browser) vs API (JSON) response
      const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
      
      // For browser requests, redirect to login page
      if (acceptsHtml) {
        console.log("Redirecting user to login page due to server error");
        return res.redirect('/login');
      }
      
      // For API requests, return JSON
      return res.status(500).json({
        error: "Server error",
        authenticated: false
      });
    }
  });

  // Endpoint to update user profile - including moods
  app.post("/api/profile", async (req, res) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.user.id;
      const updateData = req.body;
      
      console.log(`Updating profile for user ${userId}:`, updateData);
      
      // Remove sensitive fields that shouldn't be updated directly
      const { password, email, id, ...safeFields } = updateData;
      
      // Process arrays to ensure proper storage format
      if (safeFields.interests && Array.isArray(safeFields.interests)) {
        safeFields.interests = safeFields.interests.length > 0 ? safeFields.interests : [];
      }

      if (safeFields.currentMoods && Array.isArray(safeFields.currentMoods)) {
        safeFields.currentMoods = safeFields.currentMoods.length > 0 ? safeFields.currentMoods : [];
      }
      
      // Handle location fields specifically
      if (safeFields.currentLocation) {
        safeFields.location = safeFields.currentLocation;
        delete safeFields.currentLocation;
      }
      
      if (safeFields.upcomingLocation) {
        safeFields.nextLocation = safeFields.upcomingLocation;
        delete safeFields.upcomingLocation;
      }
      
      console.log(`Safe profile update for user ${userId}:`, safeFields);
      
      // Update the user with all provided safe fields
      await db.update(users)
        .set(safeFields)
        .where(eq(users.id, userId));
      
      console.log(`Updated user ${userId} profile successfully`);
      
      // Get the updated user data
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      // Return the updated user data
      return res.json(updatedUser || { error: "User not found after update" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get user profile by ID
  app.get('/api/users/profile/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Find the user by ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId)),
        columns: {
          id: true,
          username: true,
          fullName: true,
          profileImage: true,
          bio: true,
          location: true,
          birthLocation: true,
          nextLocation: true,
          interests: true,
          currentMoods: true,
          profession: true,
          age: true,
          gender: true,
          sexualOrientation: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });
  
  // Get user by ID - simplified endpoint for event creator info
  app.get('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`Fetching user with ID: ${userId}`);
      
      // Check if userId is a number
      if (isNaN(parseInt(userId))) {
        // This might be a username lookup, forward to the username handler
        return res.redirect(`/api/users/username/${userId}`);
      }
      
      // Find the user by ID
      const userQuery = await db.select().from(users).where(eq(users.id, parseInt(userId)));
      
      if (userQuery.length === 0) {
        console.log(`User not found with ID: ${userId}`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information before returning user
      const { password, ...userWithoutPassword } = userQuery[0] as any;
      
      console.log(`Found user by ID: ${userWithoutPassword.username}`);
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
  
  // Get user by username
  app.get('/api/users/username/:username', async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      console.log(`Fetching user with username: ${username}`);
      
      // Find the user by username
      const userQuery = await db.select().from(users).where(eq(users.username, username));
      
      if (userQuery.length === 0) {
        console.log(`User not found with username: ${username}`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information before returning user
      const { password, ...userWithoutPassword } = userQuery[0] as any;
      
      console.log(`Found user by username: ${userWithoutPassword.username}`);
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user by username:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Connection related endpoints

  // Send a connection request
  app.post('/api/connections/request', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;

      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      // Check if request already exists
      const existingConnection = await db.query.userConnections.findFirst({
        where: and(
          eq(userConnections.followerId, currentUser.id),
          eq(userConnections.followingId, targetUserId)
        )
      });

      if (existingConnection) {
        return res.status(400).json({ 
          error: 'Connection request already exists', 
          status: existingConnection.status 
        });
      }

      // Create new connection request
      const newConnection = await db.insert(userConnections).values({
        followerId: currentUser.id,
        followingId: targetUserId,
        status: 'pending',
        createdAt: new Date()
      }).returning();

      res.status(201).json({
        message: 'Connection request sent successfully',
        connection: newConnection[0]
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
      res.status(500).json({ error: 'Failed to send connection request' });
    }
  });

  // Get pending connection requests (received by current user)
  app.get('/api/connections/pending', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;

      // Get all pending requests where the current user is the target
      const pendingRequests = await db.query.userConnections.findMany({
        where: and(
          eq(userConnections.followingId, currentUser.id),
          eq(userConnections.status, 'pending')
        ),
        with: {
          follower: true
        }
      });

      // Format the response
      const formattedRequests = pendingRequests.map(request => {
        if (!request.follower) {
          console.error('Missing follower data in connection request:', request);
          return null;
        }

        return {
          id: request.follower.id,
          username: request.follower.username,
          fullName: request.follower.fullName,
          profileImage: request.follower.profileImage,
          requestDate: request.createdAt,
          status: request.status
        };
      }).filter(Boolean) as Array<{
        id: number;
        username: string;
        fullName: string | null;
        profileImage: string | null;
        requestDate: Date | null;
        status: string;
      }>;

      res.json(formattedRequests);
    } catch (error) {
      console.error('Error fetching pending connection requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending connection requests' });
    }
  });

  // Accept or decline a connection request
  app.put('/api/connections/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;

      const { userId } = req.params;
      const { status } = req.body;

      if (!status || (status !== 'accepted' && status !== 'declined')) {
        return res.status(400).json({ error: 'Valid status (accepted or declined) is required' });
      }

      // Update the connection status
      const updatedConnection = await db
        .update(userConnections)
        .set({ status })
        .where(
          and(
            eq(userConnections.followerId, parseInt(userId)),
            eq(userConnections.followingId, currentUser.id),
            eq(userConnections.status, 'pending')
          )
        )
        .returning();

      if (!updatedConnection || updatedConnection.length === 0) {
        return res.status(404).json({ error: 'Connection request not found' });
      }

      res.json({
        message: `Connection request ${status}`,
        connection: updatedConnection[0]
      });
    } catch (error) {
      console.error('Error updating connection request:', error);
      res.status(500).json({ error: 'Failed to update connection request' });
    }
  });

  // Get all connections (accepted only)
  app.get('/api/connections', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;

      // Get connections where current user is either follower or following
      const connections = await db.query.userConnections.findMany({
        where: and(
          or(
            eq(userConnections.followerId, currentUser.id),
            eq(userConnections.followingId, currentUser.id)
          ),
          eq(userConnections.status, 'accepted')
        ),
        with: {
          follower: true,
          following: true
        }
      });

      // Format the response to show the other user in each connection
      const formattedConnections = connections.map(connection => {
        const isFollower = connection.followerId === currentUser.id;
        const otherUser = isFollower ? connection.following : connection.follower;

        if (!otherUser) {
          console.error('Missing related user data in connection:', connection);
          return null;
        }

        return {
          id: otherUser.id,
          username: otherUser.username,
          fullName: otherUser.fullName,
          profileImage: otherUser.profileImage,
          connectionDate: connection.createdAt,
          connectionType: isFollower ? 'following' : 'follower'
        };
      }).filter(Boolean) as Array<{
        id: number;
        username: string;
        fullName: string | null;
        profileImage: string | null;
        connectionDate: Date | null;
        connectionType: string;
      }>;

      res.json(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({ error: 'Failed to fetch connections' });
    }
  });

  // Check connection status between current user and another user
  app.get('/api/connections/status/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;

      const { userId } = req.params;
      const targetUserId = parseInt(userId);

      // Check outgoing connection (current user -> target user)
      const outgoingConnection = await db.query.userConnections.findFirst({
        where: and(
          eq(userConnections.followerId, currentUser.id),
          eq(userConnections.followingId, targetUserId)
        )
      });

      // Check incoming connection (target user -> current user)
      const incomingConnection = await db.query.userConnections.findFirst({
        where: and(
          eq(userConnections.followerId, targetUserId),
          eq(userConnections.followingId, currentUser.id)
        )
      });

      res.json({
        outgoing: outgoingConnection ? {
          status: outgoingConnection.status,
          date: outgoingConnection.createdAt
        } : null,
        incoming: incomingConnection ? {
          status: incomingConnection.status,
          date: incomingConnection.createdAt
        } : null
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
      res.status(500).json({ error: 'Failed to check connection status' });
    }
  });

// Private Event Access Request endpoints
  
  // Send access request for private event
  app.post('/api/events/:eventId/request-access', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;
      const { eventId } = req.params;

      // Find the event and verify it exists and is private
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!event.isPrivate && !event.isRsvp) {
        return res.status(400).json({ error: 'This event does not require access requests' });
      }

      // Check if user is the event creator
      if (event.creatorId === currentUser.id) {
        return res.status(400).json({ error: 'You cannot request access to your own event' });
      }

      // Check if request already exists
      const existingRequest = await db.query.eventParticipants.findFirst({
        where: and(
          eq(eventParticipants.userId, currentUser.id),
          eq(eventParticipants.eventId, parseInt(eventId))
        )
      });

      if (existingRequest) {
        return res.status(400).json({ 
          error: 'Access request already exists', 
          status: existingRequest.status 
        });
      }

      // Create new access request
      const newRequest = await db.insert(eventParticipants).values({
        userId: currentUser.id,
        eventId: parseInt(eventId),
        status: 'pending_access',
        createdAt: new Date()
      }).returning();

      res.status(201).json({
        message: 'Access request sent successfully',
        request: newRequest[0]
      });
    } catch (error) {
      console.error('Error sending access request:', error);
      res.status(500).json({ error: 'Failed to send access request' });
    }
  });

  // Get pending access requests for an event (for hosts)
  app.get('/api/events/:eventId/access-requests', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;
      const { eventId } = req.params;

      // Verify the event exists and user is the creator
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.creatorId !== currentUser.id) {
        return res.status(403).json({ error: 'Only event creators can view access requests' });
      }

      // Get all pending access requests for this event
      const pendingRequests = await db.query.eventParticipants.findMany({
        where: and(
          eq(eventParticipants.eventId, parseInt(eventId)),
          eq(eventParticipants.status, 'pending_access')
        ),
        with: {
          user: true
        }
      });

      // Format the response similar to connections
      const formattedRequests = pendingRequests.map(request => {
        if (!request.user) {
          console.error('Missing user data in access request:', request);
          return null;
        }

        return {
          id: request.user.id,
          username: request.user.username,
          fullName: request.user.fullName,
          profileImage: request.user.profileImage,
          requestDate: request.createdAt,
          status: request.status
        };
      }).filter(Boolean);

      res.json(formattedRequests);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      res.status(500).json({ error: 'Failed to fetch access requests' });
    }
  });

  // Accept or decline access request for private event
  app.put('/api/events/:eventId/access-requests/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as Express.User;
      const { eventId, userId } = req.params;
      const { action } = req.body;

      if (!action || !['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'Action must be "accept" or "decline"' });
      }

      // Verify the event exists and user is the creator
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.creatorId !== currentUser.id) {
        return res.status(403).json({ error: 'Only event creators can manage access requests' });
      }

      // Find the access request
      const accessRequest = await db.query.eventParticipants.findFirst({
        where: and(
          eq(eventParticipants.eventId, parseInt(eventId)),
          eq(eventParticipants.userId, parseInt(userId)),
          eq(eventParticipants.status, 'pending_access')
        )
      });

      if (!accessRequest) {
        return res.status(404).json({ error: 'Access request not found' });
      }

      // Update the request status
      if (action === 'accept') {
        await db.update(eventParticipants)
          .set({ 
            status: 'interested',
            updatedAt: new Date()
          })
          .where(eq(eventParticipants.id, accessRequest.id));

        // Increment interested count
        await db.update(events)
          .set({ interestedCount: (event.interestedCount || 0) + 1 })
          .where(eq(events.id, parseInt(eventId)));

        res.json({ message: 'Access request accepted successfully' });
      } else {
        // Decline - remove the request
        await db.delete(eventParticipants)
          .where(eq(eventParticipants.id, accessRequest.id));

        res.json({ message: 'Access request declined successfully' });
      }
    } catch (error) {
      console.error('Error updating access request:', error);
      res.status(500).json({ error: 'Failed to update access request' });
    }
  });

// Event participation API endpoints

// Get a user's participation status for an event
app.get('/api/events/:eventId/participation/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as Express.User;
    const { eventId } = req.params;

    // Find current participation status for this user and event
    const participationRecord = await db.query.eventParticipants.findFirst({
      where: and(
        eq(eventParticipants.userId, currentUser.id),
        eq(eventParticipants.eventId, parseInt(eventId))
      )
    });

    if (!participationRecord) {
      return res.json({ status: 'not_participating' });
    }

    return res.json({ status: participationRecord.status });
  } catch (error) {
    console.error('Error getting participation status:', error);
    res.status(500).json({ error: 'Failed to get participation status' });
  }
});

// Update a user's participation status for an event
app.post('/api/events/:eventId/participate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as Express.User;
    const { eventId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['interested', 'attending', 'not_participating'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be "interested", "attending", or "not_participating".' });
    }

    // Find the event to make sure it exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Find current participation record if any
    const existingRecord = await db.query.eventParticipants.findFirst({
      where: and(
        eq(eventParticipants.userId, currentUser.id),
        eq(eventParticipants.eventId, parseInt(eventId))
      )
    });

    // Handle removal of participation (not_participating)
    if (status === 'not_participating') {
      if (existingRecord) {
        // Decrement appropriate counter based on previous status
        if (existingRecord.status === 'interested') {
          await db.update(events)
            .set({ interestedCount: Math.max((event.interestedCount || 0) - 1, 0) })
            .where(eq(events.id, parseInt(eventId)));
        } else if (existingRecord.status === 'attending') {
          await db.update(events)
            .set({ attendingCount: Math.max((event.attendingCount || 0) - 1, 0) })
            .where(eq(events.id, parseInt(eventId)));
        }

        // Delete the record
        await db.delete(eventParticipants)
          .where(and(
            eq(eventParticipants.userId, currentUser.id),
            eq(eventParticipants.eventId, parseInt(eventId))
          ));

        return res.json({ status: 'not_participating' });
      } else {
        // No record to delete
        return res.json({ status: 'not_participating' });
      }
    }

    // Handle adding or updating participation status
    if (existingRecord) {
      // Update existing record if status changed
      if (existingRecord.status !== status) {
        // First decrement the counter for the old status
        if (existingRecord.status === 'interested') {
          await db.update(events)
            .set({ interestedCount: Math.max((event.interestedCount || 0) - 1, 0) })
            .where(eq(events.id, parseInt(eventId)));
        } else if (existingRecord.status === 'attending') {
          await db.update(events)
            .set({ attendingCount: Math.max((event.attendingCount || 0) - 1, 0) })
            .where(eq(events.id, parseInt(eventId)));
        }

        // Increment counter for the new status
        if (status === 'interested') {
          await db.update(events)
            .set({ interestedCount: (event.interestedCount || 0) + 1 })
            .where(eq(events.id, parseInt(eventId)));
        } else if (status === 'attending') {
          await db.update(events)
            .set({ attendingCount: (event.attendingCount || 0) + 1 })
            .where(eq(events.id, parseInt(eventId)));
        }

        // Update the record
        await db.update(eventParticipants)
          .set({ 
            status,
            // Use the column directly instead of a property name
            [eventParticipants.updatedAt.name]: new Date()
          })
          .where(and(
            eq(eventParticipants.userId, currentUser.id),
            eq(eventParticipants.eventId, parseInt(eventId))
          ));
      }
    } else {
      // Create new record with proper field names from the schema
      await db.insert(eventParticipants).values({
        [eventParticipants.userId.name]: currentUser.id,
        [eventParticipants.eventId.name]: parseInt(eventId),
        [eventParticipants.status.name]: status,
        [eventParticipants.createdAt.name]: new Date()
      });

      // Increment the counter for the new status
      if (status === 'interested') {
        await db.update(events)
          .set({ interestedCount: (event.interestedCount || 0) + 1 })
          .where(eq(events.id, parseInt(eventId)));
      } else if (status === 'attending') {
        await db.update(events)
          .set({ attendingCount: (event.attendingCount || 0) + 1 })
          .where(eq(events.id, parseInt(eventId)));
      }
    }

    return res.json({ status });
  } catch (error) {
    console.error('Error updating participation status:', error);
    res.status(500).json({ error: 'Failed to update participation status' });
  }
});

  // Stripe requires the raw body to construct the event
  // IMPORTANT: This must come *before* express.json() middleware, or apply only to this route.
  // We'll apply it specifically to the webhook route.
  app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured.');
      return res.sendStatus(400);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) { // Keep simple catch, handle error below
      console.error(`Error verifying webhook signature:`);
      if (err instanceof Error) {
        console.error(err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      return res.status(400).send(`Webhook Error: Unknown error`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // --- Retrieve and validate metadata --- 
        const userIdStr = session.metadata?.userId;
        const eventIdStr = session.metadata?.eventId;
        const ticketTierIdStr = session.metadata?.ticketTierId;
        const quantityStr = session.metadata?.quantity;
        
        const userId = userIdStr ? parseInt(userIdStr, 10) : NaN;
        const eventId = eventIdStr ? parseInt(eventIdStr, 10) : NaN;
        const ticketTierId = ticketTierIdStr ? parseInt(ticketTierIdStr, 10) : NaN;
        const quantity = quantityStr ? parseInt(quantityStr, 10) : 1; // Default quantity to 1 if missing/invalid

        if (isNaN(userId) || isNaN(eventId) || isNaN(ticketTierId) || isNaN(quantity)) {
            console.error('Missing or invalid metadata in checkout session:', session.id, { userIdStr, eventIdStr, ticketTierIdStr, quantityStr });
            return res.status(400).send('Metadata error.');
        }

        // --- Payment details --- 
        const stripeCheckoutSessionId = session.id;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const amount = session.amount_total;
        const currency = session.currency;

        if (!paymentIntentId || amount === null || !currency) {
             console.error('Missing payment details in checkout session:', session.id);
             return res.status(400).send('Payment detail error.');
        }

        try {
            // --- Generate Unique Ticket Identifier --- 
            const ticketIdentifier = uuidv4();
            
            // --- Update Event Participant --- 
            const [participant] = await db
                .update(eventParticipants)
                .set({
                    paymentStatus: 'completed',
                    paymentIntentId: paymentIntentId, 
                    purchaseDate: new Date(),
                    ticketIdentifier: ticketIdentifier, // Store the unique identifier
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(eventParticipants.userId, userId), // Use validated number userId
                    eq(eventParticipants.eventId, eventId), // Use validated number eventId
                    eq(eventParticipants.ticketTierId, ticketTierId), // Use validated ticket tier ID
                    eq(eventParticipants.paymentIntentId, stripeCheckoutSessionId) // Look for session ID in paymentIntentId field
                ))
                .returning();
            
            if (!participant) {
                console.error(`Webhook: Event participant not found for session: ${stripeCheckoutSessionId}, userId: ${userId}, eventId: ${eventId}`);
                 return res.status(404).send('Participant not found.');
            }

            // --- Create Payment Record --- 
             await db.insert(payments).values({
                userId: userId,
                eventParticipantId: participant.id, 
                stripeChargeId: paymentIntentId, 
                // We don't have a stripeCheckoutSessionId column in the database,
                // so use the paymentIntentId (which contains the session ID) twice
                stripeCheckoutSessionId: paymentIntentId, 
                stripeCustomerId: stripeCustomerId,
                amount: amount,
                currency: currency,
                status: 'succeeded',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // --- Update Event Ticket Count --- 
             const [eventData] = await db.select({ availableTickets: events.availableTickets }).from(events).where(eq(events.id, eventId));
             if (eventData && typeof eventData.availableTickets === 'number') {
                 await db.update(events)
                    .set({ availableTickets: eventData.availableTickets - quantity })
                    .where(eq(events.id, eventId));
             }
             console.log(`Successfully processed checkout for session: ${stripeCheckoutSessionId}, Ticket ID: ${ticketIdentifier}`);

        } catch (dbError) { // Keep simple catch, handle error below
            console.error(`Database error processing webhook for session ${stripeCheckoutSessionId}:`);
             if (dbError instanceof Error) {
                console.error(dbError.message);
             }
            return res.sendStatus(500);
        }

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });



  // Ensure regular JSON parsing happens *after* the raw body parser for the webhook
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Define other routes *after* middleware setup
  // ... existing routes ...

  // --- Create Stripe Checkout Session Endpoint --- 
  app.post('/api/payments/create-checkout-session', async (req: Request, res: Response) => {
    // Check authentication - try multiple methods
    let userId: number | null = null;
    
    // Method 1: Check if authenticated via passport
    if (req.isAuthenticated() && req.user) {
      userId = (req.user as any).id;
      console.log("User authenticated via passport:", (req.user as any).username);
    } 
    // Method 2: Try to get userId from request headers and body
    else {
      const headerUserId = req.headers['x-user-id'] as string;
      const headerSessionId = req.headers['x-session-id'] as string;
      const cookieSessionId = req.cookies?.maly_session_id || req.cookies?.sessionId;
      const bodyUserId = req.body.userId;
      
      console.log("Checkout authentication attempt via alternative methods:", {
        headerUserId: headerUserId || 'not_present',
        headerSessionId: headerSessionId || 'not_present',
        cookieSessionId: cookieSessionId || 'not_present',
        bodyUserId: bodyUserId || 'not_present'
      });
      
      // Manual session queries removed - rely on passport authentication only
      // (prevents database schema conflicts with connect-pg-simple)
      
      // If still not authenticated, use X-User-ID header or body userId as a fallback
      if (!userId) {
        if (headerUserId) {
          userId = parseInt(headerUserId, 10);
          console.log("User ID from header:", userId);
        } else if (bodyUserId) {
          userId = parseInt(bodyUserId.toString(), 10);
          console.log("User ID from request body:", userId);
        }
        
        // Verify this user exists if we found an ID
        if (userId) {
          try {
            const userQuery = await db
              .select()
              .from(users)
              .where(eq(users.id, userId));
              
            if (!userQuery.length) {
              console.log("User not found for ID:", userId);
              userId = null;
            } else {
              console.log("User verified from ID:", userQuery[0].username);
            }
          } catch (err) {
            console.error("Error verifying user:", err);
            userId = null;
          }
        }
      }
    }
    
    // If no user ID found through any method, return authentication error
    if (!userId) {
      console.log("Checkout failed: No authenticated user found");
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { ticketTierId: ticketTierIdReq, quantity: quantityReq = 1 } = req.body;

    if (!ticketTierIdReq) {
      return res.status(400).json({ error: 'Missing required parameters. ticketTierId is required.' });
    }

    try {
      const ticketTierId = parseInt(ticketTierIdReq.toString(), 10);
      const quantity = parseInt(quantityReq.toString(), 10);

      // Fetch ticket tier details with event and creator information
      const tierQuery = await db
        .select({
          tierId: ticketTiers.id,
          tierName: ticketTiers.name,
          tierDescription: ticketTiers.description,
          tierPrice: ticketTiers.price,
          tierQuantity: ticketTiers.quantity,
          stripePriceId: ticketTiers.stripePriceId,
          stripeProductId: ticketTiers.stripeProductId,
          eventId: events.id,
          eventTitle: events.title,
          eventDescription: events.description,
          eventImage: events.image,
          creatorId: events.creatorId
        })
        .from(ticketTiers)
        .leftJoin(events, eq(ticketTiers.eventId, events.id))
        .where(and(
          eq(ticketTiers.id, ticketTierId),
          eq(ticketTiers.isActive, true)
        ))
        .limit(1);

      if (!tierQuery || !tierQuery.length) {
        return res.status(404).json({ error: 'Ticket tier not found or inactive' });
      }

      const ticketTier = tierQuery[0];

      // Validate event creator can receive payments using Connect module
      const eventCreator = await validateEventCreatorForPayment(ticketTier.creatorId!);

      // For free tiers, check if Stripe Price ID exists (should be null for free tickets)
      const tierPrice = parseFloat(ticketTier.tierPrice || '0');
      if (tierPrice === 0) {
        return res.status(400).json({ error: 'Cannot create checkout session for free tickets' });
      }

      // Check if we have the required Stripe Price ID and event ID
      if (!ticketTier.stripePriceId) {
        return res.status(400).json({ error: 'Stripe Price ID not found for this ticket tier' });
      }

      if (!ticketTier.eventId) {
        return res.status(400).json({ error: 'Event not found for this ticket tier' });
      }

      // Calculate total amount and application fee
      const unitAmount = Math.round(tierPrice * 100); // Convert to cents
      const totalAmount = unitAmount * quantity;
      const applicationFeeAmount = calculateApplicationFee(totalAmount);

      // Construct the base URL properly for Stripe redirects
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const host = req.headers.host || 'localhost:5000';
      const origin = req.headers.origin || `${protocol}://${host}`;
      
      // Ensure the URL has a proper scheme
      const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

      // Create Stripe checkout session with Connect payment using pre-created Price ID
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        automatic_tax: { enabled: true },
        line_items: [
          {
            price: ticketTier.stripePriceId, // Use the pre-created Price ID
            quantity,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: eventCreator.stripeAccountId,
          },
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancel?eventId=${ticketTier.eventId}`,
        metadata: {
          eventId: ticketTier.eventId.toString(),
          ticketTierId: ticketTier.tierId.toString(),
          userId: userId.toString(),
          quantity: quantity.toString(),
          creatorId: eventCreator.id.toString(),
          applicationFeeAmount: applicationFeeAmount.toString(),
        },
      });

      // Create initial participation record
      await db.insert(eventParticipants).values({
        userId,
        eventId: ticketTier.eventId,
        ticketTierId: ticketTier.tierId,
        status: 'pending',
        ticketQuantity: quantity,
        paymentStatus: 'initiated',
        paymentIntentId: session.id, // Use paymentIntentId to store the session ID since stripeCheckoutSessionId doesn't exist
        createdAt: new Date(),
      });

      return res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({ 
        error: 'Failed to create checkout session', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ... other routes ...

  // --- QR Code Download Endpoint --- 
  app.get('/api/tickets/:participantId/qr', requireAuth, async (req: Request, res: Response) => {
    const participantId = parseInt(req.params.participantId, 10);
    const userId = (req.user as any)?.id;

    if (isNaN(participantId) || !userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      // Fetch participant record and verify ownership
      const [participant] = await db
        .select({ 
            ticketIdentifier: eventParticipants.ticketIdentifier,
            userId: eventParticipants.userId,
            eventId: eventParticipants.eventId // For filename
         })
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.id, participantId),
          eq(eventParticipants.userId, userId) // Ensure the logged-in user owns this ticket
        ))
        .limit(1);

      if (!participant || !participant.ticketIdentifier) {
        return res.status(404).json({ error: 'Ticket not found or QR not available' });
      }

      // Generate QR Code
      const qrCodeDataURL = await QRCode.toDataURL(participant.ticketIdentifier, {
         errorCorrectionLevel: 'H', // High error correction
         type: 'image/png',
         margin: 1, // Minimal margin
         scale: 8 // Size of the QR code
      });

      // Convert data URL to buffer
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');

      // Set headers for download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-qr-${participant.eventId}-${participantId}.png"`);
      res.send(imgBuffer);

    } catch (error) {
      console.error(`Error generating QR code for participant ${participantId}:`, error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });
  
  // --- Get Latest Ticket Endpoint --- 
  app.get('/api/me/latest-ticket', requireAuth, async (req: Request, res: Response) => {
     const userId = (req.user as any)?.id;
     
     if (!userId || isNaN(userId)) {
       return res.status(401).json({ error: 'User not authenticated' });
     }
     
     try {
         const [latestParticipant] = await db
            .select({ 
                id: eventParticipants.id,
                eventId: eventParticipants.eventId,
                purchaseDate: eventParticipants.purchaseDate
             })
            .from(eventParticipants)
            .where(and(
                eq(eventParticipants.userId, userId),
                eq(eventParticipants.paymentStatus, 'completed'), // Only completed purchases
                isNotNull(eventParticipants.ticketIdentifier) // Ensure QR is available
            ))
            .orderBy(desc(eventParticipants.purchaseDate)) // Get the most recent
            .limit(1);
            
        if (!latestParticipant) {
            return res.status(404).json({ message: 'No recent completed tickets found.' });
        }
        
        res.json(latestParticipant);
        
     } catch (error) {
         console.error(`Error fetching latest ticket for user ${userId}:`, error);
         res.status(500).json({ error: 'Failed to fetch latest ticket' });
     }
  });

  // --- Premium Subscription Routes ---

  // Create a checkout session for premium subscription
  app.post('/api/premium/create-checkout', async (req, res, next) => {
    // Use the checkAuthentication middleware as a function
    // This will either call next() if authenticated or return an error response
    await checkAuthentication(req, res, async () => {
      try {
        // Detailed session ID debugging
        const headerSessionId = req.headers['x-session-id'] as string;
        const cookieSessionId = req.cookies?.sessionId || req.cookies?.maly_session_id;
        const expressSessionId = req.sessionID;
        
        console.log("Premium checkout - session ID sources:", {
          'x-session-id': headerSessionId || 'not_present',
          'cookie.sessionId': req.cookies?.sessionId || 'not_present',
          'cookie.maly_session_id': req.cookies?.maly_session_id || 'not_present',
          'express.sessionID': expressSessionId || 'not_present',
          'passport_authenticated': req.isAuthenticated() ? 'yes' : 'no'
        });
        
        // At this point, the user should be authenticated and available on req.user
        // thanks to the checkAuthentication middleware
        const userId = req.user?.id;
        
        if (!userId) {
          console.log("Premium checkout - Authentication failed: No userId found after middleware");
          return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log("Premium checkout - Proceeding with userId:", userId);

        // Get the subscription type (monthly, yearly, etc.)
        const { subscriptionType = 'monthly' } = req.body;
        
        // Calculate unit amount based on subscription type (in cents)
        // Use the same prices shown in the PremiumPage component
        const unitAmount = subscriptionType === 'yearly' ? 29000 : 2900; // $290 yearly or $29 monthly
        const interval = subscriptionType === 'yearly' ? 'year' : 'month';
        
        console.log(`Premium checkout - Creating checkout with ${subscriptionType} subscription at ${unitAmount/100} USD`);

        // Get user for customer information
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId)
        });

        if (!user) {
          console.log("Premium checkout - User not found in database for ID:", userId);
          return res.status(404).json({ error: 'User not found' });
        }

        console.log("Premium checkout - Creating Stripe session for user:", user.username);

        // Create a Stripe checkout session for subscription
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          automatic_tax: { enabled: true },
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Maly Premium ${subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
                  description: `Unlock all premium features with our ${subscriptionType} subscription`,
                },
                unit_amount: unitAmount,
                recurring: {
                  interval: interval,
                },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${req.headers.origin}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/premium`,
          customer_email: user.email,
          client_reference_id: userId.toString(),
          metadata: {
            userId: userId.toString(),
            subscriptionType
          }
        });

        console.log("Premium checkout - Created Stripe session:", session.id);
        
        // Set the session ID in the response header so the client can store it
        res.setHeader('x-session-id', headerSessionId || cookieSessionId || expressSessionId || '');
        
        return res.json({ sessionId: session.id, url: session.url });
      } catch (error) {
        console.error('Error creating premium checkout session:', error);
        return res.status(500).json({ error: 'Failed to create checkout session' });
      }
    });
  });

  // Get subscription status
  app.get('/api/premium/status', checkAuthentication, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user is premium in the users table
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get active subscription if exists
      const subscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      });

      return res.json({
        isPremium: user.isPremium,
        subscription: subscription || null,
        expiresAt: subscription ? subscription.currentPeriodEnd : null
      });
    } catch (error) {
      console.error('Error getting premium status:', error);
      return res.status(500).json({ error: 'Failed to get premium status' });
    }
  });

  // Cancel subscription
  app.post('/api/premium/cancel', checkAuthentication, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get active subscription
      const subscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Cancel at period end to allow user to keep benefits until the end of the current period
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update the subscription in our database
      await db.update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, subscription.id));

      return res.json({ success: true, message: 'Subscription will be canceled at the end of the current billing period' });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Handle subscription webhook events
  app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured.');
      return res.status(500).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed:`, err);
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      // Handle the specific events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Handle both subscription and one-time payments
          if (session.mode === 'subscription') {
            await handleSubscriptionCheckout(session);
          } else if (session.mode === 'payment') {
            await handlePaymentCheckout(session);
          }
          break;
        }
          
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePayment(invoice);
          break;
        }
          
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
          
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error) {
      console.error(`Error processing webhook: ${event.type}`, error);
      return res.status(500).send('Webhook processing failed');
    }
  });

  // Helper functions for webhook handling
  async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
    // Get metadata from the session
    const userId = parseInt(session.metadata?.userId || '0');
    const subscriptionType = session.metadata?.subscriptionType || 'monthly';
    
    if (!userId) {
      console.error('No user ID in session metadata');
      return;
    }
    
    // Get the subscription from Stripe
    if (!session.subscription) {
      console.error('No subscription created with checkout session');
      return;
    }
    
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;
      
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    let dbSubscriptionId: number; // Store the DB subscription ID for payment recording
    
    // Insert subscription into database
    try {
      // Update user to premium
      await db.update(users)
        .set({ isPremium: true })
        .where(eq(users.id, userId));
        
      // Check if the subscription already exists
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subscriptionId)
      });
      
      if (existingSubscription) {
        // Update existing subscription
        await db.update(subscriptions)
          .set({
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, existingSubscription.id));
      
        dbSubscriptionId = existingSubscription.id;
      } else {
        // Create new subscription
        const [newSubscription] = await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: typeof stripeSubscription.customer === 'string' 
            ? stripeSubscription.customer 
            : stripeSubscription.customer?.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          subscriptionType,
          priceId: stripeSubscription.items.data[0]?.price.id
        }).returning();
        
        dbSubscriptionId = newSubscription.id;
      }
      
      // Record the initial payment
      // Get the latest invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        limit: 1
      });
      
      if (invoices.data.length > 0) {
        const invoice = invoices.data[0];
        
        // Get payment intent if available
        let paymentIntent = null;
        if (invoice.payment_intent) {
          const paymentIntentId = typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent.id;
          
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        }
        
        // Record the payment
        await recordSubscriptionPayment(
          dbSubscriptionId,
          userId,
          invoice,
          paymentIntent
        );
        
        console.log(`Initial payment recorded for subscription ${subscriptionId}, amount: ${invoice.amount_paid/100} ${invoice.currency}`);
      }
      
      console.log(`Successfully processed premium subscription for user ${userId}`);
    } catch (error) {
      console.error('Error storing subscription:', error);
      throw error;
    }
  }

  async function handlePaymentCheckout(session: Stripe.Checkout.Session) {
    // Handle one-time payment (existing code for event tickets)
    // **FIX**: Get userId from metadata, not client_reference_id
    const userId = parseInt(session.metadata?.userId || '0'); 
    const eventId = parseInt(session.metadata?.eventId || '0');
    const quantity = parseInt(session.metadata?.quantity || '1');
    const stripeCheckoutSessionId = session.id; // Get the actual session ID
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id; // Get the actual PI id

    console.log(`[Webhook] Received checkout.session.completed for session: ${stripeCheckoutSessionId}`);

    if (!userId || !eventId) {
      console.error(`[Webhook Error] Missing userId (${userId}) or eventId (${eventId}) in metadata for session: ${stripeCheckoutSessionId}`);
      return; // Stop processing
    }

    if (!paymentIntentId) {
        console.error(`[Webhook Error] Missing payment_intent ID in session: ${stripeCheckoutSessionId}`);
        // It's unusual but might happen in some edge cases. Decide if you want to stop or proceed.
        // For now, we'll log and potentially stop.
        return; 
    }

    console.log(`[Webhook] Processing payment checkout for user ${userId}, event ${eventId}, session ${stripeCheckoutSessionId}, PI: ${paymentIntentId}`);
    
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    
    try {
      console.log(`[Webhook] Searching for participant record for session ${stripeCheckoutSessionId} (user: ${userId}, event: ${eventId})`);
      // Find the initial participation record created when checkout started
      // Use the checkout session ID (stored in paymentIntentId column initially) to find the correct record
      const participantRecord = await db.query.eventParticipants.findFirst({
        where: and(
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.eventId, eventId),
          // IMPORTANT: We stored the session.id in paymentIntentId when creating the participant record initially
          eq(eventParticipants.paymentIntentId, stripeCheckoutSessionId) 
        )
      });

      if (!participantRecord) {
        // This is a critical error. The webhook received a completed payment, but we can't find the matching 'pending' record
        // that should have been created when the user clicked "purchase".
        console.error(`[Webhook Critical Error] Could not find initial 'pending' participation record for session ${stripeCheckoutSessionId} (user: ${userId}, event: ${eventId}). Did the initial record creation fail?`);
        // You might want to add alerting here. For now, we stop processing.
        return; 
      }
      
      console.log(`[Webhook] Found participant record ID: ${participantRecord.id}. Current status: ${participantRecord.paymentStatus}`);
      
      // Check if already processed (idempotency check)
      if (participantRecord.paymentStatus === 'completed' && participantRecord.ticketIdentifier) {
          console.log(`[Webhook Info] Participation record ${participantRecord.id} already marked as completed. Skipping update. (Session: ${stripeCheckoutSessionId})`);
          return;
      }

      // Generate a unique ticket identifier
      const ticketIdentifier = uuidv4();
      console.log(`[Webhook] Generated new ticketIdentifier: ${ticketIdentifier} for participant ID: ${participantRecord.id}`);

      // Update the event participant record with pending_approval status
      console.log(`[Webhook] Updating participant record ID: ${participantRecord.id} to status 'pending_approval' and setting paymentIntentId to ${paymentIntentId}`);
      const updateResult = await db.update(eventParticipants)
        .set({
          status: 'pending_approval', // Set status to pending_approval for host review
          paymentStatus: 'completed',
          paymentIntentId: paymentIntentId, // Update with the actual Payment Intent ID
          ticketIdentifier: ticketIdentifier,
          purchaseDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(eventParticipants.id, participantRecord.id)) // Update by the specific participant record ID
        .returning(); // Return the updated record to confirm

      if (!updateResult || updateResult.length === 0) {
          console.error(`[Webhook Error] Failed to update participant record ID: ${participantRecord.id}. Update returned no rows.`);
          // Consider adding specific error handling or retry logic here
          return;
      }

      console.log(`[Webhook] Successfully updated event participation for user ${userId}, event ${eventId}, participant ID: ${participantRecord.id}, ticket ID: ${ticketIdentifier}`);

      // Optionally, create a record in the main payments table
      if (session.amount_total && session.currency) {
        console.log(`[Webhook] Creating payment record for session ${stripeCheckoutSessionId}`);
        await db.insert(payments).values({
          userId: userId,
          eventParticipantId: participantRecord.id, // Link to the participant record
          stripeCheckoutSessionId: stripeCheckoutSessionId, // Use the actual session ID
          stripeChargeId: paymentIntentId, // Use the actual Payment Intent ID
          stripeCustomerId: stripeCustomerId,
          amount: session.amount_total, // Amount in cents
          currency: session.currency,
          status: 'succeeded',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[Webhook] Successfully created payment record for session ${stripeCheckoutSessionId}`);
      } else {
           console.warn(`[Webhook Warning] Missing amount_total or currency for session ${stripeCheckoutSessionId}. Skipping payment record creation.`);
      }
      
    } catch (error) {
      console.error(`[Webhook Error] Database error processing checkout session ${stripeCheckoutSessionId}:`, error);
      // Re-throw the error so the main webhook handler catches it and returns 500
      // This ensures Stripe knows the webhook failed and will retry.
      throw error; 
    }
  }

  async function handleInvoicePayment(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;
    
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription.id;
    
    // Get the subscription from our database
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscriptionId)
    });
    
    if (!subscription) {
      console.error(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }
    
    // Get the updated subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Update our subscription record
    await db.update(subscriptions)
      .set({
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscription.id));
    
    // Make sure the user is marked as premium
    await db.update(users)
      .set({ isPremium: true })
      .where(eq(users.id, subscription.userId));
    
    // Get payment intent if available
    let paymentIntent = null;
    if (invoice.payment_intent) {
      const paymentIntentId = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent.id;
      
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }
    
    // Record the payment in our database
    try {
      await recordSubscriptionPayment(
        subscription.id,
        subscription.userId,
        invoice,
        paymentIntent
      );
      console.log(`Payment recorded for invoice ${invoice.id}`);
    } catch (error) {
      console.error(`Error recording payment for invoice ${invoice.id}:`, error);
    }
    
    console.log(`Updated subscription for user ${subscription.userId} after invoice payment`);
  }

  async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Find the subscription in our database
    const dbSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id)
    });
    
    if (!dbSubscription) {
      console.error(`Subscription not found for update: ${subscription.id}`);
      return;
    }
    
    // Update the subscription in our database
    await db.update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, dbSubscription.id));
    
    // If the subscription is no longer active, remove premium status
    if (subscription.status !== 'active') {
      await db.update(users)
        .set({ isPremium: false })
        .where(eq(users.id, dbSubscription.userId));
    }
    
    console.log(`Updated subscription status to ${subscription.status} for user ${dbSubscription.userId}`);
  }

  async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Find the subscription in our database
    const dbSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id)
    });
    
    if (!dbSubscription) {
      console.error(`Subscription not found for deletion: ${subscription.id}`);
      return;
    }
    
    // Update the subscription in our database
    await db.update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, dbSubscription.id));
    
    // Remove premium status from the user
    await db.update(users)
      .set({ isPremium: false })
      .where(eq(users.id, dbSubscription.userId));
    
    console.log(`Marked subscription as canceled for user ${dbSubscription.userId}`);
  }

  // Get user's payment history
  app.get('/api/me/payment-history', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get payment history
      const payments = await getUserPaymentHistory(userId);
      
      return res.json({ payments });
    } catch (error) {
      console.error('Error getting payment history:', error);
      return res.status(500).json({ error: 'Failed to get payment history' });
    }
  });
  
  // Get details for a specific subscription including payment history
  app.get('/api/me/subscriptions/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id, 10);
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ error: 'Invalid subscription ID' });
      }
      
      // Get subscription
      const subscription = await db.query.subscriptions.findFirst({
        where: (subscriptions, { and, eq }) => and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId)
        )
      });
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      // Get subscription with payment history
      const subscriptionWithPayments = await getSubscriptionWithPayments(subscriptionId);
      
      return res.json(subscriptionWithPayments);
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return res.status(500).json({ error: 'Failed to get subscription details' });
    }
  });

  // Create migration for subscription_payments table if it doesn't exist
  app.post('/api/admin/create-payment-tables', async (req, res) => {
    try {
      // Check if table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'subscription_payments'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        // Create subscription_payments table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "subscription_payments" (
            "id" SERIAL PRIMARY KEY,
            "subscription_id" INTEGER NOT NULL REFERENCES "subscriptions"("id"),
            "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
            "stripe_invoice_id" TEXT UNIQUE,
            "stripe_payment_intent_id" TEXT UNIQUE,
            "amount" INTEGER NOT NULL,
            "currency" TEXT NOT NULL,
            "status" TEXT NOT NULL,
            "billing_reason" TEXT,
            "period_start" TIMESTAMP NOT NULL,
            "period_end" TIMESTAMP NOT NULL,
            "payment_method" TEXT,
            "receipt_url" TEXT,
            "created_at" TIMESTAMP DEFAULT NOW()
          );
        `);
        
        return res.json({ message: 'Payment tables created successfully' });
      } else {
        return res.json({ message: 'Payment tables already exist' });
      }
    } catch (error) {
      console.error('Error creating payment tables:', error);
      return res.status(500).json({ error: 'Failed to create payment tables' });
    }
  });

  // Get admin payment statistics
  app.get('/api/admin/payment-stats', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // First check if user is admin
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get payment statistics
      const stats = await getPaymentStats();
      
      return res.json(stats);
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return res.status(500).json({ error: 'Failed to get payment statistics' });
    }
  });

  // Get all payments (admin only)
  app.get('/api/admin/all-payments', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // First check if user is admin
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Get all payments
      const payments = await db.query.subscriptionPayments.findMany({
        orderBy: (subscriptionPayments, { desc }) => [desc(subscriptionPayments.createdAt)],
      });
      
      return res.json({ payments });
    } catch (error) {
      console.error('Error getting all payments:', error);
      return res.status(500).json({ error: 'Failed to get payment data' });
    }
  });

  // Add an endpoint to make a user an admin (ADMIN ONLY)
  app.post('/api/admin/make-admin', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate input with Zod schema
      const validationResult = makeAdminSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }
      
      const { userId } = validationResult.data;

      // Find the user by ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update the user to be an admin
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, user.id));
      
      return res.json({ 
        success: true, 
        message: `User ${user.username} is now an admin`,
        userId: user.id 
      });
    } catch (error) {
      console.error('Error making user admin:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete Event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);
      
      // Authenticate the user
      let currentUser = null;

      // Method 1: Check if user is authenticated via passport
      if (req.isAuthenticated() && req.user) {
        currentUser = req.user;
        console.log("User authenticated via passport for event deletion:", currentUser.username);
      }
      
      // Manual session queries removed - rely on passport authentication only
      // (prevents database schema conflicts with connect-pg-simple)

      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify this event exists and the user is the creator
      const [existingEvent] = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (existingEvent.creatorId !== currentUser.id) {
        return res.status(403).json({ error: "You can only delete your own events" });
      }

      // First delete all event participants
      await db.delete(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));
      
      // Then delete the event
      await db.delete(events)
        .where(eq(events.id, eventId));

      return res.json({ 
        message: "Event deleted successfully",
        eventId: eventId
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Add JWT test endpoint to demonstrate token authentication

  // GET /api/events/:eventId/applications - Fetch all pending applications for a specific event
  app.get('/api/events/:eventId/applications', requireAuth, async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId);
      const currentUser = req.user as any;

      if (!currentUser || !currentUser.id || isNaN(currentUser.id)) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify this event exists and the user is the creator
      const [existingEvent] = await db.select()
        .from(events)
        .where(eq(events.id, eventIdNum))
        .limit(1);

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (existingEvent.creatorId !== currentUser.id) {
        return res.status(403).json({ error: "You can only manage applications for your own events" });
      }

      // Fetch all pending applications with user details
      const applications = await db.select({
        id: eventParticipants.id,
        userId: eventParticipants.userId,
        status: eventParticipants.status,
        ticketQuantity: eventParticipants.ticketQuantity,
        purchaseDate: eventParticipants.purchaseDate,
        createdAt: eventParticipants.createdAt,
        // User details
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        email: users.email,
        bio: users.bio,
        location: users.location
      })
      .from(eventParticipants)
      .innerJoin(users, eq(eventParticipants.userId, users.id))
      .where(
        and(
          eq(eventParticipants.eventId, eventIdNum),
          inArray(eventParticipants.status, ['pending_approval', 'pending_access'])
        )
      )
      .orderBy(desc(eventParticipants.createdAt));

      return res.json({
        eventId: eventIdNum,
        eventTitle: existingEvent.title,
        applications,
        totalPending: applications.length
      });
    } catch (error) {
      console.error("Error fetching event applications:", error);
      res.status(500).json({ error: "Failed to fetch event applications" });
    }
  });

  // PUT /api/events/:eventId/applications/:userId - Approve or reject a pending application
  // GET individual user's application status for an event
  app.get('/api/events/:eventId/applications/:userId', requireAuth, async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const eventIdNum = parseInt(eventId);
      const userIdNum = parseInt(userId);
      const currentUser = req.user as any;

      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Users can only check their own status unless they're the event creator
      if (currentUser.id !== userIdNum) {
        // Check if current user is the event creator
        const [existingEvent] = await db.select()
          .from(events)
          .where(eq(events.id, eventIdNum))
          .limit(1);

        if (!existingEvent || existingEvent.creatorId !== currentUser.id) {
          return res.status(403).json({ error: "You can only check your own application status" });
        }
      }

      // Find the user's application for this event
      const [application] = await db.select()
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventIdNum),
            eq(eventParticipants.userId, userIdNum)
          )
        )
        .limit(1);

      if (!application) {
        return res.status(404).json({ error: "No application found" });
      }

      return res.json({
        id: application.id,
        eventId: eventIdNum,
        userId: userIdNum,
        status: application.status,
        ticketQuantity: application.ticketQuantity,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt
      });
    } catch (error) {
      console.error("Error fetching application status:", error);
      res.status(500).json({ error: "Failed to fetch application status" });
    }
  });

  app.put('/api/events/:eventId/applications/:userId', requireAuth, async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const { status } = req.body;
      const eventIdNum = parseInt(eventId);
      const userIdNum = parseInt(userId);
      const currentUser = req.user as any;

      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status. Must be 'approved' or 'rejected'" 
        });
      }

      // Verify this event exists and the user is the creator
      const [existingEvent] = await db.select()
        .from(events)
        .where(eq(events.id, eventIdNum))
        .limit(1);

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (existingEvent.creatorId !== currentUser.id) {
        return res.status(403).json({ error: "You can only manage applications for your own events" });
      }

      // Find the pending application (either RSVP or access request)
      const [application] = await db.select()
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventIdNum),
            eq(eventParticipants.userId, userIdNum),
            inArray(eventParticipants.status, ['pending_approval', 'pending_access'])
          )
        )
        .limit(1);

      if (!application) {
        return res.status(404).json({ 
          error: "Pending application not found for this user and event" 
        });
      }

      // Update the application status based on original request type
      let finalStatus = 'rejected';
      if (status === 'approved') {
        if (application.status === 'pending_approval') {
          finalStatus = 'attending'; // RSVP approval → attending
        } else if (application.status === 'pending_access') {
          finalStatus = 'interested'; // Access approval → interested (can upgrade to attending later)
        }
      }
      
      const [updatedApplication] = await db.update(eventParticipants)
        .set({
          status: finalStatus,
          updatedAt: new Date()
        })
        .where(eq(eventParticipants.id, application.id))
        .returning();

      // If approved, update the appropriate event count and add to group chat
      if (status === 'approved') {
        const ticketQuantity = application.ticketQuantity || 1;
        
        if (finalStatus === 'attending') {
          // RSVP approval → increment attending count
          const currentCount = existingEvent.attendingCount || 0;
          await db.update(events)
            .set({ 
              attendingCount: currentCount + ticketQuantity 
            })
            .where(eq(events.id, eventIdNum));
        } else if (finalStatus === 'interested') {
          // Access approval → increment interested count
          const currentCount = existingEvent.interestedCount || 0;
          await db.update(events)
            .set({ 
              interestedCount: currentCount + 1 // Access requests always count as 1
            })
            .where(eq(events.id, eventIdNum));
        }

        // Get or create event group chat and add the approved user
        try {
          const conversationId = await getOrCreateEventGroupChat(eventIdNum, currentUser.id);
          await addUserToEventGroupChat(conversationId, userIdNum);
          console.log(`User ${userIdNum} added to event ${eventIdNum} group chat (conversation ${conversationId})`);
        } catch (error) {
          console.error("Error adding user to event group chat:", error);
          // Don't fail the approval if group chat fails
        }
      }

      // Get user details for response
      const [applicantUser] = await db.select({
        username: users.username,
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

      return res.json({
        message: `Application ${status} successfully`,
        application: {
          id: updatedApplication.id,
          eventId: eventIdNum,
          userId: userIdNum,
          status: finalStatus,
          ticketQuantity: application.ticketQuantity,
          updatedAt: updatedApplication.updatedAt
        },
        applicant: applicantUser
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ error: "Failed to update application status" });
    }
  });

  app.get('/api/jwt-test', verifyToken, (req: Request, res: Response) => {
    res.json({
      message: 'JWT authentication successful!',
      user: {
        id: req.user?.id,
        username: req.user?.username,
        email: req.user?.email
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/jwt-test-optional', verifyTokenOptional, (req: Request, res: Response) => {
    if (req.user) {
      res.json({
        message: 'JWT authentication successful (optional)!',
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        message: 'No JWT token provided, but access granted (optional endpoint)',
        timestamp: new Date().toISOString()
      });
    }
  });

  console.log('[ROUTE DEBUG] Route registration completed. All routes should be available now.');
  return { app, httpServer };
}