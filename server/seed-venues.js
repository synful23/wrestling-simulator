// seed-venues.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Venue = require('./models/Venue');

// Load environment variables
dotenv.config();

// Venues data
const venues = [
  {
    name: 'Madison Square Garden',
    location: 'New York, NY, USA',
    capacity: 20000,
    rentalCost: 50000,
    prestige: 95,
    description: 'The world\'s most famous arena. The Mecca of professional wrestling.',
    isAvailable: true
  },
  {
    name: 'Staples Center',
    location: 'Los Angeles, CA, USA',
    capacity: 18000,
    rentalCost: 45000,
    prestige: 90,
    description: 'Home to the biggest events in Los Angeles.',
    isAvailable: true
  },
  {
    name: 'AllState Arena',
    location: 'Chicago, IL, USA',
    capacity: 16000,
    rentalCost: 35000,
    prestige: 85,
    description: 'Chicago\'s premier indoor arena with a storied wrestling history.',
    isAvailable: true
  },
  {
    name: 'Wells Fargo Center',
    location: 'Philadelphia, PA, USA',
    capacity: 17000,
    rentalCost: 32000,
    prestige: 80,
    description: 'Philadelphia\'s major venue known for passionate wrestling crowds.',
    isAvailable: true
  },
  {
    name: 'Tokyo Dome',
    location: 'Tokyo, Japan',
    capacity: 55000,
    rentalCost: 65000,
    prestige: 95,
    description: 'The iconic dome that hosts the biggest wrestling events in Japan.',
    isAvailable: true
  },
  {
    name: 'Korakuen Hall',
    location: 'Tokyo, Japan',
    capacity: 1800,
    rentalCost: 5000,
    prestige: 85,
    description: 'The spiritual home of Japanese professional wrestling.',
    isAvailable: true
  },
  {
    name: 'Hammerstein Ballroom',
    location: 'New York, NY, USA',
    capacity: 2200,
    rentalCost: 12000,
    prestige: 75,
    description: 'Historic venue famous for hosting passionate and rowdy wrestling crowds.',
    isAvailable: true
  },
  {
    name: 'Wembley Stadium',
    location: 'London, UK',
    capacity: 90000,
    rentalCost: 100000,
    prestige: 95,
    description: 'The largest stadium in the UK and one of the most prestigious venues in the world.',
    isAvailable: true
  },
  {
    name: 'Arena México',
    location: 'Mexico City, Mexico',
    capacity: 16500,
    rentalCost: 20000,
    prestige: 90,
    description: 'The cathedral of lucha libre wrestling.',
    isAvailable: true
  },
  {
    name: 'Rogers Centre',
    location: 'Toronto, ON, Canada',
    capacity: 53000,
    rentalCost: 60000,
    prestige: 85,
    description: 'Massive stadium that has hosted some of wrestling\'s biggest events.',
    isAvailable: true
  },
  {
    name: 'Barclays Center',
    location: 'Brooklyn, NY, USA',
    capacity: 16000,
    rentalCost: 40000,
    prestige: 80,
    description: 'Modern arena that has become a regular host for major wrestling events.',
    isAvailable: true
  },
  {
    name: 'Arena Ciudad de México',
    location: 'Mexico City, Mexico',
    capacity: 22000,
    rentalCost: 25000,
    prestige: 75,
    description: 'One of the largest indoor venues in Latin America.',
    isAvailable: true
  },
  {
    name: 'Ryōgoku Kokugikan',
    location: 'Tokyo, Japan',
    capacity: 11000,
    rentalCost: 20000,
    prestige: 85,
    description: 'Historic sumo hall that hosts major wrestling events.',
    isAvailable: true
  },
  {
    name: 'Alamodome',
    location: 'San Antonio, TX, USA',
    capacity: 64000,
    rentalCost: 70000,
    prestige: 80,
    description: 'Massive dome that has hosted record-breaking wrestling crowds.',
    isAvailable: true
  },
  {
    name: 'Prudential Center',
    location: 'Newark, NJ, USA',
    capacity: 17000,
    rentalCost: 30000,
    prestige: 75,
    description: 'Modern arena in the New York metro area.',
    isAvailable: true
  },
  // Mid-size venues
  {
    name: 'Hammerstein Center',
    location: 'Cleveland, OH, USA',
    capacity: 9000,
    rentalCost: 15000,
    prestige: 60,
    description: 'Mid-sized venue perfect for televised weekly shows.',
    isAvailable: true
  },
  {
    name: 'The Hydro',
    location: 'Glasgow, Scotland, UK',
    capacity: 13000,
    rentalCost: 25000,
    prestige: 70,
    description: 'Scotland\'s premier entertainment venue.',
    isAvailable: true
  },
  {
    name: 'Guangzhou Gymnasium',
    location: 'Guangzhou, China',
    capacity: 10000,
    rentalCost: 18000,
    prestige: 65,
    description: 'Modern arena for international events in China.',
    isAvailable: true
  },
  {
    name: 'Saitama Super Arena',
    location: 'Saitama, Japan',
    capacity: 22000,
    rentalCost: 30000,
    prestige: 80,
    description: 'Multi-purpose arena that can be configured for different sized events.',
    isAvailable: true
  },
  {
    name: 'Sydney Super Dome',
    location: 'Sydney, Australia',
    capacity: 21000,
    rentalCost: 35000,
    prestige: 75,
    description: 'The largest indoor entertainment venue in Australia.',
    isAvailable: true
  },
  // Smaller venues
  {
    name: 'ECW Arena',
    location: 'Philadelphia, PA, USA',
    capacity: 1300,
    rentalCost: 3000,
    prestige: 70,
    description: 'Legendary venue known for hardcore wrestling.',
    isAvailable: true
  },
  {
    name: 'The Cockpit',
    location: 'Leeds, UK',
    capacity: 800,
    rentalCost: 1500,
    prestige: 55,
    description: 'Intimate venue for independent wrestling.',
    isAvailable: true
  },
  {
    name: 'Electric Ballroom',
    location: 'London, UK',
    capacity: 1500,
    rentalCost: 4000,
    prestige: 60,
    description: 'Historic venue that hosts regular wrestling events.',
    isAvailable: true
  },
  {
    name: 'Civic Center',
    location: 'Atlanta, GA, USA',
    capacity: 6000,
    rentalCost: 10000,
    prestige: 65,
    description: 'Mid-sized venue with history of wrestling events.',
    isAvailable: true
  },
  {
    name: 'Recreation Center',
    location: 'Tampa, FL, USA',
    capacity: 3500,
    rentalCost: 6000,
    prestige: 50,
    description: 'Affordable venue for smaller promotions.',
    isAvailable: true
  }
];

// Connect to MongoDB and seed venues
const seedVenues = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check if venues already exist
    const count = await Venue.countDocuments();
    if (count > 0) {
      console.log(`${count} venues already exist. Skipping seeding.`);
      
      // If you want to force re-seeding, uncomment this line:
      // await Venue.deleteMany({});
    } else {
      // Insert venues
      const result = await Venue.insertMany(venues);
      console.log(`Successfully inserted ${result.length} venues`);
    }
    
    console.log('Venue seeding completed');
  } catch (error) {
    console.error('Error seeding venues:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding function
seedVenues();