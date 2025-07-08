import { useLanguage } from './language-context';
import OpenAI from 'openai';

type TranslationKey = 
  | 'discover'
  | 'connect'
  | 'create'
  | 'make'
  | 'inbox'
  | 'profile'
  | 'settings'
  | 'guide'
  | 'searchEvents'
  | 'allCategories'
  | 'thisWeekend'
  | 'nextWeek'
  | 'buyTickets'
  | 'saveEvent'
  | 'publishEvent'
  | 'processingPurchase'
  | 'redirectingToCheckout'
  | 'eventSaved'
  | 'findInSavedEvents'
  | 'concierge'
  | 'languageSettings'
  | 'selectYourLanguage'
  | 'premiumUpgrade'
  | 'translator'
  | 'logout'
  | 'adminPanel'
  | 'myProfile'
  | 'home'
  | 'pageNotFound'
  | 'filters'
  | 'connections'
  | 'save'
  | 'edit'
  | 'delete'
  | 'yourNetwork'
  | 'incomingRequests'
  | 'searchMessages'
  | 'noConversationsYet'
  | 'noConversationsMatch'
  | 'connectWithOthers'
  | 'findConnections'
  | 'location'
  | 'category'
  | 'categoryFiltering'
  | 'locationBasedDiscovery'
  | 'eventManagement'
  | 'navigation'
  | 'welcomeToCommunity'
  | 'profileSetup'
  | 'digitalNomads'
  | 'allLocations'
  | 'selectCity'
  | 'createEvent'
  | 'eventsFound'
  | 'searchByVibe'
  | 'eventsThisMonth'
  | 'free'
  | 'perPerson'
  | 'cities'
  | 'vibe'
  | 'allCities'
  | 'selectVibes'
  | 'findPeopleWithSimilarVibes'
  | 'clearAll'
  | 'searchByName'
  | 'addPhotosFlyer'
  | 'eventTitle'
  | 'fillEventDetails'
  | 'vibesForEvent'
  | 'eventLocation'
  | 'eventDate'
  | 'paid'
  | 'yourStatus'
  | 'eventOptions'
  | 'editEvent'
  | 'deleteEvent'
  | 'interested'
  | 'attending'
  | 'getTickets'
  | 'about'
  | 'eventSchedule'
  | 'attendees'
  | 'more'
  | 'price'
  | 'recommendedForYou'
  | 'trending'
  | 'addItem'
  | 'startTime'
  | 'endTime'
  | 'description'
  | 'addAnotherItem'
  | 'noScheduleItems'
  | 'bestRooftops'
  | 'bestDateSpots'
  | 'bestDayTrips'
  | 'findingLocalInsights'
  | 'askAnythingAbout'
  | 'conciergeGreeting'
  | 'premiumAdPartner'
  | 'letsGetStarted'
  | 'Party & Nightlife'
  | 'Fashion & Style'
  | 'Networking & Business'
  | 'Dining & Drinks'
  | 'Outdoor & Nature'
  | 'Wellness & Fitness'
  | 'Creative & Artsy'
  | 'Single & Social'
  | 'Chill & Recharge'
  | 'Adventure & Exploring'
  | 'Spiritual & Intentional'
  | 'editProfile'
  | 'shareProfile'
  | 'connectProfile'
  | 'viewLocations'
  | 'moodAndVibe'
  | 'shareModalTitle'
  | 'shareModalDescription'
  | 'copy'
  | 'copied'
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'done'
  | 'yourStatus'
  | 'eventOptions'
  | 'editEvent'
  | 'deleteEvent'
  | 'interested'
  | 'attending'
  | 'free'
  | 'perPerson'
  | 'getTickets'
  | 'about'
  | 'eventSchedule'
  | 'attendees'
  // Profile Edit Page Translations
  | 'fullName'
  | 'username'
  | 'usernameCannotBeChanged'
  | 'gender'
  | 'selectGender'
  | 'male'
  | 'female'
  | 'nonBinary'
  | 'other'
  | 'preferNotToSay'
  | 'sexualOrientation'
  | 'selectOrientation'
  | 'straight'
  | 'gay'
  | 'lesbian'
  | 'bisexual'
  | 'pansexual'
  | 'asexual'
  | 'queer'
  | 'questioning'
  | 'age'
  | 'profession'
  | 'whatDoYouDo'
  | 'bio'
  | 'tellUsAboutYourself'
  | 'locations'
  | 'currentLocation'
  | 'selectYourCurrentLocation'
  | 'born'
  | 'whereWereYouBorn'
  | 'raised'
  | 'whereWereYouRaised'
  | 'lived'
  | 'meaningfulPlaceLived'
  | 'upcomingLocation'
  | 'whereAreYouGoingNext'
  | 'vibeAndMood'
  | 'selectVibeAndMood'
  | 'changePhoto'
  | 'cancel'
  | 'saveChanges'
  | 'saving'
  | 'Tags are used for both your profile preferences and current mood.'
  | 'Default (purple): Selected as your preferred vibe'
  | 'Secondary (gray): Selected as your current mood'
  | 'Ringed: Selected as both preferred vibe and current mood'
  // Event Page Translations
  | 'illBeAttending'
  | 'imAttending'
  | 'imInterested'
  | 'share'
  | 'eventOrganizer'
  | 'purchaseTickets'
  | 'ticketQuantity'
  | 'ticketsAvailable'
  | 'perTicket'
  | 'subtotal'
  | 'serviceFee'
  | 'total'
  | 'backToEvent'
  | 'qrCodeTicket'
  | 'loading'
  | 'youAreNowAttending'
  | 'youAreNowInterested'
  | 'noLongerParticipating'
  | 'successfullyUpdated'
  | 'proceedToPayment'
  | 'login'
  | 'cancelParticipation';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    discover: 'Discover',
    login: 'Login',
    connect: 'Connect',
    create: 'Create',
    make: 'Make',
    inbox: 'Inbox',
    profile: 'Profile',
    settings: 'Settings',
    guide: 'City Guide',
    searchEvents: 'Search events...',
    searchMessages: 'Search messages...',
    allCategories: 'All categories',
    thisWeekend: 'THIS WEEKEND',
    nextWeek: 'NEXT WEEK',
    buyTickets: 'Buy Tickets',
    saveEvent: 'Save Event',
    publishEvent: 'Publish Event',
    processingPurchase: 'Processing Purchase',
    redirectingToCheckout: 'Redirecting to secure checkout...',
    eventSaved: 'Event Saved',
    findInSavedEvents: 'You can find this in your saved events',
    concierge: 'Concierge',
    languageSettings: 'Language Settings',
    selectYourLanguage: 'Select Your Language',
    premiumUpgrade: 'Premium Upgrade',
    translator: 'Translator',
    logout: 'Logout',
    adminPanel: 'Admin Panel',
    myProfile: 'My Profile',
    home: 'Home',
    pageNotFound: 'Page Not Found',
    filters: 'Filters',
    connections: 'Connections',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    yourNetwork: 'Your Network',
    incomingRequests: 'Incoming Requests',
    noConversationsYet: 'No conversations yet',
    noConversationsMatch: 'No conversations match your search',
    connectWithOthers: 'Connect with others to start messaging',
    findConnections: 'Find connections',
    location: 'Location',
    category: 'Category',
    categoryFiltering: 'Category filtering',
    locationBasedDiscovery: 'Location-based discovery',
    eventManagement: 'Event Management',
    navigation: 'Navigation',
    welcomeToCommunity: 'Welcome to the Community',
    profileSetup: 'Let\'s set up your profile and help you connect with like-minded nomads.',
    digitalNomads: 'digital nomads',
    allLocations: 'All Locations',
    selectCity: 'Select city',
    createEvent: 'Create Event',
    eventsFound: 'events found',
    searchByVibe: 'Search by Vibe',
    eventsThisMonth: 'EVENTS THIS MONTH',
    cities: 'Cities',
    vibe: 'Vibe',
    allCities: 'All Cities',
    selectVibes: 'Select Vibes',
    findPeopleWithSimilarVibes: 'Find people with similar vibes',
    clearAll: 'Clear all',
    searchByName: 'Search by name...',
    addPhotosFlyer: 'Add photos or flyer for your event',
    eventTitle: 'Event title',
    fillEventDetails: 'Fill in Event Details',
    vibesForEvent: 'Vibes for this Event',
    eventLocation: 'Event Location',
    eventDate: 'Event Date',
    paid: 'Paid',
    addItem: 'Add Item',
    startTime: 'Start Time',
    endTime: 'End Time',
    description: 'Description',
    addAnotherItem: 'Add Another Item',
    noScheduleItems: 'No schedule items added yet. Click "Add Item" to create your event schedule.',
    bestRooftops: 'Best Rooftops',
    bestDateSpots: 'Best Date Spots',
    bestDayTrips: 'Best Day Trips',
    findingLocalInsights: 'Finding local insights...',
    askAnythingAbout: 'Ask anything about',
    conciergeGreeting: "Hi, I'm Maly — like your local friend with great taste. I'll help you know where to go, who to know, and what to do.",
    premiumAdPartner: 'Premium Ad Partner',
    letsGetStarted: "Let's Get Started!",
    'Party & Nightlife': 'Party & Nightlife',
    'Fashion & Style': 'Fashion & Style',
    'Networking & Business': 'Networking & Business',
    'Dining & Drinks': 'Dining & Drinks',
    'Outdoor & Nature': 'Outdoor & Nature',
    'Wellness & Fitness': 'Wellness & Fitness',
    'Creative & Artsy': 'Creative & Artsy',
    'Single & Social': 'Single & Social',
    'Chill & Recharge': 'Chill & Recharge',
    'Adventure & Exploring': 'Adventure & Exploring',
    'Spiritual & Intentional': 'Spiritual & Intentional',
    editProfile: 'Edit Profile',
    shareProfile: 'Share Profile',
    connectProfile: 'Connect',
    viewLocations: 'View Locations',
    moodAndVibe: 'Mood & Vibe',
    shareModalTitle: 'Share',
    shareModalDescription: 'Share this with friends via:',
    copy: 'Copy',
    copied: 'Copied!',
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    done: 'Done',
    yourStatus: 'Your Status',
    eventOptions: 'Event Options',
    editEvent: 'Edit Event',
    deleteEvent: 'Delete Event',
    interested: 'Interested',
    attending: 'Attending',
    free: 'Free',
    perPerson: 'per person',
    getTickets: 'Get Tickets',
    about: 'About',
    eventSchedule: 'Event Schedule',
    attendees: 'Attendees',
    more: 'more',
    price: 'Price',
    recommendedForYou: 'Recommended For You',
    trending: 'Trending',
    // Profile Edit Page Translations
    fullName: 'Full Name',
    username: 'Username',
    usernameCannotBeChanged: 'Username cannot be changed',
    gender: 'Gender',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    nonBinary: 'Non-binary',
    other: 'Other',
    preferNotToSay: 'Prefer not to say',
    sexualOrientation: 'Sexual Orientation',
    selectOrientation: 'Select orientation',
    straight: 'Straight',
    gay: 'Gay',
    lesbian: 'Lesbian',
    bisexual: 'Bisexual',
    pansexual: 'Pansexual',
    asexual: 'Asexual',
    queer: 'Queer',
    questioning: 'Questioning',
    age: 'Age',
    profession: 'Profession',
    whatDoYouDo: 'What do you do?',
    bio: 'Bio',
    tellUsAboutYourself: 'Tell us about yourself',
    locations: 'Locations',
    currentLocation: 'Current Location',
    selectYourCurrentLocation: 'Select your current location',
    born: 'Born',
    whereWereYouBorn: 'Where were you born?',
    raised: 'Raised',
    whereWereYouRaised: 'Where were you raised?',
    lived: 'Lived',
    meaningfulPlaceLived: 'A meaningful place you\'ve lived',
    upcomingLocation: 'Upcoming Location',
    whereAreYouGoingNext: 'Where are you going next?',
    vibeAndMood: 'Vibe and Mood',
    selectVibeAndMood: 'Select tags that represent your vibe and mood',
    changePhoto: 'Change Photo',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    'Tags are used for both your profile preferences and current mood.': 'Tags are used for both your profile preferences and current mood.',
    'Default (purple): Selected as your preferred vibe': 'Default (purple): Selected as your preferred vibe',
    'Secondary (gray): Selected as your current mood': 'Secondary (gray): Selected as your current mood',
    'Ringed: Selected as both preferred vibe and current mood': 'Ringed: Selected as both preferred vibe and current mood',
    // Event Page Translations
    illBeAttending: 'I\'ll be attending',
    imAttending: 'I\'m attending ✓',
    imInterested: 'I\'m interested ✓',
    share: 'Share',
    eventOrganizer: 'Event Organizer',
    purchaseTickets: 'Purchase Tickets',
    ticketQuantity: 'Ticket Quantity',
    ticketsAvailable: 'tickets available',
    perTicket: 'per ticket',
    subtotal: 'Subtotal',
    serviceFee: 'Service Fee (5%)',
    total: 'Total',
    backToEvent: 'Back to Event',
    qrCodeTicket: 'After payment, you\'ll receive a QR code ticket that can be used for event entry.',
    loading: 'Loading...',
    youAreNowAttending: 'You are now attending this event!',
    youAreNowInterested: 'You are now interested in this event',
    noLongerParticipating: 'You are no longer participating in this event',
    successfullyUpdated: 'Successfully updated',
    proceedToPayment: 'Proceed to Payment',
    cancelParticipation: 'Cancel Participation'
  },
  es: {
    discover: 'Descubrir',
    login: 'Iniciar Sesión',
    share: 'Compartir',
    connect: 'Conectar',
    create: 'Crear',
    make: 'Hacer',
    inbox: 'Mensajes',
    profile: 'Perfil',
    settings: 'Ajustes',
    guide: 'Guía Local',
    searchEvents: 'Buscar eventos...',
    searchMessages: 'Buscar mensajes...',
    noConversationsYet: 'No hay conversaciones aún',
    noConversationsMatch: 'Ninguna conversación coincide con tu búsqueda',
    connectWithOthers: 'Conecta con otros para comenzar a enviar mensajes',
    findConnections: 'Encontrar conexiones',
    yourNetwork: 'Tu Red',
    incomingRequests: 'Solicitudes Entrantes',
    allCategories: 'Todas las categorías',
    thisWeekend: 'ESTE FIN DE SEMANA',
    nextWeek: 'PRÓXIMA SEMANA',
    buyTickets: 'Comprar Entradas',
    saveEvent: 'Guardar Evento',
    publishEvent: 'Publicar Evento',
    processingPurchase: 'Procesando Compra',
    redirectingToCheckout: 'Redirigiendo al pago seguro...',
    eventSaved: 'Evento Guardado',
    findInSavedEvents: 'Puedes encontrarlo en tus eventos guardados',
    concierge: 'Conserje',
    languageSettings: 'Configuración de Idioma',
    selectYourLanguage: 'Selecciona tu Idioma',
    premiumUpgrade: 'Actualización Premium',
    translator: 'Traductor',
    logout: 'Cerrar Sesión',
    adminPanel: 'Panel de Administración',
    myProfile: 'Mi Perfil',
    home: 'Inicio',
    pageNotFound: 'Página No Encontrada',
    filters: 'Filtros',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    location: 'Ubicación',
    category: 'Categoría',
    categoryFiltering: 'Filtrado por categoría',
    locationBasedDiscovery: 'Descubrimiento basado en ubicación',
    eventManagement: 'Gestión de Eventos',
    navigation: 'Navegación',
    welcomeToCommunity: 'Bienvenido a la Comunidad',
    profileSetup: 'Configuremos tu perfil y ayudemos a conectarte con nómadas afines.',
    digitalNomads: 'nómadas digitales',
    allLocations: 'Todas las Ubicaciones',
    selectCity: 'Seleccionar ciudad',
    createEvent: 'Crear Evento',
    eventsFound: 'eventos encontrados',
    searchByVibe: 'Buscar por Ambiente',
    eventsThisMonth: 'EVENTOS ESTE MES',
    cities: 'Ciudades',
    vibe: 'Ambiente',
    allCities: 'Todas las Ciudades',
    selectVibes: 'Seleccionar Ambientes',
    findPeopleWithSimilarVibes: 'Encuentra personas con ambientes similares',
    clearAll: 'Borrar todo',
    searchByName: 'Buscar por nombre...',
    addPhotosFlyer: 'Añadir fotos o folleto para tu evento',
    eventTitle: 'Título del evento',
    fillEventDetails: 'Completar detalles del evento',
    vibesForEvent: 'Ambientes para este evento',
    eventLocation: 'Ubicación del evento',
    eventDate: 'Fecha del evento',
    paid: 'De pago',
    addItem: 'Añadir elemento',
    startTime: 'Hora de inicio',
    endTime: 'Hora de fin',
    description: 'Descripción',
    addAnotherItem: 'Añadir otro elemento',
    noScheduleItems: 'Aún no hay elementos en la agenda. Haz clic en "Añadir elemento" para crear la agenda del evento.',
    bestRooftops: 'Mejores Terrazas',
    bestDateSpots: 'Mejores Lugares para Citas',
    bestDayTrips: 'Mejores Excursiones de un Día',
    findingLocalInsights: 'Buscando información local...',
    askAnythingAbout: 'Pregunta cualquier cosa sobre',
    conciergeGreeting: "Hola, soy Maly — como tu amigo local con buen gusto. Te ayudaré a saber dónde ir, a quién conocer y qué hacer.",
    premiumAdPartner: 'Socio Premium de Publicidad',
    letsGetStarted: "¡Comencemos!",
    'Party & Nightlife': 'Fiesta y Vida Nocturna',
    'Fashion & Style': 'Moda y Estilo',
    'Networking & Business': 'Networking y Negocios',
    'Dining & Drinks': 'Comidas y Bebidas',
    'Outdoor & Nature': 'Aire Libre y Naturaleza',
    'Wellness & Fitness': 'Bienestar y Fitness',
    'Creative & Artsy': 'Creativo y Artístico',
    'Single & Social': 'Solteros y Social',
    'Chill & Recharge': 'Relajación y Recarga',
    'Adventure & Exploring': 'Aventura y Exploración',
    'Spiritual & Intentional': 'Espiritual e Intencional',
    editProfile: 'Editar Perfil',
    shareProfile: 'Compartir Perfil',
    connectProfile: 'Conectar',
    viewLocations: 'Ver Ubicaciones',
    moodAndVibe: 'Estado y Ambiente',
    shareModalTitle: 'Compartir',
    shareModalDescription: 'Compartir con amigos a través de:',
    copy: 'Copiar',
    copied: '¡Copiado!',
    email: 'Correo',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    done: 'Listo',
    yourStatus: 'Tu Estado',
    eventOptions: 'Opciones del Evento',
    editEvent: 'Editar Evento',
    deleteEvent: 'Eliminar Evento',
    interested: 'Interesado',
    attending: 'Asistiendo',
    free: 'Gratis',
    perPerson: 'por persona',
    getTickets: 'Obtener Entradas',
    about: 'Acerca de',
    eventSchedule: 'Programa del Evento',
    attendees: 'Asistentes',
    more: 'más',
    price: 'Precio',
    recommendedForYou: 'Recomendado Para Ti',
    trending: 'Tendencia',
    // Already added translations above, removing duplicates
    // Profile Edit Page Translations
    fullName: 'Nombre Completo',
    username: 'Nombre de Usuario',
    usernameCannotBeChanged: 'El nombre de usuario no se puede cambiar',
    gender: 'Género',
    selectGender: 'Seleccionar género',
    male: 'Masculino',
    female: 'Femenino',
    nonBinary: 'No binario',
    other: 'Otro',
    preferNotToSay: 'Prefiero no decirlo',
    sexualOrientation: 'Orientación Sexual',
    selectOrientation: 'Seleccionar orientación',
    straight: 'Heterosexual',
    gay: 'Gay',
    lesbian: 'Lesbiana',
    bisexual: 'Bisexual',
    pansexual: 'Pansexual',
    asexual: 'Asexual',
    queer: 'Queer',
    questioning: 'Cuestionando',
    age: 'Edad',
    profession: 'Profesión',
    whatDoYouDo: '¿A qué te dedicas?',
    bio: 'Biografía',
    tellUsAboutYourself: 'Cuéntanos sobre ti',
    locations: 'Ubicaciones',
    currentLocation: 'Ubicación Actual',
    selectYourCurrentLocation: 'Selecciona tu ubicación actual',
    born: 'Nacimiento',
    whereWereYouBorn: '¿Dónde naciste?',
    raised: 'Crianza',
    whereWereYouRaised: '¿Dónde te criaste?',
    lived: 'Vivido',
    meaningfulPlaceLived: 'Un lugar significativo donde hayas vivido',
    upcomingLocation: 'Próxima Ubicación',
    whereAreYouGoingNext: '¿A dónde vas después?',
    vibeAndMood: 'Ambiente y Estado',
    selectVibeAndMood: 'Selecciona etiquetas que representen tu ambiente y estado',
    changePhoto: 'Cambiar Foto',
    cancel: 'Cancelar',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',
    'Tags are used for both your profile preferences and current mood.': 'Las etiquetas se utilizan tanto para tus preferencias de perfil como para tu estado actual.',
    'Default (purple): Selected as your preferred vibe': 'Predeterminado (morado): Seleccionado como tu ambiente preferido',
    'Secondary (gray): Selected as your current mood': 'Secundario (gris): Seleccionado como tu estado actual',
    'Ringed: Selected as both preferred vibe and current mood': 'Con borde: Seleccionado como ambiente preferido y estado actual',
    // Add any missing event translations here
    illBeAttending: 'Asistiré',
    imAttending: 'Estoy asistiendo ✓',
    imInterested: 'Estoy interesado/a ✓',
    loading: 'Cargando...',
    youAreNowAttending: '¡Ahora estás asistiendo a este evento!',
    youAreNowInterested: 'Ahora estás interesado/a en este evento',
    noLongerParticipating: 'Ya no estás participando en este evento',
    successfullyUpdated: 'Actualizado con éxito',
    proceedToPayment: 'Proceder al Pago',
    purchaseTickets: 'Comprar Entradas',
    ticketQuantity: 'Cantidad de Entradas',
    ticketsAvailable: 'entradas disponibles',
    perTicket: 'por entrada',
    subtotal: 'Subtotal',
    serviceFee: 'Cargo por Servicio (5%)',
    total: 'Total',
    backToEvent: 'Volver al Evento',
    qrCodeTicket: 'Después del pago, recibirás un código QR que se puede utilizar para la entrada al evento.',
    eventOrganizer: 'Organizador del Evento',
    cancelParticipation: 'Cancelar Participación'
  }
};

