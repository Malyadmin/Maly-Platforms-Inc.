import type { Request, Response } from 'express';
import { openai, SYSTEM_PROMPT } from './config/openai';
import { db } from '../db';
import { events, users } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { webSearch } from './services/search';
import axios from 'axios';

// Helper function to clean response of asterisks and markdown formatting
function cleanResponse(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

// Enhanced function to query events with natural language interpretation
async function queryEventsFromUserMessage(message: string) {
  try {
    console.log('Analyzing message for event queries:', message);
    
    // Parse parameters from the message
    const params: any = {};
    
    // Extract city/location
    const cityMatch = message.match(/in\s+([^?.,]+)(?:[?,.]|$)/i);
    if (cityMatch) {
      params.city = cityMatch[1].trim();
      console.log('Detected city:', params.city);
    }
    
    // Extract category
    const categoryMatches = [
      { pattern: /art|exhibit|gallery|museum/i, category: 'Art' },
      { pattern: /music|concert|dj|band|festival/i, category: 'Music' },
      { pattern: /food|restaurant|dining|culinary|eat/i, category: 'Food' },
      { pattern: /tech|technology|coding|developer|software/i, category: 'Tech' },
      { pattern: /social|meetup|networking|mixer/i, category: 'Social' },
      { pattern: /workshop|class|learn|course/i, category: 'Workshop' },
    ];
    
    for (const match of categoryMatches) {
      if (match.pattern.test(message)) {
        params.category = match.category;
        console.log('Detected category:', params.category);
        break;
      }
    }
    
    // Extract date ranges
    if (/today|tonight/i.test(message)) {
      params.dateFrom = new Date().toISOString().split('T')[0];
      params.dateTo = new Date().toISOString().split('T')[0];
      console.log('Detected date range: Today');
    } else if (/tomorrow/i.test(message)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.dateFrom = tomorrow.toISOString().split('T')[0];
      params.dateTo = tomorrow.toISOString().split('T')[0];
      console.log('Detected date range: Tomorrow');
    } else if (/this\s+weekend/i.test(message)) {
      const now = new Date();
      // Find next Saturday
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + ((6 - now.getDay()) % 7 || 7));
      
      // Find next Sunday
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      
      params.dateFrom = saturday.toISOString().split('T')[0];
      params.dateTo = sunday.toISOString().split('T')[0];
      console.log('Detected date range: This weekend');
    } else if (/next\s+week/i.test(message)) {
      const now = new Date();
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7));
      
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      
      params.dateFrom = nextMonday.toISOString().split('T')[0];
      params.dateTo = nextSunday.toISOString().split('T')[0];
      console.log('Detected date range: Next week');
    }
    
    // Get filtered events from our AI events endpoint
    console.log('Querying AI events endpoint with params:', params);
    
    // Create URL for the internal API call
    const url = new URL('http://localhost:5000/api/ai/events');
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    // Make the request to our own endpoint
    console.log('Fetching events from:', url.toString());
    const response = await axios.get(url.toString());
    const events = response.data;
    
    console.log(`Found ${events.length} events matching criteria`);
    return events;
  } catch (error) {
    console.error('Error querying events:', error);
    return [];
  }
}

