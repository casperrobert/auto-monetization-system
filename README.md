# 🚀 CASPER SYSTEM 24 - Auto Monetization System

A secure, accessible, and high-performance automated monetization system with comprehensive security features, modern web standards compliance, and robust error handling.

## ✨ Features

### 🔒 Security
- **Content Security Policy (CSP)** implementation
- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** protection
- **Input validation and sanitization**
- **Secure API key handling**
- **XSS and injection attack prevention**

### 🎯 Functionality
- **MetaMask Wallet Integration** - Secure crypto wallet connection
- **Live Cryptocurrency Prices** - Real-time data from CoinGecko API
- **Amazon Affiliate Link Generator** - Automated affiliate link creation
- **Revenue Tracking** - Local storage-based earnings log
- **Backendless Integration** - Optional cloud database support
- **TikTok Automation** - Scheduled trending data collection

### ♿ Accessibility
- **WCAG 2.1 AA compliance**
- **ARIA labels and roles**
- **Keyboard navigation support**
- **Screen reader compatibility**
- **High contrast mode support**
- **Reduced motion support**
- **Semantic HTML structure**

### ⚡ Performance
- **Compression middleware**
- **Static asset caching**
- **Optimized JavaScript bundling**
- **Lazy loading implementation**
- **Debounced user interactions**
- **Rate-limited API calls**

## 🛠️ Installation

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- MetaMask browser extension (for wallet features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/casperrobert/auto-monetization-system.git
   cd auto-monetization-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run automation` | Run TikTok automation scheduler |
| `npm run lint` | Check code for linting errors |
| `npm run lint:fix` | Fix linting errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run validate` | Run linting and format checks |
| `npm run security-check` | Run security audit |
| `npm run clean` | Clean log files |

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com

# TikTok API Configuration
TIKTOK_API_KEY=your_api_key_here
TIKTOK_API_BASE_URL=https://api.tiktok.com/v1

# Automation Configuration
CRON_SCHEDULE=0 * * * *
TIMEZONE=UTC
RUN_ON_START=false

# Optional: Backendless Configuration
BACKENDLESS_APP_ID=your_app_id
BACKENDLESS_API_KEY=your_api_key
BACKENDLESS_TABLE=Transactions

# Optional: Amazon Affiliate
AMAZON_AFFILIATE_TAG=your_tag_here
```

### Dashboard Configuration

The dashboard stores configuration locally in the browser:

1. **Affiliate Settings** - Amazon affiliate tag for link generation
2. **Backendless Integration** - Optional cloud database connection
3. **Wallet Settings** - MetaMask integration preferences

## 🏗️ Architecture

### Backend Components

- **`index.js`** - Main Express server with security middleware
- **`automation.js`** - TikTok automation scheduler with error handling
- **Security Middleware** - Helmet, CORS, rate limiting, compression
- **Logging System** - Winston-based structured logging

### Frontend Components

- **`dashboard.html`** - Main dashboard interface with accessibility features
- **`index.html`** - Landing page with semantic HTML
- **`styles.css`** - Responsive CSS with accessibility support
- **`js/utils.js`** - Secure utility functions and validation
- **`js/erc20.js`** - ERC20 token interaction utilities
- **`js/dashboard.js`** - Dashboard functionality with error handling

## 🔐 Security Features

### Server Security
- **Helmet.js** - Sets various HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents abuse and DoS attacks
- **Input Validation** - Server-side validation using express-validator
- **Secure Headers** - CSP, HSTS, X-Frame-Options, etc.

### Client Security
- **Input Sanitization** - XSS prevention
- **CSP Compliance** - Strict content security policy
- **Secure Storage** - Safe localStorage wrapper
- **Rate Limiting** - Client-side API call limiting
- **Error Handling** - Comprehensive error reporting

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Semantic HTML** - Proper use of HTML5 semantic elements
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Color Contrast** - Meets WCAG contrast requirements
- **Focus Management** - Visible focus indicators
- **Alt Text** - Descriptive alternative text for images

### Responsive Design
- **Mobile-first** - Optimized for mobile devices
- **Flexible Layouts** - CSS Grid and Flexbox
- **Touch-friendly** - Larger touch targets
- **Readable Text** - Optimized typography

## 📊 Performance Optimizations

### Server Performance
- **Compression** - Gzip compression for responses
- **Caching** - Static asset caching headers
- **Efficient Routing** - Optimized Express routing

### Client Performance
- **Debounced Interactions** - Prevents excessive API calls
- **Lazy Loading** - Content loaded on demand
- **Optimized JavaScript** - Modular and efficient code
- **CSS Optimization** - Minimal and organized stylesheets

## 🧪 Testing

### Manual Testing Checklist

#### Security Testing
- [ ] XSS prevention works
- [ ] Rate limiting functions correctly
- [ ] Input validation prevents malicious input
- [ ] CSP headers are properly set

#### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works
- [ ] Color contrast meets requirements
- [ ] Focus indicators are visible

#### Performance Testing
- [ ] Page load times under 3 seconds
- [ ] API responses under 1 second
- [ ] No memory leaks in long sessions

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure proper `ALLOWED_ORIGINS`
- Set up logging directory
- Configure reverse proxy (nginx/Apache)

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check browser console for errors
   - Verify network connection

2. **API Rate Limiting**
   - Check rate limit configuration
   - Monitor API usage patterns
   - Implement exponential backoff

3. **Performance Issues**
   - Check server logs for errors
   - Monitor memory usage
   - Verify network performance

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## 📝 Changelog

### Version 1.0.0 - Security & Accessibility Overhaul
- ✅ **Security hardening** - Added comprehensive security middleware
- ✅ **Performance optimization** - Implemented caching and compression
- ✅ **Accessibility improvements** - WCAG 2.1 AA compliance
- ✅ **Code quality enhancements** - ESLint, Prettier, modern JavaScript
- ✅ **Error handling** - Comprehensive error management
- ✅ **Documentation** - Complete documentation and examples
- ✅ **Maintainability** - Modular architecture and clean code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and linting
4. Submit a pull request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Maintain WCAG 2.1 AA accessibility compliance
- Add comprehensive error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ by CASPER SYSTEM 24**