// Initialize OpenAI client if API key is available
const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '', 
  dangerouslyAllowBrowser: true 
});

// Cache for translations to avoid repeated API calls
const translationCache: Record<string, Record<string, string>> = {
  'en': {},
  'es': {}
};

/**
 * Translates text using OpenAI if available, or returns the original text
 * @param text Text to translate
 * @param targetLanguage Language code to translate to
 * @returns Translated text or original if translation fails
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  // Check cache first
  const cacheKey = `${text}_${targetLanguage}`;
  if (translationCache[targetLanguage]?.[text]) {
    return translationCache[targetLanguage][text];
  }
  
  try {
    // Use OpenAI for translation
    if (openai.apiKey) {
      const prompt = `Translate the following text to ${targetLanguage === 'es' ? 'Spanish' : 'English'}: "${text}"
      Return ONLY the translated text, nothing else.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a professional translator. Provide only the translated text without any additional information." },
          { role: "user", content: prompt }
        ],
      });
      
      const translatedText = response.choices[0].message.content?.trim() || text;
      
      // Cache the result
      if (!translationCache[targetLanguage]) translationCache[targetLanguage] = {};
      translationCache[targetLanguage][text] = translatedText;
      
      return translatedText;
    }
  } catch (error) {
    console.error('Translation error:', error);
  }
  
  // Fallback: return original text if translation fails
  return text;
}

/**
 * Translates a user tag or category
 * @param tag The tag to translate
 * @param language Target language ('en' or 'es')
 */
