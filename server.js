const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory game data (in production, use database)
const players = new Map();
const transactions = [];

// Initialize player data structure
function createNewPlayer(playerId) {
  return {
    id: playerId,
    username: `Player_${playerId.slice(0, 8)}`,
    money: 0,
    premiumCurrency: 0,
    businesses: {
      lemonadeStand: { level: 0, owned: false, income: 0 },
      retailStore: { level: 0, owned: false, income: 0 },
      restaurant: { level: 0, owned: false, income: 0 },
      techCompany: { level: 0, owned: false, income: 0 },
      bank: { level: 0, owned: false, income: 0 },
      realEstate: { level: 0, owned: false, income: 0 },
      ecommerce: { level: 0, owned: false, income: 0 },
      entertainment: { level: 0, owned: false, income: 0 }
    },
    totalIncome: 0,
    passiveIncomePerSecond: 0,
    prestigeLevel: 0,
    totalEarned: 0,
    lastClickTime: Date.now(),
    createdAt: new Date().toISOString()
  };
}

// Business definitions
const businesses = {
  lemonadeStand: {
    name: 'Lemonade Stand',
    baseCost: 10,
    baseIncome: 1,
    description: 'Start small with a classic lemonade stand'
  },
  retailStore: {
    name: 'Retail Store',
    baseCost: 100,
    baseIncome: 10,
    description: 'Open your own retail store'
  },
  restaurant: {
    name: 'Restaurant',
    baseCost: 500,
    baseIncome: 50,
    description: 'Run a successful restaurant'
  },
  techCompany: {
    name: 'Tech Company',
    baseCost: 2000,
    baseIncome: 200,
    description: 'Launch a tech startup'
  },
  bank: {
    name: 'Bank',
    baseCost: 10000,
    baseIncome: 1000,
    description: 'Establish your own bank'
  },
  realEstate: {
    name: 'Real Estate Empire',
    baseCost: 50000,
    baseIncome: 5000,
    description: 'Build a real estate empire'
  },
  ecommerce: {
    name: 'E-Commerce Platform',
    baseCost: 100000,
    baseIncome: 10000,
    description: 'Create an online marketplace'
  },
  entertainment: {
    name: 'Entertainment Studio',
    baseCost: 500000,
    baseIncome: 50000,
    description: 'Produce entertainment content'
  }
};

// Routes

// Initialize player
app.post('/api/player/init', (req, res) => {
  const playerId = uuidv4();
  const newPlayer = createNewPlayer(playerId);
  players.set(playerId, newPlayer);
  res.json({ playerId, player: newPlayer });
});

// Get player data
app.get('/api/player/:playerId', (req, res) => {
  const { playerId } = req.params;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(player);
});

// Click to earn money
app.post('/api/player/:playerId/click', (req, res) => {
  const { playerId } = req.params;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const clickIncome = 1 + Math.floor(player.prestigeLevel / 2);
  player.money += clickIncome;
  player.totalEarned += clickIncome;
  player.lastClickTime = Date.now();
  
  res.json({ money: player.money, clickIncome });
});

// Buy business
app.post('/api/player/:playerId/business/:businessId/buy', (req, res) => {
  const { playerId, businessId } = req.params;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const business = businesses[businessId];
  if (!business) {
    return res.status(400).json({ error: 'Business not found' });
  }
  
  const level = player.businesses[businessId].level;
  const cost = Math.floor(business.baseCost * Math.pow(1.15, level));
  
  if (player.money < cost) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  player.money -= cost;
  player.businesses[businessId].level += 1;
  player.businesses[businessId].owned = true;
  
  // Calculate new income
  const income = Math.floor(business.baseIncome * Math.pow(1.1, level) * (1 + player.prestigeLevel * 0.1));
  player.businesses[businessId].income = income;
  
  // Recalculate total passive income
  player.passiveIncomePerSecond = Object.values(player.businesses).reduce((sum, b) => sum + b.income, 0);
  
  res.json({
    money: player.money,
    business: player.businesses[businessId],
    passiveIncomePerSecond: player.passiveIncomePerSecond
  });
});

