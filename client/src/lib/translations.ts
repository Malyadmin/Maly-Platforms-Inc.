import { useLanguage } from './language-context';
import OpenAI from 'openai';

type TranslationKey = 
  | 'discover'
  | 'explore'
  | 'connect'
  | 'create'
  | 'make'
  | 'inbox'
  | 'chats'
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
  | 'cancelParticipation'
  // Hamburger Menu Sections
  | 'aiTools'
  | 'accountAndProfile'
  | 'creatorTools'
  | 'companyAndLegal'
  | 'language'
  // Menu Items
  | 'aiConcierge'
  | 'editProfile'
  | 'notificationPreferences'
  | 'creatorDashboard'
  | 'stripeConnect'
  | 'aboutMaly'
  | 'termsAndConditions'
  | 'privacyPolicy'
  | 'paymentDisclaimer'
  // Auth Page
  | 'register'
  | 'usernameOrEmail'
  | 'password'
  | 'enterYourInformation'
  | 'alreadyHaveAccount'
  | 'dontHaveAccount'
  | 'signInToAccount'
  | 'createNewAccount'
  | 'username'
  | 'email'
  | 'enterUsername'
  | 'enterUsernameOrEmail'
  | 'enterEmail'
  | 'enterPassword'
  | 'name'
  | 'enterName'
  | 'enterAge'
  | 'willNotBeDisplayed'
  | 'whereAreYouBased'
  | 'chooseYourVibe'
  | 'profilePicture'
  | 'profilePreview'
  | 'iAgreeToThe'
  | 'showPassword'
  | 'hidePassword'
  | 'events'
  | 'discover'
  // Common buttons and actions
  | 'submit'
  | 'back'
  | 'next'
  | 'done'
  | 'close'
  | 'delete'
  | 'edit'
  | 'save'
  | 'update'
  | 'confirm'
  | 'search'
  | 'filter'
  | 'sort'
  | 'view'
  | 'add'
  | 'remove'
  | 'send'
  | 'reply'
  | 'forward'
  // Validation and errors
  | 'usernameOrEmailRequired'
  | 'passwordMinLength'
  | 'usernameMinLength'
  | 'validEmailRequired'
  | 'mustAcceptTerms'
  | 'mustAcceptPrivacy'
  | 'validationError'
  | 'error'
  // DiscoverPage & Event listings
  | 'today'
  | 'thisWeek'
  | 'thisWeekend'
  | 'nextWeek'
  | 'nextWeekend'
  | 'thisMonth'
  | 'upcomingEvents'
  | 'noEventsFound'
  | 'noEventsInCity'
  | 'tryOtherCity'
  | 'anytime'
  | 'filterByTime'
  | 'filterByCity'
  | 'filterByVibe'
  | 'createFirstEvent'
  | 'beFirstToCreateEvent'
  // EventPage
  | 'purchaseFailed'
  | 'failedInitiateTicketPurchase'
  | 'success'
  | 'successfullyUpdatedParticipation'
  | 'eventNotFound'
  | 'rsvpRequestSent'
  | 'dressCode'
  | 'showMore'
  | 'showLess'
  | 'readMore'
  | 'readLess'
  | 'messageHost'
  | 'selectTicketTier'
  | 'requestToAttend'
  | 'applicationPending'
  | 'applicationApproved'
  | 'applicationDeclined'
  | 'cancelRequest'
  // InboxPage
  | 'conversations'
  | 'noConversationsYet'
  | 'noConversationsMatch'
  | 'connectWithOthers'
  | 'messages'
  | 'groups'
  | 'contacts'
  | 'rsvpRequests'
  | 'connectionRequests'
  | 'accept'
  | 'decline'
  | 'viewEvent'
  | 'participants'
  // ConnectPage
  | 'people'
  | 'filters'
  | 'allGenders'
  | 'male'
  | 'female'
  | 'nonBinary'
  | 'allVibes'
  | 'allIntentions'
  | 'addToContacts'
  | 'added'
  | 'addedSuccessfully'
  | 'failedToAddContact'
  | 'loading'
  // Event Detail strings
  | 'hostedBy'
  | 'unknownHost'
  | 'checkOutThisEvent'
  | 'shareFailed'
  | 'unableToShareEvent'
  | 'linkCopied'
  | 'eventLinkCopied'
  | 'locationCoordinatesNotAvailable'
  | 'viewMore'
  | 'viewLess'
  | 'accessRequestSent'
  | 'accessRequestSentDescription'
  | 'failedToSendAccessRequest'
  | 'failedToUpdateParticipation'
  | 'forDemoOnly'
  // Profile strings
  | 'contactAdded'
  | 'contactAddedDescription'
  | 'errorAddingContact'
  | 'contactRemoved'
  | 'contactRemovedDescription'
  | 'errorRemovingContact'
  | 'errorStartingConversation'
  | 'message'
  | 'age'
  | 'years'
  | 'profession'
  | 'location'
  | 'from'
  | 'lived'
  | 'nextStop'
  | 'lookingFor'
  | 'interests'
  | 'currentVibe'
  | 'profileNotFound'
  | 'profile'
  | 'connect'
  | 'connected'
  | 'profileLinkCopied'
  | 'occupation'
  | 'bio'
  | 'vibe'
  | 'intention'
  | 'born'
  | 'upcoming'
  | 'moodUpdated'
  | 'moodUpdatedDescription'
  | 'errorUpdatingMood'
  | 'selectYourTicket'
  | 'selected'
  | 'purchase'
  | 'selectATicket'
  | 'addCustomCity'
  | 'enterCityName'
  | 'when'
  | 'city'
  | 'vibes'
  | 'addCity'
  | 'noEventsMatchCriteria'
  | 'clearFilters'
  | 'scrollForMore'
  | 'nextMonth'
  | 'appearance'
  | 'typeMessage'
  | 'sendMessage'
  | 'newMessage'
  | 'groupChat'
  | 'directMessage'
  | 'startNewConversation'
  | 'noMessagesYet'
  | 'startConversation'
  | 'eventChat'
  | 'savedEvents'
  | 'myEvents'
  | 'hostedEvents'
  | 'attendingEvents'
  | 'noSavedEvents'
  | 'noHostedEvents'
  | 'noAttendingEvents'
  | 'viewProfile'
  | 'removeFromContacts'
  | 'pendingRequest'
  | 'requestSent'
  | 'acceptRequest'
  | 'declineRequest'
  | 'connectionPending'
  | 'loadingMore'
  | 'endOfResults'
  | 'tryDifferentFilters'
  | 'noResultsFound'
  | 'searchResults'
  | 'recentSearches'
  | 'clearHistory'
  | 'popularSearches'
  | 'seeAll'
  | 'hideAll'
  | 'sortBy'
  | 'newest'
  | 'oldest'
  | 'mostPopular'
  | 'priceHighToLow'
  | 'priceLowToHigh'
  | 'dateAscending'
  | 'dateDescending'
  // Additional ConnectPage strings
  | 'profilesFound'
  | 'profileFound'
  | 'loadingUsers'
  | 'noUsersFound'
  | 'dating'
  | 'social'
  | 'networking'
  | 'friends'
  | 'all'
  | 'allCities'
  | 'pending'
  | 'demo'
  | 'userRemovedFromContacts'
  | 'errorRemovingContact'
  | 'userAddedToContacts'
  // InboxPage additional strings
  | 'youNeedToSignIn'
  | 'signInToViewMessages'
  | 'signIn'
  | 'noMessagesYet'
  | 'noGroupChatsYet'
  | 'noConnectionsYet'
  | 'unknownUser'
  | 'groupThread'
  | 'members'
  // ProfilePage spaced headers
  | 'profileSpaced'
  | 'connectSpaced'
  // EventPage strings
  | 'exploreSpaced'
  | 'requesting'
  | 'request'
  | 'attending'
  | 'rsvp'
  | 'xAttending'
  | 'xInterested'
  | 'xAvailable'
  // ChatbotPage strings
  | 'conciergeSpaced'
  | 'cityGuide'
  | 'welcomeConcierge'
  | 'conciergeBetaDescription'
  // CreateEventFlowPage strings
  | 'createSpaced'
  | 'createYourEvent'
  | 'promoteOrShare'
  | 'eventTitle'
  | 'conciseAndEngaging'
  | 'eventSummary'
  | 'briefOverview'
  | 'buildYourEventGallery'
  | 'addHighResPhotos'
  | 'firstPictureFlyer'
  | 'tooManyImages'
  | 'maxImagesAllowed'
  | 'validationError'
  | 'atLeastOneImage'
  | 'eventDetails'
  | 'setLocationSchedule'
  | 'onlineEvent'
  | 'hostedVirtually'
  | 'eventVisibility'
  | 'selectVisibility'
  | 'cityRequired'
  | 'startTypingCity'
  | 'venueAddress'
  | 'addressPlaceholder'
  | 'additionalLocationInfo'
  | 'optionalFloorNotes'
  | 'startDateTime'
  | 'endDateTime'
  | 'activitySchedule'
  | 'addItinerary'
  | 'addActivity'
  | 'eventSetup'
  | 'privacySettings'
  | 'eventPrivacy'
  | 'publicForEveryone'
  | 'requiresApproval'
  | 'guestApprovalDesc'
  | 'dressCodeLabel'
  | 'casualSmart'
  | 'genderRestrictions'
  | 'noRestriction'
  | 'requiredVibes'
  | 'selectVibes'
  | 'ticketingSetup'
  | 'eventPaid'
  | 'setTicketPrices'
  | 'eventFree'
  | 'addTicketTier'
  | 'tierName'
  | 'tierDescription'
  | 'price'
  | 'quantity'
  | 'unlimited'
  | 'reviewSubmit'
  | 'reviewEvent'
  | 'readyToPublish'
  | 'creating'
  | 'createEvent'
  | 'eventCreated'
  | 'eventLive'
  | 'errorCreating';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    events: 'Events',
    discover: 'Explore',
    explore: 'Explore',
    login: 'Login',
    connect: 'Connect',
    create: 'Create',
    make: 'Make',
    inbox: 'Chats',
    chats: 'Chats',
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
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    add: 'Add',
    remove: 'Remove',
    send: 'Send',
    reply: 'Reply',
    back: 'Back',
    next: 'Next',
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
    cancelParticipation: 'Cancel Participation',
    // Hamburger Menu Sections
    aiTools: 'AI TOOLS',
    accountAndProfile: 'ACCOUNT AND PROFILE',
    creatorTools: 'CREATOR TOOLS',
    companyAndLegal: 'COMPANY AND LEGAL',
    language: 'LANGUAGE',
    // Menu Items
    aiConcierge: 'Concierge',
    notificationPreferences: 'Notification Preferences',
    creatorDashboard: 'Creator Dashboard',
    stripeConnect: 'Stripe Connect',
    aboutMaly: 'About Maly',
    termsAndConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    paymentDisclaimer: 'Payment Disclaimer',
    // Auth Page
    register: 'Register',
    usernameOrEmail: 'Username or Email',
    password: 'Password',
    enterYourInformation: 'Enter your information to get started',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signInToAccount: 'Sign in to your Maly account',
    createNewAccount: 'Create a new account to join our community',
    enterUsername: 'Enter your username',
    enterUsernameOrEmail: 'Enter your username or email',
    enterEmail: 'Enter your email address',
    enterPassword: 'Enter your password',
    name: 'Name',
    enterName: 'Enter your name',
    enterAge: 'Enter your age',
    willNotBeDisplayed: '(will not be displayed)',
    whereAreYouBased: 'Where are you based?',
    chooseYourVibe: 'Choose your vibe',
    profilePicture: 'Profile Picture',
    profilePreview: 'Profile preview',
    iAgreeToThe: 'I agree to the',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    // Common buttons and actions
    submit: 'Submit',
    update: 'Update',
    confirm: 'Confirm',
    forward: 'Forward',
    // Validation and errors
    usernameOrEmailRequired: 'Username or email must be provided',
    passwordMinLength: 'Password must be at least 6 characters',
    usernameMinLength: 'Username must be at least 3 characters',
    validEmailRequired: 'Please enter a valid email address',
    mustAcceptTerms: 'You must accept the Terms and Conditions to register',
    mustAcceptPrivacy: 'You must accept the Privacy Policy to register',
    validationError: 'Validation Error',
    error: 'Error',
    // DiscoverPage & Event listings
    today: 'TODAY',
    thisWeek: 'THIS WEEK',
    thisWeekend: 'THIS WEEKEND',
    nextWeek: 'NEXT WEEK',
    nextWeekend: 'NEXT WEEKEND',
    thisMonth: 'THIS MONTH',
    upcomingEvents: 'UPCOMING',
    noEventsFound: 'No events found',
    noEventsInCity: 'No events yet in',
    tryOtherCity: 'Try selecting another city',
    anytime: 'Anytime',
    filterByTime: 'Filter by time',
    filterByCity: 'Filter by city',
    filterByVibe: 'Filter by vibe',
    createFirstEvent: 'Create First Event',
    beFirstToCreateEvent: 'Be the first to create an event',
    // EventPage
    purchaseFailed: 'Purchase Failed',
    failedInitiateTicketPurchase: 'Failed to initiate ticket purchase. Please try again.',
    success: 'Success',
    successfullyUpdatedParticipation: 'Successfully updated participation status',
    eventNotFound: 'Event not found',
    rsvpRequestSent: 'RSVP request sent! The host will review your application.',
    dressCode: 'Dress Code',
    showMore: 'Show more',
    showLess: 'Show less',
    readMore: 'Read more',
    readLess: 'Read less',
    messageHost: 'Message Host',
    selectTicketTier: 'Select a ticket tier',
    requestToAttend: 'Request to Attend',
    applicationPending: 'Application Pending',
    applicationApproved: 'Application Approved',
    applicationDeclined: 'Application Declined',
    cancelRequest: 'Cancel Request',
    // InboxPage
    conversations: 'Conversations',
    noConversationsYet: 'No conversations yet',
    noConversationsMatch: 'No conversations match your search',
    connectWithOthers: 'Connect with others to start messaging',
    messages: 'Messages',
    groups: 'Groups',
    contacts: 'Contacts',
    rsvpRequests: 'RSVP Requests',
    connectionRequests: 'Connection Requests',
    accept: 'Accept',
    decline: 'Decline',
    viewEvent: 'View Event',
    participants: 'participants',
    // ConnectPage
    people: 'People',
    filters: 'Filters',
    allGenders: 'All Genders',
    male: 'Male',
    female: 'Female',
    nonBinary: 'Non-Binary',
    allVibes: 'All Vibes',
    allIntentions: 'All Intentions',
    addToContacts: 'Add to Contacts',
    added: 'Added',
    addedSuccessfully: 'Added successfully',
    failedToAddContact: 'Failed to add contact',
    loading: 'Loading...',
    // Event Detail strings
    hostedBy: 'Hosted by',
    unknownHost: 'Unknown Host',
    checkOutThisEvent: 'Check out this event:',
    shareFailed: 'Share failed',
    unableToShareEvent: 'Unable to share this event',
    linkCopied: 'Link copied!',
    eventLinkCopied: 'Event link copied to clipboard',
    locationCoordinatesNotAvailable: 'Location coordinates not available',
    viewMore: 'View More',
    viewLess: 'View Less',
    accessRequestSent: 'Access Request Sent',
    accessRequestSentDescription: 'Your request has been sent to the event host for approval',
    failedToSendAccessRequest: 'Failed to send access request',
    failedToUpdateParticipation: 'Failed to update participation status',
    forDemoOnly: 'FOR DEMO ONLY',
    // Profile strings
    contactAdded: 'Contact added',
    contactAddedDescription: "They've been added to your contacts.",
    errorAddingContact: 'Error adding contact',
    contactRemoved: 'Contact removed',
    contactRemovedDescription: "They've been removed from your contacts.",
    errorRemovingContact: 'Error removing contact',
    errorStartingConversation: 'Error starting conversation',
    message: 'Message',
    age: 'Age',
    years: 'years',
    profession: 'Profession',
    location: 'Location',
    from: 'From',
    lived: 'Lived',
    nextStop: 'Next Stop',
    lookingFor: 'Looking For',
    interests: 'Interests',
    currentVibe: 'Current Vibe',
    profileNotFound: 'Profile not found',
    connect: 'Connect',
    connected: 'Connected',
    profileLinkCopied: 'Profile link copied to clipboard',
    occupation: 'Occupation',
    bio: 'Bio',
    vibe: 'Vibe',
    intention: 'Intention',
    born: 'Born',
    upcoming: 'Upcoming',
    moodUpdated: 'Mood updated',
    moodUpdatedDescription: 'Your mood has been updated successfully.',
    errorUpdatingMood: 'Error updating mood',
    selectYourTicket: 'Select Your Ticket',
    selected: 'Selected',
    purchase: 'Purchase',
    selectATicket: 'Select a ticket',
    addCustomCity: 'Add Custom City',
    enterCityName: 'Enter city name',
    when: 'When',
    city: 'City',
    vibes: 'Vibes',
    addCity: '+ Add City',
    noEventsMatchCriteria: 'No events match your search criteria',
    clearFilters: 'Clear Filters',
    scrollForMore: 'Scroll for more events',
    nextMonth: 'NEXT MONTH',
    appearance: 'Appearance',
    typeMessage: 'Type a message...',
    sendMessage: 'Send message',
    newMessage: 'New Message',
    groupChat: 'Group Chat',
    directMessage: 'Direct Message',
    startNewConversation: 'Start a new conversation',
    noMessagesYet: 'No messages yet',
    startConversation: 'Start the conversation',
    eventChat: 'Event Chat',
    savedEvents: 'Saved Events',
    myEvents: 'My Events',
    hostedEvents: 'Hosted Events',
    attendingEvents: 'Attending Events',
    noSavedEvents: 'No saved events',
    noHostedEvents: 'No hosted events',
    noAttendingEvents: 'No attending events',
    viewProfile: 'View Profile',
    removeFromContacts: 'Remove from Contacts',
    pendingRequest: 'Pending Request',
    requestSent: 'Request Sent',
    acceptRequest: 'Accept Request',
    declineRequest: 'Decline Request',
    connectionPending: 'Connection Pending',
    loadingMore: 'Loading more...',
    endOfResults: 'End of results',
    tryDifferentFilters: 'Try different filters',
    noResultsFound: 'No results found',
    searchResults: 'Search Results',
    recentSearches: 'Recent Searches',
    clearHistory: 'Clear History',
    popularSearches: 'Popular Searches',
    seeAll: 'See All',
    hideAll: 'Hide All',
    sortBy: 'Sort By',
    newest: 'Newest',
    oldest: 'Oldest',
    mostPopular: 'Most Popular',
    priceHighToLow: 'Price: High to Low',
    priceLowToHigh: 'Price: Low to High',
    dateAscending: 'Date: Ascending',
    dateDescending: 'Date: Descending',
    // Additional ConnectPage strings
    profilesFound: 'profiles found',
    profileFound: 'profile found',
    loadingUsers: 'Loading users...',
    noUsersFound: 'No users found',
    dating: 'Dating',
    social: 'Social',
    networking: 'Networking',
    friends: 'Friends',
    all: 'All',
    allCities: 'All Cities',
    pending: 'Pending',
    demo: 'DEMO',
    userRemovedFromContacts: 'User has been removed from your contacts.',
    errorRemovingContact: 'Error removing contact',
    userAddedToContacts: 'User has been added to your contacts.',
    // InboxPage additional strings
    youNeedToSignIn: 'You need to sign in',
    signInToViewMessages: 'Sign in to view your messages',
    signIn: 'Sign In',
    noMessagesYet: 'No messages yet',
    noGroupChatsYet: 'No group chats yet',
    noConnectionsYet: 'No connections yet',
    unknownUser: 'Unknown User',
    groupThread: 'Group Thread',
    members: 'members',
    // ProfilePage spaced headers
    profileSpaced: 'P R O F I L E',
    connectSpaced: 'C O N N E C T',
    // EventPage strings
    exploreSpaced: 'E X P L O R E',
    requesting: 'Requesting...',
    request: 'Request',
    attending: 'Attending',
    rsvp: 'RSVP',
    xAttending: 'Attending',
    xInterested: 'Interested',
    xAvailable: 'available',
    // ChatbotPage strings
    conciergeSpaced: 'C O N C I E R G E',
    cityGuide: 'City Guide',
    welcomeConcierge: "Welcome to Maly's Concierge (Beta V1.5)",
    conciergeBetaDescription: 'Restaurant Reservations, Hotel Bookings, and Community Curated Recs coming soon.',
    // CreateEventFlowPage strings
    createSpaced: 'C R E A T E',
    createYourEvent: 'Create your event',
    promoteOrShare: 'Promote or share remarkable experiences',
    eventTitle: 'Event Title',
    conciseAndEngaging: 'Concise and engaging',
    eventSummary: 'Event Summary / Invitation',
    briefOverview: 'A brief overview of your event. Use ChatGPT or similar if you need assistance.',
    buildYourEventGallery: 'Build your event gallery',
    addHighResPhotos: 'Add high resolution photos or flyer to your event',
    firstPictureFlyer: 'First picture will be your event flyer',
    tooManyImages: 'Too many images',
    maxImagesAllowed: 'Maximum 6 images allowed',
    validationError: 'Validation Error',
    atLeastOneImage: 'At least one image is required to continue',
    eventDetails: 'Event details',
    setLocationSchedule: 'Set your event location and schedule',
    onlineEvent: 'Online Event',
    hostedVirtually: 'Event will be hosted virtually',
    eventVisibility: 'Event Visibility',
    selectVisibility: 'Select visibility',
    cityRequired: 'City is required for physical events',
    startTypingCity: 'Start typing city name...',
    venueAddress: 'Venue Address',
    addressPlaceholder: 'Full address of the venue',
    additionalLocationInfo: 'Additional Location Info',
    optionalFloorNotes: 'Floor, room number, or notes (optional)',
    startDateTime: 'Start Date & Time',
    endDateTime: 'End Date & Time',
    activitySchedule: 'Activity Schedule',
    addItinerary: 'Add itinerary or schedule for your event',
    addActivity: 'Add Activity',
    eventSetup: 'Event setup',
    privacySettings: 'Set privacy and event requirements',
    eventPrivacy: 'Event Privacy',
    publicForEveryone: 'Public - visible to everyone',
    requiresApproval: 'Requires Approval',
    guestApprovalDesc: 'Guests need approval to attend',
    dressCodeLabel: 'Dress Code',
    casualSmart: 'Casual, Smart Casual, etc.',
    genderRestrictions: 'Gender Restrictions',
    noRestriction: 'No restriction',
    requiredVibes: 'Required Vibes',
    selectVibes: 'Select vibes',
    ticketingSetup: 'Ticketing setup',
    eventPaid: 'This event is paid',
    setTicketPrices: 'Set your ticket prices',
    eventFree: 'This event is free',
    addTicketTier: 'Add Ticket Tier',
    tierName: 'Tier Name',
    tierDescription: 'Description (optional)',
    price: 'Price',
    quantity: 'Quantity',
    unlimited: 'Unlimited',
    reviewSubmit: 'Review & Submit',
    reviewEvent: 'Review your event details',
    readyToPublish: 'Your event is ready to be published',
    creating: 'Creating...',
    createEvent: 'Create Event',
    eventCreated: 'Event Created',
    eventLive: 'Your event is now live!',
    errorCreating: 'Error creating event'
  },
  es: {
    events: 'Eventos',
    discover: 'Explorar',
    explore: 'Explorar',
    login: 'Iniciar Sesión',
    share: 'Compartir',
    connect: 'Conectar',
    create: 'Crear',
    make: 'Hacer',
    inbox: 'Chats',
    chats: 'Chats',
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
    connections: 'Conexiones',
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
    close: 'Cerrar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    view: 'Ver',
    add: 'Agregar',
    remove: 'Quitar',
    send: 'Enviar',
    reply: 'Responder',
    back: 'Atrás',
    next: 'Siguiente',
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
    cancelParticipation: 'Cancelar Participación',
    // Hamburger Menu Sections
    aiTools: 'HERRAMIENTAS DE IA',
    accountAndProfile: 'CUENTA Y PERFIL',
    creatorTools: 'HERRAMIENTAS DE CREADOR',
    companyAndLegal: 'EMPRESA Y LEGAL',
    language: 'IDIOMA',
    // Menu Items
    aiConcierge: 'Conserje',
    notificationPreferences: 'Preferencias de Notificación',
    creatorDashboard: 'Panel de Creador',
    stripeConnect: 'Stripe Connect',
    aboutMaly: 'Acerca de Maly',
    termsAndConditions: 'Términos y Condiciones',
    privacyPolicy: 'Política de Privacidad',
    paymentDisclaimer: 'Descargo de Responsabilidad de Pago',
    // Auth Page
    register: 'Registrarse',
    usernameOrEmail: 'Nombre de Usuario o Correo',
    password: 'Contraseña',
    enterYourInformation: 'Ingresa tu información para comenzar',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
    signInToAccount: 'Inicia sesión en tu cuenta de Maly',
    createNewAccount: 'Crea una nueva cuenta para unirte a nuestra comunidad',
    enterUsername: 'Ingresa tu nombre de usuario',
    enterUsernameOrEmail: 'Ingresa tu nombre de usuario o correo',
    enterEmail: 'Ingresa tu dirección de correo electrónico',
    enterPassword: 'Ingresa tu contraseña',
    name: 'Nombre',
    enterName: 'Ingresa tu nombre',
    enterAge: 'Ingresa tu edad',
    willNotBeDisplayed: '(no se mostrará)',
    whereAreYouBased: '¿Dónde te encuentras?',
    chooseYourVibe: 'Elige tu ambiente',
    profilePicture: 'Foto de Perfil',
    profilePreview: 'Vista previa del perfil',
    iAgreeToThe: 'Acepto los',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    // Common buttons and actions
    submit: 'Enviar',
    update: 'Actualizar',
    confirm: 'Confirmar',
    forward: 'Reenviar',
    // Validation and errors
    usernameOrEmailRequired: 'Se debe proporcionar un nombre de usuario o correo electrónico',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    usernameMinLength: 'El nombre de usuario debe tener al menos 3 caracteres',
    validEmailRequired: 'Por favor ingresa una dirección de correo electrónico válida',
    mustAcceptTerms: 'Debes aceptar los Términos y Condiciones para registrarte',
    mustAcceptPrivacy: 'Debes aceptar la Política de Privacidad para registrarte',
    validationError: 'Error de Validación',
    error: 'Error',
    // DiscoverPage & Event listings
    today: 'HOY',
    thisWeek: 'ESTA SEMANA',
    thisWeekend: 'ESTE FIN DE SEMANA',
    nextWeek: 'PRÓXIMA SEMANA',
    nextWeekend: 'PRÓXIMO FIN DE SEMANA',
    thisMonth: 'ESTE MES',
    upcomingEvents: 'PRÓXIMOS',
    noEventsFound: 'No se encontraron eventos',
    noEventsInCity: 'Aún no hay eventos en',
    tryOtherCity: 'Intenta seleccionar otra ciudad',
    anytime: 'Cualquier momento',
    filterByTime: 'Filtrar por tiempo',
    filterByCity: 'Filtrar por ciudad',
    filterByVibe: 'Filtrar por ambiente',
    createFirstEvent: 'Crear Primer Evento',
    beFirstToCreateEvent: 'Sé el primero en crear un evento',
    // EventPage
    purchaseFailed: 'Compra Fallida',
    failedInitiateTicketPurchase: 'No se pudo iniciar la compra de entradas. Por favor, inténtalo de nuevo.',
    success: 'Éxito',
    successfullyUpdatedParticipation: 'Estado de participación actualizado exitosamente',
    eventNotFound: 'Evento no encontrado',
    rsvpRequestSent: '¡Solicitud RSVP enviada! El anfitrión revisará tu solicitud.',
    dressCode: 'Código de Vestimenta',
    showMore: 'Mostrar más',
    showLess: 'Mostrar menos',
    readMore: 'Leer más',
    readLess: 'Leer menos',
    messageHost: 'Mensaje al Anfitrión',
    selectTicketTier: 'Selecciona un tipo de entrada',
    requestToAttend: 'Solicitar Asistir',
    applicationPending: 'Solicitud Pendiente',
    applicationApproved: 'Solicitud Aprobada',
    applicationDeclined: 'Solicitud Rechazada',
    cancelRequest: 'Cancelar Solicitud',
    // InboxPage
    conversations: 'Conversaciones',
    noConversationsYet: 'Aún no hay conversaciones',
    noConversationsMatch: 'Ninguna conversación coincide con tu búsqueda',
    connectWithOthers: 'Conecta con otros para comenzar a enviar mensajes',
    messages: 'Mensajes',
    groups: 'Grupos',
    contacts: 'Contactos',
    rsvpRequests: 'Solicitudes RSVP',
    connectionRequests: 'Solicitudes de Conexión',
    accept: 'Aceptar',
    decline: 'Rechazar',
    viewEvent: 'Ver Evento',
    participants: 'participantes',
    // ConnectPage
    people: 'Personas',
    filters: 'Filtros',
    allGenders: 'Todos los Géneros',
    male: 'Masculino',
    female: 'Femenino',
    nonBinary: 'No Binario',
    allVibes: 'Todos los Ambientes',
    allIntentions: 'Todas las Intenciones',
    addToContacts: 'Agregar a Contactos',
    added: 'Agregado',
    addedSuccessfully: 'Agregado exitosamente',
    failedToAddContact: 'No se pudo agregar contacto',
    loading: 'Cargando...',
    // Event Detail strings
    hostedBy: 'Organizado por',
    unknownHost: 'Anfitrión Desconocido',
    checkOutThisEvent: 'Mira este evento:',
    shareFailed: 'Error al compartir',
    unableToShareEvent: 'No se puede compartir este evento',
    linkCopied: '¡Enlace copiado!',
    eventLinkCopied: 'Enlace del evento copiado al portapapeles',
    locationCoordinatesNotAvailable: 'Coordenadas de ubicación no disponibles',
    viewMore: 'Ver Más',
    viewLess: 'Ver Menos',
    accessRequestSent: 'Solicitud de Acceso Enviada',
    accessRequestSentDescription: 'Tu solicitud ha sido enviada al anfitrión del evento para su aprobación',
    failedToSendAccessRequest: 'No se pudo enviar la solicitud de acceso',
    failedToUpdateParticipation: 'No se pudo actualizar el estado de participación',
    forDemoOnly: 'SOLO PARA DEMO',
    // Profile strings
    contactAdded: 'Contacto agregado',
    contactAddedDescription: 'Se ha agregado a tus contactos.',
    errorAddingContact: 'Error al agregar contacto',
    contactRemoved: 'Contacto eliminado',
    contactRemovedDescription: 'Se ha eliminado de tus contactos.',
    errorRemovingContact: 'Error al eliminar contacto',
    errorStartingConversation: 'Error al iniciar conversación',
    message: 'Mensaje',
    age: 'Edad',
    years: 'años',
    profession: 'Profesión',
    location: 'Ubicación',
    from: 'De',
    lived: 'Vivió',
    nextStop: 'Próxima Parada',
    lookingFor: 'Busco',
    interests: 'Intereses',
    currentVibe: 'Ambiente Actual',
    profileNotFound: 'Perfil no encontrado',
    connect: 'Conectar',
    connected: 'Conectado',
    profileLinkCopied: 'Enlace de perfil copiado al portapapeles',
    occupation: 'Ocupación',
    bio: 'Bio',
    vibe: 'Ambiente',
    intention: 'Intención',
    born: 'Nacido',
    upcoming: 'Próximo',
    moodUpdated: 'Ambiente actualizado',
    moodUpdatedDescription: 'Tu ambiente ha sido actualizado exitosamente.',
    errorUpdatingMood: 'Error al actualizar ambiente',
    selectYourTicket: 'Selecciona Tu Entrada',
    selected: 'Seleccionado',
    purchase: 'Comprar',
    selectATicket: 'Selecciona una entrada',
    addCustomCity: 'Agregar Ciudad Personalizada',
    enterCityName: 'Ingresa el nombre de la ciudad',
    when: 'Cuándo',
    city: 'Ciudad',
    vibes: 'Ambientes',
    addCity: '+ Agregar Ciudad',
    noEventsMatchCriteria: 'No hay eventos que coincidan con tu búsqueda',
    clearFilters: 'Borrar Filtros',
    scrollForMore: 'Desplázate para ver más eventos',
    nextMonth: 'PRÓXIMO MES',
    appearance: 'Apariencia',
    typeMessage: 'Escribe un mensaje...',
    sendMessage: 'Enviar mensaje',
    newMessage: 'Nuevo Mensaje',
    groupChat: 'Chat Grupal',
    directMessage: 'Mensaje Directo',
    startNewConversation: 'Iniciar una nueva conversación',
    noMessagesYet: 'Aún no hay mensajes',
    startConversation: 'Iniciar la conversación',
    eventChat: 'Chat del Evento',
    savedEvents: 'Eventos Guardados',
    myEvents: 'Mis Eventos',
    hostedEvents: 'Eventos Organizados',
    attendingEvents: 'Eventos a los que Asistes',
    noSavedEvents: 'No hay eventos guardados',
    noHostedEvents: 'No hay eventos organizados',
    noAttendingEvents: 'No hay eventos a los que asistas',
    viewProfile: 'Ver Perfil',
    removeFromContacts: 'Eliminar de Contactos',
    pendingRequest: 'Solicitud Pendiente',
    requestSent: 'Solicitud Enviada',
    acceptRequest: 'Aceptar Solicitud',
    declineRequest: 'Rechazar Solicitud',
    connectionPending: 'Conexión Pendiente',
    loadingMore: 'Cargando más...',
    endOfResults: 'Fin de los resultados',
    tryDifferentFilters: 'Prueba filtros diferentes',
    noResultsFound: 'No se encontraron resultados',
    searchResults: 'Resultados de Búsqueda',
    recentSearches: 'Búsquedas Recientes',
    clearHistory: 'Borrar Historial',
    popularSearches: 'Búsquedas Populares',
    seeAll: 'Ver Todo',
    hideAll: 'Ocultar Todo',
    sortBy: 'Ordenar Por',
    newest: 'Más Nuevos',
    oldest: 'Más Antiguos',
    mostPopular: 'Más Populares',
    priceHighToLow: 'Precio: Mayor a Menor',
    priceLowToHigh: 'Precio: Menor a Mayor',
    dateAscending: 'Fecha: Ascendente',
    dateDescending: 'Fecha: Descendente',
    // Additional ConnectPage strings
    profilesFound: 'perfiles encontrados',
    profileFound: 'perfil encontrado',
    loadingUsers: 'Cargando usuarios...',
    noUsersFound: 'No se encontraron usuarios',
    dating: 'Citas',
    social: 'Social',
    networking: 'Networking',
    friends: 'Amigos',
    all: 'Todos',
    allCities: 'Todas las Ciudades',
    pending: 'Pendiente',
    demo: 'DEMO',
    userRemovedFromContacts: 'Usuario eliminado de tus contactos.',
    errorRemovingContact: 'Error al eliminar contacto',
    userAddedToContacts: 'Usuario agregado a tus contactos.',
    // InboxPage additional strings
    youNeedToSignIn: 'Necesitas iniciar sesión',
    signInToViewMessages: 'Inicia sesión para ver tus mensajes',
    signIn: 'Iniciar Sesión',
    noMessagesYet: 'Aún no hay mensajes',
    noGroupChatsYet: 'Aún no hay chats grupales',
    noConnectionsYet: 'Aún no hay conexiones',
    unknownUser: 'Usuario Desconocido',
    groupThread: 'Hilo Grupal',
    members: 'miembros',
    // ProfilePage spaced headers
    profileSpaced: 'P E R F I L',
    connectSpaced: 'C O N E C T A R',
    // EventPage strings
    exploreSpaced: 'E X P L O R A R',
    requesting: 'Solicitando...',
    request: 'Solicitar',
    attending: 'Asistiendo',
    rsvp: 'RSVP',
    xAttending: 'Asistiendo',
    xInterested: 'Interesados',
    xAvailable: 'disponibles',
    // ChatbotPage strings
    conciergeSpaced: 'C O N S E R J E',
    cityGuide: 'Guía de Ciudad',
    welcomeConcierge: 'Bienvenido al Conserje de Maly (Beta V1.5)',
    conciergeBetaDescription: 'Próximamente: Reservaciones de restaurantes, reservas de hotel y recomendaciones de la comunidad.',
    // CreateEventFlowPage strings
    createSpaced: 'C R E A R',
    createYourEvent: 'Crea tu evento',
    promoteOrShare: 'Promociona o comparte experiencias extraordinarias',
    eventTitle: 'Título del Evento',
    conciseAndEngaging: 'Conciso y atractivo',
    eventSummary: 'Resumen del Evento / Invitación',
    briefOverview: 'Una breve descripción de tu evento. Usa ChatGPT o similar si necesitas ayuda.',
    buildYourEventGallery: 'Construye tu galería de eventos',
    addHighResPhotos: 'Agrega fotos en alta resolución o flyer a tu evento',
    firstPictureFlyer: 'La primera imagen será el flyer de tu evento',
    tooManyImages: 'Demasiadas imágenes',
    maxImagesAllowed: 'Máximo 6 imágenes permitidas',
    validationError: 'Error de Validación',
    atLeastOneImage: 'Se requiere al menos una imagen para continuar',
    eventDetails: 'Detalles del evento',
    setLocationSchedule: 'Establece la ubicación y horario de tu evento',
    onlineEvent: 'Evento en Línea',
    hostedVirtually: 'El evento será virtual',
    eventVisibility: 'Visibilidad del Evento',
    selectVisibility: 'Seleccionar visibilidad',
    cityRequired: 'La ciudad es requerida para eventos presenciales',
    startTypingCity: 'Comienza a escribir el nombre de la ciudad...',
    venueAddress: 'Dirección del Lugar',
    addressPlaceholder: 'Dirección completa del lugar',
    additionalLocationInfo: 'Información Adicional de Ubicación',
    optionalFloorNotes: 'Piso, número de sala o notas (opcional)',
    startDateTime: 'Fecha y Hora de Inicio',
    endDateTime: 'Fecha y Hora de Fin',
    activitySchedule: 'Horario de Actividades',
    addItinerary: 'Agrega itinerario u horario para tu evento',
    addActivity: 'Agregar Actividad',
    eventSetup: 'Configuración del evento',
    privacySettings: 'Establece privacidad y requisitos del evento',
    eventPrivacy: 'Privacidad del Evento',
    publicForEveryone: 'Público - visible para todos',
    requiresApproval: 'Requiere Aprobación',
    guestApprovalDesc: 'Los invitados necesitan aprobación para asistir',
    dressCodeLabel: 'Código de Vestimenta',
    casualSmart: 'Casual, Smart Casual, etc.',
    genderRestrictions: 'Restricciones de Género',
    noRestriction: 'Sin restricción',
    requiredVibes: 'Vibes Requeridas',
    selectVibes: 'Seleccionar vibes',
    ticketingSetup: 'Configuración de entradas',
    eventPaid: 'Este evento es de pago',
    setTicketPrices: 'Establece los precios de tus entradas',
    eventFree: 'Este evento es gratuito',
    addTicketTier: 'Agregar Nivel de Entrada',
    tierName: 'Nombre del Nivel',
    tierDescription: 'Descripción (opcional)',
    price: 'Precio',
    quantity: 'Cantidad',
    unlimited: 'Ilimitado',
    reviewSubmit: 'Revisar y Enviar',
    reviewEvent: 'Revisa los detalles de tu evento',
    readyToPublish: 'Tu evento está listo para publicarse',
    creating: 'Creando...',
    createEvent: 'Crear Evento',
    eventCreated: 'Evento Creado',
    eventLive: '¡Tu evento ya está publicado!',
    errorCreating: 'Error al crear el evento'
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