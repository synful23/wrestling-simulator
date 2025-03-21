// random-wrestlers.js
// Script to create random wrestlers and insert them into MongoDB

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Wrestler = require('./models/Wrestler');

// Load environment variables
dotenv.config();

// Names data
const maleFirstNames = [
  'Jack', 'Ace', 'Duke', 'Rex', 'Blade', 'Stone', 'Lance', 'Max', 'Axel', 'Brick',
  'Hawk', 'Titan', 'Blaze', 'Thunder', 'Viper', 'Wolf', 'Hunter', 'Ryder', 'Maverick', 'Drake',
  'Phoenix', 'Slade', 'Jax', 'Kane', 'Dax', 'Spike', 'Gunner', 'Steel', 'Storm', 'Dash',
  'Tyler', 'Marcus', 'Zack', 'Rico', 'Dominic', 'Isaiah', 'Hiro', 'Jin', 'Miguel', 'Santiago'
];

const femaleFirstNames = [
  'Luna', 'Nova', 'Phoenix', 'Ember', 'Sierra', 'Blaze', 'Raven', 'Storm', 'Diamond', 'Scarlett',
  'Jade', 'Ruby', 'Athena', 'Venus', 'Victoria', 'Skye', 'Valkyrie', 'Ivy', 'Trinity', 'Angel',
  'Nikki', 'Tessa', 'Bianca', 'Mercedes', 'Sasha', 'Rhea', 'Natalya', 'Bayley', 'Tiffany', 'Kiana'
];

const lastNames = [
  'Storm', 'Steele', 'Knight', 'Fury', 'Power', 'Thunder', 'Wolf', 'Stone', 'Viper', 'Maverick',
  'Blaze', 'Phoenix', 'Hunter', 'Ryder', 'Black', 'Savage', 'Hawkins', 'Strong', 'Rivera', 'Cruz',
  'Rodriguez', 'Jackson', 'Smith', 'Johnson', 'Williams', 'Anderson', 'Martinez', 'Tanaka', 'Kim', 'Singh',
  'Khan', 'Patel', 'Nakamura', 'Lee', 'Chen', 'Nguyen', 'Garcia', 'Taylor', 'Brown', 'Davis'
];

const ringNames = [
  'The Apex Predator', 'The Beast', 'The Phenom', 'The Icon', 'The Game', 
  'The Viper', 'The Heartbreak Kid', 'The Architect', 'The Demon King', 'The Queen',
  'The Boss', 'The Man', 'The Empress', 'The Glamazon', 'The EST',
  'Hardcore', 'Macho', 'Rowdy', 'Stunning', 'Superfly',
  'Nature Boy', 'The Rock', 'Stone Cold', 'The Undertaker', 'American Dream'
];

const styles = ['Technical', 'High-Flyer', 'Powerhouse', 'Brawler', 'Showman', 'All-Rounder'];

const hometowns = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Miami, FL',
  'Toronto, Canada', 'Montreal, Canada', 'Mexico City, Mexico', 'London, England', 'Manchester, England',
  'Tokyo, Japan', 'Osaka, Japan', 'Seoul, South Korea', 'Melbourne, Australia', 'Sydney, Australia',
  'Paris, France', 'Berlin, Germany', 'Rome, Italy', 'Madrid, Spain', 'Moscow, Russia',
  'Cairo, Egypt', 'Mumbai, India', 'Delhi, India', 'Beijing, China', 'Shanghai, China',
  'Lagos, Nigeria', 'Johannesburg, South Africa', 'Rio de Janeiro, Brazil', 'São Paulo, Brazil', 'Buenos Aires, Argentina'
];

const signatureMovesList = [
  'Superkick', 'Spinebuster', 'Powerbomb', 'German Suplex', 'DDT',
  'Clothesline', 'Dropkick', 'Moonsault', 'Hurricanrana', 'Frog Splash',
  'Superplex', 'Figure Four', 'Sharpshooter', 'Boston Crab', 'Crossface',
  'Piledriver', 'Chokeslam', 'Powerslam', 'Suicide Dive', 'Flying Elbow',
  'Spear', 'Enzuigiri', 'Backbreaker', 'Neckbreaker', 'Leg Drop',
  'Falcon Arrow', 'Facebuster', 'Senton', 'Brainbuster', 'Stunner',
  'Air Raid Crash', 'Backhand Chop', 'Avalanche', 'Backstabber', 'Flying Forearm',
  'Diving Headbutt', 'Belly-to-Belly Suplex', 'Snap Suplex', 'Snap Mare', 'Diving Leg Drop'
];

