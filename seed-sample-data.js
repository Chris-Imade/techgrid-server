const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Contact = require('./models/Contact');
const Registration = require('./models/Registration');
const Newsletter = require('./models/Newsletter');
const logger = require('./utils/logger');

// Sample data
const sampleContacts = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+2348012345678',
    subject: 'Inquiry about Tech Grid Series Event',
    message: 'Hello, I would like to know more details about the upcoming Tech Grid Series event. What topics will be covered and who are the speakers?',
    status: 'pending',
    metadata: {
      timestamp: new Date('2025-09-15T10:30:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.23.45',
      source: 'contact_form'
    }
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@techcorp.com',
    phone: '+2348087654321',
    subject: 'Partnership Opportunity',
    message: 'We are interested in partnering with Tech Grid Series for our corporate training program. Can we schedule a meeting to discuss potential collaboration?',
    status: 'processed',
    metadata: {
      timestamp: new Date('2025-09-18T14:20:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.24.67',
      source: 'contact_form'
    }
  },
  {
    name: 'Michael Chen',
    email: 'mchen@financeai.io',
    phone: '+2347012345678',
    subject: 'Speaking Opportunity',
    message: 'I am an AI researcher specializing in financial applications. Would there be an opportunity to speak at Tech Grid about AI-driven trading algorithms?',
    status: 'responded',
    emailSent: true,
    emailSentAt: new Date('2025-09-20T09:15:00Z'),
    metadata: {
      timestamp: new Date('2025-09-19T16:45:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.25.89',
      source: 'contact_form'
    }
  },
  {
    name: 'Emily Williams',
    email: 'emily.williams@startup.ng',
    phone: '+2348098765432',
    subject: 'Sponsorship Information',
    message: 'Our fintech startup is interested in sponsoring the Tech Grid event. Could you send us the sponsorship packages and benefits?',
    status: 'pending',
    metadata: {
      timestamp: new Date('2025-09-21T11:00:00Z'),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)',
      ipAddress: '102.89.26.12',
      source: 'contact_form'
    }
  },
  {
    name: 'David Okonkwo',
    email: 'david.okonkwo@bankng.com',
    phone: '+2348056789012',
    subject: 'Group Registration Query',
    message: 'We have a team of 10 professionals who want to attend. Do you offer group discounts for corporate registrations?',
    status: 'processed',
    metadata: {
      timestamp: new Date('2025-09-22T13:30:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.27.34',
      source: 'contact_form'
    }
  }
];

const sampleRegistrations = [
  {
    firstName: 'Amara',
    lastName: 'Eze',
    email: 'amara.eze@techbank.ng',
    phone: '+2348123456789',
    company: 'TechBank Nigeria',
    jobTitle: 'AI Research Lead',
    experience: 'expert',
    interests: ['ai-trading', 'risk-management', 'fraud-detection'],
    expectations: 'Looking forward to learning about cutting-edge AI applications in financial services and networking with industry leaders.',
    newsletter: true,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-10T08:00:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.30.15',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'confirmed'
    }
  },
  {
    firstName: 'Chioma',
    lastName: 'Nwosu',
    email: 'chioma.nwosu@fintechstartup.com',
    phone: '+2348034567890',
    company: 'FinTech Innovations',
    jobTitle: 'Product Manager',
    experience: 'intermediate',
    interests: ['robo-advisors', 'regulatory-compliance'],
    expectations: 'Interested in understanding how AI can improve our robo-advisory platform and ensure compliance.',
    newsletter: true,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-12T10:30:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.31.22',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'registered'
    }
  },
  {
    firstName: 'Oluwaseun',
    lastName: 'Adeyemi',
    email: 'seun.adeyemi@investcorp.ng',
    phone: '+2347045678901',
    company: 'InvestCorp Nigeria',
    jobTitle: 'Senior Data Scientist',
    experience: 'advanced',
    interests: ['ai-trading', 'fraud-detection', 'risk-management'],
    expectations: 'Want to explore practical implementations of AI in trading systems and fraud prevention.',
    newsletter: false,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-14T14:15:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.32.45',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'confirmed'
    }
  },
  {
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    email: 'fatima.ibrahim@consultant.com',
    phone: '+2348156789012',
    company: 'Financial Consulting Group',
    jobTitle: 'IT Consultant',
    experience: 'beginner',
    interests: ['regulatory-compliance', 'fraud-detection'],
    expectations: 'New to AI in finance. Hoping to understand the basics and explore career opportunities in this field.',
    newsletter: false,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-16T09:00:00Z'),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)',
      ipAddress: '102.89.33.67',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'registered'
    }
  },
  {
    firstName: 'Ifeanyi',
    lastName: 'Okafor',
    email: 'ifeanyi.okafor@digitalbank.ng',
    phone: '+2348067890123',
    company: 'Digital Bank Ltd',
    jobTitle: 'Head of Innovation',
    experience: 'expert',
    interests: ['ai-trading', 'robo-advisors', 'risk-management', 'fraud-detection'],
    expectations: 'Seeking insights on implementing comprehensive AI solutions across our banking operations.',
    newsletter: true,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-17T11:45:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.34.89',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'confirmed'
    }
  },
  {
    firstName: 'Grace',
    lastName: 'Okeke',
    email: 'grace.okeke@student.edu.ng',
    phone: '+2349078901234',
    company: 'University of Lagos',
    jobTitle: 'Graduate Student',
    experience: 'beginner',
    interests: ['ai-trading', 'robo-advisors'],
    expectations: 'Conducting research on AI applications in finance. Looking to learn from experts and gather insights for my thesis.',
    newsletter: true,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-19T15:20:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.35.12',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'registered'
    }
  },
  {
    firstName: 'Chukwudi',
    lastName: 'Nnaji',
    email: 'chukwudi.nnaji@cryptofund.io',
    phone: '+2348089012345',
    company: 'CryptoFund Africa',
    jobTitle: 'Portfolio Manager',
    experience: 'intermediate',
    interests: ['ai-trading', 'risk-management'],
    expectations: 'Interested in AI-driven strategies for cryptocurrency trading and risk assessment.',
    newsletter: false,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-20T12:00:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.36.34',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'registered'
    }
  },
  {
    firstName: 'Blessing',
    lastName: 'Chukwuma',
    email: 'blessing.c@insurancetech.ng',
    phone: '+2347090123456',
    company: 'InsuranceTech Nigeria',
    jobTitle: 'Chief Technology Officer',
    experience: 'advanced',
    interests: ['fraud-detection', 'risk-management', 'regulatory-compliance'],
    expectations: 'Exploring AI for fraud detection in insurance claims and improving risk assessment models.',
    newsletter: true,
    terms: true,
    confirmationEmailSent: true,
    metadata: {
      timestamp: new Date('2025-09-21T16:30:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.37.56',
      source: 'conference_registration',
      eventId: 'tech_grid_ai_finance_2025',
      status: 'confirmed'
    }
  }
];