// Upgrade business
app.post('/api/player/:playerId/business/:businessId/upgrade', (req, res) => {
  const { playerId, businessId } = req.params;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const business = businesses[businessId];
  if (!business) {
    return res.status(400).json({ error: 'Business not found' });
  }
  
  if (!player.businesses[businessId].owned) {
    return res.status(400).json({ error: 'You do not own this business' });
  }
  
  const level = player.businesses[businessId].level;
  const upgradeCost = Math.floor(business.baseCost * Math.pow(1.15, level) * 0.5);
  
  if (player.money < upgradeCost) {
    return res.status(400).json({ error: 'Insufficient funds for upgrade' });
  }
  
  player.money -= upgradeCost;
  player.businesses[businessId].level += 1;
  
  const income = Math.floor(business.baseIncome * Math.pow(1.1, level + 1) * (1 + player.prestigeLevel * 0.1));
  player.businesses[businessId].income = income;
  
  player.passiveIncomePerSecond = Object.values(player.businesses).reduce((sum, b) => sum + b.income, 0);
  
  res.json({
    money: player.money,
    business: player.businesses[businessId],
    passiveIncomePerSecond: player.passiveIncomePerSecond
  });
});

// Collect passive income
app.post('/api/player/:playerId/collect', (req, res) => {
  const { playerId } = req.params;
  const { secondsElapsed } = req.body;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const income = Math.floor(player.passiveIncomePerSecond * secondsElapsed);
  player.money += income;
  player.totalEarned += income;
  
  res.json({ money: player.money, incomeGenerated: income });
});

// Prestige system
app.post('/api/player/:playerId/prestige', (req, res) => {
  const { playerId } = req.params;
  const player = players.get(playerId);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const prestigeGain = Math.floor(Math.sqrt(player.totalEarned / 1000000));
  
  if (prestigeGain < 1) {
    return res.status(400).json({ error: 'You need more earnings to prestige' });
  }
  
  // Reset player
  player.prestigeLevel += prestigeGain;
  player.money = 0;
  player.premiumCurrency = 0;
  player.businesses = {
    lemonadeStand: { level: 0, owned: false, income: 0 },
    retailStore: { level: 0, owned: false, income: 0 },
    restaurant: { level: 0, owned: false, income: 0 },
    techCompany: { level: 0, owned: false, income: 0 },
    bank: { level: 0, owned: false, income: 0 },
    realEstate: { level: 0, owned: false, income: 0 },
    ecommerce: { level: 0, owned: false, income: 0 },
    entertainment: { level: 0, owned: false, income: 0 }
  };
  player.passiveIncomePerSecond = 0;
  player.totalEarned = 0;
  
  res.json({
    player,
    prestigeGain,
    newPrestigeLevel: player.prestigeLevel
  });
});

// Stripe: Create payment intent for premium currency
app.post('/api/payment/create-intent', async (req, res) => {
  try {
    const { playerId, amount, tier } = req.body;
    
    if (!playerId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { playerId, tier }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe: Confirm payment and grant premium currency
app.post('/api/payment/confirm', async (req, res) => {
  try {
    const { playerId, paymentIntentId, amount } = req.body;
    const player = players.get(playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const premiumCurrency = amount * 1000; // 1 USD = 1000 premium currency
      player.premiumCurrency += premiumCurrency;
      
      transactions.push({
        playerId,
        amount,
        premiumCurrency,
        timestamp: new Date().toISOString(),
        paymentIntentId
      });
      
      res.json({
        success: true,
        premiumCurrency: player.premiumCurrency,
        message: 'Payment successful!'
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment tiers
app.get('/api/payment/tiers', (req, res) => {
  res.json([
    { id: 'tier1', name: 'Starter Pack', amount: 4.99, currency: 5000, description: '5,000 Premium Currency' },
    { id: 'tier2', name: 'Business Pack', amount: 9.99, currency: 12000, description: '12,000 Premium Currency' },
    { id: 'tier3', name: 'Tycoon Pack', amount: 19.99, currency: 25000, description: '25,000 Premium Currency' },
    { id: 'tier4', name: 'Mogul Pack', amount: 49.99, currency: 70000, description: '70,000 Premium Currency' }
  ]);
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(players.values())
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 100)
    .map((p, index) => ({
      rank: index + 1,
      username: p.username,
      totalEarned: p.totalEarned,
      prestigeLevel: p.prestigeLevel,
      passiveIncome: p.passiveIncomePerSecond
    }));
  
  res.json(leaderboard);
});

// Get game stats
app.get('/api/stats', (req, res) => {
  res.json({
    totalPlayers: players.size,
    totalTransactions: transactions.length,
    totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
    businesses: businesses
  });
});

// Serve game page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Business Tycoon server running on http://localhost:${PORT}`);
  console.log(`Stripe Public Key: ${process.env.STRIPE_PUBLIC_KEY}`);
});