const finishersList = [
  'The Last Ride', 'Sweet Chin Music', 'Rock Bottom', 'Tombstone Piledriver', 'Stunner',
  'RKO', 'F5', 'GTS', 'Styles Clash', 'Pedigree',
  'Attitude Adjustment', 'Sister Abigail', 'Claymore Kick', 'End of Days', 'Eclipse',
  'Bank Statement', 'Figure Eight', 'Natural Selection', 'Dis-Arm-Her', 'Rack Attack',
  'Black Mass', 'Coup de Grace', '630 Senton', 'Codebreaker', 'Skull Crushing Finale',
  'Big Ending', 'Neutralizer', 'Kinshasa', 'Phenomenal Forearm', 'Dirty Deeds',
  'Pop-up Powerbomb', 'Razors Edge', 'Jackhammer', 'Diamond Cutter', 'Batista Bomb',
  'Black Arrow', 'Curb Stomp', 'Red Arrow', 'Spiral Tap', 'Perfect Plex'
];

// Utility functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomSignatureMoves = () => {
  const numMoves = getRandomInt(1, 3);
  const moves = new Set();
  
  while (moves.size < numMoves) {
    moves.add(getRandomElement(signatureMovesList));
  }
  
  return Array.from(moves);
};

// Generate random wrestler
const generateRandomWrestler = () => {
  const gender = Math.random() > 0.7 ? 'Female' : 'Male'; // 30% chance of female
  const firstNames = gender === 'Male' ? maleFirstNames : femaleFirstNames;
  
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const includeRingName = Math.random() > 0.7; // 30% chance of ring name
  
  let name;
  if (includeRingName) {
    const ringName = getRandomElement(ringNames);
    name = `${firstName} "${ringName}" ${lastName}`;
  } else {
    name = `${firstName} ${lastName}`;
  }
  
  const attributes = {
    strength: getRandomInt(30, 95),
    agility: getRandomInt(30, 95),
    charisma: getRandomInt(30, 95),
    technical: getRandomInt(30, 95)
  };
  
  const style = getRandomElement(styles);
  
  // Adjust attributes based on style
  switch (style) {
    case 'Technical':
      attributes.technical = Math.min(attributes.technical + 15, 100);
      break;
    case 'High-Flyer':
      attributes.agility = Math.min(attributes.agility + 15, 100);
      break;
    case 'Powerhouse':
      attributes.strength = Math.min(attributes.strength + 15, 100);
      break;
    case 'Showman':
      attributes.charisma = Math.min(attributes.charisma + 15, 100);
      break;
    // All-Rounder and Brawler get no specific bonus
  }
  
  const age = getRandomInt(21, 45);
  const experience = Math.max(0, getRandomInt(0, age - 18)); // Experience cannot exceed (age - 18)
  
  // Calculate popularity based on attributes and experience
  const basePopularity = (attributes.strength + attributes.agility + attributes.charisma + attributes.technical) / 4;
  const experienceBonus = experience * 1.5;
  let popularity = Math.min(Math.round(basePopularity + experienceBonus / 10), 100);
  
  // Occasionally create a superstar with high popularity
  if (Math.random() > 0.9) {
    popularity = getRandomInt(85, 100);
  }
  
  // Calculate salary based on popularity and experience
  const baseSalary = 30000;
  const popularityMultiplier = popularity / 50;
  const experienceMultiplier = 1 + (experience / 20);
  let salary = Math.round((baseSalary * popularityMultiplier * experienceMultiplier) / 5000) * 5000; // Round to nearest 5000
  
  // Randomly make some wrestlers more or less expensive
  if (Math.random() > 0.8) {
    salary = salary * getRandomInt(12, 20) / 10;
  }
  
  return {
    name,
    gender,
    style,
    attributes,
    popularity,
    salary,
    hometown: getRandomElement(hometowns),
    age,
    experience,
    bio: `${name} is a ${experience} year veteran known for ${gender === 'Male' ? 'his' : 'her'} ${style.toLowerCase()} style.`,
    signatureMoves: getRandomSignatureMoves(),
    finisher: getRandomElement(finishersList),
    isActive: true,
    isInjured: Math.random() > 0.95 // 5% chance of being injured
  };
};

// Generate and insert wrestlers
const seedDatabase = async (count = 60) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Delete existing free agent wrestlers (optional)
    const deleteResult = await Wrestler.deleteMany({ 'contract.company': { $exists: false } });
    console.log(`Deleted ${deleteResult.deletedCount} existing free agent wrestlers`);
    
    // Create new wrestlers
    const wrestlers = [];
    for (let i = 0; i < count; i++) {
      wrestlers.push(generateRandomWrestler());
    }
    
    // Insert wrestlers
    const result = await Wrestler.insertMany(wrestlers);
    console.log(`Successfully inserted ${result.length} wrestlers`);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding function
const wrestlerCount = process.argv[2] || 60; // Default 60 wrestlers or pass as command line argument
seedDatabase(parseInt(wrestlerCount));