export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, context, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Set response language based on client preference
    const responseLanguage = language || 'en';
    
    // Extract city from the message prefix [City: CityName]
    let selectedCity = '';
    let cleanedMessage = message;
    const cityPrefixMatch = message.match(/^\[City:\s*([^\]]+)\]\s*/i);
    if (cityPrefixMatch) {
      selectedCity = cityPrefixMatch[1].trim();
      cleanedMessage = message.replace(cityPrefixMatch[0], '').trim();
      console.log('Extracted city from prefix:', selectedCity);
    }

    // Check if message is asking about events
    const isEventQuery = cleanedMessage.toLowerCase().includes('events') || 
                        cleanedMessage.toLowerCase().includes('going on') || 
                        cleanedMessage.toLowerCase().includes('happening') ||
                        cleanedMessage.toLowerCase().includes('things to do');

    if (isEventQuery) {
      console.log('Detected event query:', cleanedMessage);
      
      // Get filtered events based on message content using our enhanced query function
      const matchingEvents = await queryEventsFromUserMessage(cleanedMessage);
      
      if (matchingEvents && matchingEvents.length > 0) {
        // Format event data for the AI
        const formattedEvents = matchingEvents.map((event: any, index: number) => {
          const date = event.humanReadableDate || new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          });
          
          const time = new Date(event.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
          
          return {
            id: event.id,
            title: event.title,
            category: event.category,
            date: date,
            time: time,
            location: event.location,
            price: event.price === '0' ? 'Free' : `$${event.price}`,
            description: event.description?.slice(0, 100) + (event.description?.length > 100 ? '...' : '')
          };
        });
        
        // Create AI prompt with matching events included
        const eventsPrompt = `You are an event-concierge responding to user questions. Based on the query "${cleanedMessage}", 
I found the following events that match their criteria. Use ONLY these events to answer the user's question:

${formattedEvents.map((event: any, index: number) => `
EVENT ${index + 1}: ${event.title}
- ID: ${event.id}
- Category: ${event.category}
- Date: ${event.date} at ${event.time}
- Location: ${event.location}
- Price: ${event.price}
- Description: ${event.description}
`).join('\n')}

IMPORTANT: 
- Respond in ${responseLanguage === 'es' ? 'Spanish' : 'English'} language.
- Never use asterisks or markdown formatting symbols
- Use plain text formatting only
- Use line breaks and dashes for organization
Respond in a friendly, helpful tone. Only mention events from the list above. If specific events match what the user is looking for, highlight those events. Provide event details including title, date, location, and price.`;
        
        // Send to OpenAI with the enhanced context
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: eventsPrompt },
            { role: "user", content: cleanedMessage }
          ],
          max_tokens: 800
        });
        
        const response = cleanResponse(completion.choices[0].message.content || '');
        return res.json({ response });
      } else {
        // No events found, explain this to the user
        const noEventsPrompt = `You are an event concierge. The user asked about events: "${cleanedMessage}"

IMPORTANT: 
- Respond in ${responseLanguage === 'es' ? 'Spanish' : 'English'} language.
- Never use asterisks or markdown formatting symbols
- Use plain text formatting only

Unfortunately, I couldn't find any events in our database matching those criteria. In your response:
1. Apologize that you couldn't find matching events
2. Suggest they try broader search terms or different dates
3. Ask if they would like to see other events instead`;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: noEventsPrompt },
            { role: "user", content: cleanedMessage }
          ],
          max_tokens: 500
        });
        
        const response = cleanResponse(completion.choices[0].message.content || '');
        return res.json({ response });
      }
    }

    // Build city-aware system prompt
    let cityContext = '';
    if (selectedCity) {
      cityContext = `\n\nIMPORTANT CONTEXT: The user is currently interested in ${selectedCity}. Tailor all your recommendations and insights specifically for ${selectedCity}. Always reference ${selectedCity} in your responses when giving location-based advice.`;
    }

    // Default handling with city context
    const systemContent = context 
      ? (responseLanguage === 'es' 
          ? `${context}${cityContext}\n\nIMPORTANT: Respond in Spanish language. Never use asterisks or markdown formatting.` 
          : `${context}${cityContext}\n\nIMPORTANT: Never use asterisks or markdown formatting.`)
      : (responseLanguage === 'es' 
          ? `${SYSTEM_PROMPT}${cityContext}\n\nIMPORTANT: Respond in Spanish language.` 
          : `${SYSTEM_PROMPT}${cityContext}`);
      
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: cleanedMessage }
      ],
      max_tokens: 1000
    });

    const response = cleanResponse(completion.choices[0].message.content || '');
    res.json({ response });

  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to get response",
      details: error.message 
    });
  }
}
