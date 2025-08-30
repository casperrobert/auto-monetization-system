const fs = require('fs');
const path = require('path');

const STREAMS_FILE = path.join(__dirname, 'streams.json');

class StreamConfigService {
  constructor() {
    this.streams = this.loadStreams();
  this.runners = {}; // track running automation per stream id
  }

  loadStreams() {
    try {
      const data = fs.readFileSync(STREAMS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultStreams();
    }
  }

  getDefaultStreams() {
    return [
      {
        id: "youtube-main",
        type: "youtube",
        enabled: true,
        params: {
          uploadCadence: 3,
          monetizationRate: 0.05,
          subscriberGoal: 10000,
          contentNiche: "tech"
        }
      },
      {
        id: "affiliate-amazon",
        type: "affiliate",
        enabled: true,
        params: {
          commission: 0.08,
          conversionRate: 0.03,
          trafficSource: "organic",
          productCategory: "electronics"
        }
      },
      {
        id: "dropship-store",
        type: "dropshipping",
        enabled: true,
        params: {
          priceMargin: 0.4,
          adBudget: 500,
          targetAudience: "millennials",
          productCount: 50
        }
      },
      {
        id: "dividend-portfolio",
        type: "dividends",
        enabled: true,
        params: {
          riskScore: 3,
          yieldTarget: 0.06,
          diversification: 0.8,
          reinvestment: true
        }
      },
      {
        id: "p2p-lending",
        type: "p2p",
        enabled: true,
        params: {
          riskScore: 4,
          averageReturn: 0.12,
          loanTerm: 36,
          defaultRate: 0.05
        }
      },
      {
        id: "reit-portfolio",
        type: "reits",
        enabled: true,
        params: {
          riskScore: 2,
          sectorFocus: "residential",
          geographicSpread: "global",
          yieldTarget: 0.08
        }
      },
      {
        id: "course-platform",
        type: "courses",
        enabled: true,
        params: {
          pricePoint: 199,
          completionRate: 0.7,
          marketingBudget: 300,
          studentCapacity: 1000
        }
      },
      {
        id: "mobile-apps",
        type: "apps",
        enabled: true,
        params: {
          monetizationModel: "freemium",
          userRetention: 0.6,
          adRevenue: 0.02,
          inAppPurchases: 0.15
        }
      }
    ];
  }

  saveStreams() {
    fs.writeFileSync(STREAMS_FILE, JSON.stringify(this.streams, null, 2));
  }

  getAllStreams() {
    return this.streams;
  }

  getStream(id) {
    return this.streams.find(s => s.id === id);
  }

  updateStream(id, updates) {
    const index = this.streams.findIndex(s => s.id === id);
    if (index !== -1) {
      this.streams[index] = { ...this.streams[index], ...updates };
      this.saveStreams();
      return this.streams[index];
    }
    return null;
  }

  toggleStream(id) {
    const stream = this.getStream(id);
    if (stream) {
      stream.enabled = !stream.enabled;
      this.saveStreams();
      return stream;
    }
    return null;
  }

  createStream(streamConfig) {
    if (this.getStream(streamConfig.id)) {
      throw new Error('Stream ID already exists');
    }
    this.streams.push(streamConfig);
    this.saveStreams();
    return streamConfig;
  }

  deleteStream(id) {
    const index = this.streams.findIndex(s => s.id === id);
    if (index !== -1) {
      const deleted = this.streams.splice(index, 1)[0];
      this.saveStreams();
      return deleted;
    }
    return null;
  }

  getStreamsByType(type) {
    return this.streams.filter(s => s.type === type);
  }

  getEnabledStreams() {
    return this.streams.filter(s => s.enabled);
  }

  // Start simple automation loop for a stream. This is a placeholder that
  // marks the stream as running and stores an interval handle. Real logic
  // should enqueue work items or call specific adapters.
  startAutomation(id) {
    const stream = this.getStream(id);
    if (!stream) throw new Error('Stream not found');
    if (this.runners[id]) return; // already running
    stream._running = true;
    this.saveStreams();
    // placeholder: perform periodic tasks (e.g., trigger income simulation)
    this.runners[id] = setInterval(() => {
      // noop: extend with real automation hooks
      console.debug(`[STREAM-AUTO] tick for ${id}`);
    }, 60 * 1000);
  }

  stopAutomation(id) {
    const stream = this.getStream(id);
    if (!stream) throw new Error('Stream not found');
    if (this.runners[id]) {
      clearInterval(this.runners[id]);
      delete this.runners[id];
    }
    stream._running = false;
    this.saveStreams();
  }
}

module.exports = StreamConfigService;