export async function translateTag(tag: string, language: string): Promise<string> {
  // If tag is already in translations, use that directly
  const translatedTag = translations[language][tag as TranslationKey];
  if (translatedTag) return translatedTag;
  
  // Otherwise use the translation API
  return await translateText(tag, language);
}

/**
 * Translates user profile information
 * @param profile User profile data
 * @param language Target language ('en' or 'es')
 */
export async function translateUserProfile(
  profile: {
    fullName?: string | null;
    username: string;
    location?: string | null;
    tags?: string[];
  },
  language: string
): Promise<{
  fullName?: string | null;
  username: string;
  location?: string | null;
  tags?: string[];
}> {
  if (language === 'en') return profile; // No need to translate if target is English
  
  const result = { ...profile };
  
  // Translate name
  if (profile.fullName) {
    result.fullName = await translateText(profile.fullName, language);
  }
  
  // Translate location
  if (profile.location) {
    result.location = await translateText(profile.location, language);
  }
  
  // Translate tags
  if (profile.tags && profile.tags.length > 0) {
    const translatedTags = await Promise.all(
      profile.tags.map(tag => translateTag(tag, language))
    );
    result.tags = translatedTags;
  }
  
  return result;
}

/**
 * Translates event information
 * @param event Event data
 * @param language Target language ('en' or 'es')
 */
