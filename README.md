# Business Tycoon - Idle Game with Stripe Integration

## 🎮 Overview

Business Tycoon is a free-to-play idle game where players build and manage businesses to generate passive income. The game features Stripe integration for premium currency purchases.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn
- Stripe Account (https://stripe.com)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/business-tycoon.git
cd business-tycoon
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Stripe keys:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
PORT=5000
```

4. **Start the server**
```bash
npm start
```

The game will be available at `http://localhost:5000`

## 📱 Features

### Core Gameplay
- **Click to Earn**: Generate income by clicking the button
- **8 Businesses**: From Lemonade Stand to Entertainment Studio
- **Passive Income**: Businesses generate money automatically
- **Upgrades**: Level up businesses to increase income
- **Prestige System**: Reset progress for permanent multipliers

### Monetization
- **Premium Currency**: Purchase with real money via Stripe
- **Ad Removal**: Optional ad-free experience
- **Season Pass**: Monthly subscription option
- **Cosmetics**: Cosmetic upgrades and themes

### Social
- **Leaderboard**: Compete with other players
- **Player Stats**: Track your progress
- **Achievements**: Unlock special rewards

## 💳 Stripe Integration

### Payment Tiers
1. **Starter Pack** - $4.99 → 5,000 Premium Currency
2. **Business Pack** - $9.99 → 12,000 Premium Currency
3. **Tycoon Pack** - $19.99 → 25,000 Premium Currency
4. **Mogul Pack** - $49.99 → 70,000 Premium Currency

### Payment Flow
1. User clicks "Buy Now"
2. Stripe payment modal opens
3. User enters card details
4. Payment is processed
5. Premium currency is added to account

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API for game logic
- Stripe payment processing
- Player data management
- Leaderboard system

### Frontend (HTML + CSS + JavaScript)
- Responsive UI
- Real-time updates
- Stripe.js integration
- Local storage for offline play

### Database
- Currently using in-memory storage (for demo)
- Recommended: Firebase or MongoDB for production

## 📊 API Endpoints

### Player Management
```
POST   /api/player/init              - Create new player
GET    /api/player/:playerId         - Get player data
POST   /api/player/:playerId/click   - Process click
POST   /api/player/:playerId/collect - Collect passive income
POST   /api/player/:playerId/prestige - Prestige
```

### Business Management
```
POST   /api/player/:playerId/business/:businessId/buy      - Buy business
POST   /api/player/:playerId/business/:businessId/upgrade  - Upgrade business
```

### Payments
```
POST   /api/payment/create-intent    - Create Stripe payment intent
POST   /api/payment/confirm          - Confirm payment
GET    /api/payment/tiers            - Get payment tiers
```

### Stats
```
GET    /api/leaderboard              - Get top 100 players
GET    /api/stats                    - Get game statistics
```

## 🎯 Revenue Model

### Target: $1,000/day

Required:
- **1,000 active players** at **$1/day average spend**
- OR **100 whales** at **$10/day**
- OR **1,000 casual players** + ad revenue

### Marketing Strategy
1. App store optimization
2. Influencer partnerships
3. Social media campaigns
4. Community events
5. Seasonal updates

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

Uses `nodemon` for auto-reload.

### Production Deployment

1. **Build for production**
```bash
PORT=80 npm start
```

2. **Deploy to Heroku**
```bash
heroku create business-tycoon
git push heroku main
```

3. **Add environment variables**
```bash
heroku config:set STRIPE_SECRET_KEY=sk_...
heroku config:set STRIPE_PUBLIC_KEY=pk_...
```

## 📈 Future Features

- [ ] Multiplayer trading system
- [ ] Daily challenges and rewards
- [ ] Stock market
- [ ] Mobile app (React Native)
- [ ] Social features (guilds, teams)
- [ ] Advanced analytics dashboard
- [ ] Admin panel
- [ ] Anti-cheat system
- [ ] Database integration (MongoDB/Firebase)
- [ ] Automated backups

## 🐛 Known Issues

- In-memory storage resets on server restart
- No persistent database yet
- Limited security (implement before production)

## 🔐 Security Considerations

Before going to production:

1. **Implement authentication** (JWT, OAuth2)
2. **Add rate limiting** to prevent abuse
3. **Validate all inputs** server-side
4. **Use HTTPS** only
5. **Implement CSRF protection**
6. **Add logging and monitoring**
7. **Use database** instead of in-memory storage
8. **Implement cheat detection**
9. **Add backup system**
10. **Regular security audits**

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

Have questions? Issues? Create a GitHub issue or contact support@businesstycoon.com

## 🎉 Ready to Launch!

Your Business Tycoon game is ready to go live. Good luck reaching that $1,000/day goal!

---

**Created with ❤️ by the Copilot team**
