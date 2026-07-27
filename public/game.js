class GameEngine {
    constructor() {
        this.playerId = this.getOrCreatePlayerId();
        this.player = null;
        this.clickCount = 0;
        this.passiveIncomeInterval = null;
        this.stripe = Stripe(this.getStripePublicKey());
        this.elements = null;
        this.cardElement = null;
        this.currentPaymentTier = null;
        
        this.init();
    }

    getOrCreatePlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            playerId = this.generateUUID();
            localStorage.setItem('playerId', playerId);
        }
        return playerId;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getStripePublicKey() {
        // In production, fetch this from server
        return 'pk_test_51234567890'; // Placeholder - will be set from server
    }

    async init() {
        try {
            // Initialize player
            const response = await fetch('/api/player/init', { method: 'POST' });
            const data = await response.json();
            this.playerId = data.playerId;
            localStorage.setItem('playerId', this.playerId);
            
            // Load player data
            await this.loadPlayer();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start passive income
            this.startPassiveIncome();
            
            // Render initial UI
            this.renderBusinesses();
            this.renderShop();
            this.updateUI();
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

    async loadPlayer() {
        try {
            const response = await fetch(`/api/player/${this.playerId}`);
            this.player = await response.json();
            this.updateUI();
        } catch (error) {
            console.error('Error loading player:', error);
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Click button
        document.getElementById('clickBtn').addEventListener('click', () => this.click());

        // Prestige button
        document.getElementById('prestigeBtn').addEventListener('click', () => this.prestige());

        // Modal
        const modal = document.getElementById('paymentModal');
        const closeBtn = document.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');

        // Load tab-specific content
        if (tabName === 'leaderboard') {
            this.loadLeaderboard();
        }
    }

    async click() {
        try {
            const response = await fetch(`/api/player/${this.playerId}/click`, { method: 'POST' });
            const data = await response.json();
            this.player.money = data.money;
            this.player.totalEarned += data.clickIncome;
            this.clickCount++;
            this.updateUI();
            this.animateClickValue(data.clickIncome);
        } catch (error) {
            console.error('Error clicking:', error);
        }
    }

    animateClickValue(value) {
        const clickValue = document.getElementById('clickValue');
        clickValue.textContent = `+$${value}`;
        clickValue.style.animation = 'none';
        setTimeout(() => {
            clickValue.style.animation = 'popUp 0.5s ease';
        }, 10);
    }

    async buyBusiness(businessId) {
        try {
            const response = await fetch(`/api/player/${this.playerId}/business/${businessId}/buy`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.error) {
                alert(data.error);
            } else {
                this.player.money = data.money;
                this.player.passiveIncomePerSecond = data.passiveIncomePerSecond;
                this.player.businesses[businessId] = data.business;
                this.renderBusinesses();
                this.updateUI();
            }
        } catch (error) {
            console.error('Error buying business:', error);
        }
    }

    async upgradeBusiness(businessId) {
        try {
            const response = await fetch(`/api/player/${this.playerId}/business/${businessId}/upgrade`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.error) {
                alert(data.error);
            } else {
                this.player.money = data.money;
                this.player.passiveIncomePerSecond = data.passiveIncomePerSecond;
                this.player.businesses[businessId] = data.business;
                this.renderBusinesses();
                this.updateUI();
            }
        } catch (error) {
            console.error('Error upgrading business:', error);
        }
    }

    renderBusinesses() {
        const grid = document.getElementById('businessesGrid');
        grid.innerHTML = '';

        const businesses = {
            lemonadeStand: { name: 'Lemonade Stand', baseCost: 10, baseIncome: 1, emoji: '🍋' },
            retailStore: { name: 'Retail Store', baseCost: 100, baseIncome: 10, emoji: '🏬' },
            restaurant: { name: 'Restaurant', baseCost: 500, baseIncome: 50, emoji: '🍔' },
            techCompany: { name: 'Tech Company', baseCost: 2000, baseIncome: 200, emoji: '💻' },
            bank: { name: 'Bank', baseCost: 10000, baseIncome: 1000, emoji: '🏦' },
            realEstate: { name: 'Real Estate', baseCost: 50000, baseIncome: 5000, emoji: '🏢' },
            ecommerce: { name: 'E-Commerce', baseCost: 100000, baseIncome: 10000, emoji: '🛒' },
            entertainment: { name: 'Entertainment', baseCost: 500000, baseIncome: 50000, emoji: '🎬' }
        };

        Object.entries(businesses).forEach(([id, biz]) => {
            const bizData = this.player.businesses[id];
            const level = bizData.level;
            const nextCost = Math.floor(biz.baseCost * Math.pow(1.15, level));
            const income = bizData.income;
            const owned = bizData.owned;

            const card = document.createElement('div');
            card.className = `business-card ${owned ? 'owned' : ''}`;
            card.innerHTML = `
                <h3>${biz.emoji} ${biz.name}</h3>
                <p class="description">Level: ${level}</p>
                <p class="income">Income: $${income}/sec</p>
                <p class="cost">Cost: $${nextCost}</p>
                <div class="business-btn-group">
                    <button class="business-btn" onclick="game.buyBusiness('${id}')" ${this.player.money < nextCost ? 'disabled' : ''}>
                        ${owned ? 'Buy More' : 'Buy'}
                    </button>
                    <button class="business-btn upgrade" onclick="game.upgradeBusiness('${id}')" ${!owned || this.player.money < nextCost * 0.5 ? 'disabled' : ''}>
                        Upgrade
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async renderShop() {
        try {
            const response = await fetch('/api/payment/tiers');
            const tiers = await response.json();
            const grid = document.getElementById('shopGrid');
            grid.innerHTML = '';

            tiers.forEach(tier => {
                const card = document.createElement('div');
                card.className = 'shop-card';
                card.innerHTML = `
                    <h3>${tier.name}</h3>
                    <p class="amount">$${tier.amount}</p>
                    <p class="currency">${tier.currency.toLocaleString()} 💎</p>
                    <p>${tier.description}</p>
                    <button class="shop-btn" onclick="game.purchasePremium('${tier.id}', ${tier.amount})">Buy Now</button>
                `;
                grid.appendChild(card);
            });
        } catch (error) {
            console.error('Error rendering shop:', error);
        }
    }

    async purchasePremium(tierId, amount) {
        this.currentPaymentTier = { tierId, amount };
        const modal = document.getElementById('paymentModal');
        modal.style.display = 'block';

        if (!this.cardElement) {
            this.elements = this.stripe.elements();
            this.cardElement = this.elements.create('card');
            this.cardElement.mount('#card-element');
        }

        document.getElementById('submitBtn').onclick = () => this.processPayment();
    }

    async processPayment() {
        if (!this.currentPaymentTier) return;

        try {
            // Create payment intent
            const intentResponse = await fetch('/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.playerId,
                    amount: this.currentPaymentTier.amount,
                    tier: this.currentPaymentTier.tierId
                })
            });

            const intentData = await intentResponse.json();

            // Confirm payment
            const result = await this.stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: { name: 'Player' }
                }
            });

            if (result.error) {
                document.getElementById('card-errors').textContent = result.error.message;
            } else {
                // Confirm with backend
                const confirmResponse = await fetch('/api/payment/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: this.playerId,
                        paymentIntentId: result.paymentIntent.id,
                        amount: this.currentPaymentTier.amount
                    })
                });

                const confirmData = await confirmResponse.json();
                if (confirmData.success) {
                    alert('Payment successful! Premium currency added.');
                    this.player.premiumCurrency = confirmData.premiumCurrency;
                    document.getElementById('paymentModal').style.display = 'none';
                    this.updateUI();
                }
            }
        } catch (error) {
            document.getElementById('card-errors').textContent = error.message;
        }
    }

    async prestige() {
        if (confirm('Prestige will reset your progress. Continue?')) {
            try {
                const response = await fetch(`/api/player/${this.playerId}/prestige`, {
                    method: 'POST'
                });
                const data = await response.json();
                this.player = data.player;
                this.renderBusinesses();
                this.updateUI();
            } catch (error) {
                console.error('Error prestiging:', error);
            }
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            const tbody = document.getElementById('leaderboardBody');
            tbody.innerHTML = '';

            leaderboard.forEach(entry => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="rank">#${entry.rank}</td>
                    <td>${entry.username}</td>
                    <td>$${entry.totalEarned.toLocaleString()}</td>
                    <td>${entry.prestigeLevel}</td>
                    <td>$${entry.passiveIncome}/s</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    startPassiveIncome() {
        this.passiveIncomeInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/player/${this.playerId}/collect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secondsElapsed: 1 })
                });
                const data = await response.json();
                this.player.money = data.money;
                this.updateUI();
            } catch (error) {
                console.error('Error collecting income:', error);
            }
        }, 1000);
    }

    updateUI() {
        // Update header stats
        document.getElementById('money').textContent = `$${this.player.money.toLocaleString()}`;
        document.getElementById('perSecond').textContent = `$${this.player.passiveIncomePerSecond}/s`;
        document.getElementById('prestige').textContent = this.player.prestigeLevel;

        // Update click value
        const clickIncome = 1 + Math.floor(this.player.prestigeLevel / 2);
        document.getElementById('clickValue').textContent = `+$${clickIncome}`;

        // Update prestige info
        const prestigeGain = Math.floor(Math.sqrt(this.player.totalEarned / 1000000));
        document.getElementById('prestigeLevel').textContent = this.player.prestigeLevel;
        document.getElementById('prestigeGain').textContent = prestigeGain;
        document.getElementById('prestigeMultiplier').textContent = `${(1 + this.player.prestigeLevel * 0.1).toFixed(1)}x`;
        document.getElementById('prestigeBtn').disabled = prestigeGain < 1;
    }
}

// Initialize game
const game = new GameEngine();