export async function translateEvent<T extends {
  title: string;
  description?: string | null;
  location?: string | null;
  category?: string | null;
  tags?: string[] | null;
  [key: string]: any;
}>(
  event: T,
  language: string
): Promise<T> {
  if (language === 'en') return event; // No need to translate if target is English
  
  const result = { ...event };
  
  // Translate title
  if (event.title) {
    result.title = await translateText(event.title, language);
  }
  
  // Translate description
  if (event.description) {
    result.description = await translateText(event.description, language);
  }
  
  // Translate location
  if (event.location) {
    result.location = await translateText(event.location, language);
  }
  
  // Translate category
  if (event.category) {
    // If category is in predefined translations, use that
    const translatedCategory = translations[language][event.category as TranslationKey];
    result.category = translatedCategory || await translateText(event.category, language);
  }
  
  // Translate tags
  if (event.tags && event.tags.length > 0) {
    const translatedTags = await Promise.all(
      event.tags.map(tag => translateTag(tag, language))
    );
    result.tags = translatedTags;
  }
  
  return result as T;
}

export function useTranslation() {
  const { language, setLanguage } = useLanguage();
  
  const t = (key: TranslationKey | string) => {
    if (typeof key === 'string' && !translations[language][key as TranslationKey]) {
      // Return the key itself if it's not found in translations
      return key;
    }
    return translations[language][key as TranslationKey] || translations['en'][key as TranslationKey];
  };

  return { t, setLanguage, language, translateText, translateUserProfile, translateTag, translateEvent };
}