const sampleNewsletterSubscriptions = [
  {
    email: 'amara.eze@techbank.ng',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-10T08:05:00Z'),
    preferences: {
      frequency: 'weekly',
      topics: ['ai-finance', 'trading-technology', 'event-updates', 'industry-insights']
    },
    tags: ['from-registration', 'confirmed-attendee'],
    metadata: {
      timestamp: new Date('2025-09-10T08:05:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.30.15',
      source: 'conference_registration',
      sourcePage: 'registration',
      status: 'subscribed'
    }
  },
  {
    email: 'chioma.nwosu@fintechstartup.com',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-12T10:35:00Z'),
    preferences: {
      frequency: 'weekly',
      topics: ['fintech-news', 'event-updates', 'industry-insights']
    },
    tags: ['from-registration'],
    metadata: {
      timestamp: new Date('2025-09-12T10:35:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.31.22',
      source: 'conference_registration',
      sourcePage: 'registration',
      status: 'subscribed'
    }
  },
  {
    email: 'ifeanyi.okafor@digitalbank.ng',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-17T11:50:00Z'),
    preferences: {
      frequency: 'weekly',
      topics: ['ai-finance', 'trading-technology', 'fintech-news', 'industry-insights']
    },
    tags: ['from-registration', 'confirmed-attendee'],
    metadata: {
      timestamp: new Date('2025-09-17T11:50:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.34.89',
      source: 'conference_registration',
      sourcePage: 'registration',
      status: 'subscribed'
    }
  },
  {
    email: 'grace.okeke@student.edu.ng',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-19T15:25:00Z'),
    preferences: {
      frequency: 'monthly',
      topics: ['ai-finance', 'event-updates']
    },
    tags: ['from-registration', 'student'],
    metadata: {
      timestamp: new Date('2025-09-19T15:25:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.35.12',
      source: 'conference_registration',
      sourcePage: 'registration',
      status: 'subscribed'
    }
  },
  {
    email: 'blessing.c@insurancetech.ng',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-21T16:35:00Z'),
    preferences: {
      frequency: 'weekly',
      topics: ['ai-finance', 'fintech-news', 'industry-insights']
    },
    tags: ['from-registration', 'confirmed-attendee', 'cto'],
    metadata: {
      timestamp: new Date('2025-09-21T16:35:00Z'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '102.89.37.56',
      source: 'conference_registration',
      sourcePage: 'registration',
      status: 'subscribed'
    }
  },
  {
    email: 'newsletter.subscriber1@gmail.com',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-08T14:00:00Z'),
    preferences: {
      frequency: 'weekly',
      topics: ['event-updates', 'industry-insights']
    },
    tags: ['direct-subscription'],
    metadata: {
      timestamp: new Date('2025-09-08T14:00:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.28.78',
      source: 'newsletter_subscription',
      sourcePage: 'homepage',
      status: 'subscribed'
    }
  },
  {
    email: 'newsletter.subscriber2@yahoo.com',
    isActive: true,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-09-11T09:30:00Z'),
    preferences: {
      frequency: 'monthly',
      topics: ['fintech-news', 'industry-insights']
    },
    tags: ['direct-subscription'],
    metadata: {
      timestamp: new Date('2025-09-11T09:30:00Z'),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)',
      ipAddress: '102.89.29.90',
      source: 'newsletter_subscription',
      sourcePage: 'blog',
      status: 'subscribed'
    }
  },
  {
    email: 'former.subscriber@outlook.com',
    isActive: false,
    welcomeEmailSent: true,
    welcomeEmailSentAt: new Date('2025-08-15T10:00:00Z'),
    unsubscribedAt: new Date('2025-09-05T16:20:00Z'),
    unsubscribeReason: 'Too many emails',
    preferences: {
      frequency: 'weekly',
      topics: ['event-updates']
    },
    tags: ['unsubscribed'],
    metadata: {
      timestamp: new Date('2025-08-15T10:00:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '102.89.27.45',
      source: 'newsletter_subscription',
      sourcePage: 'homepage',
      status: 'unsubscribed'
    }
  }
];

// Seeding function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    logger.info('Database seeding started');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await Contact.deleteMany({});
    await Registration.deleteMany({});
    await Newsletter.deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert Contacts
    console.log('\n📧 Inserting sample contacts...');
    const contacts = await Contact.insertMany(sampleContacts);
    console.log(`✅ Inserted ${contacts.length} contacts`);

    // Insert Registrations one by one to trigger pre-save hooks
    console.log('\n👥 Inserting sample registrations...');
    const registrations = [];
    for (const regData of sampleRegistrations) {
      const registration = new Registration(regData);
      await registration.save();
      registrations.push(registration);
    }
    console.log(`✅ Inserted ${registrations.length} registrations`);

    // Insert Newsletter Subscriptions
    console.log('\n📰 Inserting sample newsletter subscriptions...');
    const newsletters = await Newsletter.insertMany(sampleNewsletterSubscriptions);
    console.log(`✅ Inserted ${newsletters.length} newsletter subscriptions`);

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE SEEDING SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n📧 CONTACTS:');
    console.log(`   Total: ${contacts.length}`);
    console.log(`   Pending: ${contacts.filter(c => c.status === 'pending').length}`);
    console.log(`   Processed: ${contacts.filter(c => c.status === 'processed').length}`);
    console.log(`   Responded: ${contacts.filter(c => c.status === 'responded').length}`);

    console.log('\n👥 REGISTRATIONS:');
    console.log(`   Total: ${registrations.length}`);
    console.log(`   Beginner: ${registrations.filter(r => r.experience === 'beginner').length}`);
    console.log(`   Intermediate: ${registrations.filter(r => r.experience === 'intermediate').length}`);
    console.log(`   Advanced: ${registrations.filter(r => r.experience === 'advanced').length}`);
    console.log(`   Expert: ${registrations.filter(r => r.experience === 'expert').length}`);
    console.log(`   Subscribed to Newsletter: ${registrations.filter(r => r.newsletter).length}`);
    console.log(`   Not Subscribed: ${registrations.filter(r => !r.newsletter).length}`);

    console.log('\n📰 NEWSLETTER:');
    console.log(`   Total: ${newsletters.length}`);
    console.log(`   Active: ${newsletters.filter(n => n.isActive).length}`);
    console.log(`   Inactive: ${newsletters.filter(n => !n.isActive).length}`);
    console.log(`   From Registrations: ${newsletters.filter(n => n.tags && n.tags.includes('from-registration')).length}`);
    console.log(`   Direct Subscriptions: ${newsletters.filter(n => n.tags && n.tags.includes('direct-subscription')).length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✨ Sample data seeded successfully!');
    console.log('='.repeat(60));
    console.log('\n🚀 You can now access the dashboard at: http://localhost:3000/dashboard');
    console.log('\n💡 Test Features:');
    console.log('   ✓ View contacts and click "View" to see details');
    console.log('   ✓ Click "Reply" on a contact to test email compose');
    console.log('   ✓ Click "Newsletter" on registrations without subscription');
    console.log('   ✓ Filter and search all sections');
    console.log('   ✓ Check analytics on overview page\n');

    logger.info('Database seeding completed successfully');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    logger.error('Database seeding failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
console.log('🌱 Starting database seeding...\n');
seedDatabase();
